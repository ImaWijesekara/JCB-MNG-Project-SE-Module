import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMaintenance, getMyTasks, scheduleMaintenance, updateTaskStatus } from '../services/maintenanceService';
import { getAllMachines } from '../services/machineService';
import { getAllUsers } from '../services/userService';

const MaintenanceManager = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [machines, setMachines] = useState([]);
    const [operators, setOperators] = useState([]);
    
    // Form fields for Admin
    const [machineId, setMachineId] = useState('');
    const [operatorUsername, setOperatorUsername] = useState('');
    const [description, setDescription] = useState('');
    const [serviceDate, setServiceDate] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const loadData = useCallback(async () => {
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
        } catch (error) {
            console.error("Failed to load maintenance data", error);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            await scheduleMaintenance(machineId, operatorUsername, description, serviceDate);
            setStatusMessage('Maintenance scheduled successfully!');
            setDescription('');
            setServiceDate('');
            setMachineId('');
            setOperatorUsername('');
            await loadData();
        } catch (error) {
            setStatusMessage(error.response?.data || 'Failed to schedule maintenance.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await updateTaskStatus(taskId, newStatus);
            await loadData();
        } catch (error) {
            alert('Failed to update status.');
        }
    };

    return (
        <div className="max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
                {user?.role === 'ADMIN' ? 'Maintenance Operations' : 'Assigned Job Queue'}
            </h2>

            {/* Admin Schedule Form */}
            {user?.role === 'ADMIN' && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">Schedule Repair Task</h3>
                    {statusMessage && <p className="mb-4 text-sm text-jcb-yellow">{statusMessage}</p>}
                    
                    <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Select Machine</label>
                            <select value={machineId} onChange={(e) => setMachineId(e.target.value)} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none">
                                <option value="">-- Choose Machine --</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.modelName} ({m.serialNumber}) - {m.status}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Assign Operator</label>
                            <select value={operatorUsername} onChange={(e) => setOperatorUsername(e.target.value)} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none">
                                <option value="">-- Choose Operator --</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.username}>{op.username} ({op.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Service Date</label>
                            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Repair Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="2"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="Describe the issue or service requirements..." />
                        </div>

                        <div>
                            <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                                Schedule Task
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tasks Data Table */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Machine</th>
                            <th className="px-6 py-4">Operator</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            {user?.role === 'OPERATOR' && <th className="px-6 py-4">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {tasks.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-4 text-center">No maintenance logs recorded.</td></tr>
                        ) : (
                            tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">#{task.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-100">{task.machineDetails}</td>
                                    <td className="px-6 py-4">{task.operatorName}</td>
                                    <td className="px-6 py-4 text-gray-300">{task.description}</td>
                                    <td className="px-6 py-4">{task.serviceDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                                            task.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' : 'bg-jcb-yellow/20 text-jcb-yellow'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    {user?.role === 'OPERATOR' && (
                                        <td className="px-6 py-4">
                                            {task.status !== 'COMPLETED' && (
                                                <button onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded transition">
                                                    Mark Completed
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaintenanceManager;