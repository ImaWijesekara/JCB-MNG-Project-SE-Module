import api from './api';

// READ ALL (Admin only)
export const getAllUsers = async () => {
    const response = await api.get('/users/all');
    return response.data;
};

// CREATE (Admin only)
export const createUser = async (userData) => {
    // We map the frontend "password" field to the backend "passwordHash" field if needed, 
    // but assuming your backend accepts what the frontend sends.
    // If your backend User entity expects "passwordHash", we make sure it's mapped correctly.
    const payload = {
        ...userData,
        passwordHash: userData.password // mapping the form's password to your backend's passwordHash
    };
    const response = await api.post('/users/create', payload);
    return response.data;
};

// UPDATE (Admin only)
export const updateUser = async (id, userData) => {
    const payload = {
        ...userData,
        passwordHash: userData.password
    };
    const response = await api.put(`/users/update/${id}`, payload);
    return response.data;
};

// DELETE (Admin only)
export const deleteUser = async (id) => {
    const response = await api.delete(`/users/delete/${id}`);
    return response.data;
};