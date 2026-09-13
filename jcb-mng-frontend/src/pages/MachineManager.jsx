import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllMachines, addMachine } from '../services/machineService';

const MachineManager = () => {
    const { user } = useContext(AuthContext);
    const [machines, setMachines] = useState([]);
    const [modelName, setModelName] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
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
        loadMachines();
    }, [loadMachines]);

    const handleAddMachine = async (e) => {
        e.preventDefault();
        try {
            await addMachine(modelName, serialNumber);
            setMessage('Machine added successfully!');
            setModelName('');
            setSerialNumber('');
            await loadMachines();
        } catch (error) {
            setMessage(error.response?.data || 'Failed to add machine.');
        }
    };

    return (
        <div className="max-w-5xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">Machine Fleet</h2>

            {/* Only Admins can add new machines */}
            {user?.role === 'ADMIN' && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">Add New Machine</h3>
                    {message && <p className="mb-4 text-sm text-jcb-yellow">{message}</p>}
                    <form onSubmit={handleAddMachine} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Model Name</label>
                            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. JCB 3CX" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Serial Number</label>
                            <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" placeholder="e.g. SN-100293" />
                        </div>
                        <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                            Add Machine
                        </button>
                    </form>
                </div>
            )}

            {/* Fleet Table available to all roles, but actions depend on role */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Model</th>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {machines.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center">No machines found in fleet.</td></tr>
                        ) : (
                            machines.map((machine) => (
                                <tr key={machine.id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">#{machine.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-100">{machine.modelName}</td>
                                    <td className="px-6 py-4">{machine.serialNumber}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                                            machine.status === 'AVAILABLE' ? 'bg-green-900/50 text-green-400' : 
                                            machine.status === 'IN_MAINTENANCE' ? 'bg-red-900/50 text-red-400' : 
                                            'bg-jcb-yellow/20 text-jcb-yellow'
                                        }`}>
                                            {machine.status}
                                        </span>
                                    </td>
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