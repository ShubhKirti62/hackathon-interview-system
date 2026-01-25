export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/user',
        USERS: '/auth/users',
    },
    CANDIDATES: {
        BASE: '/candidates',
        BY_ID: (id: string) => `/candidates/${id}`,
        PARSE_RESUME: '/candidates/parse-resume',
        UPDATE_STATUS: (id: string) => `/candidates/${id}/status`,
    },
    FACE: {
        REGISTER: '/face/register',
        VERIFY: '/face/verify',
        STATUS: (candidateId: string) => `/face/status/${candidateId}`,
        REPORT: (sessionId: string) => `/face/report/${sessionId}`,
        SCREENSHOT: '/face/screenshot',
        SCREENSHOTS: (candidateId: string) => `/face/screenshots/${candidateId}`,
        SCREENSHOT_BY_ID: (id: string) => `/face/screenshot/${id}`,
    },
    QUESTIONS: {
        BASE: '/questions',
        VERIFY: (id: string) => `/questions/${id}/verify`,
        BULK_UPLOAD: '/questions/bulk-upload',
    },
    INTERVIEWS: {
        START: '/interviews/start',
        RESPONSE: (id: string) => `/interviews/${id}/response`,
        SUBMIT_RESPONSE: (id: string) => `/interviews/${id}/response`,
        COMPLETE: (id: string) => `/interviews/${id}/complete`,
        BY_ID: (id: string) => `/interviews/${id}`,
        UPDATE_STATE: (id: string) => `/interviews/${id}/state`,
    },
    QUESTIONNAIRES: {
        BASE: '/questionnaires',
        BY_ID: (id: string) => `/questionnaires/${id}`,
    },
    INVITES: {
        GENERATE: '/invites',
        VALIDATE: (token: string) => `/invites/${token}`,
    },
    SESSIONS: {
        LIST: '/sessions',
        REPORT: (id: string) => `/sessions/${id}`,
    },
    SETTINGS: {
        BASE: '/settings',
        SEED: '/settings/seed',
    },
    SLOTS: {
        BASE: '/slots',
        AVAILABLE: '/slots/available',
        BOOK: (id: string) => `/slots/book/${id}`,
        FEEDBACK: (id: string) => `/slots/feedback/${id}`,
    },
};
