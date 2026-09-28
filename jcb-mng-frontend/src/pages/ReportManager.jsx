import { useState, useEffect } from 'react';

const ReportManager = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Mock reporting data
    const monthlyData = [
        { month: 'September 2026', revenue: 450000, rentals: 12, maintenanceCosts: 25000 },
        { month: 'August 2026', revenue: 380000, rentals: 9, maintenanceCosts: 15000 },
        { month: 'July 2026', revenue: 510000, rentals: 15, maintenanceCosts: 40000 },
    ];

    useEffect(() => {
        // Simulate API load time
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">Financial Reports</h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">Monthly revenue analysis and operational costs.</p>
                </div>
                <button className="mt-4 md:mt-0 text-sm font-bold text-jcb-textMuted hover:text-jcb-textMain bg-white border border-jcb-border px-4 py-2 rounded-md shadow-sm transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export CSV
                </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 mb-10">
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">Q3 Total Revenue</p>
                    <p className="text-4xl font-extrabold text-green-600">Rs. 1.34M</p>
                </div>
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">Total Rentals</p>
                    <p className="text-4xl font-extrabold text-jcb-textMain">36</p>
                </div>
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl p-6">
                    <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-2">Maintenance Spend</p>
                    <p className="text-4xl font-extrabold text-red-500">Rs. 80K</p>
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
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Gross Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-jcb-textMuted">Compiling reports...</td></tr>
                            ) : monthlyData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-jcb-textMain font-bold">{row.month}</td>
                                    <td className="px-6 py-4 text-jcb-textMuted">{row.rentals} machines dispatched</td>
                                    <td className="px-6 py-4 text-red-500 font-medium">- Rs. {row.maintenanceCosts.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-black text-green-600">Rs. {row.revenue.toLocaleString()}</td>
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