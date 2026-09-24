import { useState, useEffect } from 'react';
import { createUser, getAllUsers, deleteUser, updateUser } from '../services/userService';

const UserManager = () => {
    const [usersList, setUsersList] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'CUSTOMER' });

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            setUsersList(await getAllUsers());
        } catch (err) {
            setError(err.response?.data || 'Failed to load users.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(loadUsers);
    }, []);

    const resetForm = () => {
        setEditingUserId(null);
        setFormData({ username: '', email: '', password: '', role: 'CUSTOMER' });
    };

    const handleEdit = (selectedUser) => {
        setEditingUserId(selectedUser.id);
        setFormData({ username: selectedUser.username, email: selectedUser.email, password: '', role: selectedUser.role });
        setError('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            if (editingUserId) {
                await updateUser(editingUserId, formData);
            } else {
                await createUser(formData);
            }
            await loadUsers();
            resetForm();
        } catch (err) {
            setError(err.response?.data || `Failed to ${editingUserId ? 'update' : 'create'} user.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setError('');
            try {
                await deleteUser(id);
                setUsersList((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== id));
                if (editingUserId === id) resetForm();
            } catch (err) {
                setError(err.response?.data || 'Failed to delete user.');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">User Directory</h2>
                <p className="text-sm text-jcb-textMuted mt-1">Manage system access, operators, and customer accounts.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm font-medium">
                    {typeof error === 'string' ? error : 'The request could not be completed.'}
                </div>
            )}

            {/* CREATE / EDIT USER CARD */}
            <div className="bg-jcb-surface border border-jcb-border shadow-sm rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-jcb-textMain">{editingUserId ? 'Edit User' : 'Register New User'}</h3>
                    {editingUserId && <button type="button" onClick={resetForm} className="text-sm text-jcb-textMuted hover:text-jcb-textMain">Cancel</button>}
                </div>
                
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-jcb-textMuted uppercase mb-1">Username</label>
                        <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={Boolean(editingUserId)}
                            className="w-full px-3 py-2 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-jcb-textMuted uppercase mb-1">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required
                            className="w-full px-3 py-2 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-jcb-textMuted uppercase mb-1">Password</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingUserId}
                            className="w-full px-3 py-2 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-jcb-textMuted uppercase mb-1">Assign Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all">
                            <option value="CUSTOMER">Customer</option>
                            <option value="OPERATOR">Operator</option>
                            <option value="OPERATION_MANAGER">Operation Manager</option>
                            <option value="DISPATCH_MANAGER">Dispatch Manager</option>
                            <option value="FINANCE_OFFICER">Finance Officer</option>
                            <option value="ADMIN">System Admin</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-jcb-brand text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition shadow-sm">
                            {isSaving ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>

            {/* USERS DATA TABLE */}
            <div className="bg-jcb-surface border border-jcb-border shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-jcb-border">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Username</th>
                            <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Email Address</th>
                            <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">System Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-jcb-border">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-jcb-textMuted">Loading users...</td></tr>
                        ) : usersList.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-jcb-textMuted">No users found.</td></tr>
                        ) : usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4 text-jcb-textMuted font-medium">#{u.id}</td>
                                <td className="px-6 py-4 text-jcb-textMain font-bold">{u.username}</td>
                                <td className="px-6 py-4 text-jcb-textMuted">{u.email}</td>
                                <td className="px-6 py-4">
                                    {/* Dynamic Colored Pills based on Role */}
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                        u.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                                        u.role === 'OPERATOR' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition mr-4">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800 font-medium text-sm transition">
                                        Delete
                                    </button>
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