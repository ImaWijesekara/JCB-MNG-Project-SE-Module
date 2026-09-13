import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardSection from './pages/DashboardSection';
import FeedbackManager from './pages/FeedbackManager';
import UserManager from './pages/UserManager';

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
                    <Route path="machines" element={<DashboardSection section="machines" />} />
                    <Route path="bookings" element={<DashboardSection section="bookings" />} />
                    <Route path="feedback" element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}><FeedbackManager /></ProtectedRoute>} />
                    <Route path="jobs" element={<ProtectedRoute allowedRoles={['OPERATOR']}><DashboardSection section="jobs" /></ProtectedRoute>} />
                    <Route path="maintenance" element={<ProtectedRoute allowedRoles={['OPERATOR']}><DashboardSection section="maintenance" /></ProtectedRoute>} />
                    <Route path="payments" element={<ProtectedRoute allowedRoles={['FINANCE_OFFICER']}><DashboardSection section="payments" /></ProtectedRoute>} />
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
