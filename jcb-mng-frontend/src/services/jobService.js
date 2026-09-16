import api from './api';

export const assignJob = async (bookingId, operatorUsername) => {
    const response = await api.post('/jobs/assign', { bookingId: Number(bookingId), operatorUsername });
    return response.data;
};
export const getAllJobs = async () => {
    const response = await api.get('/jobs/all');
    return response.data;
};
export const getMyJobs = async () => {
    const response = await api.get('/jobs/my');
    return response.data;
};
export const updateJobStatus = async (id, status) => {
    const response = await api.put(`/jobs/${id}/status`, null, { params: { status } });
    return response.data;
};
export const deleteJob = async (id) => {
    const response = await api.delete(`/jobs/delete/${id}`);
    return response.data;
};