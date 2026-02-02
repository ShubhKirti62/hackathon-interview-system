import axios from 'axios';
import { showLoader, hideLoader } from '../store/loaderStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptors for auth and loader
api.interceptors.request.use((config) => {
    // Show loader on request start, EXCEPT for background tasks
    const silentEndpoints = ['/state', '/screenshot', '/proxy-check', '/violation'];
    const isSilent = silentEndpoints.some(endpoint => config.url?.includes(endpoint));

    if (!isSilent) {
        showLoader();
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    hideLoader();
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        // Always try to hide loader (it's safe and idempotent)
        hideLoader();
        return response;
    },
    (error) => {
        hideLoader();
        return Promise.reject(error);
    }
);

export default api;
