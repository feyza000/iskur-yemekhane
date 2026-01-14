import { request } from './api';

export const AuthService = {
    login: async (username, password) => {
        const data = await request('/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            if (data.is_superuser) localStorage.setItem('isSuperUser', 'true');
            if (data.is_staff) localStorage.setItem('isStaff', 'true');
            localStorage.setItem('userId', data.user_id);
        }
        return data;
    },

    register: async (userData) => {
        return await request('/register/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    requestPasswordReset: async (email) => {
        return await request('/password-reset/request/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isSuperUser');
        localStorage.removeItem('isStaff');
        localStorage.removeItem('userId');
    }
};
