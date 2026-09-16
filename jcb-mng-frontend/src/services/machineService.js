import api from './api';

export const addMachine = async (machine) => {
    const response = await api.post('/machines/add', machine);
    return response.data;
};

export const updateMachine = async (id, machine) => {
    const response = await api.put(`/machines/update/${id}`, machine);
    return response.data;
};

export const getAllMachines = async () => {
    const response = await api.get('/machines/all');
    return response.data;
};

export const getAvailableMachines = async () => {
    const response = await api.get('/machines/available');
    return response.data;
};

export const updateMachineStatus = async (id, status) => {
    const params = new URLSearchParams();
    params.append('status', status);
    
    const response = await api.put(`/machines/${id}/status`, params);
    return response.data;
};

export const deleteMachine = async (id) => {
    const response = await api.delete(`/machines/delete/${id}`);
    return response.data;
};