import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/userService';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // CRUD Form State
    const [formData, setFormData] = useState({ id: null, username: '', email: '', password: '', role: 'CUSTOMER' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load users');
            setLoading(false);
        }
    };

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateUser(formData.id, formData);
                alert("User updated successfully");
            } else {
                await createUser(formData);
                alert("User created successfully");
            }
            resetForm();
            loadUsers(); // Refresh table
        } catch (err) {
            alert(err.response?.data || "Operation failed");
        }
    };

    const handleEdit = (user) => {
        // Load user data into form, leave password blank so we only update it if they type a new one
        setFormData({ id: user.id, username: user.username, email: user.email, password: '', role: user.role });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            try {
                await deleteUser(id);
                loadUsers(); // Refresh table
            } catch (err) {
                alert("Failed to delete user");
            }
        }
    };

    const resetForm = () => {
        setFormData({ id: null, username: '', email: '', password: '', role: 'CUSTOMER' });
        setIsEditing(false);
    };

    if (loading) return <div className="text-jcb-yellow">Loading users...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    // --- Stats Calculations ---
    const totalUsers = users.length;
    const activeAccounts = users.length;
    const newThisMonth = users.filter((user) => {
        if (!user.createdAt) return false;
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">User Management</h2>

            {/* STATS SECTION */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {[
                    ['Total users', totalUsers],
                    ['Active accounts', activeAccounts],
                    ['New this month', newThisMonth],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-800 bg-jcb-surface p-5 shadow-sm">
                        <p className="text-sm text-gray-400">{label}</p>
                        <p className="mt-4 text-3xl font-bold text-jcb-yellow">{value}</p>
                    </div>
                ))}
            </div>

            {/* CREATE / EDIT FORM */}
            <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800 shadow-md">
                <h3 className="text-xl font-bold text-gray-100 mb-4">{isEditing ? 'Edit User' : 'Create New User'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={isEditing} required
                            className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                            className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">
                            {isEditing ? 'New Password (Optional)' : 'Password'}
                        </label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!isEditing}
                            className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Role</label>
                        <select name="role" value={formData.role} onChange={handleInputChange} required
                            className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100">
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OPERATOR">OPERATOR</option>
                            <option value="FINANCE_OFFICER">FINANCE_OFFICER</option>
                            <option value="MAINTENANCE_TECHNICIAN">MAINTENANCE_TECHNICIAN</option>
                            <option value="OPERATION_MANAGER">OPERATION_MANAGER</option>
                        </select>
                    </div>
                    <div className="md:col-span-4 flex gap-4 mt-2">
                        <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                            {isEditing ? 'Update User' : 'Create User'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="bg-gray-700 text-white font-bold py-2 px-6 rounded hover:bg-gray-600 transition">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* USERS TABLE */}
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-jcb-surface shadow-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-xs uppercase text-gray-100">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/50 transition">
                                <td className="px-6 py-4">#{user.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-100">{user.username}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded px-2 py-1 text-xs font-bold ${
                                        user.role === 'ADMIN' ? 'bg-red-900/50 text-red-400' : 
                                        user.role === 'CUSTOMER' ? 'bg-jcb-yellow/20 text-jcb-yellow' : 
                                        'bg-blue-900/50 text-blue-400'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(user)} className="text-blue-400 hover:text-blue-300 font-medium mr-4">Edit</button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManager;