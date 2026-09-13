import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { submitFeedback, getAllFeedback, getMyFeedback } from '../services/feedbackService';

const FeedbackManager = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            loadAllFeedback();
        } else if (user?.role === 'CUSTOMER') {
            loadMyFeedback();
        }
    }, [user]);

    const loadAllFeedback = async () => {
        try {
            const data = await getAllFeedback();
            setFeedbacks(data);
        } catch (error) {
            console.error("Failed to load feedback");
        }
    };

    const loadMyFeedback = async () => {
        try {
            const data = await getMyFeedback();
            setFeedbacks(data);
        } catch (error) {
            setStatus('Failed to load your feedback.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitFeedback(message, rating);
            setStatus('Feedback submitted successfully!');
            setMessage('');
            setRating(5);
            await loadMyFeedback();
        } catch (error) {
            setStatus(error.response?.data || 'Failed to submit feedback.');
        }
    };

    return (
        <div className="max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">{user?.role === 'ADMIN' ? 'Feedback Management' : 'My feedback'}</h2>

            {user?.role === 'CUSTOMER' && (
                <div className="bg-jcb-surface p-6 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-jcb-yellow mb-4">Submit New Feedback</h3>
                    {status && <p className="mb-4 text-sm text-jcb-yellow">{status}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="feedback-rating" className="mb-1 block text-sm text-gray-400">Rating</label>
                            <select id="feedback-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full rounded border border-gray-700 bg-jcb-dark px-3 py-2 text-gray-100 outline-none focus:border-jcb-yellow sm:w-48">
                                <option value={5}>5 - Excellent</option>
                                <option value={4}>4 - Good</option>
                                <option value={3}>3 - Average</option>
                                <option value={2}>2 - Poor</option>
                                <option value={1}>1 - Very poor</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="feedback-message" className="mb-1 block text-sm text-gray-400">Message</label>
                            <textarea id="feedback-message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} rows="4"
                                className="w-full rounded border border-gray-700 bg-jcb-dark px-3 py-2 text-gray-100 outline-none focus:border-jcb-yellow"></textarea>
                            <p className="mt-1 text-right text-xs text-gray-500">{message.length}/1000</p>
                        </div>
                        <button type="submit" className="bg-jcb-yellow text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-500 transition">
                            Submit
                        </button>
                    </form>
                </div>
            )}

            {user?.role === 'CUSTOMER' && (
                <div className="mt-8 overflow-hidden rounded-lg border border-gray-800 bg-jcb-surface">
                    <div className="border-b border-gray-800 px-6 py-4">
                        <h3 className="font-bold text-gray-100">Your previous feedback</h3>
                    </div>
                    {feedbacks.length === 0 ? (
                        <p className="px-6 py-5 text-sm text-gray-400">You have not submitted any feedback yet.</p>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {feedbacks.map((feedback) => (
                                <div key={feedback.id} className="px-6 py-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm font-bold text-jcb-yellow">{feedback.rating} / 5</span>
                                        <span className="text-xs text-gray-500">{feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-300">{feedback.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {user?.role === 'ADMIN' && (
                <div className="bg-jcb-surface rounded-lg border border-gray-800 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-800 text-gray-100 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-4 text-center">No feedback found.</td></tr>
                            ) : (
                                feedbacks.map((fb) => (
                                    <tr key={fb.id} className="border-b border-gray-800">
                                        <td className="px-6 py-4">#{fb.id}</td>
                                        <td className="px-6 py-4 text-gray-100">{fb.message}</td>
                                        <td className="px-6 py-4 font-bold text-jcb-yellow">{fb.rating} / 5</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeedbackManager;