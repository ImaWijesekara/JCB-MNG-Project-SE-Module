import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { submitFeedback, getAllFeedback, getMyFeedback, deleteFeedback } from '../services/feedbackService';

const FeedbackManager = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    
    // Form State for Customers
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        const loadFeedbacks = async () => {
            if (!user) return;

            setIsLoading(true);
            setError('');
            try {
                const data = user.role === 'ADMIN'
                    ? await getAllFeedback()
                    : await getMyFeedback();
                setFeedbacks(data);
            } catch (err) {
                setError(err.response?.data || 'Failed to load feedback. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadFeedbacks();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            const feedback = await submitFeedback(comment, rating);
            setFeedbacks((currentFeedbacks) => [feedback, ...currentFeedbacks]); // Add new to top
            setSuccess('Thank you! Your feedback has been successfully submitted.');
            setComment('');
            setRating(5);
            
            // Clear success message after 4 seconds
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data || "Failed to submit feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this review?")) {
            setError('');
            setDeletingId(id);
            try {
                await deleteFeedback(id);
                setFeedbacks((currentFeedbacks) => currentFeedbacks.filter(f => f.id !== id));
            } catch (err) {
                setError(err.response?.data || "Failed to delete feedback");
            } finally {
                setDeletingId(null);
            }
        }
    };

    // Calculate Metrics
    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0 
        ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) 
        : "0.0";

    // Enterprise SVG Star Renderer
    const renderStars = (count) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < count ? 'text-jcb-brand fill-current' : 'text-gray-200 fill-current'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* PAGE HEADER WITH METRICS */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-jcb-border">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-jcb-textMain">
                        {user?.role === 'ADMIN' ? 'Feedback Moderation' : 'My Reviews'}
                    </h2>
                    <p className="text-sm text-jcb-textMuted mt-1.5 font-medium">
                        {user?.role === 'ADMIN' ? 'Monitor system satisfaction and manage customer reviews.' : 'Share your rental experience to help us improve.'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-4">
                    <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-jcb-textMuted uppercase">Total Reviews</span>
                        <span className="text-lg font-black text-jcb-textMain">{totalReviews}</span>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <div className="bg-white border border-jcb-border rounded-lg px-4 py-2 shadow-sm flex flex-col items-center">
                            <span className="text-xs font-bold text-jcb-textMuted uppercase">Avg Rating</span>
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-black text-jcb-textMain">{avgRating}</span>
                                <svg className="w-4 h-4 text-jcb-brand fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ALERT BANNERS */}
            {error && (
                <div className="flex items-center bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md mb-8 shadow-sm">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-md mb-8 shadow-sm">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    <span className="text-sm font-semibold">{success}</span>
                </div>
            )}

            {/* CUSTOMER FEEDBACK FORM */}
            {user?.role === 'CUSTOMER' && (
                <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden mb-10 transition-all">
                    <div className="bg-gray-50 px-6 py-4 border-b border-jcb-border flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-jcb-brand/20 text-yellow-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </div>
                        <h3 className="text-base font-bold text-jcb-textMain">Submit New Review</h3>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Rating</label>
                            <select 
                                value={rating} 
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full md:w-64 px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain font-medium focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all appearance-none cursor-pointer"
                            >
                                <option value={5}>5 Stars - Excellent Experience</option>
                                <option value={4}>4 Stars - Good Experience</option>
                                <option value={3}>3 Stars - Average</option>
                                <option value={2}>2 Stars - Below Expectations</option>
                                <option value={1}>1 Star - Poor Experience</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-jcb-textMuted uppercase tracking-wider mb-1.5">Your Comment</label>
                            <textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)} 
                                required rows="3"
                                placeholder="Tell us about the machine quality, operator service, or overall experience..."
                                className="w-full px-4 py-2.5 bg-white border border-jcb-border rounded-lg text-sm text-jcb-textMain focus:outline-none focus:ring-2 focus:ring-jcb-brand/50 focus:border-jcb-brand transition-all resize-none placeholder:text-gray-300" 
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={isSubmitting || comment.trim() === ''} className="bg-jcb-brand text-black font-bold py-2.5 px-6 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <><svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Publishing...</>
                                ) : 'Publish Review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* FEEDBACK DATA TABLE */}
            <div className="bg-white border border-jcb-border shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-jcb-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">ID</th>
                                {user?.role === 'ADMIN' && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Customer</th>}
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Comment</th>
                                <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider">Date</th>
                                {user?.role === 'ADMIN' && <th className="px-6 py-4 text-xs font-bold text-jcb-textMuted uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={user?.role === 'ADMIN' ? 6 : 5} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="font-medium">Loading feedback records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : feedbacks.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === 'ADMIN' ? 6 : 5} className="px-6 py-12 text-center text-jcb-textMuted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                            </div>
                                            <span className="font-medium">No reviews have been submitted yet.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : feedbacks.map((f) => (
                                <tr key={f.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-jcb-textMuted font-medium">#{f.id}</td>
                                    {user?.role === 'ADMIN' && <td className="px-6 py-4 font-bold text-jcb-textMain">{f.username || f.customerName}</td>}
                                    <td className="px-6 py-4">
                                        {renderStars(f.rating)}
                                    </td>
                                    <td className="px-6 py-4 text-jcb-textMain max-w-xs truncate" title={f.message || f.comment}>
                                        {f.message || f.comment}
                                    </td>
                                    <td className="px-6 py-4 text-jcb-textMuted">
                                        {new Date(f.submittedAt || f.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    {user?.role === 'ADMIN' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    disabled={deletingId === f.id} 
                                                    onClick={() => handleDelete(f.id)} 
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                                                    title="Delete Review"
                                                >
                                                    {deletingId === f.id ? (
                                                        <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeedbackManager;