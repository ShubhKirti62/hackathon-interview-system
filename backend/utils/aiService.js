const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

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
        console.warn("Gemini API Key missing. Returning mock score.");
        return {
            score: 5,
            feedback: "AI Evaluation unavailable (Missing API Key). please configure GEMINI_API_KEY in backend."
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
        return {
            score: 0,
            feedback: "Error during AI evaluation. Please review manually."
        };
    }
};

/**
 * Generate Overall Interview Summary
 * @param {Object} interviewData - Full interview object
 * @returns {Promise<string>} - Summary text
 */
const generateInterviewSummary = async (interviewData) => {
    if (!model) return "AI Summary unavailable.";

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
