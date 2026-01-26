const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// Initialize Gemini
// using gemini-1.5-flash for speed and lower cost, with better structured output support
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

/**
 * Configure the model with structured output schema for evaluation
 */
const evaluationModel = genAI ? genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
                score: { 
                    type: SchemaType.NUMBER,
                    description: "Score from 0 to 10, allowing one decimal place."
                },
                feedback: { 
                    type: SchemaType.STRING,
                    description: "Brief feedback explaining the score, max 2 sentences."
                },
                missingKeywords: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "List of mandatory keywords that were missing from the answer."
                }
            },
            required: ["score", "feedback", "missingKeywords"]
        }
    }
}) : null;

const summaryModel = genAI ? genAI.getGenerativeModel({ model: "gemini-flash-latest" }) : null;

/**
 * Retry operation wrapper with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>}
 */
const retryOperation = async (operation, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            // Check for quota or server errors (503, 429)
            const isRetryable = error.message.includes('503') || error.message.includes('429') || error.message.includes('fetch failed');
            
            if (!isRetryable && i < maxRetries - 1) {
                // If it's not obviously retryable, we might still want to try once more just in case, but usually we break
                // For now, let's treat most "generation" errors as potentially transient unless it's a bad request
                if (error.status === 400) throw error; // Bad Request -> don't retry
            }

            if (i === maxRetries - 1) break;
            
            // Wait with exponential backoff: 1s, 2s, 4s
            const delay = 1000 * Math.pow(2, i);
            console.log(`AI Service: Retry attempt ${i+1}/${maxRetries} after ${delay}ms error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

/**
 * Hybrid Evaluation of an Answer
 * @param {string} questionText - The question asked
 * @param {string} userAnswer - The candidate's response
 * @param {Array<string>} keywords - Mandatory keywords to check for
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Object>} - { score, feedback }
 */
const evaluateAnswer = async (questionText, userAnswer, keywords = [], difficulty = 'Medium') => {
    if (!evaluationModel) {
        console.warn("Gemini API Key missing. Using fallback evaluation.");
        return keywordBasedEvaluation(questionText, userAnswer, keywords, difficulty);
    }

    try {
        const prompt = `
        You are an expert technical interviewer evaluating a candidate's answer.
        
        Question: "${questionText}"
        Difficulty: ${difficulty}
        Candidate Answer: "${userAnswer}"
        Mandatory Keywords/Concepts: [${keywords.join(', ')}]

        Evaluation Rules:
        1. Check if the answer contains the Mandatory Keywords (or very close synonyms). 
           - If NO keywords are found and the list is not empty, the maximum score is 4/10.
           - If SOME keywords are found, score based on completeness.
        2. Evaluate technical correctness, clarity, and depth.
        3. Provide a Score (0-10) and brief Feedback (max 2 sentences).
        `;

        const result = await retryOperation(async () => {
            return await evaluationModel.generateContent(prompt);
        });

        const data = result.response.text();
        // Since we enforced JSON schema, data should be valid JSON
        return JSON.parse(data);

    } catch (error) {
        console.error("AI Evaluation Error (Final):", error.message);
        
        // Final Fallback to keyword-based evaluation
        console.log("Using keyword-based fallback evaluation due to AI failure.");
        return keywordBasedEvaluation(questionText, userAnswer, keywords, difficulty);
    }
};

/**
 * Keyword-based fallback evaluation (when AI is unavailable)
 */
const keywordBasedEvaluation = (questionText, userAnswer, keywords = [], difficulty = 'Medium') => {
    const answerLower = userAnswer.toLowerCase();
    const answerLength = userAnswer.trim().split(/\s+/).length;
    
    let score = 0;
    let foundKeywords = [];
    let missingKeywords = [];
    
    // Check for keywords (case-insensitive)
    keywords.forEach(keyword => {
        if (answerLower.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
            score += 2; // 2 points per keyword
        } else {
            missingKeywords.push(keyword);
        }
    });
    
    // Bonus for answer length (shows effort)
    if (answerLength > 50) score += 2;
    else if (answerLength > 20) score += 1;
    
    // Difficulty adjustment
    if (difficulty === 'Easy' && score > 0) score += 1;
    if (difficulty === 'Hard') score = Math.max(0, score - 1);
    
    // Cap at 10
    score = Math.min(10, score);
    
    // Generate feedback
    let feedback = '';
    if (foundKeywords.length === keywords.length && keywords.length > 0) {
        feedback = `Good answer! Covered all key concepts: ${foundKeywords.join(', ')}.`;
    } else if (foundKeywords.length > 0) {
        feedback = `Partial answer. Mentioned: ${foundKeywords.join(', ')}. Missing: ${missingKeywords.join(', ')}.`;
    } else if (keywords.length > 0) {
        feedback = `Answer lacks key concepts: ${missingKeywords.join(', ')}. Please review the topic.`;
    } else {
        feedback = `Answer provided (${answerLength} words). Manual review recommended.`;
    }
    
    return {
        score: score,
        feedback: feedback + " (Keyword-based fallback)",
        missingKeywords: missingKeywords
    };
};

/**
 * Generate Overall Interview Summary
 * @param {Object} interviewData - Full interview object
 * @returns {Promise<string>} - Summary text
 */
const generateInterviewSummary = async (interviewData) => {
    if (!summaryModel) {
        // Fallback summary based on scores
        const responses = interviewData.responses || [];
        if (responses.length === 0) return "No responses available for evaluation.";
        
        const scores = responses.map(r => r.score || 0).filter(s => s > 0);
        if (scores.length === 0) return "Interview completed but no scores available.";
        
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        return `Candidate completed ${responses.length} questions with an average score of ${avgScore.toFixed(1)}/10.`;
    }

    try {
        const transcript = interviewData.responses.map((r, i) => 
            `Q${i+1}: ${r.questionId ? '...' : ''} (Score: ${r.score}/10)`
        ).join('\n');

        const prompt = `
        Summarize this technical interview performance based on these scores:
        ${transcript}

        Provide a 3-sentence summary of the candidate's strengths and weaknesses.
        `;

        const result = await retryOperation(async () => {
            return await summaryModel.generateContent(prompt);
        });
        
        return result.response.text();
    } catch (error) {
        console.error("AI Summary Error:", error);
        return "Failed to generate summary.";
    }
};

module.exports = {
    evaluateAnswer,
    generateInterviewSummary
};
