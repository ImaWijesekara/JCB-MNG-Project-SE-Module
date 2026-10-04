import { useState, useEffect, useCallback, useMemo } from 'react';
import { createInvoice, getAllInvoices, getEligibleInvoiceBookings, updateInvoice, voidInvoice } from '../services/invoiceService';

const fetchInvoiceData = () => Promise.all([getAllInvoices(), getEligibleInvoiceBookings()]);

const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDefaultDueDate = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return formatDateInput(dueDate);
};

const InvoiceManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [eligibleBookings, setEligibleBookings] = useState([]);
    const [bookingId, setBookingId] = useState('');
    const [dueDate, setDueDate] = useState(getDefaultDueDate());
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
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
            || (invoice.description || '').toLowerCase().includes(search)
            || String(invoice.bookingId).includes(search));
    }, [invoices, searchTerm]);
    const editingInvoice = invoices.find((invoice) => invoice.id === editingInvoiceId);

    const resetForm = () => {
        setBookingId('');
        setDueDate(getDefaultDueDate());
        setDescription('');
        setNotes('');
        setEditingInvoiceId(null);
    };

    const handleEdit = (invoice) => {
        setEditingInvoiceId(invoice.id);
        setBookingId(String(invoice.bookingId));
        setDueDate(invoice.dueDate || getDefaultDueDate());
        setDescription(invoice.description || '');
        setNotes(invoice.notes || '');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!editingInvoiceId && !bookingId) {
            setError('Select an approved booking before issuing an invoice.');
            return;
        }
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            const invoiceDetails = { dueDate, description, notes };
            if (editingInvoiceId) {
                await updateInvoice(editingInvoiceId, invoiceDetails);
                setSuccess('Invoice details updated.');
            } else {
                await createInvoice(bookingId, invoiceDetails);
                setSuccess('Invoice issued and added to the customer billing portal.');
            }
            resetForm();
            await loadData();
        } catch (err) {
            setError(err.response?.data || (editingInvoiceId ? 'Failed to update invoice.' : 'Failed to issue invoice.'));
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
            if (editingInvoiceId === invoiceId) resetForm();
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
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">Issue and maintain invoices for approved bookings, then follow their payment settlement.</p>
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
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-jcb-textMain">
                            {editingInvoiceId ? `Edit Invoice ${editingInvoice?.invoiceNumber || `#${editingInvoiceId}`}` : 'Issue Invoice'}
                        </h3>
                        {editingInvoiceId && (
                            <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                        {!editingInvoiceId && (
                            <div className="md:col-span-2 xl:col-span-4">
                                <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5" htmlFor="invoice-booking">Approved booking</label>
                                <select id="invoice-booking" value={bookingId} onChange={(event) => setBookingId(event.target.value)} required className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm">
                                    <option value="">-- Choose booking --</option>
                                    {eligibleBookings.map((booking) => (
                                        <option key={booking.id} value={booking.id}>
                                            Booking #{booking.id} | {booking.customerName} | {booking.machineDetails} | Rs. {booking.totalCost?.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                {eligibleBookings.length === 0 && !isLoading && <p className="mt-1.5 text-xs text-jcb-textMuted">No approved bookings are waiting for invoices.</p>}
                            </div>
                        )}
                        {editingInvoice && (
                            <div className="md:col-span-2 xl:col-span-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                                Booking #{editingInvoice.bookingId} · {editingInvoice.customerName} · Amount is fixed from the approved booking at Rs. {Number(editingInvoice.amount).toLocaleString()}.
                            </div>
                        )}
                        <div className="md:col-span-2 xl:col-span-3">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5" htmlFor="invoice-description">Invoice description</label>
                            <input
                                id="invoice-description"
                                type="text"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                required
                                maxLength={500}
                                placeholder="e.g. JCB rental charges"
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5" htmlFor="invoice-due-date">Due date</label>
                            <input
                                id="invoice-due-date"
                                type="date"
                                value={dueDate}
                                min={editingInvoice?.issueDate || formatDateInput(new Date())}
                                onChange={(event) => setDueDate(event.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm"
                            />
                        </div>
                        <div className="md:col-span-2 xl:col-span-4">
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5" htmlFor="invoice-notes">Notes</label>
                            <textarea
                                id="invoice-notes"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                maxLength={2000}
                                rows={3}
                                placeholder="Optional billing instructions or additional information"
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm resize-y"
                            />
                            <p className="mt-1 text-right text-xs text-jcb-textMuted">{notes.length}/2000</p>
                        </div>
                        {!editingInvoiceId && <p className="md:col-span-2 xl:col-span-3 text-xs text-jcb-textMuted">The issue date is set automatically. Invoice amount is copied from the approved booking and cannot be edited.</p>}
                        <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                            <button type="submit" disabled={isSubmitting || (!editingInvoiceId && !bookingId)} className="bg-jcb-brand text-black font-bold py-2.5 px-5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-60">
                                {isSubmitting ? 'Saving...' : editingInvoiceId ? 'Save Invoice Changes' : 'Issue Invoice'}
                            </button>
                        </div>
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
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Invoice Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Issue Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="9" className="px-6 py-12 text-center text-jcb-textMuted">Loading invoices...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan="9" className="px-6 py-12 text-center text-jcb-textMuted">{searchTerm ? 'No invoices match your search.' : 'No invoices have been issued.'}</td></tr>
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMain font-bold">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">#{inv.bookingId}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.customerName}</td>
                                    <td className="px-6 py-4 whitespace-normal min-w-56 max-w-sm">
                                        <div className="font-semibold text-jcb-textMain">{inv.description || 'Equipment rental charges'}</div>
                                        <div className="text-xs text-jcb-textMuted mt-1 break-words">{inv.notes || 'No additional notes'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-jcb-textMain">Rs. {inv.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.issueDate}</td>
                                    <td className={`px-6 py-4 ${inv.status === 'UNPAID' && inv.dueDate && inv.dueDate < formatDateInput(new Date()) ? 'font-bold text-red-600' : 'text-jcb-textMuted'}`}>
                                        {inv.dueDate || '—'}
                                        {inv.status === 'UNPAID' && inv.dueDate && inv.dueDate < formatDateInput(new Date()) && <span className="block text-[10px] uppercase">Overdue</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(inv.status)}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {processingId === inv.id ? <span className="text-xs text-gray-400">Processing...</span> : inv.status === 'UNPAID' && (
                                                <>
                                                    <button type="button" onClick={() => handleEdit(inv)} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition">Edit</button>
                                                    <button type="button" onClick={() => handleVoid(inv.id)} className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition">Void</button>
                                                </>
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