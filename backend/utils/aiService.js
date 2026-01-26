const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

/**
 * Hybrid Evaluation of an Answer
 * @param {string} questionText - The question asked
 * @param {string} userAnswer - The candidate's response
 * @param {Array<string>} keywords - Mandatory keywords to check for
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Object>} - { score, feedback }
 */
const evaluateAnswer = async (questionText, userAnswer, keywords = [], difficulty = 'Medium') => {
    if (!model) {
        console.warn("Gemini API Key missing. Using fallback evaluation.");
        
        // Simple keyword-based fallback evaluation
        let score = 5; // Base score
        let feedback = "Answer received.";
        const foundKeywords = [];
        
        if (keywords && keywords.length > 0) {
            const lowerAnswer = userAnswer.toLowerCase();
            keywords.forEach(keyword => {
                if (lowerAnswer.includes(keyword.toLowerCase())) {
                    foundKeywords.push(keyword);
                    score += 1;
                }
            });
            
            const keywordCoverage = foundKeywords.length / keywords.length;
            score = Math.round(3 + keywordCoverage * 7); // Scale 3-10 based on keyword coverage
            
            if (foundKeywords.length === 0) {
                feedback = "Answer doesn't contain key concepts. Consider reviewing the topic.";
            } else if (foundKeywords.length === keywords.length) {
                feedback = "Excellent answer covering all key concepts.";
            } else {
                feedback = `Good answer covering ${foundKeywords.length}/${keywords.length} key concepts: ${foundKeywords.join(', ')}.`;
            }
        } else {
            // Length-based scoring for answers without keywords
            if (userAnswer.length < 50) {
                score = 3;
                feedback = "Answer is too brief. Please provide more detail.";
            } else if (userAnswer.length > 200) {
                score = 7;
                feedback = "Comprehensive answer provided.";
            } else {
                score = 5;
                feedback = "Adequate answer provided.";
            }
        }
        
        return {
            score: Math.min(10, Math.max(0, score)),
            feedback,
            foundKeywords
        };
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

        Output JSON format ONLY:
        {
            "score": number, // 0-10, one decimal place allowed
            "feedback": "string",
            "missingKeywords": ["keyword1"] // list missing ones if any
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up markdown code blocks if any
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return data;


    } catch (error) {
        console.error("AI Evaluation Error:", error);
        console.error("Error details:", error.message);
        
        // Fallback to keyword-based evaluation
        console.log("Using keyword-based fallback evaluation...");
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
        feedback: feedback + " (Keyword-based evaluation)",
        missingKeywords: missingKeywords
    };
};

/**
 * Generate Overall Interview Summary
 * @param {Object} interviewData - Full interview object
 * @returns {Promise<string>} - Summary text
 */
const generateInterviewSummary = async (interviewData) => {
    if (!model) {
        // Fallback summary based on scores
        const responses = interviewData.responses || [];
        if (responses.length === 0) {
            return "No responses available for evaluation.";
        }
        
        const scores = responses.map(r => r.score || 0).filter(s => s > 0);
        if (scores.length === 0) {
            return "Interview completed but no scores available.";
        }
        
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        let summary = `Candidate completed ${responses.length} questions with an average score of ${avgScore.toFixed(1)}/10.`;
        
        if (avgScore >= 8) {
            summary += " Performance was excellent with strong technical understanding.";
        } else if (avgScore >= 6) {
            summary += " Performance was good with solid technical knowledge.";
        } else if (avgScore >= 4) {
            summary += " Performance was moderate with some areas needing improvement.";
        } else {
            summary += " Performance needs significant improvement in technical areas.";
        }
        
        return summary;
    }

    try {
        // Construct a summary of Q&A
        const transcript = interviewData.responses.map((r, i) => 
            `Q${i+1}: ${r.questionId ? '...' : ''} (Score: ${r.score}/10)`
        ).join('\n');

        const prompt = `
        Summarize this technical interview performance based on these scores:
        ${transcript}

        Provide a 3-sentence summary of the candidate's strengths and weaknesses.
        `;

        const result = await model.generateContent(prompt);
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
