import api from './api';

export const getAllInvoices = async () => {
    const response = await api.get('/invoices/all');
    return response.data;
};