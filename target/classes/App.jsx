import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardSection from './pages/DashboardSection';
import FeedbackManager from './pages/FeedbackManager';
import UserManager from './pages/UserManager';
import MachineManager from './pages/MachineManager';
import MaintenanceManager from './pages/MaintenanceManager';
import BookingManager from './pages/BookingManager';
import PaymentManager from './pages/PaymentManager';
import JobManager from './pages/JobManager';

function App() {

  return (
   <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardSection />} />
                    <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManager /></ProtectedRoute>} />
                    <Route path="machines" element={<MachineManager />} />
                    <Route path="bookings" element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}><BookingManager /></ProtectedRoute>} />
                    <Route path="feedback" element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}><FeedbackManager /></ProtectedRoute>} />
                    <Route path="jobs" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><JobManager /></ProtectedRoute>} />
                    <Route path="maintenance" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><MaintenanceManager /></ProtectedRoute>} />
                    <Route path="payments" element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER', 'FINANCE_OFFICER']}><PaymentManager /></ProtectedRoute>} />
                    <Route path="invoices" element={<ProtectedRoute allowedRoles={['FINANCE_OFFICER']}><DashboardSection section="invoices" /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute allowedRoles={['FINANCE_OFFICER']}><DashboardSection section="reports" /></ProtectedRoute>} />
                </Route>

                {/* Catch-all route to handle 404s */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
  )
}

export default App
