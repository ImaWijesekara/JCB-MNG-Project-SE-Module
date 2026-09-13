import React, { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navigationByRole = {
    ADMIN: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Users', path: '/dashboard/users' },
        { label: 'Machines', path: '/dashboard/machines' },
        { label: 'Maintenance', path: '/dashboard/maintenance' },
        { label: 'Bookings', path: '/dashboard/bookings' },
        { label: 'Feedback', path: '/dashboard/feedback' },
    ],
    CUSTOMER: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Browse machines', path: '/dashboard/machines' },
        { label: 'My bookings', path: '/dashboard/bookings' },
        { label: 'My feedback', path: '/dashboard/feedback' },
    ],
    OPERATOR: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Assigned jobs', path: '/dashboard/jobs' },
        { label: 'Machines', path: '/dashboard/machines' },
        { label: 'Maintenance', path: '/dashboard/maintenance' },
    ],
    FINANCE_OFFICER: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Payments', path: '/dashboard/payments' },
        { label: 'Invoices', path: '/dashboard/invoices' },
        { label: 'Reports', path: '/dashboard/reports' },
    ],
};

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = navigationByRole[user?.role] || navigationByRole.CUSTOMER;

    return (
        <div className="min-h-screen bg-jcb-dark text-gray-100 lg:flex">
            <aside className="border-b border-gray-800 bg-jcb-surface lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
                    <div>
                        <p className="text-lg font-bold tracking-tight">JCB Portal</p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">Management system</p>
                    </div>
                    <span className="rounded bg-jcb-yellow px-2 py-1 text-xs font-bold text-gray-900">{user?.role}</span>
                </div>
                <nav className="flex gap-2 overflow-x-auto p-4 lg:block lg:flex-1 lg:space-y-2" aria-label="Dashboard navigation">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) => `block whitespace-nowrap rounded px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-jcb-yellow text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <button
                    type="button"
                    onClick={logout}
                    className="m-4 rounded border border-red-500/50 px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-900/30"
                >
                    Sign out
                </button>
            </aside>

            <main className="flex-1">
                <header className="border-b border-gray-800 px-6 py-6 sm:px-10">
                    <p className="text-sm text-gray-400">Welcome back, {user?.username}</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your workspace</h1>
                </header>
                <div className="p-6 sm:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;