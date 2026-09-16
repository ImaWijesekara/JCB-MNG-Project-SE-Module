import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMachines, addMachine, updateMachine, updateMachineStatus, deleteMachine } from '../services/machineService';

const MachineManager = () => {
    const { user } = useContext(AuthContext);
    const canManageMachines = user?.role === 'ADMIN' || user?.role === 'OPERATION_MANAGER';
    const [machines, setMachines] = useState([]);
    const [formData, setFormData] = useState({ name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', status: 'AVAILABLE', operationalStatus: 'OPERATIONAL' });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');

    const loadMachines = useCallback(async () => {
        try {
            const data = await getAllMachines();
            setMachines(data);
        } catch (error) {
            console.error("Failed to load machines", error);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadMachines();
    }, [loadMachines]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ name: '', modelName: '', modelYear: '', serialNumber: '', dailyRate: '', status: 'AVAILABLE', operationalStatus: 'OPERATIONAL' });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const machine = { ...formData, dailyRate: Number(formData.dailyRate) };
        if (!machine.name.trim() || !machine.modelName.trim() || !machine.modelYear.trim() || !machine.serialNumber.trim() || machine.dailyRate < 0) {
            setMessage('Enter a name, model name, model year, serial number, and a valid daily rate.');
            return;
        }
        try {
            if (editingId) {
                await updateMachine(editingId, machine);
                setMessage('Machine updated successfully!');
            } else {
                await addMachine(machine);
                setMessage('Machine added successfully!');
            }
            resetForm();
            await loadMachines();
        } catch (error) {
            setMessage(error.response?.data || 'Failed to save machine.');
        }
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
        setMessage('');
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateMachineStatus(id, status);
            setMachines((current) => current.map((machine) => machine.id === id ? { ...machine, status } : machine));
            setMessage('Machine status updated successfully.');
        } catch (error) {
            setMessage(error.response?.data || 'Failed to update machine status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this machine?')) return;
        try {
            await deleteMachine(id);
            setMachines((current) => current.filter((machine) => machine.id !== id));
            setMessage('Machine deleted successfully.');
        } catch (error) {
            setMessage(error.response?.data || 'Failed to delete machine.');
        }
    };

    return (
        <div className="max-w-5xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">Machine Fleet</h2>

            {/* Only Admins can add new machines */}
            {canManageMachines && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">{editingId ? 'Edit Machine' : 'Add New Machine'}</h3>
                    {message && <p className="mb-4 text-sm text-jcb-yellow">{message}</p>}
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Machine Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required maxLength="100"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. JCB 3CX" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Model Name</label>
                            <input type="text" name="modelName" value={formData.modelName} onChange={handleInputChange} required maxLength="100"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. 3CX" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Model Year</label>
                            <input type="text" name="modelYear" value={formData.modelYear} onChange={handleInputChange} required pattern="[0-9]{4}" maxLength="4"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. 2022" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Serial Number</label>
                            <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} required maxLength="100"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. SN-100293" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Daily Rate</label>
                            <input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleInputChange} required min="0" step="0.01"
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. 15000" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Operational Status</label>
                            <select name="operationalStatus" value={formData.operationalStatus} onChange={handleInputChange} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none">
                                <option value="OPERATIONAL">OPERATIONAL</option>
                                <option value="NON_OPERATIONAL">NON_OPERATIONAL</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                                {editingId ? 'Update' : 'Add Machine'}
                            </button>
                            {editingId && <button type="button" onClick={resetForm} className="bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-600 transition">Cancel</button>}
                        </div>
                    </form>
                </div>
            )}

            {/* Fleet Table available to all roles, but actions depend on role */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Machine</th>
                            <th className="px-6 py-4">Model Name</th>
                            <th className="px-6 py-4">Model Year</th>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">Daily Rate</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Operational Status</th>
                            {canManageMachines && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {machines.length === 0 ? (
                            <tr><td colSpan={canManageMachines ? 9 : 8} className="px-6 py-4 text-center">No machines found in fleet.</td></tr>
                        ) : (
                            machines.map((machine) => (
                                <tr key={machine.id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">#{machine.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-100">{machine.name}</td>
                                    <td className="px-6 py-4">{machine.modelName}</td>
                                    <td className="px-6 py-4">{machine.modelYear}</td>
                                    <td className="px-6 py-4">{machine.serialNumber}</td>
                                    <td className="px-6 py-4">{machine.dailyRate?.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        {canManageMachines ? <select value={machine.status} onChange={(e) => handleStatusChange(machine.id, e.target.value)} className="rounded border border-gray-700 bg-jcb-dark px-2 py-1 text-xs text-gray-100">
                                            <option value="AVAILABLE">AVAILABLE</option><option value="RENTED">RENTED</option><option value="MAINTENANCE">MAINTENANCE</option>
                                        </select> : <span>{machine.status}</span>}
                                    </td>
                                    <td className="px-6 py-4">{machine.operationalStatus}</td>
                                    {canManageMachines && <td className="px-6 py-4 text-right"><button type="button" onClick={() => handleEdit(machine)} className="mr-4 font-medium text-blue-400 hover:text-blue-300">Edit</button>{user?.role === 'ADMIN' && <button type="button" onClick={() => handleDelete(machine.id)} className="font-medium text-red-400 hover:text-red-300">Delete</button>}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MachineManager;