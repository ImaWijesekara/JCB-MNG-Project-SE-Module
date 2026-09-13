import api from './api';

export const scheduleMaintenance = async (machineId, operatorUsername, description, serviceDate) => {
    const params = new URLSearchParams();
    params.append('machineId', machineId);
    params.append('operatorUsername', operatorUsername);
    params.append('description', description);
    params.append('serviceDate', serviceDate);

    const response = await api.post('/maintenance/schedule', params);
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
    const params = new URLSearchParams();
    params.append('status', status);
    const response = await api.put(`/maintenance/${taskId}/status`, params);
    return response.data;
};