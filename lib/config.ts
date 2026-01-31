export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://api.smanahotels.com' : 'http://localhost:5000');
export const API_URL = `${BACKEND_URL}/api`;
