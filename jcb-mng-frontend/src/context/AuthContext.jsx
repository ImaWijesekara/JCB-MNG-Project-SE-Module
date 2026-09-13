import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { logoutUser } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const role = decoded.role ? decoded.role.replace('ROLE_', '') : 'CUSTOMER';
                setUser({ username: decoded.sub, role, token });
            } catch (error) {
                console.error("Invalid token");
                logoutUser();
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('jwt_token', token);
        const decoded = jwtDecode(token);
        const role = decoded.role ? decoded.role.replace('ROLE_', '') : 'CUSTOMER';
        setUser({ username: decoded.sub, role, token });
    };

    const logout = () => {
        logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};