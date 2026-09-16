import api from './api';

export const loginUser = async (username, password) => {
    const response = await api.post('/users/login', { username, password });
    if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
    }
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('jwt_token');
};