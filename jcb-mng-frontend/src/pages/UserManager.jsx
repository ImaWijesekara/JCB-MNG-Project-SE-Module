import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <div className="text-jcb-yellow">Loading users...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

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

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {[
                    ['Total users', totalUsers],
                    ['Active accounts', activeAccounts],
                    ['New this month', newThisMonth],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-800 bg-jcb-surface p-5">
                        <p className="text-sm text-gray-400">{label}</p>
                        <p className="mt-4 text-3xl font-bold text-jcb-yellow">{value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-800 bg-jcb-surface shadow-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-xs uppercase text-gray-100">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found.</td>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManager;