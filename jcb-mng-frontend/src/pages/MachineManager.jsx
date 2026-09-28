import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMachines, addMachine, updateMachine, updateMachineStatus, deleteMachine } from '../services/machineService';
import { Link } from 'react-router-dom';

const MachineManager = () => {
    const { user } = useContext(AuthContext);
    const canManageMachines = user?.role === 'ADMIN' || user?.role === 'OPERATION_MANAGER';
    
    // Data State
    const [machines, setMachines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [formData, setFormData] = useState({ 
        name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', status: 'AVAILABLE', operationalStatus: 'OPERATIONAL' 
    });

    const loadMachines = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllMachines();
            setMachines(data);
        } catch (err) {
            setError(err.response?.data || 'Failed to load fleet data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMachines();
    }, [loadMachines]);

    // VIVA FLEX 1: Live Search Filtering
    const filteredMachines = useMemo(() => {
        return machines.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.modelName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [machines, searchTerm]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: null }); // Clear error on typing
        }
    };

    const resetForm = () => {
        setFormData({ name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', status: 'AVAILABLE', operationalStatus: 'OPERATIONAL' });
        setEditingId(null);
        setError('');
        setFieldErrors({});
    };

    const handleEdit = (machine) => {
        setEditingId(machine.id);
        setFormData({
            name: machine.name || '',
            modelName: machine.modelName || '',
            modelYear: machine.modelYear || '',
            serialNumber: machine.serialNumber || '',
            dailyRate: machine.dailyRate ?? '',
            status: machine.status || 'AVAILABLE',
            operationalStatus: machine.operationalStatus || 'OPERATIONAL',
        });
        setError('');
        setSuccess('');
        setFieldErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // VIVA FLEX 2: Client-Side Validation
    const validateForm = () => {
        const errors = {};
        const currentYear = new Date().getFullYear();
        
        if (formData.name.trim().length < 3) errors.name = "Name is too short.";
        if (formData.serialNumber.trim().length < 4) errors.serialNumber = "Invalid serial number.";
        if (formData.modelYear < 1990 || formData.modelYear > currentYear + 1) errors.modelYear = `Year must be between 1990 and ${currentYear + 1}.`;
        if (formData.dailyRate <= 0) errors.dailyRate = "Rate must be greater than 0.";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) return;

        const machine = { ...formData, dailyRate: Number(formData.dailyRate) };
        setIsSaving(true);
        try {
            if (editingId) {
                await updateMachine(editingId, machine);
                setSuccess('Machine profile updated successfully!');
            } else {
                await addMachine(machine);
                setSuccess('New machine registered successfully!');
            }
            resetForm();
            await loadMachines();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to save machine data.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        setError('');
        try {
            await updateMachineStatus(id, status);
            setMachines((current) => current.map((m) => m.id === id ? { ...m, status } : m));
            setSuccess('Fleet status updated.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update machine status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this machine? This action cannot be undone.')) return;
        setError('');
        try {
            await deleteMachine(id);
            setMachines((current) => current.filter((m) => m.id !== id));
            setSuccess('Machine removed from fleet.');
            if (editingId === id) resetForm();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to delete machine.');
        }
    };

    // Metrics Calculation
    const totalMachines = filteredMachines.length;
    const availableMachines = filteredMachines.filter(m => m.status === 'AVAILABLE').length;
    const rentedMachines = filteredMachines.filter(m => m.status === 'RENTED').length;

    // VIVA FLEX 3: Customer Card View Renderer
    const renderCustomerCatalog = () => {
        const availableCatalog = filteredMachines.filter(m => m.status === 'AVAILABLE' && m.operationalStatus === 'OPERATIONAL');

        if (isLoading) return <p className="text-center py-12 text-jcb-textMuted animate-pulse font-medium">Loading catalog...</p>;
        if (availableCatalog.length === 0) return (
            <div className="bg-white border border-jcb-border rounded-xl p-12 text-center shadow-sm">
                <p className="text-jcb-textMuted font-medium">No machines are currently available for your search criteria.</p>
            </div>
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCatalog.map(machine => (
                    <div key={machine.id} className="bg-white border border-jcb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-jcb-brand transition-all flex flex-col">
                        <div className="h-40 bg-gray-50 border-b border-jcb-border flex items-center justify-center relative">
                            {/* Decorative JCB Icon Placeholder */}
                            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md border border-green-200">AVAILABLE</span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-xl font-black text-jcb-textMain truncate" title={machine.name}>{machine.name}</h3>
                            <p className="text-sm text-jcb-textMuted mb-4">{machine.modelYear} • {machine.modelName}</p>
                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-jcb-textMuted uppercase font-bold">Daily Rate</p>
                                    <p className="text-lg font-black text-jcb-brand">Rs. {machine.dailyRate?.toLocaleString()}</p>
                                </div>
                                <Link to="/dashboard/bookings" className="bg-jcb-textMain text-white hover:bg-black font-bold py-2 px-4 rounded-md shadow-sm transition text-sm">
                                    Book Now
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER & METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {user?.role === 'CUSTOMER' ? 'Equipment Catalog' : 'Fleet Management'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {user?.role === 'CUSTOMER' ? 'Browse and book available machinery for your next project.' : 'Track machine inventory, daily rates, and operational status.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                    {/* Live Search */}
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Search machinery..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-jcb-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 w-full sm:w-56 transition-shadow"
                        />
                    </div>
                    {canManageMachines && (
                        <>
                            <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                                <span className="text-xs font-bold text-jcb-textMuted uppercase">Available</span>
                                <span className="text-lg font-black text-green-600">{availableMachines}</span>
                            </div>
                            <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                                <span className="text-xs font-bold text-jcb-textMuted uppercase">Rented</span>
                                <span className="text-lg font-black text-blue-600">{rentedMachines}</span>
                            </div>
                            <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                                <span className="text-xs font-bold text-jcb-textMuted uppercase">Total</span>
                                <span className="text-lg font-black text-jcb-textMain">{totalMachines}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ALERTS */}
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

            {/* CUSTOMER E-COMMERCE VIEW */}
            {user?.role === 'CUSTOMER' && renderCustomerCatalog()}

            {/* CREATE / EDIT MACHINE FORM (ADMIN/OPS ONLY) */}
            {canManageMachines && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${editingId ? 'bg-blue-100 text-blue-600' : 'bg-jcb-brand/20 text-yellow-700'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <h3 className="text-base font-bold text-jcb-textMain">{editingId ? 'Modify Machine Profile' : 'Register New Machine'}</h3>
                        </div>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm transition">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 items-start">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Machine Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} maxLength="100" placeholder="e.g. JCB 3CX Backhoe"
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.name ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all`} />
                                {fieldErrors.name && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.name}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Model</label>
                                <input type="text" name="modelName" value={formData.modelName} onChange={handleInputChange} required maxLength="100" placeholder="e.g. 3CX"
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Year</label>
                                <input type="number" name="modelYear" value={formData.modelYear} onChange={handleInputChange} placeholder="e.g. 2022"
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.modelYear ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all`} />
                                {fieldErrors.modelYear && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.modelYear}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Serial Number</label>
                                <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} maxLength="100" placeholder="e.g. SN-100293"
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.serialNumber ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all`} />
                                {fieldErrors.serialNumber && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.serialNumber}</p>}
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Daily Rate (LKR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-medium">Rs.</span>
                                    <input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange} step="0.01" placeholder="15000"
                                        className={`w-full pl-9 pr-4 py-2.5 bg-white border ${fieldErrors.dailyRate ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all`} />
                                </div>
                                {fieldErrors.dailyRate && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.dailyRate}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Op Status</label>
                                <select name="operationalStatus" value={formData.operationalStatus} onChange={handleInputChange} required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all appearance-none cursor-pointer">
                                    <option value="OPERATIONAL">OPERATIONAL</option>
                                    <option value="NON_OPERATIONAL">NON_OPERATIONAL</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 pt-6">
                                <button type="submit" disabled={isSaving} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSaving ? (
                                        <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                                    ) : editingId ? 'Save Changes' : 'Register Machine'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* FLEET DATA TABLE (ADMIN/OPS ONLY) */}
            {canManageMachines && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-jcb-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Serial No.</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Daily Rate</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Booking Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Health</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-jcb-textMuted">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span className="font-medium">Loading fleet inventory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMachines.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-jcb-textMuted">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                                </div>
                                                <span className="font-medium">{searchTerm ? 'No machines match your search.' : 'No machines found in fleet.'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMachines.map((machine) => (
                                    <tr key={machine.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-jcb-textMain">{machine.name}</span>
                                                <span className="text-xs text-jcb-textMuted">{machine.modelYear} • {machine.modelName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-jcb-textMuted font-mono">{machine.serialNumber}</td>
                                        <td className="px-6 py-4 font-bold text-jcb-textMain">Rs. {machine.dailyRate?.toLocaleString()}</td>
                                        
                                        {/* INTERACTIVE STATUS PILL */}
                                        <td className="px-6 py-4">
                                            <select 
                                                value={machine.status} 
                                                onChange={(e) => handleStatusChange(machine.id, e.target.value)} 
                                                className={`text-xs font-bold rounded-full px-3 py-1 border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-colors ${
                                                    machine.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                    machine.status === 'RENTED' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                    'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                                }`}
                                            >
                                                <option value="AVAILABLE">AVAILABLE</option>
                                                <option value="RENTED">RENTED</option>
                                                <option value="MAINTENANCE">MAINTENANCE</option>
                                            </select>
                                        </td>

                                        {/* OPERATIONAL HEALTH PILL */}
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex w-max items-center gap-1.5 ${
                                                machine.operationalStatus === 'OPERATIONAL' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${machine.operationalStatus === 'OPERATIONAL' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                {machine.operationalStatus.replace('_', ' ')}
                                            </span>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(machine)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit Machine">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                {user?.role === 'ADMIN' && (
                                                    <button onClick={() => handleDelete(machine.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete Machine">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineManager;