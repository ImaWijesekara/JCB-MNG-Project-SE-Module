import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/authService';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const data = await loginUser(username, password);
            login(data.token);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const responseMessage = err.response?.data;
            setError(typeof responseMessage === 'string'
                ? responseMessage
                : 'Unable to sign in. Check your credentials and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-jcb-background font-sans">
            {/* LEFT SIDE - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-jcb-textMain items-center justify-center overflow-hidden">
                {/* Background Image Placeholder (Replace src with your own image if you have one) */}
                <img 
                    src="https://images.unsplash.com/photo-1581094288338-2314dddb7ece?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="JCB Industrial" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="relative z-10 text-center px-12">
                    <h1 className="text-5xl font-black text-white tracking-tight mb-4">JCB PORTAL</h1>
                    <p className="text-lg text-jcb-textMuted font-medium">Enterprise Heavy Machinery Management</p>
                    <div className="mt-8 inline-block bg-jcb-brand text-black font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        Authorized Personnel Only
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-jcb-border p-10">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-jcb-textMain tracking-tight">Welcome Back</h2>
                        <p className="text-sm text-jcb-textMuted mt-2">Sign in to your enterprise account to continue.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-md text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all"
                                required
                            />
                        </div>
                        
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-jcb-brand hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-2.5 px-4 rounded-md transition duration-200 shadow-sm"
                            >
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                    
                    <p className="text-center text-sm text-jcb-textMuted mt-8">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;