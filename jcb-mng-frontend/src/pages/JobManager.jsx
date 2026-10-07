import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { assignJob, getAllJobs, getAvailableBookings, getMyJobs, updateJobAssignment, updateJobStatus, deleteJob } from '../services/jobService';
import { getOperators } from '../services/userService';

const getTodayDate = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
};

const JobManager = () => {
    const { user } = useContext(AuthContext);
    
    // Data State
    const [jobs, setJobs] = useState([]);
    const [approvedBookings, setApprovedBookings] = useState([]);
    const [operators, setOperators] = useState([]);
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    
    // Assignment form state for managers
    const [bookingId, setBookingId] = useState('');
    const [operatorUsername, setOperatorUsername] = useState('');
    const [assignedDate, setAssignedDate] = useState(getTodayDate());
    const [status, setStatus] = useState('ASSIGNED');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [notes, setNotes] = useState('');
    const [editingJobId, setEditingJobId] = useState(null);

    const canManageJobs = ['ADMIN', 'OPERATION_MANAGER'].includes(user?.role);
    const isOperator = user?.role === 'OPERATOR';
    const editingJob = jobs.find((job) => job.id === editingJobId);

    const fetchData = useCallback(async () => {
        if (canManageJobs) {
            const [jobsData, availableBookings, availableOperators] = await Promise.all([
                getAllJobs(),
                getAvailableBookings(),
                getOperators()
            ]);
            return { jobs: jobsData, approvedBookings: availableBookings, operators: availableOperators };
        }
        if (isOperator) {
            return { jobs: await getMyJobs(), approvedBookings: [], operators: [] };
        }
        return { jobs: [], approvedBookings: [], operators: [] };
    }, [canManageJobs, isOperator]);

    const applyData = ({ jobs: nextJobs, approvedBookings: nextBookings, operators: nextOperators }) => {
        setJobs(nextJobs);
        setApprovedBookings(nextBookings);
        setOperators(nextOperators);
        setError('');
    };

    const loadData = async () => {
        setLoading(true);
        try {
            applyData(await fetchData());
        } catch (err) {
            setError(err.response?.data || 'Failed to sync job assignments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isCurrent = true;
        fetchData()
            .then((data) => {
                if (isCurrent) applyData(data);
            })
            .catch((err) => {
                if (isCurrent) setError(err.response?.data || 'Failed to sync job assignments.');
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });
        return () => {
            isCurrent = false;
        };
    }, [fetchData]);

    const resetForm = () => {
        setBookingId('');
        setOperatorUsername('');
        setAssignedDate(getTodayDate());
        setStatus('ASSIGNED');
        setDescription('');
        setPriority('MEDIUM');
        setNotes('');
        setEditingJobId(null);
    };

    const handleEdit = (job) => {
        setEditingJobId(job.id);
        setBookingId(String(job.bookingId));
        setOperatorUsername(job.operatorName || job.operatorUsername);
        setAssignedDate(job.assignedDate || getTodayDate());
        setStatus(job.status);
        setDescription(job.description || '');
        setPriority(job.priority || 'MEDIUM');
        setNotes(job.notes || '');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!bookingId || !operatorUsername) {
            setError('Please select both an approved booking and an available operator.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const assignment = { bookingId, operatorUsername, assignedDate, status, description, priority, notes };
            if (editingJobId) {
                await updateJobAssignment(editingJobId, assignment);
                setSuccess(`Job #${editingJobId} updated successfully.`);
            } else {
                await assignJob(bookingId, operatorUsername, assignedDate, status, description, priority, notes);
                setSuccess(`Operator successfully assigned to Booking #${bookingId}!`);
            }
            resetForm();
            await loadData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || (editingJobId ? 'Failed to update job assignment.' : 'Failed to assign operator.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setError('');
        setSuccess('');
        setProcessingId(id);
        try {
            await updateJobStatus(id, status);
            await loadData();
            setSuccess(`Job #${id} successfully marked as ${status}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update job status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to completely remove this job assignment?")) return;
        setError('');
        setSuccess('');
        try {
            await deleteJob(id);
            if (editingJobId === id) resetForm();
            await loadData();
            setSuccess('Job assignment removed.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to delete assignment.');
        }
    };

    // Metrics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'IN_PROGRESS').length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;

    // Helper for beautiful status pills
    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ASSIGNED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER & METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {canManageJobs ? 'Operator Job Assignments' : 'My Active Jobs'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {canManageJobs ? 'Create, update, and manage operator assignments for approved rental bookings.' : 'View your assigned machines and update job statuses.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Active</span>
                        <span className="text-lg font-black text-blue-600">{activeJobs}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Completed</span>
                        <span className="text-lg font-black text-green-600">{completedJobs}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Total Logs</span>
                        <span className="text-lg font-black text-jcb-textMain">{totalJobs}</span>
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

            {/* JOB ASSIGNMENT CREATE / UPDATE FORM */}
            {canManageJobs && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-jcb-brand/20 text-yellow-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">
                            {editingJobId ? `Update Job Assignment #${editingJobId}` : 'Create Job Assignment'}
                        </h3>
                        {editingJobId && (
                            <button type="button" onClick={resetForm} className="ml-auto text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">
                                Cancel
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5 items-end">
                            <div className="xl:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Approved Booking</label>
                                <select 
                                    value={bookingId} 
                                    onChange={(e) => setBookingId(e.target.value)} 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">-- Choose Approved Booking --</option>
                                    {editingJob && !approvedBookings.some((booking) => String(booking.id) === String(editingJob.bookingId)) && (
                                        <option value={editingJob.bookingId}>Ticket #{editingJob.bookingId} - Current booking</option>
                                    )}
                                    {approvedBookings.map(b => (
                                        <option key={b.id} value={b.id}>Ticket #{b.id} - {b.machineDetails} (Starts: {b.startDate})</option>
                                    ))}
                                </select>
                                {approvedBookings.length === 0 && !editingJobId && !loading && <p className="mt-1.5 text-xs text-jcb-textMuted font-medium">No approved, unassigned bookings are available.</p>}
                            </div>
                            <div className="xl:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Select Operator</label>
                                <select 
                                    value={operatorUsername} 
                                    onChange={(e) => setOperatorUsername(e.target.value)} 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">-- Choose Operator --</option>
                                    {operators.map(operator => (
                                        <option key={operator.username} value={operator.username}>{operator.username}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Assigned Date</label>
                                <input
                                    type="date"
                                    value={assignedDate}
                                    onChange={(e) => setAssignedDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Job Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50"
                                >
                                    <option value="ASSIGNED">Assigned</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 xl:col-span-3">
                                <label htmlFor="job-description" className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">
                                    Job Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="job-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    maxLength={1000}
                                    rows={3}
                                    placeholder="Describe the work the operator needs to complete"
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 resize-y"
                                />
                                <p className="mt-1 text-right text-xs text-jcb-textMuted">{description.length}/1000</p>
                            </div>
                            <div className="sm:col-span-2 xl:col-span-3">
                                <label htmlFor="job-notes" className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">
                                    Additional Notes
                                </label>
                                <textarea
                                    id="job-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength={2000}
                                    rows={3}
                                    placeholder="Add instructions or information for the operator"
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 resize-y"
                                />
                                <p className="mt-1 text-right text-xs text-jcb-textMuted">{notes.length}/2000</p>
                            </div>
                            <div className="sm:col-span-2 xl:col-span-6 flex justify-end gap-3 pt-1">
                                <button type="submit" disabled={isSubmitting || (!editingJobId && approvedBookings.length === 0) || operators.length === 0} className="min-w-36 bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                                    ) : editingJobId ? 'Update Assignment' : 'Assign Job'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* JOBS DATA TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Job ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Ticket #</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Rental Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Assigned Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Assignment Details</th>
                                {canManageJobs && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Assigned Operator</th>}
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={canManageJobs ? 9 : 8} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Loading dispatch ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageJobs ? 9 : 8} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                            </div>
                                            <span className="font-medium">No job assignments found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : jobs.map((j) => (
                                <tr key={j.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono font-medium">JOB-{j.id}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono">#{j.bookingId}</td>
                                    <td className="px-6 py-4 text-jcb-textMain font-medium truncate max-w-xs">{j.machineDetails}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{j.dates || j.scheduleDate}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{j.assignedDate || '—'}</td>
                                    <td className="px-6 py-4 whitespace-normal min-w-60 max-w-sm">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                j.priority === 'HIGH'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : j.priority === 'LOW'
                                                        ? 'bg-gray-50 text-gray-600 border-gray-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                            }`}>
                                                {j.priority || 'MEDIUM'} PRIORITY
                                            </span>
                                            <span className="font-semibold text-jcb-textMain break-words">{j.description || 'No description provided'}</span>
                                            <span className="text-xs text-jcb-textMuted break-words">{j.notes || 'No additional notes'}</span>
                                        </div>
                                    </td>
                                    {canManageJobs && <td className="px-6 py-4 font-bold text-jcb-textMain">{j.operatorName || j.operatorUsername}</td>}
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(j.status)}`}>
                                            {j.status}
                                        </span>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-right">
                                        {processingId === j.id ? (
                                            <span className="text-xs text-gray-400 font-medium animate-pulse">Updating...</span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                {/* OPERATOR ACTIONS (Massive field buttons) */}
                                                {isOperator && j.status === 'ASSIGNED' && (
                                                    <button onClick={() => handleStatusUpdate(j.id, 'IN_PROGRESS')} className="flex w-full justify-center items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition shadow-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Start Job
                                                    </button>
                                                )}
                                                {isOperator && j.status === 'IN_PROGRESS' && (
                                                    <button onClick={() => handleStatusUpdate(j.id, 'COMPLETED')} className="flex w-full justify-center items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-bold transition shadow-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        Mark Completed
                                                    </button>
                                                )}

                                                {canManageJobs && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(j)}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition"
                                                            title="Edit job assignment"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(j.id)}
                                                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-bold transition"
                                                            title="Delete job assignment"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
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

export default JobManager;