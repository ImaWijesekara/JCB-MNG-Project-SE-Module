import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const InvoiceManager = () => {
    const { user } = useContext(AuthContext);
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Simulating an API call to an invoiceService
        const fetchInvoices = async () => {
            setIsLoading(true);
            try {
                // Mock data to demonstrate the UI immediately for the Viva
                const mockInvoices = [
                    { id: 'INV-2026-001', bookingId: 101, customer: 'Acme Corp', amount: 45000, date: '2026-09-20', status: 'PAID' },
                    { id: 'INV-2026-002', bookingId: 104, customer: 'BuildIt Ltd', amount: 15000, date: '2026-09-22', status: 'UNPAID' },
                    { id: 'INV-2026-003', bookingId: 105, customer: 'John Doe', amount: 30000, date: '2026-09-25', status: 'DRAFT' }
                ];
                setInvoices(mockInvoices);
            } catch (err) {
                setError('Failed to load invoices.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleDownload = (id) => {
        alert(`Generating PDF for ${id}... (Connect to PDF generation library here)`);
    };

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices.filter(i => i.status === 'UNPAID').reduce((sum, inv) => sum + inv.amount, 0);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">Invoice Management</h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">Generate, review, and track billing for completed rentals.</p>
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
                </div>
            </div>

            {error && (
                <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}

            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center justify-between">
                    <h3 className="text-base font-bold text-jcb-textMain">Master Ledger</h3>
                    <button className="text-sm font-bold text-black bg-jcb-brand hover:bg-yellow-400 px-4 py-2 rounded-md shadow-sm transition">
                        + Generate Invoice
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Issue Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-jcb-textMuted">Loading invoices...</td></tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMain font-bold">{inv.id}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.customer}</td>
                                    <td className="px-6 py-4 font-bold text-jcb-textMain">Rs. {inv.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{inv.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            inv.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                                            inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDownload(inv.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Download PDF">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            </button>
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