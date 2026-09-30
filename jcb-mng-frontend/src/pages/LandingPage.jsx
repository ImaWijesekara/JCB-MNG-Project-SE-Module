import React from 'react';
import { Link } from 'react-router-dom';

// --- SUB-COMPONENTS ---

const Navbar = () => (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-sm">
                        JCB
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-gray-900 hidden sm:block">
                        Equipment Rentals
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors px-4 py-2">
                        Sign In
                    </Link>
                    <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold py-2.5 px-6 rounded-lg transition-all shadow-sm hover:shadow">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    </nav>
);

const HeroSection = () => (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-black overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
            <img 
                src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                alt="Excavator working" 
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold text-xs tracking-widest uppercase mb-6 animate-fade-in-up">
                Enterprise Fleet Management
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
                Heavy Machinery, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                    Delivered On Demand.
                </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300 font-medium mb-10">
                The all-in-one platform to book JCBs, dispatch certified operators, and track your project's logistics in real-time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-lg py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-yellow-400/20 flex items-center justify-center gap-2">
                    Start Renting Now <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
                <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-lg py-4 px-8 rounded-xl transition-all backdrop-blur-sm flex items-center justify-center">
                    Staff Portal Login
                </Link>
            </div>
        </div>
    </div>
);

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-yellow-400/50 transition-all group">
        <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-yellow-400 group-hover:text-black transition-all">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
);

const FeaturesSection = () => (
    <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Built for Scale & Efficiency</h2>
                <p className="mt-4 text-gray-500 font-medium text-lg">Everything you need to manage earthmoving logistics from one dashboard.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    title="Instant Digital Booking" 
                    description="Browse our live inventory and secure your machinery with real-time availability and transparent daily rates."
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                />
                <FeatureCard 
                    title="Certified Operators" 
                    description="Every machine comes with the option to deploy a highly trained, safety-certified operator directly to your site."
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                />
                <FeatureCard 
                    title="Automated Maintenance" 
                    description="Our fleet is strictly monitored. Faulty machines are automatically pulled from the catalog and routed to mechanics."
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>}
                />
            </div>
        </div>
    </div>
);

const StatsSection = () => (
    <div className="bg-yellow-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-yellow-500/30">
                <div>
                    <p className="text-4xl md:text-5xl font-black text-black">150+</p>
                    <p className="mt-2 text-sm font-bold text-yellow-900 uppercase tracking-widest">Machines</p>
                </div>
                <div>
                    <p className="text-4xl md:text-5xl font-black text-black">12k</p>
                    <p className="mt-2 text-sm font-bold text-yellow-900 uppercase tracking-widest">Jobs Done</p>
                </div>
                <div>
                    <p className="text-4xl md:text-5xl font-black text-black">4.9</p>
                    <p className="mt-2 text-sm font-bold text-yellow-900 uppercase tracking-widest">User Rating</p>
                </div>
                <div>
                    <p className="text-4xl md:text-5xl font-black text-black">24/7</p>
                    <p className="mt-2 text-sm font-bold text-yellow-900 uppercase tracking-widest">Support</p>
                </div>
            </div>
        </div>
    </div>
);

const Footer = () => (
    <footer className="bg-black py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center font-black text-black text-xl mx-auto mb-6">
                JCB
            </div>
            <p className="text-gray-400 font-medium mb-6">Empowering construction teams with enterprise-grade logistics and reliable machinery.</p>
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} JCB Management System. Developed for academic presentation.</p>
        </div>
    </footer>
);

// --- MAIN PAGE EXPORT ---
const LandingPage = () => {
    return (
        <div className="min-h-screen font-sans selection:bg-yellow-400 selection:text-black">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <StatsSection />
            <Footer />
        </div>
    );
};

export default LandingPage;