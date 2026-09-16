import api from './api';

export const makePayment = async (bookingId, paymentMethod) => {
    const response = await api.post('/payments/pay', { bookingId: Number(bookingId), paymentMethod });
    return response.data;
};

export const getMyPayments = async () => {
    const response = await api.get('/payments/my');
    return response.data;
};

export const getAllPayments = async () => {
    const response = await api.get('/payments/all');
    return response.data;
};

export const updatePaymentStatus = async (id, status) => {
    const response = await api.put(`/payments/${id}/status`, null, { params: { status } });
    return response.data;
};

export const deletePayment = async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
};