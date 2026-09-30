import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMachines, getMyMachines, addMachine, addOperatorMachine, updateMachine, updateOperatorMachine, deleteMachine, deleteOperatorMachine } from '../services/machineService';
import { Link } from 'react-router-dom';

const OperationManager = () => {
    const { user } = useContext(AuthContext);
    
    // Role Definitions
    const isManager = user?.role === 'ADMIN' || user?.role === 'OPERATION_MANAGER';
    const isMaintenanceManager = user?.role === 'MAINTENANCE_MANAGER';
    const isOperator = user?.role === 'OPERATOR';
    const isCustomer = user?.role === 'CUSTOMER';
    
    // Data State
    const [machines, setMachines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Universal Form State
    const [formData, setFormData] = useState({ 
        name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', 
        status: 'AVAILABLE', operationalStatus: 'OPERATIONAL',
        currentLocation: 'Main Yard', startDate: '', endDate: ''
    });

    const loadMachines = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = isOperator ? await getMyMachines() : await getAllMachines();
            setMachines(data);
        } catch (err) {
            setError(err.response?.data || 'Failed to sync fleet data.');
        } finally {
            setIsLoading(false);
        }
    }, [isOperator]);

    useEffect(() => {
        loadMachines();
    }, [loadMachines]);

    const filteredMachines = useMemo(() => {
        return machines.filter(m => 
            (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (m.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.currentLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [machines, searchTerm]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: null }); 
    };

    const resetForm = () => {
        setFormData({ 
            name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', 
            status: 'AVAILABLE', operationalStatus: 'OPERATIONAL', currentLocation: 'Main Yard',
            startDate: '', endDate: ''
        });
        setEditingId(null);
        setIsCreating(false);
        setError('');
        setFieldErrors({});
    };

    // Populates the form based on who is clicking
    const handleEdit = (machine) => {
        setEditingId(machine.id);
        setIsCreating(false);
        setFormData({
            name: machine.name || '',
            modelName: machine.modelName || '',
            modelYear: machine.modelYear || '',
            serialNumber: machine.serialNumber || '',
            dailyRate: machine.dailyRate ?? '',
            status: machine.status || 'AVAILABLE',
            operationalStatus: machine.operationalStatus || 'OPERATIONAL',
            currentLocation: machine.currentLocation || 'Main Yard',
            startDate: machine.startDate || '',
            endDate: machine.endDate || '',
        });
        setError('');
        setSuccess('');
        setFieldErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Validation depends on the role
    const validateForm = () => {
        const errors = {};
        if (isManager || isCreating) {
            const currentYear = new Date().getFullYear();
            if (formData.name.trim().length < 3) errors.name = "Name is too short.";
            if (formData.serialNumber.trim().length < 4) errors.serialNumber = "Invalid serial number.";
            if (formData.modelYear < 1990 || formData.modelYear > currentYear + 1) errors.modelYear = `Year between 1990-${currentYear + 1}.`;
            if (formData.dailyRate <= 0) errors.dailyRate = "Rate must be > 0.";
        }
        if (formData.currentLocation.trim().length < 3) errors.currentLocation = "Site location is required.";
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            errors.endDate = "Return date must be on or after deployment start date.";
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) return;

        const machinePayload = isOperator && !isCreating ? {
            status: formData.status,
            operationalStatus: formData.operationalStatus,
            currentLocation: formData.currentLocation,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null
        } : { ...formData, dailyRate: Number(formData.dailyRate) };
        
        setIsSaving(true);
        try {
            if (editingId) {
                if (isOperator) {
                    await updateOperatorMachine(editingId, machinePayload);
                } else {
                    await updateMachine(editingId, machinePayload);
                }
                setSuccess(isOperator ? 'Field logistics and machine health updated!' : 'Machine asset details updated successfully!');
            } else if (isManager || (isOperator && isCreating)) {
                if (isOperator) {
                    await addOperatorMachine(machinePayload);
                    setSuccess('Field machine registered successfully!');
                } else {
                    await addMachine(machinePayload);
                    setSuccess('New machine registered into company assets!');
                }
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

    const handleDelete = async (id) => {
        const confirmation = isOperator
            ? 'Remove this machine you registered? Machines with bookings or field-task history cannot be removed.'
            : 'WARNING: Deleting an asset removes all its financial history. Proceed?';
        if (!window.confirm(confirmation)) return;
        try {
            if (isOperator) {
                await deleteOperatorMachine(id);
            } else {
                await deleteMachine(id);
            }
            setMachines((current) => current.filter((m) => m.id !== id));
            setSuccess('Machine removed from fleet.');
            if (editingId === id) resetForm();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to delete machine.');
        }
    };

    const handleCreate = () => {
        resetForm();
        setIsCreating(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- CUSTOMER E-COMMERCE RENDERER ---
    const renderCustomerCatalog = () => {
        const availableCatalog = filteredMachines.filter(m => m.status === 'AVAILABLE' && m.operationalStatus === 'OPERATIONAL');

        if (isLoading) return <p className="text-center py-12 text-jcb-textMuted animate-pulse font-medium">Loading catalog...</p>;
        if (availableCatalog.length === 0) return (
            <div className="bg-white border border-jcb-border rounded-xl p-12 text-center shadow-sm">
                <p className="text-jcb-textMuted font-medium">No machines are currently available at this location.</p>
            </div>
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCatalog.map(machine => (
                    <div key={machine.id} className="bg-white border border-jcb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="h-40 bg-gray-50 border-b border-jcb-border flex items-center justify-center relative">
                            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                            <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md border border-green-200">AVAILABLE</span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-xl font-black text-jcb-textMain truncate">{machine.name}</h3>
                            <p className="text-sm text-jcb-textMuted mb-2">{machine.modelYear} • {machine.modelName}</p>
                            
                            <div className="flex items-center gap-1.5 text-gray-500 mb-4 bg-gray-50 p-2 rounded-md border border-gray-100">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span className="text-xs font-bold uppercase tracking-wider">{machine.currentLocation || 'Main Warehouse'}</span>
                            </div>

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
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {isCustomer ? 'Equipment Catalog' : isManager ? 'Asset Management' : isOperator ? 'Field Logistics' : 'Fleet Status'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {isCustomer ? 'Browse machinery available at different site locations.' :
                         isManager ? 'Manage inventory, base pricing, and asset registration.' :
                         isMaintenanceManager ? 'Monitor machine health and field locations alongside maintenance records.' :
                         'Update your machine locations and report breakdowns directly from the field.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    {isOperator && !isCreating && !editingId && (
                        <button type="button" onClick={handleCreate} className="bg-jcb-brand text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm">
                            Register Machine
                        </button>
                    )}
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Search by name, site..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-jcb-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 w-full sm:w-56" />
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8 text-sm font-semibold shadow-sm">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-8 text-sm font-semibold shadow-sm">{success}</div>}

            {/* CUSTOMER VIEW */}
            {isCustomer && renderCustomerCatalog()}

            {/* MANAGER & OPERATOR FORM */}
            {(isManager || (isOperator && (editingId || isCreating))) && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-jcb-brand/20 text-yellow-700">
                                {isOperator ? 
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> : 
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                                }
                            </div>
                            <h3 className="text-base font-bold text-jcb-textMain">
                                {isOperator ? isCreating ? 'Register Field Machine' : `Update Location: ${formData.name}` : editingId ? 'Modify Fleet Asset' : 'Register New Machine'}
                            </h3>
                        </div>
                        {(editingId || isCreating) && (
                            <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">Cancel</button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* ASSET CREATION - ONLY VISIBLE TO MANAGERS */}
                        {(isManager || isCreating) && (
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-5 items-start mb-5 border-b border-gray-100 pb-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Machine Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. JCB 3CX Backhoe"
                                        className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.name ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Model</label>
                                    <input type="text" name="modelName" value={formData.modelName} onChange={handleInputChange} placeholder="e.g. 3CX"
                                        className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Year</label>
                                    <input type="number" name="modelYear" value={formData.modelYear} onChange={handleInputChange} placeholder="e.g. 2022"
                                        className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.modelYear ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Serial Number</label>
                                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} placeholder="e.g. SN-100293"
                                        className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.serialNumber ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Daily Rate</label>
                                    <input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange} step="0.01" placeholder="15000"
                                        className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.dailyRate ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                </div>
                            </div>
                        )}

                        {/* FIELD LOGISTICS - VISIBLE TO MANAGERS AND OPERATORS */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 items-end">
                            <div className={isOperator ? 'md:col-span-2' : 'md:col-span-3'}>
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Update Live Location</label>
                                <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleInputChange} placeholder="e.g. Colombo Construction Site A"
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.currentLocation ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                {fieldErrors.currentLocation && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.currentLocation}</p>}
                            </div>

                            {isOperator && (
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Fleet Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-jcb-brand/50">
                                        {formData.status === 'RENTED' ? <option value="RENTED">Rented</option> : <><option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option></>}
                                    </select>
                                </div>
                            )}

                            <div className={isOperator ? 'md:col-span-1' : 'md:col-span-2'}>
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Machine Health Status</label>
                                <select name="operationalStatus" value={formData.operationalStatus} onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 outline-none cursor-pointer">
                                    <option value="OPERATIONAL">🟢 Fully Operational</option>
                                    <option value="NON_OPERATIONAL">🔴 Broken Down / Needs Repair</option>
                                </select>
                            </div>

                            {isOperator && <>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Deployment Start</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Expected Return</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.endDate ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                                    {fieldErrors.endDate && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.endDate}</p>}
                                </div>
                            </>}

                            <div className={isOperator ? 'md:col-span-6 flex justify-end' : 'md:col-span-1'}>
                                <button type="submit" disabled={isSaving} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSaving ? 'Saving...' : isCreating ? 'Register Machine' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* STAFF DATA TABLE (Visible to Managers & Operators) */}
            {!isCustomer && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-jcb-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Live Location</th>
                                    {isOperator && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Fleet Status</th>}
                                    {isManager && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Rate</th>}
                                    {isOperator && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Deployment</th>}
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Health Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan={isOperator ? 6 : isManager ? 5 : 4} className="text-center py-8">Loading fleet data...</td></tr>
                                ) : filteredMachines.map((m) => (
                                    <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-jcb-textMain block">{m.name}</span>
                                            <span className="text-xs text-jcb-textMuted font-mono">SN: {m.serialNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800 flex items-center gap-1">
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                {m.currentLocation || 'Main Yard'}
                                            </span>
                                        </td>
                                        {isOperator && <td className="px-6 py-4 text-sm font-semibold text-jcb-textMain">{m.status}</td>}
                                        {isManager && <td className="px-6 py-4 font-black text-jcb-textMain">Rs.{m.dailyRate?.toLocaleString()}</td>}
                                        {isOperator && <td className="px-6 py-4 text-xs text-jcb-textMuted">{m.startDate || '—'} to {m.endDate || '—'}</td>}
                                        
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex w-max items-center gap-1.5 ${
                                                m.operationalStatus === 'OPERATIONAL' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.operationalStatus === 'OPERATIONAL' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                {m.operationalStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                                                {(isManager || isOperator) && (
                                                    <button onClick={() => handleEdit(m)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${isOperator ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-blue-600 hover:bg-blue-50'}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                        {isOperator && 'Update Logistics'}
                                                    </button>
                                                )}
                                                {(isManager || (isOperator && m.createdByUsername === user.username)) && (
                                                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
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

export default OperationManager;