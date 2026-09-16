import api from './api';

export const scheduleMaintenance = async (machineId, operatorUsername, description, serviceDate) => {
    const response = await api.post('/maintenance/schedule', {
        machineId: Number(machineId),
        operatorUsername,
        description,
        serviceDate,
    });
    return response.data;
};

export const getAllMaintenance = async () => {
    const response = await api.get('/maintenance/all');
    return response.data;
};

export const getMyTasks = async () => {
    const response = await api.get('/maintenance/my-tasks');
    return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
    const response = await api.put(`/maintenance/${taskId}/status`, null, {
        params: { status },
    });
    return response.data;
};

export const updateMaintenance = async (taskId, task) => {
    const response = await api.put(`/maintenance/${taskId}`, task);
    return response.data;
};

export const deleteMaintenance = async (taskId) => {
    const response = await api.delete(`/maintenance/${taskId}`);
    return response.data;
};