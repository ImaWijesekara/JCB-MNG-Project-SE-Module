import api from './api';

export const getMonthlyReports = async () => {
    const response = await api.get('/reports/monthly');
    return response.data;
};