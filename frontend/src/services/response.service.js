import { request } from './api';

export const ResponseService = {
    // Tüm cevapları getir (Admin dashboard için)
    getAll: async () => {
        return await request('/responses/');
    },

    // Sadece benim cevaplarımı getir (Profil sayfası için)
    getMyResponses: async () => {
        // Backend'de filter varsa parametre eklenebilir, 
        // şu an /responses/ endpointi user'a göre de filtreliyor olabilir veya client filter yapıyordur.
        // Ama user endpoint'i mantıklı:
        // Şimdilik /responses/ çekip client side veya backend filter kullanıyoruz.
        // Backend UserViewSet filter yapıyor mu bakalım.
        // API analizine göre '/responses/' endpoint zaten user ise sadece kendi cevaplarını dönüyor (ViewSet).
        return await request('/responses/');
    },

    getById: async (id) => {
        return await request(`/responses/${id}/`);
    },

    create: async (data) => {
        return await request('/responses/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    update: async (id, data) => {
        return await request(`/responses/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete: async (id) => {
        return await request(`/responses/${id}/`, {
            method: 'DELETE'
        });
    }
};
