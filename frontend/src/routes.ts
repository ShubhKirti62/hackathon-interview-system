export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/',
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        CANDIDATES: '/admin/candidates',
        QUESTIONS: '/admin/questions',
    },
    INTERVIEW: {
        INTRO: '/interview',
        SETUP: '/interview/setup/:id',
        SESSION: '/interview/session/:id',
        MEETING: '/interview/meeting/:id',
        RESULT: '/interview/result/:id',
    },
    CANDIDATE: {
        DASHBOARD: '/candidate/home',
    },
    DEMO: '/demo',
};
