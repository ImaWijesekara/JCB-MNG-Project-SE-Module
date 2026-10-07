import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createBooking, getMyBookings, getAllBookings, updateBookingStatus } from '../services/bookingService';
import { getAvailableMachines } from '../services/machineService';
import { makePayment } from '../services/paymentService';
import { getMyInvoices } from '../services/invoiceService';

const BookingManager = () => {
    const { user } = useContext(AuthContext);
    
    // Data State
    const [bookings, setBookings] = useState([]);
    const [machines, setMachines] = useState([]);
    const [invoices, setInvoices] = useState([]);
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [processingPaymentId, setProcessingPaymentId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CARD');
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Form State for Customers
    const [formData, setFormData] = useState({ machineId: '', startDate: '', endDate: '' });

    const isAdmin = user?.role === 'ADMIN';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                setBookings(await getAllBookings());
            } else if (user?.role === 'CUSTOMER') {
                const [bookingData, availableMachines, invoiceData] = await Promise.all([
                    getMyBookings(),
                    getAvailableMachines(),
                    getMyInvoices(),
                ]);
                setBookings(bookingData);
                setInvoices(invoiceData);
                setMachines(availableMachines.filter((machine) =>
                    machine.status === 'AVAILABLE' && machine.operationalStatus === 'OPERATIONAL'
                ));
            }
        } catch (err) {
            setError(err.response?.data || 'Failed to sync booking data.');
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        const loadInitialData = async () => {
            await loadData();
        };
        loadInitialData();
    }, [loadData]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: null });
        }
    };

    // VIVA FLEX 1: Strict Date & Field Validation
    const validateForm = () => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!formData.machineId) errors.machineId = "Please select a machine.";
        if (!formData.startDate) errors.startDate = "Start date is required.";
        if (formData.startDate && formData.startDate < today) errors.startDate = "Start date cannot be in the past.";
        if (!formData.endDate) errors.endDate = "End date is required.";
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            errors.endDate = "End date must be exactly on or after the start date.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        try {
            await createBooking(formData);
            setFormData({ machineId: '', startDate: '', endDate: '' });
            setSuccess("Rental request submitted! Awaiting dispatch approval.");
            await loadData();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data || 'Failed to create booking request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        setError('');
        setSuccess('');
        setProcessingId(id);
        try {
            await updateBookingStatus(id, status);
            await loadData();
            setSuccess(`Booking #${id} successfully marked as ${status}.`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update booking status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handlePayment = async (bookingId) => {
        setError('');
        setSuccess('');
        setProcessingPaymentId(bookingId);
        try {
            await makePayment(bookingId, paymentMethod);
            await loadData();
            setSuccess(`Payment submitted for booking #${bookingId}. Finance will verify it shortly.`);
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data || 'Failed to submit payment.');
        } finally {
            setProcessingPaymentId(null);
        }
    };

    const getInvoiceForBooking = (bookingId) => invoices.find((invoice) => invoice.bookingId === bookingId);

    // Metrics Calculation
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const activeBookings = bookings.filter(b => b.status === 'APPROVED').length;

    // Helper for beautiful status pills
    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-50 text-green-700 border-green-200';
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'REJECTED': 
            case 'CANCELED': return 'bg-red-50 text-red-700 border-red-200';
            case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER & METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {isAdmin ? 'Booking & Dispatch' : 'My Rentals'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {isAdmin ? 'Manage customer requests and dispatch logistics.' : 'Request machinery and track your active rentals.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Pending</span>
                        <span className="text-lg font-black text-yellow-600">{pendingBookings}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Active</span>
                        <span className="text-lg font-black text-green-600">{activeBookings}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Total</span>
                        <span className="text-lg font-black text-jcb-textMain">{totalBookings}</span>
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

            {/* CUSTOMER BOOKING FORM */}
            {user?.role === 'CUSTOMER' && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-jcb-brand/20 text-yellow-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">Reserve Equipment</h3>
                    </div>
                    
                    <form onSubmit={handleCreateBooking} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Select Equipment</label>
                                <select 
                                    name="machineId"
                                    value={formData.machineId} 
                                    onChange={handleInputChange} 
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.machineId ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="">-- Choose a Machine --</option>
                                    {machines.map((machine) => (
                                        <option key={machine.id} value={machine.id}>
                                            {machine.name} ({machine.modelName}) - Rs. {machine.dailyRate?.toLocaleString()}/day
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.machineId && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.machineId}</p>}
                                {machines.length === 0 && !loading && (
                                    <p className="mt-1.5 text-xs font-medium text-orange-500">No JCBs are currently available for booking.</p>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Start Date</label>
                                <input 
                                    type="date" 
                                    name="startDate"
                                    min={new Date().toISOString().split('T')[0]} 
                                    value={formData.startDate} 
                                    onChange={handleInputChange} 
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all cursor-pointer`} 
                                />
                                {fieldErrors.startDate && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.startDate}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">End Date</label>
                                <input 
                                    type="date" 
                                    name="endDate"
                                    min={formData.startDate || new Date().toISOString().split('T')[0]} 
                                    value={formData.endDate} 
                                    onChange={handleInputChange} 
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 transition-all cursor-pointer`} 
                                />
                                {fieldErrors.endDate && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.endDate}</p>}
                            </div>
                            <div className="md:col-span-4 pt-2">
                                <button type="submit" disabled={isSubmitting || machines.length === 0} className="bg-jcb-brand text-black font-bold py-2.5 px-6 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...</>
                                    ) : 'Confirm Rental Request'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* BOOKINGS DATA TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Ticket ID</th>
                                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Client</th>}
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Machine Specs</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Rental Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                {user?.role === 'CUSTOMER' && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Billing</th>}
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Loading booking ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                            </div>
                                            <span className="font-medium">No booking records found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.map((b) => (
                                <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono">#{b.id}</td>
                                    {isAdmin && <td className="px-6 py-4 font-bold text-jcb-textMain">{b.customerName}</td>}
                                    <td className="px-6 py-4 text-jcb-textMain font-medium truncate max-w-xs" title={b.machineDetails}>{b.machineDetails}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{b.startDate} <span className="mx-1 text-gray-300">→</span> {b.endDate}</td>
                                    <td className="px-6 py-4 font-black text-jcb-textMain">Rs. {b.totalCost?.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(b.status)}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    {user?.role === 'CUSTOMER' && (
                                        <td className="px-6 py-4">
                                            {b.status !== 'APPROVED' && !b.invoiceStatus ? (
                                                <span className="text-xs text-jcb-textMuted">Available after approval</span>
                                            ) : b.paymentStatus === 'COMPLETED' || b.invoiceStatus === 'PAID' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200">PAID</span>
                                            ) : b.paymentStatus === 'PENDING' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-yellow-50 text-yellow-700 border-yellow-200">VERIFYING</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-red-600">UNPAID</span>
                                                    {getInvoiceForBooking(b.id) && (
                                                        <select
                                                            aria-label={`Payment method for booking ${b.id}`}
                                                            value={paymentMethod}
                                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                                            className="px-2 py-1 border border-jcb-border rounded text-xs"
                                                        >
                                                            <option value="CARD">Card</option>
                                                            <option value="BANK_TRANSFER">Bank transfer</option>
                                                            <option value="CASH">Cash</option>
                                                        </select>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        {processingId === b.id ? (
                                            <span className="text-xs text-gray-400 font-medium animate-pulse">Processing...</span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* ADMIN/DISPATCH ACTIONS */}
                                                {isAdmin && b.status === 'PENDING' && (
                                                    <>
                                                        <button onClick={() => handleStatusChange(b.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-bold transition">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Approve
                                                        </button>
                                                        <button onClick={() => handleStatusChange(b.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-bold transition">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {isAdmin && b.status === 'APPROVED' && (
                                                    <button onClick={() => handleStatusChange(b.id, 'COMPLETED')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg> Archive
                                                    </button>
                                                )}
                                                
                                                {/* CUSTOMER ACTIONS */}
                                                {user?.role === 'CUSTOMER' && b.status === 'PENDING' && (
                                                    <button onClick={() => handleStatusChange(b.id, 'CANCELED')} className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-xs font-bold transition">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Cancel Request
                                                    </button>
                                                )}
                                                {user?.role === 'CUSTOMER' && b.status === 'APPROVED'
                                                    && b.paymentStatus !== 'COMPLETED'
                                                    && b.paymentStatus !== 'PENDING'
                                                    && getInvoiceForBooking(b.id) && (
                                                    <button
                                                        onClick={() => handlePayment(b.id)}
                                                        disabled={processingPaymentId === b.id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-jcb-brand text-black hover:bg-yellow-400 rounded-md text-xs font-bold transition disabled:opacity-60"
                                                    >
                                                        {processingPaymentId === b.id ? 'Submitting...' : `Pay Rs. ${b.totalCost?.toLocaleString()}`}
                                                    </button>
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

export default BookingManager;