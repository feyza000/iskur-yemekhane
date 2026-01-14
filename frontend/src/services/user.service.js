import { request } from './api';

export const UserService = {
    // Tüm kullanıcıları getir (Admin için)
    getAll: async () => {
        return await request('/users/');
    },

    // Tek bir kullanıcıyı getir
    getById: async (id) => {
        return await request(`/users/${id}/`);
    },

    // Kullanıcı oluştur (Admin paneli var mı bilmiyorum ama ekleyelim)
    create: async (data) => {
        return await request('/users/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Kullanıcı güncelle (ör: is_staff yapma)
    update: async (id, data) => {
        return await request(`/users/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Kullanıcı sil
    delete: async (id) => {
        return await request(`/users/${id}/`, {
            method: 'DELETE'
        });
    }
};
