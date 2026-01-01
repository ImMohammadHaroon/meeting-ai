import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../services/api';
import { supabase } from '../services/supabase';
import meetingBg from '../assets/meeting.png';

const Dashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const data = await meetingsAPI.getAll();
            setMeetings(data.meetings || []);
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
            setError('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/signin');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleDeleteMeeting = async (meetingId, meetingTitle, e) => {
        e.preventDefault(); // Prevent navigation to meeting detail
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${meetingTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await meetingsAPI.delete(meetingId);
            // Refresh the meetings list
            await fetchMeetings();
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            setError(error.response?.data?.error || 'Failed to delete meeting');
        }
    };

    return (
        <div
            className="min-h-screen bg-black p-6"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${meetingBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-4xl font-bold text-gradient">Meeting AI</h1>
                    <div className="flex flex-wrap gap-2 md:gap-4">
                        <Link to="/create-meeting" className="btn-secondary text-sm md:text-base px-3 py-2 md:px-4 md:py-2 whitespace-nowrap">
                            + Individual
                        </Link>
                        <Link to="/create-group-meeting" className="btn-secondary text-sm md:text-base px-3 py-2 md:px-4 md:py-2 whitespace-nowrap">
                            + Group
                        </Link>
                        <Link to="/create-live-meeting" className="btn-primary text-sm md:text-base px-3 py-2 md:px-4 md:py-2 whitespace-nowrap">
                            + Live Meeting
                        </Link>
                        <button onClick={handleSignOut} className="btn-secondary text-sm md:text-base px-3 py-2 md:px-4 md:py-2 whitespace-nowrap">
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                        <p className="mt-4 text-white/60">Loading meetings...</p>
                    </div>
                ) : meetings.length === 0 ? (
                    /* Empty State */
                    <div className="bg-black/90 rounded-xl p-12 text-center">
                        <h2 className="text-2xl font-semibold mb-4">No meetings yet</h2>
                        <p className="text-white/60 mb-6">
                            Create your first meeting to get started with AI-powered transcription and analysis.
                        </p>
                        <Link to="/create-meeting" className="btn-primary inline-block">
                            Create Your First Meeting
                        </Link>
                    </div>
                ) : (
                    /* Meetings Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {meetings.map((meeting) => (
                            <Link
                                key={meeting.id}
                                to={`/meetings/${meeting.id}`}
                                className="card-glass group relative"
                            >
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDeleteMeeting(meeting.id, meeting.title, e)}
                                    className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-300 opacity-100 sm:opacity-0 group-hover:opacity-100 z-10"
                                    title="Delete meeting"
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                <div className="flex items-start justify-between mb-3 pr-10 md:pr-12">
                                    <h3 className="text-lg md:text-xl font-semibold group-hover:text-white/90 line-clamp-2">
                                        {meeting.title}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${meeting.processed
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-yellow-500/20 text-yellow-300'
                                            }`}
                                    >
                                        {meeting.processed ? 'Processed' : 'Pending'}
                                    </span>
                                </div>

                                {meeting.description && (
                                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                        {meeting.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-xs md:text-sm text-white/50">
                                    <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                                    <span className="group-hover:text-white/70 transition-colors hidden sm:inline">
                                        View Details →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
