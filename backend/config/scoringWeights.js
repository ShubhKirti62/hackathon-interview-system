module.exports = {
    metrics: {
        relevance: { min: 0, max: 5 },
        clarity: { min: 0, max: 5 },
        depth: { min: 0, max: 5 },
        accuracy: { min: 0, max: 5 },
        structure: { min: 0, max: 5 },
        confidence: { min: 0, max: 5 },
        honesty: { min: 0, max: 5 }
    },
    roles: {
        "frontend_dev": {
            relevance: 0.15,
            clarity: 0.20,
            depth: 0.20,
            accuracy: 0.25,
            structure: 0.10,
            confidence: 0.05,
            honesty: 0.05
        },
        "sales": {
            relevance: 0.20,
            clarity: 0.30,
            confidence: 0.25,
            structure: 0.15,
            honesty: 0.10
        },
        // Default fallback
        "default": {
            relevance: 0.15,
            clarity: 0.15,
            depth: 0.15,
            accuracy: 0.15,
            structure: 0.15,
            confidence: 0.15,
            honesty: 0.10
        }
    }
};
