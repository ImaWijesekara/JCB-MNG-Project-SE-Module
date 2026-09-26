import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMaintenance, getMyTasks, scheduleMaintenance, updateMaintenance, deleteMaintenance, updateTaskStatus } from '../services/maintenanceService';
import { getAllMachines } from '../services/machineService';
import { getAllUsers } from '../services/userService';

const MaintenanceManager = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [machines, setMachines] = useState([]);
    const [operators, setOperators] = useState([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    
    // Form fields
    const [machineId, setMachineId] = useState('');
    const [operatorUsername, setOperatorUsername] = useState('');
    const [description, setDescription] = useState('');
    const [serviceDate, setServiceDate] = useState('');
    const [taskStatus, setTaskStatus] = useState('SCHEDULED');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (user?.role === 'ADMIN') {
                const [taskData, machineData, userData] = await Promise.all([
                    getAllMaintenance(),
                    getAllMachines(),
                    getAllUsers()
                ]);
                setTasks(taskData);
                setMachines(machineData);
                // Filter users to only show OPERATORS for task assignment
                setOperators(userData.filter(u => u.role === 'OPERATOR'));
            } else if (user?.role === 'OPERATOR') {
                const taskData = await getMyTasks();
                setTasks(taskData);
            }
        } catch (err) {
            setError(err.response?.data || 'Failed to load maintenance data.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSchedule = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!machineId || !operatorUsername || !description.trim() || !serviceDate) {
            setError('Please complete all required fields.');
            return;
        }
        
        setIsSaving(true);
        try {
            const task = { machineId: Number(machineId), operatorUsername, description: description.trim(), serviceDate, status: taskStatus };
            if (editingTaskId) {
                await updateMaintenance(editingTaskId, task);
                setSuccess('Maintenance task updated successfully!');
            } else {
                await scheduleMaintenance(machineId, operatorUsername, description, serviceDate);
                setSuccess('New repair task dispatched successfully!');
            }
            handleCancelEdit();
            await loadData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to schedule maintenance.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (task) => {
        setEditingTaskId(task.id);
        setMachineId(String(task.machineId));
        setOperatorUsername(task.operatorUsername || task.operatorName); // Handle depending on DTO
        setDescription(task.description);
        setServiceDate(task.serviceDate);
        setTaskStatus(task.status);
        setError('');
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setTaskStatus('SCHEDULED');
        setMachineId('');
        setOperatorUsername('');
        setDescription('');
        setServiceDate('');
        setError('');
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this maintenance task?')) return;
        setError('');
        try {
            await deleteMaintenance(taskId);
            setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
            if (editingTaskId === taskId) handleCancelEdit();
            setSuccess('Maintenance task removed.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to delete maintenance task.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setError('');
        setSuccess('');
        setProcessingId(taskId);
        try {
            await updateTaskStatus(taskId, newStatus);
            await loadData();
            setSuccess(`Task #${taskId} successfully marked as ${newStatus}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update status.');
        } finally {
            setProcessingId(null);
        }
    };

    // Calculate Metrics
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS').length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER & METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {user?.role === 'ADMIN' ? 'Fleet Maintenance' : 'Assigned Repair Queue'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {user?.role === 'ADMIN' ? 'Schedule repairs, dispatch operators, and track service history.' : 'View your assigned machines and update repair statuses.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Pending</span>
                        <span className="text-lg font-black text-yellow-600">{pendingTasks}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Completed</span>
                        <span className="text-lg font-black text-green-600">{completedTasks}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Total Logs</span>
                        <span className="text-lg font-black text-jcb-textMain">{totalTasks}</span>
                    </div>
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

            {/* ADMIN DISPATCH FORM */}
            {user?.role === 'ADMIN' && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${editingTaskId ? 'bg-blue-100 text-blue-600' : 'bg-jcb-brand/20 text-yellow-700'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <h3 className="text-base font-bold text-jcb-textMain">{editingTaskId ? 'Modify Repair Ticket' : 'Dispatch New Repair Task'}</h3>
                        </div>
                        {editingTaskId && (
                            <button type="button" onClick={handleCancelEdit} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm transition">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSchedule} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Select Machine</label>
                                <select value={machineId} onChange={(e) => setMachineId(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all appearance-none cursor-pointer">
                                    <option value="">-- Choose Machine --</option>
                                    {machines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.modelYear}) - {m.status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Assign Operator</label>
                                <select value={operatorUsername} onChange={(e) => setOperatorUsername(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all appearance-none cursor-pointer">
                                    <option value="">-- Choose Operator --</option>
                                    {operators.map(op => (
                                        <option key={op.id} value={op.username}>{op.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Service Date</label>
                                <input type="date" value={serviceDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setServiceDate(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all cursor-pointer" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Repair Description</label>
                                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength="1000"
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all" placeholder="E.g., Replace hydraulic fluid and check boom cylinders." />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Task Status</label>
                                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all appearance-none cursor-pointer">
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <button type="submit" disabled={isSaving} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSaving ? (
                                        <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                                    ) : editingTaskId ? 'Save Changes' : 'Dispatch Task'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* MAINTENANCE TASKS TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Ticket ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Technician</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Loading maintenance logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                                            </div>
                                            <span className="font-medium">No maintenance logs found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono">#{task.id}</td>
                                    <td className="px-6 py-4 font-bold text-jcb-textMain">{task.machineDetails}</td>
                                    <td className="px-6 py-4 text-jcb-textMain">{task.operatorName || task.operatorUsername}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted max-w-xs truncate" title={task.description}>{task.description}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">
                                        {new Date(task.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {processingId === task.id ? (
                                            <span className="text-xs text-gray-400 font-medium animate-pulse">Processing...</span>
                                        ) : user?.role === 'OPERATOR' ? (
                                            task.status !== 'COMPLETED' && (
                                                <button onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                                    className="flex items-center justify-end w-full gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-bold transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Complete
                                                </button>
                                            )
                                        ) : (
                                            /* ADMIN ACTIONS (Hidden until hover) */
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit Task">
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

export default MaintenanceManager;