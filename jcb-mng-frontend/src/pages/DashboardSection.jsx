import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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

const DashboardSection = ({ section = 'overview' }) => {
    const { user } = useContext(AuthContext);
    const content = sectionContent[section] || sectionContent.overview;

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