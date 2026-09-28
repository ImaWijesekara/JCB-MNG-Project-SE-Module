import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardSection from './pages/DashboardSection';

// Managers (CRUD Modules)
import UserManager from './pages/UserManager';
import MachineManager from './pages/MachineManager';
import BookingManager from './pages/BookingManager';
import JobManager from './pages/JobManager';
import MaintenanceManager from './pages/MaintenanceManager';
import PaymentManager from './pages/PaymentManager';
import FeedbackManager from './pages/FeedbackManager';
import InvoiceManager from './pages/InvoiceManager';
import ReportManager from './pages/ReportManager';

// Security Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Default Overview loaded for ALL logged-in users */}
          <Route index element={<DashboardSection />} />

          {/* 1. System Admin Only */}
          <Route 
            path="users" 
            element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManager /></ProtectedRoute>} 
          />

          {/* 2. Operations & Fleet Inventory */}
          <Route 
            path="machines" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATION_MANAGER', 'CUSTOMER', 'OPERATOR']}><MachineManager /></ProtectedRoute>} 
          />

          {/* 3. Bookings & Approvals */}
          <Route 
            path="bookings" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCH_MANAGER', 'CUSTOMER']}><BookingManager /></ProtectedRoute>} 
          />

          {/* 4. Operator Assignments & Dispatch */}
          <Route 
            path="jobs" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCH_MANAGER', 'OPERATOR']}><JobManager /></ProtectedRoute>} 
          />

          {/* 5. Maintenance & Repairs */}
          <Route 
            path="maintenance" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATION_MANAGER', 'OPERATOR']}><MaintenanceManager /></ProtectedRoute>} 
          />

          {/* 6. Finance & Billing */}
          <Route 
            path="payments" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER', 'CUSTOMER']}><PaymentManager /></ProtectedRoute>} 
          />
          <Route 
            path="invoices" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER']}><InvoiceManager /></ProtectedRoute>} 
          />
          <Route 
            path="reports" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER']}><ReportManager /></ProtectedRoute>} 
          />

          {/* Customer Specific */}
          <Route 
            path="feedback" 
            element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}><FeedbackManager /></ProtectedRoute>} 
          />
        </Route>

        {/* Catch-all route to handle 404s */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App;