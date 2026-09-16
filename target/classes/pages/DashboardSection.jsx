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

const sectionContent = {
    overview: {
        title: 'Overview',
        description: 'A quick view of the work that matters to your team today.',
        stats: ['Active requests', 'Open bookings', 'Pending actions'],
    },
    users: {
        title: 'User management',
        description: 'Review accounts and manage access for the JCB operation.',
        stats: ['Total users', 'Active accounts', 'New this month'],
    },
    machines: {
        title: 'Machines',
        description: 'Keep machine availability and operational status in one place.',
        stats: ['Available machines', 'Currently hired', 'Needs maintenance'],
    },
    bookings: {
        title: 'Bookings',
        description: 'Track upcoming, active, and completed machine bookings.',
        stats: ['Upcoming bookings', 'Active bookings', 'Completed bookings'],
    },
    feedback: {
        title: 'Feedback',
        description: 'Collect customer feedback and turn it into practical improvements.',
        stats: ['Total submissions', 'Average rating', 'Needs review'],
    },
    jobs: {
        title: 'Assigned jobs',
        description: 'See the jobs assigned to you and keep their progress current.',
        stats: ['Assigned today', 'In progress', 'Completed'],
    },
    maintenance: {
        title: 'Maintenance',
        description: 'Monitor service work and keep the fleet ready for use.',
        stats: ['Scheduled service', 'In service', 'Ready to deploy'],
    },
    payments: {
        title: 'Payments',
        description: 'Monitor incoming payments and outstanding balances.',
        stats: ['Collected this month', 'Pending payments', 'Overdue'],
    },
    invoices: {
        title: 'Invoices',
        description: 'Prepare, review, and track invoices for completed bookings.',
        stats: ['Draft invoices', 'Sent invoices', 'Paid invoices'],
    },
    reports: {
        title: 'Reports',
        description: 'Use operational and financial summaries to guide decisions.',
        stats: ['Revenue this month', 'Booking volume', 'Utilization rate'],
    },
};

const overviewLinks = {
    ADMIN: [
        ['Users', '/dashboard/users'],
        ['Machines', '/dashboard/machines'],
        ['Bookings', '/dashboard/bookings'],
        ['Maintenance', '/dashboard/maintenance'],
        ['Feedback', '/dashboard/feedback'],
    ],
    CUSTOMER: [
        ['Browse machines', '/dashboard/machines'],
        ['My bookings', '/dashboard/bookings'],
        ['My feedback', '/dashboard/feedback'],
    ],
    OPERATOR: [
        ['Assigned jobs', '/dashboard/jobs'],
        ['Maintenance tasks', '/dashboard/maintenance'],
        ['Machines', '/dashboard/machines'],
    ],
    FINANCE_OFFICER: [
        ['Payments', '/dashboard/payments'],
        ['Invoices', '/dashboard/invoices'],
        ['Reports', '/dashboard/reports'],
    ],
};

const getOverviewStats = (role, data) => {
    if (role === 'ADMIN') {
        return [
            ['Total users', data.users.length, '/dashboard/users'],
            ['Available JCBs', data.machines.filter((machine) => machine.status === 'AVAILABLE').length, '/dashboard/machines'],
            ['Pending bookings', data.bookings.filter((booking) => booking.status === 'PENDING').length, '/dashboard/bookings'],
            ['Active maintenance', data.maintenance.filter((task) => task.status === 'SCHEDULED').length, '/dashboard/maintenance'],
            ['Feedback submissions', data.feedback.length, '/dashboard/feedback'],
        ];
    }

    if (role === 'OPERATOR') {
        return [
            ['Assigned jobs', data.jobs.filter((job) => job.status === 'ASSIGNED').length, '/dashboard/jobs'],
            ['Jobs in progress', data.jobs.filter((job) => job.status === 'IN_PROGRESS').length, '/dashboard/jobs'],
            ['Completed jobs', data.jobs.filter((job) => job.status === 'COMPLETED').length, '/dashboard/jobs'],
            ['Scheduled maintenance', data.maintenance.filter((task) => task.status === 'SCHEDULED').length, '/dashboard/maintenance'],
            ['Available JCBs', data.machines.filter((machine) => machine.status === 'AVAILABLE').length, '/dashboard/machines'],
        ];
    }

    if (role === 'FINANCE_OFFICER') {
        return [
            ['Pending payments', data.payments.filter((payment) => payment.status === 'PENDING').length, '/dashboard/payments'],
            ['Completed payments', data.payments.filter((payment) => payment.status === 'COMPLETED').length, '/dashboard/payments'],
            ['Failed payments', data.payments.filter((payment) => payment.status === 'FAILED').length, '/dashboard/payments'],
        ];
    }

    return [
        ['Available JCBs', data.machines.filter((machine) => machine.status === 'AVAILABLE' && machine.operationalStatus !== 'NON_OPERATIONAL').length, '/dashboard/machines'],
        ['Pending bookings', data.bookings.filter((booking) => booking.status === 'PENDING').length, '/dashboard/bookings'],
        ['Approved rentals', data.bookings.filter((booking) => booking.status === 'APPROVED').length, '/dashboard/bookings'],
        ['Completed rentals', data.bookings.filter((booking) => booking.status === 'COMPLETED').length, '/dashboard/bookings'],
        ['My feedback', data.feedback.length, '/dashboard/feedback'],
    ];
};

const DashboardSection = ({ section = 'overview' }) => {
    const { user } = useContext(AuthContext);
    const [overviewData, setOverviewData] = useState({ users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments: [] });
    const [loadingOverview, setLoadingOverview] = useState(section === 'overview');
    const [overviewError, setOverviewError] = useState('');
    const content = sectionContent[section] || sectionContent.overview;

    useEffect(() => {
        if (section !== 'overview' || !user?.role) return;

        const loadOverview = async () => {
            try {
                const isAdmin = user.role === 'ADMIN';
                let data;
                if (isAdmin) {
                    const [users, machines, bookings, feedback, maintenance] = await Promise.all([
                        getAllUsers(), getAllMachines(), getAllBookings(), getAllFeedback(), getAllMaintenance(),
                    ]);
                    data = { users, machines, bookings, feedback, maintenance, jobs: [], payments: [] };
                } else if (user.role === 'CUSTOMER') {
                    const [machines, bookings, feedback] = await Promise.all([
                        getAllMachines(), getMyBookings(), getMyFeedback(),
                    ]);
                    data = { users: [], machines, bookings, feedback, maintenance: [], jobs: [], payments: [] };
                } else if (user.role === 'OPERATOR') {
                    const [machines, jobs, maintenance] = await Promise.all([
                        getAllMachines(), getMyJobs(), getMyTasks(),
                    ]);
                    data = { users: [], machines, bookings: [], feedback: [], maintenance, jobs, payments: [] };
                } else if (user.role === 'FINANCE_OFFICER') {
                    const payments = await getAllPayments();
                    data = { users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments };
                } else {
                    data = { users: [], machines: [], bookings: [], feedback: [], maintenance: [], jobs: [], payments: [] };
                }
                setOverviewData(data);
            } catch (error) {
                setOverviewError(error.response?.data || 'Unable to load dashboard overview.');
            } finally {
                setLoadingOverview(false);
            }
        };

        loadOverview();
    }, [section, user]);

    if (section === 'overview') {
        const stats = getOverviewStats(user?.role, overviewData);
        const links = overviewLinks[user?.role] || [];

        return (
            <section>
                <div className="mb-8 max-w-3xl">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-jcb-yellow">{user?.role}</p>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {user?.role === 'ADMIN' ? 'Operations overview' : user?.role === 'OPERATOR' ? 'Operator overview' : user?.role === 'FINANCE_OFFICER' ? 'Finance overview' : 'Your JCB workspace'}
                    </h2>
                    <p className="mt-3 text-gray-400">
                        {user?.role === 'ADMIN'
                            ? 'Monitor users, fleet activity, bookings, maintenance, and customer feedback.'
                            : user?.role === 'OPERATOR'
                                ? 'Track assigned jobs, maintenance tasks, and the current fleet availability.'
                                : user?.role === 'FINANCE_OFFICER'
                                    ? 'Review payment activity and financial records that need attention.'
                                    : 'Browse available equipment and keep track of your rental activity and feedback.'}
                    </p>
                </div>

                {loadingOverview && <p className="mb-4 text-sm text-gray-400">Loading your overview...</p>}
                {overviewError && <p className="mb-4 text-sm text-red-400">{overviewError}</p>}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {stats.map(([label, value, path]) => (
                        <Link key={label} to={path} className="rounded-lg border border-gray-800 bg-jcb-surface p-5 transition hover:border-jcb-yellow/60">
                            <p className="text-sm text-gray-400">{label}</p>
                            <p className="mt-4 text-3xl font-bold text-jcb-yellow">{loadingOverview ? '--' : value}</p>
                            <p className="mt-2 text-xs text-gray-500">Open details</p>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 border-t border-gray-800 pt-6">
                    <h3 className="mb-3 text-lg font-bold text-gray-100">Quick access</h3>
                    <div className="flex flex-wrap gap-3">
                        {links.map(([label, path]) => (
                            <Link key={path} to={path} className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-jcb-yellow hover:text-jcb-yellow">{label}</Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="mb-8 max-w-3xl">
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-jcb-yellow">{user?.role}</p>
                <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
                <p className="mt-3 text-gray-400">{content.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {content.stats.map((stat) => (
                    <div key={stat} className="rounded-lg border border-gray-800 bg-jcb-surface p-5">
                        <p className="text-sm text-gray-400">{stat}</p>
                        <p className="mt-4 text-3xl font-bold text-jcb-yellow">--</p>
                        <p className="mt-2 text-xs text-gray-500">Connect this view to the backend data source.</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default DashboardSection;