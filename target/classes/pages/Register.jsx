import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'CUSTOMER'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
            setError('Please complete all fields before continuing.');
            return;
        }

        try {
            await registerUser({
                username: formData.username.trim(),
                email: formData.email.trim(),
                passwordHash: formData.password,
                role: formData.role
            });

            setSuccess(true);
            setTimeout(() => navigate('/'), 1800);
        } catch (err) {
            const backendMessage = typeof err?.response?.data === 'string'
                ? err.response.data
                : err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';

            setError(backendMessage);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #020817 0%, #0f172a 100%)' }}>
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/60 backdrop-blur-sm">
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">JCB Management</p>
                    <h2 className="mt-3 text-3xl font-bold text-white">Create Account</h2>
                    <p className="mt-2 text-sm text-slate-400">Join the JCB Management platform</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Registration successful! Redirecting to sign in...
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-amber-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                        Register
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/" className="font-medium text-amber-400 hover:text-amber-300 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;