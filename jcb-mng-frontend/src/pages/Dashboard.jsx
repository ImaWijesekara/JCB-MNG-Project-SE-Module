import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// 1. COMPLETE NAVIGATION MAPPING FOR ALL 6 ROLES
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
    OPERATION_MANAGER: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Machine Fleet', path: '/dashboard/machines' },
        { label: 'Maintenance Logs', path: '/dashboard/maintenance' },
    ],
    DISPATCH_MANAGER: [
        { label: 'Overview', path: '/dashboard' },
        { label: 'Bookings & Approvals', path: '/dashboard/bookings' },
        { label: 'Operator Assignments', path: '/dashboard/jobs' },
    ],
    FINANCE_OFFICER: [
        { label: 'Financial Dashboard', path: '/dashboard' },
        { label: 'Payment Verifications', path: '/dashboard/payments' },
        { label: 'Invoices', path: '/dashboard/invoices' },
        { label: 'Revenue Reports', path: '/dashboard/reports' },
    ],
    OPERATOR: [
        { label: 'Operator Dashboard', path: '/dashboard' },
        { label: 'My Assigned Jobs', path: '/dashboard/jobs' },
        { label: 'Maintenance Tasks', path: '/dashboard/maintenance' },
        { label: 'Fleet Status', path: '/dashboard/machines' },
    ],
    CUSTOMER: [
        { label: 'My Portal', path: '/dashboard' },
        { label: 'Browse Machines', path: '/dashboard/machines' },
        { label: 'My Bookings', path: '/dashboard/bookings' },
        { label: 'Billing & Payments', path: '/dashboard/payments' },
        { label: 'My Reviews', path: '/dashboard/feedback' },
    ],
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
    
    // Role Logic
    const currentRole = user?.role?.replace('ROLE_', '') || 'CUSTOMER';
    const isCustomer = currentRole === 'CUSTOMER';
    
    const navigation = navigationByRole[currentRole] || navigationByRole.CUSTOMER;
    const pageTitle = headerByRole[currentRole] || 'Your Workspace';

    // RENDER 1: CUSTOMER TOP NAVBAR (E-Commerce Style)
    const renderCustomerNavbar = () => (
        <header className="bg-white border-b border-jcb-border shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-jcb-brand rounded flex items-center justify-center font-black text-black">
                            JCB
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-jcb-textMain hidden sm:block">
                            Equipment Rentals
                        </span>
                    </div>

                    {/* Desktop Horizontal Nav */}
                    <nav className="hidden md:flex space-x-1" aria-label="Customer Navigation">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                    isActive 
                                    ? 'bg-jcb-brand/10 text-yellow-700' 
                                    : 'text-jcb-textMuted hover:bg-gray-50 hover:text-jcb-textMain'
                                }`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Profile & Logout */}
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                        <span className="text-sm font-bold text-jcb-textMain hidden sm:block">{user?.username}</span>
                        <button 
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );

    // RENDER 2: STAFF SIDEBAR (Admin/Operations Style)
    const renderStaffSidebar = () => (
        <aside className="border-r border-jcb-border bg-white hidden lg:flex lg:flex-col lg:w-64 shadow-sm z-10 relative">
            <div className="flex items-center justify-between border-b border-jcb-border px-6 py-5 bg-gray-50/50">
                <div>
                    <p className="text-xl font-black tracking-tight text-jcb-textMain">JCB PORTAL</p>
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-jcb-textMuted">Management System</p>
                </div>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Staff Navigation">
                <p className="px-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Main Menu</p>
                {navigation.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) => `block rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                            isActive 
                            ? 'bg-jcb-brand text-black shadow-sm' 
                            : 'text-jcb-textMuted hover:bg-gray-50 hover:text-jcb-textMain'
                        }`}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            
            <div className="p-4 border-t border-jcb-border bg-gray-50">
                <div className="mb-3 px-2">
                    <p className="text-xs text-jcb-textMuted font-medium">Logged in as</p>
                    <p className="text-sm font-bold text-jcb-textMain truncate">{user?.username}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-jcb-brand/20 text-jcb-action text-xs font-black rounded-full uppercase tracking-wider">
                        {currentRole.replace('_', ' ')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className={`min-h-screen bg-gray-50 font-sans flex ${isCustomer ? 'flex-col' : 'flex-row'}`}>
            
            {/* If Customer, show Top Navbar. If Staff, show Left Sidebar */}
            {isCustomer ? renderCustomerNavbar() : renderStaffSidebar()}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0">
                
                {/* Universal Page Header */}
                <header className="bg-white border-b border-jcb-border px-6 py-6 sm:px-10 shadow-sm z-0">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm font-bold text-jcb-textMuted uppercase tracking-wider">Welcome back, {user?.username}</p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-jcb-textMain sm:text-3xl">
                            {pageTitle}
                        </h1>
                    </div>
                </header>
                
                {/* Outlet loads DashboardSection.jsx (Overview) or UserManager.jsx, etc. */}
                <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
                    <div className={isCustomer ? "max-w-7xl mx-auto" : ""}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;