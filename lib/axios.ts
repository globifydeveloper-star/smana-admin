import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // If we are on the client side, redirect to login
            if (typeof window !== 'undefined') {
                // Prevent infinite redirect loop if already on login
                if (!window.location.pathname.startsWith('/login')) {
                    // Clear any stale client-side auth data
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
