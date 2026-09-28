import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Services
import { getAllUsers } from '../services/userService';
import { getAllMachines } from '../services/machineService';
import { getAllBookings, getMyBookings } from '../services/bookingService';
import { getAllFeedback, getMyFeedback } from '../services/feedbackService';
import { getAllMaintenance, getMyTasks } from '../services/maintenanceService';
import { getAllPayments } from '../services/paymentService';
// Assuming you have a jobService, if not, it will gracefully fallback
import { getMyJobs, getAllJobs } from '../services/jobService'; 

// 1. DYNAMIC QUICK LINKS BY EXACT ROLE
const overviewLinks = {
    ADMIN: [
        ['Manage Users', '/dashboard/users'],
        ['Fleet Inventory', '/dashboard/machines'],
        ['Dispatch Jobs', '/dashboard/jobs'],
        ['Moderate Feedback', '/dashboard/feedback'],
    ],
    OPERATION_MANAGER: [
        ['Fleet Inventory', '/dashboard/machines'],
        ['Maintenance Logs', '/dashboard/maintenance'],
    ],
    DISPATCH_MANAGER: [
        ['Manage Bookings', '/dashboard/bookings'],
        ['Dispatch Operators', '/dashboard/jobs'],
    ],
    FINANCE_OFFICER: [
        ['Verify Payments', '/dashboard/payments'],
        ['Issue Invoices', '/dashboard/invoices'],
        ['View Reports', '/dashboard/reports'],
    ],
    OPERATOR: [
        ['View My Jobs', '/dashboard/jobs'],
        ['Log Maintenance', '/dashboard/maintenance'],
    ],
    CUSTOMER: [
        ['Browse Machines', '/dashboard/machines'],
        ['My Bookings', '/dashboard/bookings'],
        ['Pay Bills', '/dashboard/payments'],
        ['Submit Review', '/dashboard/feedback'],
    ],
};

// 2. DYNAMIC KPI CARDS BY EXACT ROLE
const getOverviewStats = (role, data) => {
    switch (role) {
        case 'ADMIN':
            return [
                ['Total Users', data.users?.length || 0, '/dashboard/users'],
                ['Available JCBs', data.machines?.filter(m => m.status === 'AVAILABLE').length || 0, '/dashboard/machines'],
                ['Pending Bookings', data.bookings?.filter(b => b.status === 'PENDING').length || 0, '/dashboard/bookings'],
                ['Active Maintenance', data.maintenance?.filter(t => t.status === 'SCHEDULED').length || 0, '/dashboard/maintenance'],
            ];
        case 'OPERATION_MANAGER':
            return [
                ['Total Fleet', data.machines?.length || 0, '/dashboard/machines'],
                ['Currently Rented', data.machines?.filter(m => m.status === 'RENTED').length || 0, '/dashboard/machines'],
                ['Non-Operational', data.machines?.filter(m => m.operationalStatus === 'NON_OPERATIONAL').length || 0, '/dashboard/machines'],
                ['Pending Repairs', data.maintenance?.filter(t => t.status === 'SCHEDULED').length || 0, '/dashboard/maintenance'],
            ];
        case 'DISPATCH_MANAGER':
            return [
                ['Pending Requests', data.bookings?.filter(b => b.status === 'PENDING').length || 0, '/dashboard/bookings'],
                ['Approved Rentals', data.bookings?.filter(b => b.status === 'APPROVED').length || 0, '/dashboard/bookings'],
                ['Active Jobs', data.jobs?.filter(j => j.status === 'IN_PROGRESS').length || 0, '/dashboard/jobs'],
            ];
        case 'FINANCE_OFFICER':
            return [
                ['Pending Payments', data.payments?.filter(p => p.status === 'PENDING').length || 0, '/dashboard/payments'],
                ['Completed Payments', data.payments?.filter(p => p.status === 'COMPLETED').length || 0, '/dashboard/payments'],
                ['Failed Transactions', data.payments?.filter(p => p.status === 'FAILED').length || 0, '/dashboard/payments'],
            ];
        case 'OPERATOR':
            return [
                ['Assigned Jobs', data.jobs?.filter(j => j.status === 'ASSIGNED').length || 0, '/dashboard/jobs'],
                ['In Progress', data.jobs?.filter(j => j.status === 'IN_PROGRESS').length || 0, '/dashboard/jobs'],
                ['Completed', data.jobs?.filter(j => j.status === 'COMPLETED').length || 0, '/dashboard/jobs'],
                ['Broken Machines', data.maintenance?.filter(t => t.status === 'SCHEDULED').length || 0, '/dashboard/maintenance'],
            ];
        case 'CUSTOMER':
        default:
            return [
                ['Available JCBs', data.machines?.filter(m => m.status === 'AVAILABLE' && m.operationalStatus !== 'NON_OPERATIONAL').length || 0, '/dashboard/machines'],
                ['Pending Requests', data.bookings?.filter(b => b.status === 'PENDING').length || 0, '/dashboard/bookings'],
                ['Approved Rentals', data.bookings?.filter(b => b.status === 'APPROVED').length || 0, '/dashboard/bookings'],
                ['My Reviews', data.feedback?.length || 0, '/dashboard/feedback'],
            ];
    }
};

const DashboardSection = () => {
    const { user } = useContext(AuthContext);
    const [overviewData, setOverviewData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.role) return;

        const loadOverview = async () => {
            try {
                const role = user.role.replace('ROLE_', '');
                let data = { users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments: [] };
                
                // 3. SECURE DATA FETCHING (Only call APIs allowed by Spring Boot @PreAuthorize)
                if (role === 'ADMIN') {
                    const [users, machines, bookings, maintenance, jobs] = await Promise.all([
                        getAllUsers().catch(() => []), 
                        getAllMachines().catch(() => []), 
                        getAllBookings().catch(() => []), 
                        getAllMaintenance().catch(() => []),
                        getAllJobs ? getAllJobs().catch(() => []) : Promise.resolve([])
                    ]);
                    data = { ...data, users, machines, bookings, maintenance, jobs };
                
                } else if (role === 'OPERATION_MANAGER') {
                    const [machines, maintenance] = await Promise.all([
                        getAllMachines().catch(() => []), 
                        getAllMaintenance().catch(() => [])
                    ]);
                    data = { ...data, machines, maintenance };
                
                } else if (role === 'DISPATCH_MANAGER') {
                    const [bookings, jobs] = await Promise.all([
                        getAllBookings().catch(() => []), 
                        getAllJobs ? getAllJobs().catch(() => []) : Promise.resolve([])
                    ]);
                    data = { ...data, bookings, jobs };

                } else if (role === 'FINANCE_OFFICER') {
                    const payments = await getAllPayments().catch(() => []);
                    data = { ...data, payments };

                } else if (role === 'OPERATOR') {
                    const [jobs, maintenance] = await Promise.all([
                        getMyJobs().catch(() => []), 
                        getMyTasks().catch(() => [])
                    ]);
                    data = { ...data, jobs, maintenance };

                } else if (role === 'CUSTOMER') {
                    const [machines, bookings, feedback] = await Promise.all([
                        getAllMachines().catch(() => []), 
                        getMyBookings().catch(() => []), 
                        getMyFeedback().catch(() => [])
                    ]);
                    data = { ...data, machines, bookings, feedback };
                }
                
                setOverviewData(data);
            } catch (err) {
                setError('Unable to sync live dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, [user]);

    const roleString = user?.role?.replace('ROLE_', '') || 'CUSTOMER';
    const stats = getOverviewStats(roleString, overviewData);
    const links = overviewLinks[roleString] || overviewLinks.CUSTOMER;

    // Dynamic Title Logic
    const getDashboardTitle = (role) => {
        switch (role) {
            case 'ADMIN': return 'Executive Command Center';
            case 'OPERATION_MANAGER': return 'Fleet Operations Overview';
            case 'DISPATCH_MANAGER': return 'Logistics & Dispatch Board';
            case 'FINANCE_OFFICER': return 'Financial Control Panel';
            case 'OPERATOR': return 'Operator Workspace';
            default: return 'Customer Portal';
        }
    };

    const getDashboardDescription = (role) => {
        switch (role) {
            case 'ADMIN': return 'Supervisory overview of system health, users, and core operations.';
            case 'OPERATION_MANAGER': return 'Monitor machine inventory, health, and scheduled maintenance tasks.';
            case 'DISPATCH_MANAGER': return 'Review incoming booking requests and allocate operators to machines.';
            case 'FINANCE_OFFICER': return 'Track pending payments, generate invoices, and analyze revenue.';
            case 'OPERATOR': return 'Track your active job assignments and log maintenance requests.';
            default: return 'Browse available equipment, track rentals, and manage billing.';
        }
    };

    return (
        <section className="max-w-6xl mx-auto pb-12">
            {/* Header Area */}
            <div className="mb-10">
                <span className="inline-block px-3 py-1 bg-jcb-brand/10 text-jcb-action font-bold text-xs rounded-full uppercase tracking-wider mb-3">
                    {roleString.replace('_', ' ')} PROFILE
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                    {getDashboardTitle(roleString)}
                </h2>
                <p className="mt-2 text-sm font-medium text-jcb-textMuted">
                    {getDashboardDescription(roleString)}
                </p>
            </div>

            {/* Error / Loading States */}
            {loading && <p className="mb-6 text-sm font-bold text-jcb-textMuted animate-pulse flex items-center gap-2"><svg className="animate-spin h-4 w-4 text-jcb-textMuted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Synchronizing live data...</p>}
            {error && <p className="mb-6 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

            {/* Dynamic KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 lg:grid-cols-3">
                {stats.map(([label, value, path]) => (
                    <Link key={label} to={path} className="group bg-white border border-jcb-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-jcb-brand">
                        <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider">{label}</p>
                        <p className="mt-4 text-4xl font-extrabold text-jcb-textMain">
                            {loading ? '--' : value}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                                View details
                            </span>
                            <svg className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Dynamic Quick Actions */}
            <div className="mt-12 pt-8 border-t border-jcb-border">
                <h3 className="mb-4 text-sm font-bold text-jcb-textMain uppercase tracking-wider">Workspace Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {links.map(([label, path]) => (
                        <Link key={path} to={path} className="rounded-lg border border-jcb-border bg-white px-5 py-2.5 text-sm font-semibold text-jcb-textMuted transition-all shadow-sm hover:border-jcb-brand hover:text-jcb-action hover:shadow">
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DashboardSection;