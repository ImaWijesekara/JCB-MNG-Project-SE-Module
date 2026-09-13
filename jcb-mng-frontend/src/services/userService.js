import api from './api';

export const getAllUsers = async () => {
    const response = await api.get('/users/all');
    return response.data;
};