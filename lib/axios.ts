import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Paths where a 401 should NOT force a redirect to /login.
// These are background calls that don't represent "user not authenticated".
const NO_REDIRECT_PATHS = [
    '/push/',       // Push notification subscription calls
    '/api/push/',
];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Don't redirect for background service calls
                const reqUrl: string = error.config?.url || '';
                const isBackgroundCall = NO_REDIRECT_PATHS.some((p) => reqUrl.includes(p));

                if (!isBackgroundCall && !window.location.pathname.startsWith('/login')) {
                    // Clear stale client-side auth data
                    document.cookie = 'userInfo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    localStorage.removeItem('userInfo');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
