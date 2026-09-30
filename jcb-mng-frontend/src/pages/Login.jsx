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
                : 'Unable to sign in. Please check your credentials and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* LEFT SIDE - Branding & Image (Matches Register Layout) */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-black items-center justify-center overflow-hidden shadow-2xl z-10">
                <img 
                    src="https://images.unsplash.com/photo-1581094288338-2314dddb7ece?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="Heavy Machinery" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                <div className="relative z-10 text-center px-12 mt-32">
                    <div className="w-20 h-20 bg-jcb-brand mx-auto rounded-lg flex items-center justify-center font-black text-black text-3xl mb-6 shadow-lg">
                        JCB
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-4">Welcome Back</h1>
                    <p className="text-base text-gray-300 font-medium leading-relaxed">
                        Securely access your dashboard to manage fleet operations, equipment bookings, and financial ledgers.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE - Login Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign in to your account</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Enter your credentials to access the portal.</p>
                    </div>

                    {error && (
                        <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Account Credentials Section */}
                        <div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. admin_john"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                                        <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</a>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 mt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-jcb-brand hover:bg-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                            >
                                {isSubmitting ? (
                                    <><svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Authenticating...</>
                                ) : 'Secure Login'}
                            </button>
                        </div>
                    </form>
                    
                    <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all">Create one here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;