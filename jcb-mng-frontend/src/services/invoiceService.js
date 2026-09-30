import api from './api';

export const getAllInvoices = async () => {
    const response = await api.get('/invoices/all');
    return response.data;
};

export const getMyInvoices = async () => {
    const response = await api.get('/invoices/my');
    return response.data;
};

export const getEligibleInvoiceBookings = async () => {
    const response = await api.get('/invoices/eligible-bookings');
    return response.data;
};

export const createInvoice = async (bookingId) => {
    const response = await api.post('/invoices/create', { bookingId: Number(bookingId) });
    return response.data;
};

export const voidInvoice = async (invoiceId) => {
    const response = await api.delete(`/invoices/${invoiceId}`);
    return response.data;
};