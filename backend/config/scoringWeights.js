module.exports = {
    roleWeights: {
        "frontend_dev": {
            noticePeriod: 0.20,
            skill: 0.45,
            experience: 0.25,
            communication: 0.10
        },
        "backend_dev": {
            noticePeriod: 0.20,
            skill: 0.45,
            experience: 0.25,
            communication: 0.10
        },
        "business_analyst": {
            noticePeriod: 0.20,
            skill: 0.45,
            experience: 0.10,
            communication: 0.25
        },
        "marketing": {
            noticePeriod: 0.20,
            skill: 0.10,
            experience: 0.20,
            communication: 0.50
        },
        // Default fallback
        "default": {
            noticePeriod: 0.20,
            skill: 0.30,
            experience: 0.20,
            communication: 0.30
        }
    },

    // Logic to normalize raw values into 0-10 scores
    scoringLogic: {
        noticePeriod: (days) => {
            if (days <= 15) return 10;
            if (days <= 30) return 8;
            if (days <= 60) return 6;
            if (days <= 90) return 4;
            return 2;
        },
        experience: (years, requiredYears = 2) => {
            // Rough mapping based on levels
            // Intern: 0, 1-2: 1.5, 2-4: 3, etc.
            const diff = years - requiredYears;
            if (diff >= 2) return 10; // Exceeds expectation
            if (diff >= 0) return 8;  // Meets expectation
            if (diff >= -1) return 5; // Slightly under
            return 2;                 // Under experienced
        }
    }
};
