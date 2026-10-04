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

export const createInvoice = async (bookingId, invoiceDetails) => {
    const response = await api.post('/invoices/create', {
        bookingId: Number(bookingId),
        dueDate: invoiceDetails.dueDate,
        description: invoiceDetails.description,
        notes: invoiceDetails.notes,
    });
    return response.data;
};

export const updateInvoice = async (invoiceId, invoiceDetails) => {
    const response = await api.put(`/invoices/${invoiceId}`, {
        dueDate: invoiceDetails.dueDate,
        description: invoiceDetails.description,
        notes: invoiceDetails.notes,
    });
    return response.data;
};

export const voidInvoice = async (invoiceId) => {
    const response = await api.delete(`/invoices/${invoiceId}`);
    return response.data;
};