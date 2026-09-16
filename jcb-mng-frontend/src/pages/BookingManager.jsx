import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createBooking, getMyBookings, getAllBookings, updateBookingStatus } from '../services/bookingService';
import { getAvailableMachines } from '../services/machineService';

const BookingManager = () => {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [machines, setMachines] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Form State for Customers
    const [formData, setFormData] = useState({ machineId: '', startDate: '', endDate: '' });

    const loadData = useCallback(async () => {
        try {
            if (user?.role === 'ADMIN') {
                setBookings(await getAllBookings());
            } else if (user?.role === 'CUSTOMER') {
                const [bookingData, availableMachines] = await Promise.all([
                    getMyBookings(),
                    getAvailableMachines(),
                ]);
                setBookings(bookingData);
                setMachines(availableMachines.filter((machine) =>
                    machine.status === 'AVAILABLE' && machine.operationalStatus !== 'NON_OPERATIONAL'));
            }
        } catch (err) {
            setError(err.response?.data || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.startDate > formData.endDate) {
            setError('End date must be on or after the start date.');
            return;
        }
        try {
            await createBooking(formData);
            setFormData({ machineId: '', startDate: '', endDate: '' });
            alert("Booking request submitted successfully!");
            loadData();
        } catch (err) {
            setError(err.response?.data || 'Failed to create booking.');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateBookingStatus(id, status);
            loadData();
        } catch {
            setError('Failed to update booking status.');
        }
    };

    return (
        <div className="max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
                {user?.role === 'ADMIN' ? 'Manage Bookings' : 'My Rentals'}
            </h2>

            {loading && <p className="mb-4 text-sm text-gray-400">Loading bookings...</p>}

            {/* CUSTOMER BOOKING FORM */}
            {user?.role === 'CUSTOMER' && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">Request a JCB Rental</h3>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    
                    <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Select Equipment</label>
                            <select 
                                value={formData.machineId} 
                                onChange={(e) => setFormData({...formData, machineId: e.target.value})} 
                                required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none"
                            >
                                <option value="">-- Choose a Machine --</option>
                                {machines.map((machine) => (
                                    <option key={machine.id} value={machine.id}>
                                        {machine.name} | {machine.modelName} | SN: {machine.serialNumber} | Rs. {machine.dailyRate}/day
                                    </option>
                                ))}
                            </select>
                            {machines.length === 0 && <p className="mt-2 text-sm text-gray-400">No JCBs are currently available for booking.</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                            <input type="date" min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">End Date</label>
                            <input type="date" min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none" />
                        </div>
                        <div className="md:col-span-4 mt-2">
                            <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BOOKINGS DATA TABLE */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            {user?.role === 'ADMIN' && <th className="px-6 py-4">Customer</th>}
                            <th className="px-6 py-4">Machine</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Total Cost</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {bookings.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-800/50 transition">
                                <td className="px-6 py-4">#{b.id}</td>
                                {user?.role === 'ADMIN' && <td className="px-6 py-4 text-gray-100 font-medium">{b.customerName}</td>}
                                <td className="px-6 py-4">{b.machineDetails}</td>
                                <td className="px-6 py-4">{b.startDate} to {b.endDate}</td>
                                <td className="px-6 py-4 text-jcb-yellow font-bold">Rs. {b.totalCost}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded px-2 py-1 text-xs font-bold ${
                                        b.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' :
                                        b.status === 'PENDING' ? 'bg-jcb-yellow/20 text-jcb-yellow' :
                                        b.status === 'REJECTED' || b.status === 'CANCELED' ? 'bg-red-900/50 text-red-400' :
                                        'bg-blue-900/50 text-blue-400'
                                    }`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {/* ADMIN ACTIONS */}
                                    {user?.role === 'ADMIN' && b.status === 'PENDING' && (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleStatusChange(b.id, 'APPROVED')} className="text-green-400 hover:text-green-300 font-medium">Approve</button>
                                            <button onClick={() => handleStatusChange(b.id, 'REJECTED')} className="text-red-400 hover:text-red-300 font-medium">Reject</button>
                                        </div>
                                    )}
                                    {user?.role === 'ADMIN' && b.status === 'APPROVED' && (
                                        <button onClick={() => handleStatusChange(b.id, 'COMPLETED')} className="text-blue-400 hover:text-blue-300 font-medium">Mark Complete</button>
                                    )}
                                    
                                    {/* CUSTOMER ACTIONS */}
                                    {user?.role === 'CUSTOMER' && b.status === 'PENDING' && (
                                        <button onClick={() => handleStatusChange(b.id, 'CANCELED')} className="text-red-400 hover:text-red-300 font-medium">Cancel Request</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingManager;