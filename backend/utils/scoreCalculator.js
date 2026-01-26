const weightsConfig = require('../config/scoringWeights');

/**
 * Calculate Weighted Score for a Candidate
 * @param {Object} candidate - Candidate object (with notice, salary, etc.)
 * @param {number} technicalScore - 0-10 Score from the technical interview
 * @param {number} communicationScore - 0-10 Score from AI evaluation of communication
 * @param {string} role - Specific role key (e.g., 'frontend_dev')
 * @returns {Object} - { finalScore, breakdown }
 */
const calculateCandidateScore = (candidate, technicalScore, communicationScore, role) => {
    // 1. Get Weights for the Role
    const weights = weightsConfig.roleWeights[role] || weightsConfig.roleWeights.business_analyst || weightsConfig.roleWeights.default;
    
    // 2. Calculate Individual Component Scores (0-10 Scale)
    
    // Notice Period Score
    const noticeScore = weightsConfig.scoringLogic.noticePeriod(candidate.noticePeriod || 30);
    
    // Experience Score (Assuming we extract years from experienceLevel string roughly)
    const expMap = {
        'Fresher/Intern': 0,
        '1-2 years': 1.5,
        '2-4 years': 3,
        '4-6 years': 5,
        '6-8 years': 7,
        '8-10 years': 9
    };
    const years = expMap[candidate.experienceLevel] !== undefined ? expMap[candidate.experienceLevel] : 2;
    // We assume 'requiredYears' might be passed or defaulted. For now using 2 as baseline.
    const experienceScore = weightsConfig.scoringLogic.experience(years, 2); 
    
    // Salary Score - REMOVED per feature request
    // We effectively ignore it. Setting to 0. Since weight is 0.0, it won't impact final score.
    const salaryScore = 0;

    // 3. Apply Weights
    const weightedScores = {
        noticePeriod: noticeScore * weights.noticePeriod,
        skill: technicalScore * weights.skill,
        experience: experienceScore * weights.experience,
        communication: communicationScore * weights.communication,
        salary: salaryScore * (weights.salary || 0)
    };

    // 4. Sum up
    const finalScore = Object.values(weightedScores).reduce((a, b) => a + b, 0);

    return {
        finalScore: parseFloat(finalScore.toFixed(2)),
        breakdown: {
            raw: {
                noticePeriod: noticeScore,
                skill: technicalScore,
                experience: experienceScore,
                communication: communicationScore,
                salary: salaryScore
            },
            weighted: weightedScores, // breakdown of how much each contributed
            weightsUsed: weights
        }
    };
};

module.exports = { calculateCandidateScore };
