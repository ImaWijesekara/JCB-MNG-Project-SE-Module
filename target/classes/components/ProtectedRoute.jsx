import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen bg-jcb-dark flex items-center justify-center text-jcb-yellow">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Kick unauthorized users back to their respective dashboards
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;