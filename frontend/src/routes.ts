export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        CANDIDATES: '/admin/candidates',
        QUESTIONS: '/admin/questions',
    },
    INTERVIEW: {
        INTRO: '/interview',
        SESSION: '/interview/session/:id',
        RESULT: '/interview/result/:id',
    },
};
