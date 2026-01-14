import { request } from './api';

export const SurveyService = {
    // Tüm anketleri getir (arama destekli)
    getAll: async (search = '') => {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return await request(`/surveys/${query}`);
    },

    // Tek bir anketin detayını getir
    getById: async (id) => {
        return await request(`/surveys/${id}/`);
    },

    // Anket İstatistiklerini Getir
    getStats: async (id) => {
        return await request(`/surveys/${id}/results/`);
    },

    // --- Admin İşlemleri ---
    create: async (data) => {
        return await request('/surveys/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    update: async (id, data) => {
        return await request(`/surveys/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    delete: async (id) => {
        return await request(`/surveys/${id}/`, {
            method: 'DELETE'
        });
    },

    // --- Soru İşlemleri ---
    createQuestion: async (data) => {
        return await request('/questions/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateQuestion: async (id, data) => {
        return await request(`/questions/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    deleteQuestion: async (id) => {
        return await request(`/questions/${id}/`, {
            method: 'DELETE'
        });
    }
};
