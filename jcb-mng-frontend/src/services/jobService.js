import api from './api';

export const assignJob = async (bookingId, operatorUsername, assignedDate, status, description, priority, notes) => {
    const response = await api.post('/jobs/assign', {
        bookingId: Number(bookingId),
        operatorUsername,
        assignedDate,
        status,
        description,
        priority,
        notes,
    });
    return response.data;
};
export const updateJobAssignment = async (id, assignment) => {
    const response = await api.put(`/jobs/${id}`, {
        bookingId: Number(assignment.bookingId),
        operatorUsername: assignment.operatorUsername,
        assignedDate: assignment.assignedDate,
        status: assignment.status,
        description: assignment.description,
        priority: assignment.priority,
        notes: assignment.notes,
    });
    return response.data;
};
export const getAllJobs = async () => {
    const response = await api.get('/jobs/all');
    return response.data;
};
export const getAvailableBookings = async () => {
    const response = await api.get('/jobs/available-bookings');
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