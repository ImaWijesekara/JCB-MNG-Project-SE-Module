import api from './api';

export const submitFeedback = async (message, rating) => {
    const params = new URLSearchParams();
    params.append('message', message);
    params.append('rating', rating);
    
    const response = await api.post('/feedback/submit', params);
    return response.data;
};

export const getAllFeedback = async () => {
    const response = await api.get('/feedback/all');
    return response.data;
};

export const getMyFeedback = async () => {
    const response = await api.get('/feedback/my');
    return response.data;
};

export const updateFeedback = async (id, message, rating) => {
    const params = new URLSearchParams();
    params.append('message', message);
    params.append('rating', rating);

    const response = await api.put(`/feedback/${id}`, params);
    return response.data;
};

export const deleteFeedback = async (id) => {
    const response = await api.delete(`/feedback/${id}`);
    return response.data;
};