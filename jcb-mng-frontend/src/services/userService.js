import api from './api';

// READ ALL (Admin only)
export const getAllUsers = async () => {
    const response = await api.get('/users/all');
    return response.data;
};

// CREATE (Admin only)
export const createUser = async (userData) => {
    const payload = {
        username: userData.username,
        email: userData.email,
        passwordHash: userData.password,
        role: userData.role
    };
    const response = await api.post('/users/create', payload);
    return response.data;
};

// UPDATE (Admin only)
export const updateUser = async (id, userData) => {
    const payload = {
        email: userData.email,
        fullName: userData.fullName || null,
        phoneNumber: userData.phoneNumber || null,
        address: userData.address || null,
        role: userData.role
    };
    if (userData.password) {
        payload.passwordHash = userData.password;
    }
    const response = await api.put(`/users/update/${id}`, payload);
    return response.data;
};

// DELETE (Admin only)
export const deleteUser = async (id) => {
    const response = await api.delete(`/users/delete/${id}`);
    return response.data;
};

// UPDATE ONLY ROLE (Admin only)
export const updateUserRole = async (userId, newRole) => {
    // Send the new role as a query parameter
    const response = await api.put(`/users/${userId}/role?role=${newRole}`);
    return response.data;
};