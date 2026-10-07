import api from './api';

export const submitFeedback = async ({ bookingId, message, rating }) => {
    const params = new URLSearchParams();
    params.append('bookingId', bookingId);
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

export const replyToFeedback = async (id, reply) => {
    const params = new URLSearchParams();
    params.append('reply', reply);

    const response = await api.put(`/feedback/${id}/reply`, params);
    return response.data;
};

export const deleteFeedback = async (id) => {
    const response = await api.delete(`/feedback/${id}`);
    return response.data;
};