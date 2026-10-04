import api from './api';

export const scheduleOperatorTask = async (machineId, operatorUsername, description, serviceDate, cost) => {
    const response = await api.post('/maintenance/schedule', {
        machineId: Number(machineId),
        operatorUsername,
        description,
        serviceDate,
        cost: Number(cost),
    });
    return response.data;
};

export const getAllOperatorTasks = async () => {
    const response = await api.get('/maintenance/all');
    return response.data;
};

export const getMyOperatorTasks = async () => {
    const response = await api.get('/maintenance/my-tasks');
    return response.data;
};

export const updateOperatorTaskStatus = async (taskId, status) => {
    const response = await api.put(`/maintenance/${taskId}/status`, null, {
        params: { status },
    });
    return response.data;
};

export const updateOperatorTask = async (taskId, task) => {
    const response = await api.put(`/maintenance/${taskId}`, task);
    return response.data;
};

export const deleteOperatorTask = async (taskId) => {
    const response = await api.delete(`/maintenance/${taskId}`);
    return response.data;
};