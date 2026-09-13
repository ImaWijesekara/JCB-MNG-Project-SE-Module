import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        passwordHash: '',
        role: 'CUSTOMER' // Default role for public sign-ups
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await registerUser(formData);
            setSuccess(true);
            setTimeout(() => navigate('/'), 2000); // Redirect to login after 2 seconds
        } catch (err) {
            setError(err.response?.data || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-jcb-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-jcb-surface rounded-lg shadow-xl p-8 border border-gray-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-100">Create Account</h2>
                    <p className="text-gray-400 mt-2">Join the JCB Management platform</p>
                </div>

                {error && <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-900 border border-green-500 text-green-100 px-4 py-3 rounded mb-4">Registration successful! Redirecting...</div>}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input type="text" name="username" onChange={handleChange} required
                            className="w-full px-4 py-2 bg-jcb-dark border border-gray-700 rounded focus:outline-none focus:border-jcb-yellow text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" onChange={handleChange} required
                            className="w-full px-4 py-2 bg-jcb-dark border border-gray-700 rounded focus:outline-none focus:border-jcb-yellow text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input type="password" name="passwordHash" onChange={handleChange} required
                            className="w-full px-4 py-2 bg-jcb-dark border border-gray-700 rounded focus:outline-none focus:border-jcb-yellow text-gray-100" />
                    </div>
                    <button type="submit" className="w-full bg-jcb-yellow hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded transition duration-200 mt-4">
                        Register
                    </button>
                </form>

                <p className="text-center text-gray-400 mt-6">
                    Already have an account? <Link to="/" className="text-jcb-yellow hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;