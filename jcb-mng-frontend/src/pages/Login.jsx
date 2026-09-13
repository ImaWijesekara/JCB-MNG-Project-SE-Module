import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/authService';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(username, password);
            login(data.token);
            // Route based on role (we will build these dashboards next)
            navigate('/dashboard'); 
        } catch (err) {
            setError('Invalid username or password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-jcb-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-jcb-surface rounded-lg shadow-xl p-8 border border-gray-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-100">JCB Management</h2>
                    <p className="text-gray-400 mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-jcb-dark border border-gray-700 rounded focus:outline-none focus:border-jcb-yellow text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-jcb-dark border border-gray-700 rounded focus:outline-none focus:border-jcb-yellow text-gray-100"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-jcb-yellow hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded transition duration-200"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-center text-gray-400 mt-6">
                    Don't have an account? <Link to="/register" className="text-jcb-yellow hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;