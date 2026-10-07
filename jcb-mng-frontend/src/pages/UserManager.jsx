import { useState, useEffect, useMemo } from 'react';
import { createUser, getAllUsers, deleteUser, updateUser } from '../services/userService';

const UserManager = () => {
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Form State (Now matching the complete Entity)
    const [formData, setFormData] = useState({ 
        username: '', email: '', password: '', role: 'CUSTOMER',
        fullName: '', phoneNumber: '', address: '' 
    });

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            setUsersList(await getAllUsers());
        } catch (err) {
            setError(err.response?.data || 'Failed to load user directory.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // VIVA FLEX 1: Upgraded Real-time Search Filtering
    const filteredUsers = useMemo(() => {
        return usersList.filter(u => {
            const search = searchTerm.toLowerCase();
            return (
                (u.username || '').toLowerCase().includes(search) || 
                (u.email || '').toLowerCase().includes(search) ||
                (u.role || '').toLowerCase().includes(search) ||
                (u.fullName || '').toLowerCase().includes(search) ||
                (u.phoneNumber || '').includes(search)
            );
        });
    }, [usersList, searchTerm]);

    const resetForm = () => {
        setEditingUserId(null);
        setFormData({ 
            username: '', email: '', password: '', role: 'CUSTOMER',
            fullName: '', phoneNumber: '', address: '' 
        });
        setError('');
        setFieldErrors({});
    };

    const handleEdit = (selectedUser) => {
        setEditingUserId(selectedUser.id);
        setFormData({ 
            username: selectedUser.username || '', 
            email: selectedUser.email || '', 
            password: '', 
            role: selectedUser.role || 'CUSTOMER',
            fullName: selectedUser.fullName || '',
            phoneNumber: selectedUser.phoneNumber || '',
            address: selectedUser.address || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError('');
        setSuccess('');
        setFieldErrors({});
    };

    // VIVA FLEX 2: Strict Client-Side Validation
    const validateForm = () => {
        const errors = {};
        if (formData.fullName.trim().length < 3) errors.fullName = "Full name is required.";
        if (formData.phoneNumber.trim().length < 9) errors.phoneNumber = "Valid phone required.";
        if (formData.username.trim().length < 3) errors.username = "At least 3 characters.";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) errors.email = "Invalid email format.";
        
        // Password is only required when creating a NEW user. When editing, leaving it blank means "don't change it".
        if (!editingUserId && formData.password.length < 6) {
            errors.password = "Minimum 6 characters.";
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: null });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (editingUserId) {
                await updateUser(editingUserId, formData);
                setSuccess(`User profile for '${formData.username}' updated successfully.`);
            } else {
                await createUser(formData);
                setSuccess(`New user '${formData.username}' registered successfully.`);
            }
            await loadUsers();
            resetForm();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data || `Failed to ${editingUserId ? 'update' : 'create'} user.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (window.confirm(`Are you sure you want to permanently remove user '${username}'? This action cannot be undone.`)) {
            setError('');
            setSuccess('');
            try {
                await deleteUser(id);
                setUsersList((current) => current.filter((u) => u.id !== id));
                if (editingUserId === id) resetForm();
                setSuccess(`User '${username}' has been removed from the system.`);
                setTimeout(() => setSuccess(''), 5000);
            } catch (err) {
                setError(err.response?.data || 'Failed to delete user.');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">User Directory</h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">Manage system access, operator assignments, and customer accounts.</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Search by name, role, phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-jcb-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 w-full sm:w-64 transition-shadow"
                        />
                    </div>
                    {/* KPI Badge */}
                    <div className="flex items-center bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                        <span className="text-sm font-bold text-jcb-textMain">{filteredUsers.length} <span className="text-jcb-textMuted font-medium">Found</span></span>
                    </div>
                </div>
            </div>

            {/* ALERT BANNERS */}
            {error && (
                <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-md mb-8 shadow-sm">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    <span className="text-sm font-semibold">{success}</span>
                </div>
            )}

            {/* CREATE / EDIT USER CARD */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${editingUserId ? 'bg-blue-100 text-blue-600' : 'bg-jcb-brand/20 text-yellow-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">{editingUserId ? 'Modify User Profile' : 'Register New User'}</h3>
                    </div>
                    {editingUserId && (
                        <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm transition">
                            Cancel Edit
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleCreate} className="p-6">
                    {/* Top Row: Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-5 mb-5 items-start">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Full Name</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe"
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all`} />
                            {fieldErrors.fullName && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.fullName}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Phone Number</label>
                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="071 234 5678"
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all`} />
                            {fieldErrors.phoneNumber && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.phoneNumber}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@company.com"
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all`} />
                            {fieldErrors.email && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.email}</p>}
                        </div>
                    </div>

                    {/* Middle Row: System Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-5 mb-5 items-start">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">System Username</label>
                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={Boolean(editingUserId)} placeholder="Unique login ID"
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all disabled:bg-gray-50 disabled:text-gray-400`} />
                            {fieldErrors.username && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.username}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingUserId ? "Leave blank to keep current" : "••••••••"}
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`} />
                            {fieldErrors.password && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.password}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">System Role</label>
                            <select name="role" value={formData.role} onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-bold focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all appearance-none cursor-pointer">
                                <option value="CUSTOMER">Customer</option>
                                <option value="OPERATOR">Operator</option>
                                <option value="OPERATION_MANAGER">Operation Manager</option>
                                <option value="MAINTENANCE_MANAGER">Maintenance Manager</option>
                                <option value="FINANCE_OFFICER">Finance Officer</option>
                                <option value="ADMIN">System Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Bottom Row: Address & Submit */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-5 items-end border-t border-gray-50 pt-5">
                        <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Physical Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Required for equipment delivery..."
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all" />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={isSaving} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isSaving ? (
                                    <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                                ) : editingUserId ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* USERS DATA TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">System Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Loading directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                            </div>
                                            <span className="font-medium">No users match your search criteria.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-jcb-textMain">{u.fullName || 'N/A'}</span>
                                            <span className="text-xs text-jcb-textMuted font-mono">@{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-jcb-textMain font-medium">{u.email}</span>
                                            <span className="text-xs text-jcb-textMuted">{u.phoneNumber || 'No phone'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            u.role === 'CUSTOMER' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            u.role === 'OPERATOR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            u.role === 'MAINTENANCE_MANAGER' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                            u.role === 'FINANCE_OFFICER' ? 'bg-green-50 text-green-700 border-green-200' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>
                                            {u.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit User">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete User">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManager;