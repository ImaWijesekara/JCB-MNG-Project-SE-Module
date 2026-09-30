import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { makePayment, getMyPayments, getAllPayments, updatePaymentStatus, deletePayment } from '../services/paymentService';
import { getMyInvoices } from '../services/invoiceService';

const fetchPaymentData = async (role, isFinance) => {
    if (isFinance) {
        return { payments: await getAllPayments().catch(() => []), invoices: [] };
    }
    if (role === 'CUSTOMER') {
        const [payments, invoices] = await Promise.all([
            getMyPayments().catch(() => []),
            getMyInvoices().catch(() => [])
        ]);
        return { payments, invoices };
    }
    return { payments: [], invoices: [] };
};

const PaymentManager = () => {
    const { user } = useContext(AuthContext);
    const isFinance = user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN';

    // Data State
    const [payments, setPayments] = useState([]);
    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [payableInvoices, setPayableInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // Form State
    const [bookingId, setBookingId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CARD');

    const loadData = useCallback(async () => {
        try {
            const { payments: paymentData, invoices: invoiceData } = await fetchPaymentData(user?.role, isFinance);
            setPayments(paymentData);
            setCustomerInvoices(invoiceData);
            setPayableInvoices(invoiceData.filter((invoice) =>
                invoice.status === 'UNPAID' && !paymentData.some((payment) =>
                    payment.bookingId === invoice.bookingId
                    && ['PENDING', 'COMPLETED'].includes(payment.status))));
        } catch {
            setError('Failed to sync financial ledger.');
        } finally {
            setLoading(false);
        }
    }, [user, isFinance]);

    useEffect(() => {
        let isCurrent = true;
        const loadInitialData = async () => {
            try {
                const { payments: paymentData, invoices: invoiceData } = await fetchPaymentData(user?.role, isFinance);
                if (!isCurrent) return;
                setPayments(paymentData);
                setCustomerInvoices(invoiceData);
                setPayableInvoices(invoiceData.filter((invoice) =>
                    invoice.status === 'UNPAID' && !paymentData.some((payment) =>
                        payment.bookingId === invoice.bookingId
                        && ['PENDING', 'COMPLETED'].includes(payment.status))));
            } catch {
                if (isCurrent) setError('Failed to sync financial ledger.');
            } finally {
                if (isCurrent) setLoading(false);
            }
        };
        loadInitialData();
        return () => { isCurrent = false; };
    }, [user, isFinance]);

    // VIVA FLEX 1: Live Ledger Search
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const search = searchTerm.toLowerCase();
            return (
                String(p.id).includes(search) ||
                String(p.bookingId).includes(search) ||
                (p.customerName || p.username || '').toLowerCase().includes(search) ||
                p.paymentMethod.toLowerCase().includes(search)
            );
        });
    }, [payments, searchTerm]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setFieldErrors({});
        
        if (!bookingId) {
            setFieldErrors({ bookingId: 'Please select an approved booking to pay for.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await makePayment(bookingId, paymentMethod);
            setBookingId('');
            setSuccess('Payment submitted for finance review.');
            await loadData();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data || "Failed to process payment gateway.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setError('');
        setSuccess('');
        setProcessingId(id);
        try {
            await updatePaymentStatus(id, status);
            await loadData();
            setSuccess(`Transaction #${id} successfully marked as ${status}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to update ledger status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to completely void this transaction record?')) return;
        setError('');
        try {
            await deletePayment(id);
            setPayments((current) => current.filter((p) => p.id !== id));
            setSuccess('Transaction voided and removed from the ledger.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || 'Failed to void payment.');
        }
    };

    // Metrics Calculation
    const pendingTransactions = filteredPayments.filter(p => p.status === 'PENDING').length;
    const totalRevenue = filteredPayments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Helper for beautiful status pills
    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER & METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {isFinance ? 'Financial Ledger' : 'Billing & Checkout'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {isFinance ? 'Verify incoming payments and manage the company ledger.' : 'Securely pay for your approved rental bookings.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                    {/* Live Search */}
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Search ledger..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-jcb-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 w-full sm:w-56 transition-shadow"
                        />
                    </div>
                    {isFinance && (
                        <>
                            <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                                <span className="text-xs font-bold text-jcb-textMuted uppercase">Pending Verifications</span>
                                <span className="text-lg font-black text-yellow-600">{pendingTransactions}</span>
                            </div>
                            <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                                <span className="text-xs font-bold text-jcb-textMuted uppercase">Total Revenue</span>
                                <span className="text-lg font-black text-green-600">Rs. {totalRevenue.toLocaleString()}</span>
                            </div>
                        </>
                    )}
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

            {/* CUSTOMER CHECKOUT FORM */}
            {user?.role === 'CUSTOMER' && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-jcb-brand/20 text-yellow-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">Secure Checkout</h3>
                    </div>
                    
                    <form onSubmit={handlePayment} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Select Unpaid Invoice</label>
                                <select 
                                    value={bookingId} 
                                    onChange={(e) => {
                                        setBookingId(e.target.value);
                                        if (fieldErrors.bookingId) setFieldErrors({ ...fieldErrors, bookingId: null });
                                    }} 
                                    className={`w-full px-4 py-2.5 bg-white border ${fieldErrors.bookingId ? 'border-red-500 focus:ring-red-500' : 'border-jcb-border focus:ring-jcb-brand/50'} rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="">-- Choose Invoice --</option>
                                    {payableInvoices.map((invoice) => (
                                        <option key={invoice.id} value={invoice.bookingId}>
                                            {invoice.invoiceNumber} - Booking #{invoice.bookingId} (Rs. {invoice.amount?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.bookingId && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.bookingId}</p>}
                                {payableInvoices.length === 0 && !loading && (
                                    <p className="mt-1.5 text-xs font-medium text-green-600">You have no unpaid invoices ready for payment.</p>
                                )}
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Payment Method</label>
                                <select 
                                    value={paymentMethod} 
                                    onChange={(e) => setPaymentMethod(e.target.value)} 
                                    className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="CARD">Credit/Debit Card</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CASH">Cash on Site</option>
                                </select>
                            </div>

                            <div className="md:col-span-1 pt-6">
                                <button type="submit" disabled={isSubmitting || payableInvoices.length === 0} className="w-full bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</>
                                    ) : 'Submit Payment'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {user?.role === 'CUSTOMER' && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10">
                    <div className="px-6 py-4 border-b border-jcb-border">
                        <h3 className="text-base font-bold text-jcb-textMain">My Invoices</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-jcb-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase">Invoice</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase">Booking</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase">Issued</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customerInvoices.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-jcb-textMuted">No invoices have been issued yet.</td></tr>
                                ) : customerInvoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="px-6 py-4 font-bold text-jcb-textMain">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-jcb-textMuted">#{invoice.bookingId}</td>
                                        <td className="px-6 py-4 text-jcb-textMuted">{invoice.issueDate}</td>
                                        <td className="px-6 py-4 font-bold text-jcb-textMain">Rs. {invoice.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${invoice.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : invoice.status === 'VOID' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FINANCIAL LEDGER TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Receipt ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Booking ID</th>
                                {isFinance && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Customer Name</th>}
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                {isFinance && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={isFinance ? 7 : 6} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Syncing financial ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={isFinance ? 7 : 6} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <span className="font-medium">{searchTerm ? 'No transactions match your search.' : 'No payment records found.'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayments.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono font-medium">TXN-{p.id}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted font-mono">#{p.bookingId}</td>
                                    {isFinance && <td className="px-6 py-4 font-bold text-jcb-textMain">{p.customerName || p.username}</td>}
                                    <td className="px-6 py-4 font-black text-jcb-textMain">Rs. {p.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{p.paymentMethod.replace('_', ' ')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    
                                    {isFinance && (
                                        <td className="px-6 py-4 text-right">
                                            {processingId === p.id ? (
                                                <span className="text-xs text-gray-400 font-medium animate-pulse">Processing...</span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {p.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate(p.id, 'COMPLETED')} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-bold transition">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Verify
                                                            </button>
                                                            <button onClick={() => handleStatusUpdate(p.id, 'FAILED')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-bold transition">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Void Transaction">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentManager;