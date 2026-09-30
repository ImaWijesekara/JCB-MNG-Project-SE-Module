import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllOperatorTasks, getMyOperatorTasks, scheduleOperatorTask, updateOperatorTask, deleteOperatorTask, updateOperatorTaskStatus } from '../services/operatorService';
import { getAllMachines, getMyMachines } from '../services/machineService';
import { getAllUsers } from '../services/userService';

const OperatorManagement = () => {
    const { user } = useContext(AuthContext);
    
    const isManager = user?.role === 'ADMIN' || user?.role === 'OPERATION_MANAGER' || user?.role === 'MAINTENANCE_MANAGER';
    const isOperator = user?.role === 'OPERATOR';

    // Data State
    const [tasks, setTasks] = useState([]);
    const [machines, setMachines] = useState([]);
    const [operators, setOperators] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Form fields
    const [machineId, setMachineId] = useState('');
    // If Operator, default the username to themselves!
    const [operatorUsername, setOperatorUsername] = useState(isOperator ? user.username : '');
    const [description, setDescription] = useState('');
    const [serviceDate, setServiceDate] = useState('');
    const [taskStatus, setTaskStatus] = useState('SCHEDULED');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const machineData = await (isOperator ? getMyMachines() : getAllMachines()).catch(() => []);
            setMachines(machineData);

            if (isManager) {
                const [taskData, userData] = await Promise.all([
                    getAllOperatorTasks().catch(() => []),
                    getAllUsers().catch(() => [])
                ]);
                setTasks(taskData);
                setOperators(userData.filter(u => u.role === 'OPERATOR'));
            } else if (isOperator) {
                setTasks(await getMyOperatorTasks().catch(() => []));
            }
        } catch (err) {
            setError(err.response?.data || 'Failed to sync task data.');
        } finally {
            setIsLoading(false);
        }
    }, [isManager, isOperator]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const search = searchTerm.toLowerCase();
            return (
                t.machineDetails?.toLowerCase().includes(search) ||
                t.operatorName?.toLowerCase().includes(search) ||
                t.operatorUsername?.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search) ||
                String(t.id).includes(search)
            );
        });
    }, [tasks, searchTerm]);

    const handleInputChange = (setter, fieldName) => (e) => {
        setter(e.target.value);
        if (fieldErrors[fieldName]) {
            setFieldErrors({ ...fieldErrors, [fieldName]: null });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!machineId) errors.machineId = "Please select a machine.";
        if (!operatorUsername) errors.operatorUsername = "Technician required.";
        if (!serviceDate) errors.serviceDate = "Date is required.";
        if (description.trim().length < 5) errors.description = "Provide a detailed task note.";
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) return;
        
        setIsSaving(true);
        try {
            const task = { machineId: Number(machineId), operatorUsername, description: description.trim(), serviceDate, status: taskStatus };
            if (editingTaskId) {
                await updateOperatorTask(editingTaskId, task);
                setSuccess('Task notes updated successfully!');
            } else {
                await scheduleOperatorTask(machineId, operatorUsername, description, serviceDate);
                setSuccess(isOperator ? 'Field task reported successfully!' : 'New task dispatched!');
            }
            handleCancelEdit();
            await loadData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to save task.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (task) => {
        setEditingTaskId(task.id);
        setMachineId(String(task.machineId));
        setOperatorUsername(task.operatorUsername || task.operatorName);
        setDescription(task.description);
        setServiceDate(task.serviceDate);
        setTaskStatus(task.status);
        setError('');
        setSuccess('');
        setFieldErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setTaskStatus('SCHEDULED');
        setMachineId('');
        setOperatorUsername(isOperator ? user.username : ''); // Reset back to themselves if operator
        setDescription('');
        setServiceDate('');
        setError('');
        setFieldErrors({});
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to permanently delete this task record?')) return;
        setError('');
        try {
            await deleteOperatorTask(taskId);
            setTasks((current) => current.filter((task) => task.id !== taskId));
            if (editingTaskId === taskId) handleCancelEdit();
            setSuccess('Task log deleted.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to delete task.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setError('');
        setSuccess('');
        setProcessingId(taskId);
        try {
            await updateOperatorTaskStatus(taskId, newStatus);
            await loadData();
            setSuccess(`Task #${taskId} successfully marked as ${newStatus}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update status.');
        } finally {
            setProcessingId(null);
        }
    };

    const totalTasks = filteredTasks.length;
    const pendingTasks = filteredTasks.filter(t => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS').length;
    const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {isManager ? 'Fleet Maintenance' : 'Field Task Reports'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {isManager ? 'Schedule repairs, dispatch technicians, and track service history.' : 'Create, update, and manage your field breakdown notes and repair tasks.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-jcb-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 w-full sm:w-56" />
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Pending</span>
                        <span className="text-lg font-black text-yellow-600">{pendingTasks}</span>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8 shadow-sm text-sm font-semibold">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-8 shadow-sm text-sm font-semibold">{success}</div>}

            {/* FULL CRUD FORM - VISIBLE TO BOTH MANAGER AND OPERATOR */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${editingTaskId ? 'bg-blue-100 text-blue-600' : 'bg-jcb-brand/20 text-yellow-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">{editingTaskId ? 'Update Task Details' : 'Create New Task / Report'}</h3>
                    </div>
                    {editingTaskId && (
                        <button type="button" onClick={handleCancelEdit} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">
                            Cancel
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleSchedule} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Select Machine</label>
                            <select value={machineId} onChange={handleInputChange(setMachineId, 'machineId')} 
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.machineId ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm font-medium focus:ring-2 focus:ring-jcb-brand/50`}
                            >
                                <option value="">-- Choose Machine --</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.modelYear})</option>
                                ))}
                            </select>
                            {fieldErrors.machineId && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.machineId}</p>}
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Assignee</label>
                            {isOperator ? (
                                // Operator is locked to their own name
                                <input type="text" disabled value={user.username} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 font-bold" />
                            ) : (
                                <select value={operatorUsername} onChange={handleInputChange(setOperatorUsername, 'operatorUsername')} 
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.operatorUsername ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm font-medium focus:ring-2 focus:ring-jcb-brand/50`}
                                >
                                    <option value="">-- Choose Technician --</option>
                                    {operators.map(op => <option key={op.id} value={op.username}>{op.username}</option>)}
                                </select>
                            )}
                            {fieldErrors.operatorUsername && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.operatorUsername}</p>}
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Task Date</label>
                            <input type="date" value={serviceDate} min={new Date().toISOString().split('T')[0]} onChange={handleInputChange(setServiceDate, 'serviceDate')} 
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.serviceDate ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Task Notes / Description</label>
                            <input type="text" value={description} onChange={handleInputChange(setDescription, 'description')} maxLength="1000" placeholder="E.g., Hydraulic pipe burst. Need replacement parts."
                                className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.description ? 'border-red-500' : 'border-jcb-border'} rounded-lg text-sm focus:ring-2 focus:ring-jcb-brand/50`} />
                            {fieldErrors.description && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.description}</p>}
                        </div>

                        <div className="md:col-span-1 pt-6">
                            <button type="submit" disabled={isSaving} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm flex items-center justify-center">
                                {isSaving ? 'Saving...' : editingTaskId ? 'Update Details' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Ticket ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-jcb-textMuted animate-pulse">Loading task logs...</td></tr>
                            ) : filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono">#{task.id}</td>
                                    <td className="px-6 py-4 font-bold text-jcb-textMain">{task.machineDetails}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted max-w-xs truncate" title={task.description}>{task.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {processingId === task.id ? (
                                            <span className="text-xs text-gray-400 font-medium animate-pulse">Processing...</span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* VIVA FLEX: The Operator has full Edit/Delete power over their tasks! */}
                                                {task.status !== 'COMPLETED' && (
                                                    <button onClick={() => handleStatusChange(task.id, 'COMPLETED')} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-bold transition">
                                                        Complete
                                                    </button>
                                                )}
                                                <button onClick={() => handleEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit Task Notes">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete Task">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        )}
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

export default OperatorManagement;