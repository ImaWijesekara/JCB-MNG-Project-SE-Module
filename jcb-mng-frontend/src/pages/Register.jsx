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
        <div className="flex min-h-screen bg-jcb-background font-sans">
            {/* LEFT SIDE - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-jcb-textMain items-center justify-center overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1581094288338-2314dddb7ece?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="JCB Industrial" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="relative z-10 text-center px-12">
                    <h1 className="text-5xl font-black text-white tracking-tight mb-4">JCB PORTAL</h1>
                    <p className="text-lg text-jcb-textMuted font-medium">Join the next generation of fleet management.</p>
                </div>
            </div>

            {/* RIGHT SIDE - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-jcb-border p-10">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-jcb-textMain tracking-tight">Create Account</h2>
                        <p className="text-sm text-jcb-textMuted mt-2">Sign up to access the JCB Management platform.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 text-sm font-medium">
                            Registration successful! Redirecting to login...
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="password"
                                name="passwordHash"
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all"
                                required
                            />
                        </div>
                        
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-jcb-brand hover:bg-yellow-400 text-black font-bold py-2.5 px-4 rounded-md transition duration-200 shadow-sm"
                            >
                                Register Now
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-jcb-textMuted mt-8">
                        Already have an account? <Link to="/" className="text-blue-600 font-bold hover:underline">Sign In here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;