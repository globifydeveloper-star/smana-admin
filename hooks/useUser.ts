import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export interface UserInfo {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export const useUser = () => {
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        const userInfo = Cookies.get('userInfo');
        if (userInfo) {
            try {
                setUser(JSON.parse(userInfo));
            } catch (e) {
                console.error("Failed to parse userInfo cookie", e);
            }
        }
    }, []);

    return user;
};
