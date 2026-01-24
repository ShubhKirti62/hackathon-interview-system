import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Basic object to hold loader functions, populated from App.tsx (or Context Provider)
export const loaderLink = {
    showLoader: () => { },
    hideLoader: () => { }
};

// Add interceptors for auth and loader
api.interceptors.request.use((config) => {
    // Show loader on request start
    if (loaderLink.showLoader) loaderLink.showLoader();

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    if (loaderLink.hideLoader) loaderLink.hideLoader();
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        // Hide loader on success response
        if (loaderLink.hideLoader) loaderLink.hideLoader();
        return response;
    },
    (error) => {
        // Hide loader on error response
        if (loaderLink.hideLoader) loaderLink.hideLoader();
        return Promise.reject(error);
    }
);

export default api;
