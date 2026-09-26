import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers } from '../services/userService';
import { getAllMachines } from '../services/machineService';
import { getAllBookings, getMyBookings } from '../services/bookingService';
import { getAllFeedback, getMyFeedback } from '../services/feedbackService';
import { getAllMaintenance, getMyTasks } from '../services/maintenanceService';
import { getAllPayments } from '../services/paymentService';
import { getMyJobs } from '../services/jobService';

// 1. Dynamic Quick Links by Role
const overviewLinks = {
    ADMIN: [
        ['Manage Users', '/admin/users'],
        ['Fleet Inventory', '/operations/fleet'],
        ['Dispatch Jobs', '/dispatch/assignments'],
        ['Moderate Feedback', '/admin/feedback'],
    ],
    CUSTOMER: [
        ['Browse Machines', '/customer/catalog'],
        ['My Bookings', '/customer/bookings'],
        ['Pay Bills', '/customer/payments'],
    ],
    OPERATOR: [
        ['View My Jobs', '/operator/jobs'],
        ['Log Maintenance', '/operator/maintenance'],
    ],
    FINANCE_OFFICER: [
        ['Verify Payments', '/finance/payments'],
        ['View Reports', '/dashboard/reports'],
    ],
};

// 2. Dynamic KPI Cards by Role
const getOverviewStats = (role, data) => {
    if (role === 'ADMIN') {
        return [
            ['Total Users', data.users.length, '/admin/users'],
            ['Available JCBs', data.machines.filter((m) => m.status === 'AVAILABLE').length, '/operations/fleet'],
            ['Pending Bookings', data.bookings.filter((b) => b.status === 'PENDING').length, '/dispatch/assignments'],
            ['Active Maintenance', data.maintenance.filter((t) => t.status === 'SCHEDULED').length, '/operator/maintenance'],
        ];
    }
    if (role === 'OPERATOR') {
        return [
            ['Assigned Jobs', data.jobs.filter((j) => j.status === 'ASSIGNED').length, '/operator/jobs'],
            ['In Progress', data.jobs.filter((j) => j.status === 'IN_PROGRESS').length, '/operator/jobs'],
            ['Completed', data.jobs.filter((j) => j.status === 'COMPLETED').length, '/operator/jobs'],
            ['Broken Machines', data.maintenance.filter((t) => t.status === 'SCHEDULED').length, '/operator/maintenance'],
        ];
    }
    if (role === 'FINANCE_OFFICER') {
        return [
            ['Pending Verification', data.payments.filter((p) => p.status === 'PENDING').length, '/finance/payments'],
            ['Completed Payments', data.payments.filter((p) => p.status === 'COMPLETED').length, '/finance/payments'],
            ['Failed Transactions', data.payments.filter((p) => p.status === 'FAILED').length, '/finance/payments'],
        ];
    }
    // CUSTOMER
    return [
        ['Available JCBs', data.machines.filter((m) => m.status === 'AVAILABLE').length, '/customer/catalog'],
        ['Pending Requests', data.bookings.filter((b) => b.status === 'PENDING').length, '/customer/bookings'],
        ['Approved Rentals', data.bookings.filter((b) => b.status === 'APPROVED').length, '/customer/bookings'],
        ['My Reviews', data.feedback.length, '/admin/feedback'],
    ];
};

const DashboardSection = () => {
    const { user } = useContext(AuthContext);
    const [overviewData, setOverviewData] = useState({ users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.role) return;

        const loadOverview = async () => {
            try {
                const role = user.role.replace('ROLE_', '');
                let data = { users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments: [] };
                
                if (role === 'ADMIN') {
                    const [users, machines, bookings, maintenance] = await Promise.all([
                        getAllUsers(), getAllMachines(), getAllBookings(), getAllMaintenance(),
                    ]);
                    data = { ...data, users, machines, bookings, maintenance };
                } else if (role === 'CUSTOMER') {
                    const [machines, bookings, feedback] = await Promise.all([
                        getAllMachines(), getMyBookings(), getMyFeedback(),
                    ]);
                    data = { ...data, machines, bookings, feedback };
                } else if (role === 'OPERATOR') {
                    const [jobs, maintenance] = await Promise.all([
                        getMyJobs(), getMyTasks(),
                    ]);
                    data = { ...data, jobs, maintenance };
                } else if (role === 'FINANCE_OFFICER') {
                    const payments = await getAllPayments();
                    data = { ...data, payments };
                }
                
                setOverviewData(data);
            } catch (err) {
                setError('Unable to load dashboard data. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, [user]);

    const roleString = user?.role?.replace('ROLE_', '') || 'CUSTOMER';
    const stats = getOverviewStats(roleString, overviewData);
    const links = overviewLinks[roleString] || overviewLinks.CUSTOMER;

    return (
        <section className="max-w-6xl mx-auto">
            {/* Header Area */}
            <div className="mb-10">
                <span className="inline-block px-3 py-1 bg-jcb-brand/10 text-jcb-action font-bold text-xs rounded-full uppercase tracking-wider mb-3">
                    {roleString} PROFILE
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                    {roleString === 'ADMIN' ? 'Executive Overview' 
                    : roleString === 'OPERATOR' ? 'Operator Dashboard' 
                    : roleString === 'FINANCE_OFFICER' ? 'Financial Dashboard' 
                    : 'Your JCB Workspace'}
                </h2>
                <p className="mt-2 text-sm font-medium text-jcb-textMuted">
                    {roleString === 'ADMIN' ? 'Monitor system health, fleet activity, and user accounts.'
                    : roleString === 'OPERATOR' ? 'Track your assigned jobs and maintenance queue.'
                    : roleString === 'FINANCE_OFFICER' ? 'Review payment activity and financial records.'
                    : 'Browse available equipment and track your rental requests.'}
                </p>
            </div>

            {loading && <p className="mb-6 text-sm font-medium text-jcb-textMuted animate-pulse">Fetching real-time data...</p>}
            {error && <p className="mb-6 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

            {/* Dynamic KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 lg:grid-cols-3">
                {stats.map(([label, value, path]) => (
                    <Link key={label} to={path} className="group bg-jcb-surface border border-jcb-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-jcb-brand">
                        <p className="text-xs font-bold text-jcb-textMuted uppercase tracking-wider">{label}</p>
                        <p className="mt-4 text-4xl font-extrabold text-jcb-textMain">
                            {loading ? '--' : value}
                        </p>
                        <p className="mt-4 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                            View details &rarr;
                        </p>
                    </Link>
                ))}
            </div>

            {/* Dynamic Quick Actions */}
            <div className="mt-12 pt-8 border-t border-jcb-border">
                <h3 className="mb-4 text-sm font-bold text-jcb-textMain uppercase tracking-wider">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {links.map(([label, path]) => (
                        <Link key={path} to={path} className="rounded-md border border-jcb-border bg-white px-5 py-2.5 text-sm font-semibold text-jcb-textMuted transition-all shadow-sm hover:border-jcb-brand hover:text-jcb-action hover:shadow">
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DashboardSection;