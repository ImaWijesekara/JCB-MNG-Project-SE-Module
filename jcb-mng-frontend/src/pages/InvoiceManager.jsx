import { useState, useEffect, useCallback, useMemo } from 'react';
import { createInvoice, getAllInvoices, getEligibleInvoiceBookings, voidInvoice } from '../services/invoiceService';

const fetchInvoiceData = () => Promise.all([getAllInvoices(), getEligibleInvoiceBookings()]);

const InvoiceManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [eligibleBookings, setEligibleBookings] = useState([]);
    const [bookingId, setBookingId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [invoiceData, bookingData] = await fetchInvoiceData();
            setInvoices(invoiceData);
            setEligibleBookings(bookingData);
        } catch (err) {
            setError(err.response?.data || 'Failed to load invoice ledger.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isCurrent = true;
        const loadInitialData = async () => {
            try {
                const [invoiceData, bookingData] = await fetchInvoiceData();
                if (isCurrent) {
                    setInvoices(invoiceData);
                    setEligibleBookings(bookingData);
                }
            } catch (err) {
                if (isCurrent) setError(err.response?.data || 'Failed to load invoice ledger.');
            } finally {
                if (isCurrent) setIsLoading(false);
            }
        };
        loadInitialData();
        return () => { isCurrent = false; };
    }, []);

    const filteredInvoices = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return invoices.filter((invoice) =>
            !search
            || (invoice.invoiceNumber || '').toLowerCase().includes(search)
            || (invoice.customerName || '').toLowerCase().includes(search)
            || String(invoice.bookingId).includes(search));
    }, [invoices, searchTerm]);

    const handleGenerate = async (event) => {
        event.preventDefault();
        if (!bookingId) {
            setError('Select an approved booking before issuing an invoice.');
            return;
        }
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            await createInvoice(bookingId);
            setBookingId('');
            setSuccess('Invoice issued and added to the customer billing portal.');
            await loadData();
        } catch (err) {
            setError(err.response?.data || 'Failed to issue invoice.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVoid = async (invoiceId) => {
        if (!window.confirm('Void this unpaid invoice? The record will remain in the ledger.')) return;
        setError('');
        setSuccess('');
        setProcessingId(invoiceId);
        try {
            await voidInvoice(invoiceId);
            setSuccess('Invoice voided. Its audit record has been retained.');
            await loadData();
        } catch (err) {
            setError(err.response?.data || 'Failed to void invoice.');
        } finally {
            setProcessingId(null);
        }
    };

    const totalBilled = invoices.filter((invoice) => invoice.status !== 'VOID')
        .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
    const outstanding = invoices.filter((invoice) => invoice.status === 'UNPAID')
        .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
    const paidCount = invoices.filter((invoice) => invoice.status === 'PAID').length;

    const statusStyle = (status) => {
        if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-200';
        if (status === 'VOID') return 'bg-gray-100 text-gray-600 border-gray-200';
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">Invoice Ledger</h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">Issue invoices for approved bookings and follow payment settlement.</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Outstanding</span>
                        <span className="text-lg font-black text-red-600">Rs. {outstanding.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Total Billed</span>
                        <span className="text-lg font-black text-jcb-textMain">Rs. {totalBilled.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Paid</span>
                        <span className="text-lg font-black text-green-600">{paidCount}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-md mb-8 shadow-sm">
                    <span className="text-sm font-semibold">{success}</span>
                </div>
            )}

            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-8">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border">
                    <h3 className="text-base font-bold text-jcb-textMain">Issue Invoice</h3>
                </div>
                <form onSubmit={handleGenerate} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5" htmlFor="invoice-booking">Approved booking</label>
                            <select id="invoice-booking" value={bookingId} onChange={(event) => setBookingId(event.target.value)} className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm">
                                <option value="">-- Choose booking --</option>
                                {eligibleBookings.map((booking) => (
                                    <option key={booking.id} value={booking.id}>
                                        Booking #{booking.id} | {booking.customerName} | {booking.machineDetails} | Rs. {booking.totalCost?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            {eligibleBookings.length === 0 && !isLoading && <p className="mt-1.5 text-xs text-jcb-textMuted">No approved bookings are waiting for invoices.</p>}
                        </div>
                        <button type="submit" disabled={isSubmitting || !bookingId} className="bg-jcb-brand text-black font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition disabled:opacity-60">
                            {isSubmitting ? 'Issuing...' : 'Issue Invoice'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-base font-bold text-jcb-textMain">Master Ledger</h3>
                    <input type="search" placeholder="Search invoice, customer, booking..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="px-3 py-2 bg-white border border-jcb-border rounded-lg text-sm w-full sm:w-72" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Booking</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Issue Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">Loading invoices...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-jcb-textMuted">{searchTerm ? 'No invoices match your search.' : 'No invoices have been issued.'}</td></tr>
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMain font-bold">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">#{inv.bookingId}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.customerName}</td>
                                    <td className="px-6 py-4 font-bold text-jcb-textMain">Rs. {inv.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.issueDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(inv.status)}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            {processingId === inv.id ? <span className="text-xs text-gray-400">Voiding...</span> : inv.status === 'UNPAID' && (
                                                <button onClick={() => handleVoid(inv.id)} className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition">Void invoice</button>
                                            )}
                                        </div>
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

export default InvoiceManager;