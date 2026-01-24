export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/user',
    },
    CANDIDATES: {
        BASE: '/candidates',
        BY_ID: (id: string) => `/candidates/${id}`,
        PARSE_RESUME: '/candidates/parse-resume',
    },
    QUESTIONS: {
        BASE: '/questions',
        VERIFY: (id: string) => `/questions/${id}/verify`,
    },
    INTERVIEWS: {
        START: '/interviews/start',
        RESPONSE: (id: string) => `/interviews/${id}/response`,
        COMPLETE: (id: string) => `/interviews/${id}/complete`,
        BY_ID: (id: string) => `/interviews/${id}`,
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
};
