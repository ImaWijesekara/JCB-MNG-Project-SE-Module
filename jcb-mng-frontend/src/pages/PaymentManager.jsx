import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { makePayment, getMyPayments, getAllPayments, updatePaymentStatus, deletePayment } from '../services/paymentService';
import { getMyBookings } from '../services/bookingService';

const PaymentManager = () => {
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [approvedBookings, setApprovedBookings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [bookingId, setBookingId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CARD');

    const loadData = useCallback(async () => {
        try {
            if (user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') {
                setPayments(await getAllPayments());
            } else if (user?.role === 'CUSTOMER') {
                const myPayments = await getMyPayments();
                setPayments(myPayments);
                const myBookings = await getMyBookings();
                const paidBookingIds = new Set(myPayments.map((payment) => payment.bookingId));
                setApprovedBookings(myBookings.filter((booking) =>
                    booking.status === 'APPROVED' && !paidBookingIds.has(booking.id)));
            }
        } catch {
            setError('Failed to load payments.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        if (!bookingId) {
            setError('Select an approved booking first.');
            return;
        }
        try {
            await makePayment(bookingId, paymentMethod);
            setBookingId('');
            alert("Payment submitted for processing!");
            loadData();
        } catch (err) {
            setError(err.response?.data || "Failed to process payment");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updatePaymentStatus(id, status);
            loadData();
        } catch {
            setError('Failed to update payment status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment record?')) return;

        try {
            await deletePayment(id);
            setPayments((currentPayments) => currentPayments.filter((payment) => payment.id !== id));
            setError('');
        } catch (err) {
            setError(err.response?.data || 'Failed to delete payment.');
        }
    };

    return (
        <div className="max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
                {user?.role === 'CUSTOMER' ? 'Billing & Payments' : 'Financial Dashboard'}
            </h2>

            {loading && <p className="mb-4 text-sm text-gray-400">Loading payments...</p>}

            {/* CUSTOMER PAYMENT FORM */}
            {user?.role === 'CUSTOMER' && (
                <div className="mb-8 bg-jcb-surface p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">Make a Payment</h3>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    
                    <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Select Approved Booking</label>
                            <select 
                                value={bookingId} 
                                onChange={(e) => setBookingId(e.target.value)} 
                                required
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none"
                            >
                                <option value="">-- Choose Booking --</option>
                                {approvedBookings.map(b => (
                                    <option key={b.id} value={b.id}>#{b.id} - {b.machineDetails} (Rs.{b.totalCost})</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
                            <select 
                                value={paymentMethod} 
                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                className="w-full px-3 py-2 bg-jcb-dark border border-gray-700 rounded text-gray-100 focus:border-jcb-yellow outline-none"
                            >
                                <option value="CARD">Credit/Debit Card</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CASH">Cash on Site</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button type="submit" className="w-full bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                                Submit Payment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PAYMENTS DATA TABLE */}
            <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Receipt ID</th>
                            <th className="px-6 py-4">Booking ID</th>
                            {(user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') && <th className="px-6 py-4">Customer</th>}
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Status</th>
                            {(user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') && <th className="px-6 py-4">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {payments.length === 0 ? (
                            <tr><td colSpan={user?.role === 'CUSTOMER' ? 5 : 7} className="px-6 py-8 text-center text-gray-500">No payment records found.</td></tr>
                        ) : payments.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-800/50 transition">
                                <td className="px-6 py-4 text-gray-100">TXN-{p.id}</td>
                                <td className="px-6 py-4">#{p.bookingId}</td>
                                {(user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') && <td className="px-6 py-4 font-medium text-gray-200">{p.customerName}</td>}
                                <td className="px-6 py-4 text-green-400 font-bold">Rs. {p.amount}</td>
                                <td className="px-6 py-4">{p.paymentMethod}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded px-2 py-1 text-xs font-bold ${
                                        p.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                                        p.status === 'PENDING' ? 'bg-jcb-yellow/20 text-jcb-yellow' :
                                        'bg-red-900/50 text-red-400'
                                    }`}>
                                        {p.status}
                                    </span>
                                </td>
                                
                                {/* FINANCE OFFICER ACTIONS */}
                                {(user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') && (
                                    <td className="px-6 py-4">
                                        {p.status === 'PENDING' && (
                                            <div className="flex gap-3">
                                                <button onClick={() => handleStatusUpdate(p.id, 'COMPLETED')} className="text-green-400 hover:text-green-300 font-medium">Verify</button>
                                                <button onClick={() => handleStatusUpdate(p.id, 'FAILED')} className="text-red-400 hover:text-red-300 font-medium">Fail</button>
                                                <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-gray-200 font-medium">Delete</button>
                                            </div>
                                        )}
                                        {p.status === 'FAILED' && (
                                            <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-gray-200 font-medium">Delete</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentManager;