import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { assignJob, getAllJobs, getMyJobs, updateJobStatus, deleteJob } from '../services/jobService';
import { getAllBookings } from '../services/bookingService';
import { getAllUsers } from '../services/userService';

const JobManager = () => {
    const { user } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [approvedBookings, setApprovedBookings] = useState([]);
    const [operators, setOperators] = useState([]);
    const [error, setError] = useState('');
    
    // Form State for Admins
    const [bookingId, setBookingId] = useState('');
    const [operatorUsername, setOperatorUsername] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            if (user?.role === 'ADMIN') {
                setJobs(await getAllJobs());
                
                // Fetch bookings and users to populate the dropdowns
                const allBookings = await getAllBookings();
                setApprovedBookings(allBookings.filter(b => b.status === 'APPROVED'));
                
                const allUsers = await getAllUsers();
                setOperators(allUsers.filter(u => u.role === 'OPERATOR'));
            } else if (user?.role === 'OPERATOR') {
                setJobs(await getMyJobs());
            }
        } catch (err) {
            setError(err.response?.data || 'Failed to load job assignments.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handleAssign = async (e) => {
        e.preventDefault();
        setError('');
        if (!bookingId || !operatorUsername) {
            setError('Select an approved booking and an operator.');
            return;
        }
        try {
            await assignJob(bookingId, operatorUsername);
            setBookingId('');
            setOperatorUsername('');
            alert("Operator successfully assigned to the booking!");
            loadData();
        } catch (err) {
            setError(err.response?.data || "Failed to assign operator");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateJobStatus(id, status);
            loadData();
        } catch (err) {
            setError(err.response?.data || 'Failed to update job status.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this job assignment?")) {
            try {
                await deleteJob(id);
                loadData();
            } catch (err) {
                setError(err.response?.data || 'Failed to delete assignment.');
            }
        }
    };

    return (
        <div className="max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
                {user?.role === 'ADMIN' ? 'Job Assignments' : 'My Operator Dashboard'}
            </h2>

            {loading && <p className="mb-4 text-sm text-gray-400">Loading job assignments...</p>}

            {/* ADMIN ASSIGNMENT FORM */}
            {user?.role === 'ADMIN' && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">Assign Operator to a Booking</h3>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    
                    <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Approved Booking</label>
                            <select 
                                value={bookingId} 
                                onChange={(e) => setBookingId(e.target.value)} 
                                required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none"
                            >
                                <option value="">-- Choose Booking --</option>
                                {approvedBookings.map(b => (
                                    <option key={b.id} value={b.id}>#{b.id} - {b.machineDetails} ({b.startDate})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Select Operator</label>
                            <select 
                                value={operatorUsername} 
                                onChange={(e) => setOperatorUsername(e.target.value)} 
                                required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none"
                            >
                                <option value="">-- Choose Operator --</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.username}>{op.username}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button type="submit" className="w-full bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                                Assign Operator
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* JOBS DATA TABLE */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Job ID</th>
                            <th className="px-6 py-4">Booking #</th>
                            <th className="px-6 py-4">Machine Details</th>
                            <th className="px-6 py-4">Dates</th>
                            {user?.role === 'ADMIN' && <th className="px-6 py-4">Assigned Operator</th>}
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {jobs.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No jobs found.</td></tr>
                        ) : jobs.map((j) => (
                            <tr key={j.id} className="hover:bg-gray-800/50 transition">
                                <td className="px-6 py-4 text-gray-100">JOB-{j.id}</td>
                                <td className="px-6 py-4">#{j.bookingId}</td>
                                <td className="px-6 py-4 text-gray-200 font-medium">{j.machineDetails}</td>
                                <td className="px-6 py-4">{j.dates}</td>
                                {user?.role === 'ADMIN' && <td className="px-6 py-4 text-jcb-yellow font-bold">{j.operatorName}</td>}
                                <td className="px-6 py-4">
                                    <span className={`rounded px-2 py-1 text-xs font-bold ${
                                        j.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                                        j.status === 'IN_PROGRESS' ? 'bg-blue-900/50 text-blue-400' :
                                        'bg-jcb-yellow/20 text-jcb-yellow'
                                    }`}>
                                        {j.status}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <div className="flex gap-3">
                                        {/* OPERATOR ACTIONS */}
                                        {user?.role === 'OPERATOR' && j.status === 'ASSIGNED' && (
                                            <button onClick={() => handleStatusUpdate(j.id, 'IN_PROGRESS')} className="text-blue-400 hover:text-blue-300 font-medium">Start Job</button>
                                        )}
                                        {user?.role === 'OPERATOR' && j.status === 'IN_PROGRESS' && (
                                            <button onClick={() => handleStatusUpdate(j.id, 'COMPLETED')} className="text-green-400 hover:text-green-300 font-medium">Mark Done</button>
                                        )}

                                        {/* ADMIN ACTIONS */}
                                        {user?.role === 'ADMIN' && (
                                            <button onClick={() => handleDelete(j.id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobManager;