import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

const Register = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        passwordHash: '',
        confirmPassword: '',
        role: 'CUSTOMER' // Default role for public sign-ups
    });
    
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: null });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (formData.username.trim().length < 3) errors.username = "Username must be at least 3 characters.";
        if (formData.fullName.trim().length < 3) errors.fullName = "Please enter your full name.";
        if (formData.phoneNumber.trim().length < 9) errors.phoneNumber = "Please enter a valid phone number.";
        if (formData.passwordHash.length < 6) errors.passwordHash = "Password must be at least 6 characters.";
        if (formData.passwordHash !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Strip confirmPassword before sending to Spring Boot
            const { confirmPassword, ...submitData } = formData;
            await registerUser(submitData);
            
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data || 'Registration failed. Please verify your details and try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* LEFT SIDE - Branding & Image */}
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
                    <h1 className="text-4xl font-black text-white tracking-tight mb-4">Equipment Rentals</h1>
                    <p className="text-base text-gray-300 font-medium leading-relaxed">
                        Create an account to browse our fleet, book machinery, and manage your invoices seamlessly.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE - Register Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Join the platform to request and manage heavy equipment.</p>
                    </div>

                    {error && (
                        <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                    )}
                    
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                            <p className="text-gray-500 font-medium">Your account has been created. Redirecting you to the login portal...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            
                            {/* Personal Information Section */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Personal Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. John Doe"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-jcb-brand/50'} rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all`} />
                                        {fieldErrors.fullName && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.fullName}</p>}
                                    </div>
                                    
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="e.g. 071 234 5678"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-jcb-brand/50'} rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all`} />
                                        {fieldErrors.phoneNumber && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.phoneNumber}</p>}
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:bg-white transition-all" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Physical Address</label>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Required for equipment delivery..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:bg-white transition-all" />
                                    </div>
                                </div>
                            </div>

                            {/* Account Credentials Section */}
                            <div className="pt-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Account Credentials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Username</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Choose a unique login name"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-jcb-brand/50'} rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all`} />
                                        {fieldErrors.username && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.username}</p>}
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                                        <input type="password" name="passwordHash" value={formData.passwordHash} onChange={handleChange} required placeholder="••••••••"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.passwordHash ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-jcb-brand/50'} rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all`} />
                                        {fieldErrors.passwordHash && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.passwordHash}</p>}
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••"
                                            className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-jcb-brand/50'} rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all`} />
                                        {fieldErrors.confirmPassword && <p className="mt-1 text-xs font-bold text-red-500">{fieldErrors.confirmPassword}</p>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-jcb-brand hover:bg-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                                >
                                    {isSubmitting ? (
                                        <><svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Securing Account...</>
                                    ) : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                        Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline transition-all">Sign In to Dashboard</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;