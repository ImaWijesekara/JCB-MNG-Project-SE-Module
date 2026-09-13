import api from './api';

export const addMachine = async (modelName, serialNumber) => {
    const params = new URLSearchParams();
    params.append('modelName', modelName);
    params.append('serialNumber', serialNumber);
    
    const response = await api.post('/machines/add', params);
    return response.data;
};

export const getAllMachines = async () => {
    const response = await api.get('/machines/all');
    return response.data;
};

export const updateMachineStatus = async (id, status) => {
    const params = new URLSearchParams();
    params.append('status', status);
    
    const response = await api.put(`/machines/${id}/status`, params);
    return response.data;
};