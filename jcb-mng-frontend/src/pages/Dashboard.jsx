import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navigationByRole = {
    ADMIN: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Users Directory', path: '/dashboard/users' },
        { label: 'Machine Fleet', path: '/dashboard/machines' },
        { label: 'Bookings & Dispatch', path: '/dashboard/bookings' },
        { label: 'Financial Ledger', path: '/dashboard/payments' },
        { label: 'Maintenance', path: '/dashboard/maintenance' },
        { label: 'Feedback Moderation', path: '/dashboard/feedback' },
    ],
    CUSTOMER: [
        { label: 'My Portal', path: '/dashboard' },
        { label: 'Browse Machines', path: '/dashboard/machines' },
        { label: 'My Bookings', path: '/dashboard/bookings' },
        { label: 'Billing & Payments', path: '/dashboard/payments' },
        { label: 'My Reviews', path: '/dashboard/feedback' },
    ],
    OPERATOR: [
        { label: 'Operator Dashboard', path: '/dashboard' },
        { label: 'My Assigned Jobs', path: '/dashboard/jobs' },
        { label: 'Maintenance Tasks', path: '/dashboard/maintenance' },
        { label: 'Fleet Status', path: '/dashboard/machines' },
    ],
    FINANCE_OFFICER: [
        { label: 'Financial Dashboard', path: '/dashboard' },
        { label: 'Payment Verifications', path: '/dashboard/payments' },
        { label: 'Invoices', path: '/dashboard/invoices' },
        { label: 'Revenue Reports', path: '/dashboard/reports' },
    ],
    // Add DISPATCH_MANAGER and OPERATION_MANAGER here if needed!
};

// Dynamic Titles for the Header
const headerByRole = {
    ADMIN: 'Executive Command Center',
    CUSTOMER: 'Customer Portal',
    OPERATOR: 'Operator Control Panel',
    FINANCE_OFFICER: 'Financial Operations',
    OPERATION_MANAGER: 'Fleet Operations Center',
    DISPATCH_MANAGER: 'Dispatch Command Center'
};

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    
    // Fallback to CUSTOMER if role is missing
    const currentRole = user?.role?.replace('ROLE_', '') || 'CUSTOMER';
    const navigation = navigationByRole[currentRole] || navigationByRole.CUSTOMER;
    const pageTitle = headerByRole[currentRole] || 'Your Workspace';

    return (
        <div className="min-h-screen bg-jcb-background text-jcb-textMain lg:flex font-sans">
            {/* SIDEBAR */}
            <aside className="border-b border-jcb-border bg-jcb-surface lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r shadow-sm z-10">
                <div className="flex items-center justify-between border-b border-jcb-border px-6 py-5">
                    <div>
                        <p className="text-xl font-black tracking-tight text-jcb-textMain">JCB PORTAL</p>
                        <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-jcb-textMuted">Management System</p>
                    </div>
                </div>
                
                <nav className="flex gap-2 overflow-x-auto p-4 lg:block lg:flex-1 lg:space-y-1.5" aria-label="Dashboard navigation">
                    <p className="hidden lg:block px-4 mb-2 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Main Menu</p>
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) => `block whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition-all shadow-sm ${
                                isActive 
                                ? 'bg-jcb-brand text-black' 
                                : 'text-jcb-textMuted hover:bg-gray-100 hover:text-jcb-textMain shadow-none'
                            }`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                
                <div className="p-4 border-t border-jcb-border bg-gray-50">
                    <div className="mb-3 px-3">
                        <p className="text-xs text-jcb-textMuted font-medium">Logged in as</p>
                        <p className="text-sm font-bold text-jcb-textMain truncate">{user?.username}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-jcb-brand/20 text-jcb-action text-xs font-bold rounded-full uppercase tracking-wider">
                            {currentRole}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full rounded-md px-4 py-2 text-center text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col">
                <header className="bg-jcb-surface border-b border-jcb-border px-6 py-6 sm:px-10 shadow-sm z-0">
                    <p className="text-sm font-bold text-jcb-textMuted uppercase tracking-wider">Welcome back, {user?.username}</p>
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-jcb-textMain sm:text-3xl">
                        {pageTitle}
                    </h1>
                </header>
                
                {/* Outlet loads DashboardSection.jsx (Overview) or UserManager.jsx, etc. */}
                <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;