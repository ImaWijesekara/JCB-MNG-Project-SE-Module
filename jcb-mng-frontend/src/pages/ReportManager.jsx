import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMonthlyReports } from '../services/reportService';

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;

const ReportManager = () => {
    const [monthlyData, setMonthlyData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReports = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            setMonthlyData(await getMonthlyReports());
        } catch (err) {
            setError(err.response?.data || 'Failed to load financial reports.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadReports();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadReports]);

    const summary = useMemo(() => monthlyData.reduce((totals, row) => ({
        revenue: totals.revenue + (Number(row.revenue) || 0),
        rentals: totals.rentals + (Number(row.rentals) || 0),
        maintenanceCosts: totals.maintenanceCosts + (Number(row.maintenanceCosts) || 0),
    }), { revenue: 0, rentals: 0, maintenanceCosts: 0 }), [monthlyData]);

    const exportCsv = () => {
        if (monthlyData.length === 0) return;

        const rows = [
            ['Period', 'Completed rentals', 'Maintenance cost (Rs.)', 'Collected revenue (Rs.)'],
            ...monthlyData.map((row) => [
                row.month,
                row.rentals,
                row.maintenanceCosts,
                row.revenue,
            ]),
        ];
        const csv = rows
            .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
            .join('\r\n');
        const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'financial-report.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">Financial Reports</h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        Monthly collected revenue, completed rentals, and recorded maintenance spend for the last 12 months.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button
                        type="button"
                        onClick={loadReports}
                        disabled={isLoading}
                        className="text-sm font-bold text-jcb-textMuted hover:text-jcb-textMain bg-white border border-jcb-border px-4 py-2 rounded-md shadow-sm transition disabled:opacity-60"
                    >
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={isLoading || monthlyData.length === 0}
                        className="text-sm font-bold text-jcb-textMuted hover:text-jcb-textMain bg-white border border-jcb-border px-4 py-2 rounded-md shadow-sm transition flex items-center gap-2 disabled:opacity-60"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8 shadow-sm text-sm font-semibold">
                    {error}
                    <button type="button" onClick={loadReports} className="ml-3 underline">Retry</button>
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-3 mb-10">
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">12-Month Collected Revenue</p>
                    <p className="text-3xl font-extrabold text-green-600">{isLoading ? '—' : formatCurrency(summary.revenue)}</p>
                </div>
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">Completed Rentals</p>
                    <p className="text-3xl font-extrabold text-jcb-textMain">{isLoading ? '—' : summary.rentals.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">Recorded Maintenance Spend</p>
                    <p className="text-3xl font-extrabold text-red-500">{isLoading ? '—' : formatCurrency(summary.maintenanceCosts)}</p>
                </div>
            </div>

            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border">
                    <h3 className="text-base font-bold text-jcb-textMain">Monthly Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Completed Rentals</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Maintenance Cost</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Collected Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-jcb-textMuted">Loading financial reports...</td></tr>
                            ) : monthlyData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-jcb-textMuted">No report data is available.</td></tr>
                            ) : monthlyData.map((row) => (
                                <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-jcb-textMain font-bold">{row.month}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{Number(row.rentals || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-500 font-medium">- {formatCurrency(row.maintenanceCosts)}</td>
                                    <td className="px-6 py-4 text-right font-black text-green-600">{formatCurrency(row.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportManager;
