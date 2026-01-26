import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveMeetingsAPI, usersAPI } from '../services/api';
import { supabase } from '../services/supabase';

const CreateLiveMeeting = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('create'); // 'create' or 'join'
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participants, setParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [createdMeeting, setCreatedMeeting] = useState(null);

    // URL input state for join mode
    const [meetingUrl, setMeetingUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    // Progress state for the popup
    const [creationStep, setCreationStep] = useState(0); // 0: Idle, 1: Creating

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { users } = await usersAPI.getAll();
            const { data: { user } } = await supabase.auth.getUser();

            // Filter out current user
            const filteredUsers = users.filter(u => u.id !== user?.id);
            setParticipants(filteredUsers || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleParticipantToggle = (userId) => {
        setSelectedParticipants(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                if (prev.length >= 10) {
                    setError('Maximum 10 participants allowed');
                    return prev;
                }
                return [...prev, userId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setCreationStep(1); // Step 1: Creating Meeting

        try {
            if (!title.trim()) {
                throw new Error('Title is required');
            }

            if (selectedParticipants.length === 0) {
                throw new Error('Please select at least one participant');
            }

            const response = await liveMeetingsAPI.create({
                title: title.trim(),
                description: description.trim(),
                participantIds: selectedParticipants
            });

            setCreatedMeeting(response);
        } catch (err) {
            console.error('Error creating live meeting:', err);
            setError(err.response?.data?.error || err.message || 'Failed to create live meeting');
            setCreationStep(0); // Reset on error
        } finally {
            setLoading(false);
        }
    };

    const handleStartMeeting = async () => {
        try {
            await liveMeetingsAPI.start(createdMeeting.liveMeeting.id);
            navigate(`/live-meeting/${createdMeeting.liveMeeting.id}`);
        } catch (err) {
            console.error('Error starting meeting:', err);
            setError('Failed to start meeting');
        }
    };

    const copyJoinUrl = () => {
        navigator.clipboard.writeText(createdMeeting.joinUrl);
        // Using a more elegant notification approach
        setError('');
        const notification = document.createElement('div');
        notification.textContent = '✓ Link copied!';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-right';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    const validateAndParseMeetingUrl = (url) => {
        setUrlError('');

        if (!url.trim()) {
            setUrlError('Please enter a meeting URL');
            return null;
        }

        try {
            // Try to parse the URL
            const urlObj = new URL(url);

            // Check if it's a valid meeting URL pattern
            const pathMatch = urlObj.pathname.match(/\/live-meeting\/([a-zA-Z0-9-]+)/);

            if (!pathMatch) {
                setUrlError('Invalid meeting URL format. Expected format: .../live-meeting/{id}');
                return null;
            }

            return pathMatch[1]; // Return the meeting ID
        } catch (e) {
            setUrlError('Invalid URL format. Please enter a valid URL');
            return null;
        }
    };

    const handleJoinMeeting = (e) => {
        e.preventDefault();

        const meetingId = validateAndParseMeetingUrl(meetingUrl);

        if (meetingId) {
            // Navigate to the live meeting page
            navigate(`/live-meeting/${meetingId}`);
        }
    };

    if (createdMeeting) {
        return (
            <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white/10 p-4 md:p-6">
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
                    {/* Header Navigation */}
                    <div className="mb-6 md:mb-10 flex items-center justify-between gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 hover:text-white transition-all duration-300 flex-shrink-0"
                        >
                            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8"></div>
                    </div>

                    <div className="relative">
                        {/* Background Glow Effect */}
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                        <div className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-6 md:p-8 lg:p-12">
                                {/* Success Icon */}
                                <div className="text-center mb-8 md:mb-10">
                                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-4 md:mb-6">
                                        <svg className="w-8 h-8 md:w-10 md:h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl md:text-4xl font-light tracking-tight text-white mb-3">
                                        Live Meeting Created
                                    </h1>
                                    <p className="text-gray-500 text-sm">
                                        Your meeting is ready to start. Share the link with participants.
                                    </p>
                                </div>

                                <div className="space-y-6 md:space-y-8">
                                    {/* Meeting Details */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 md:p-6">
                                        <h2 className="text-xl md:text-2xl font-medium text-white mb-2">
                                            {createdMeeting.meeting.title}
                                        </h2>
                                        {createdMeeting.meeting.description && (
                                            <p className="text-gray-400 text-sm leading-relaxed">
                                                {createdMeeting.meeting.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Join URL Section */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                            Meeting Join Link
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                                            <input
                                                type="text"
                                                value={createdMeeting.joinUrl}
                                                readOnly
                                                className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 md:px-5 py-3 md:py-4 text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                                            />
                                            <button
                                                onClick={copyJoinUrl}
                                                className="px-4 md:px-6 py-3 md:py-4 text-sm rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-600 ml-1">
                                            Share this link with participants to let them join the meeting
                                        </p>
                                    </div>

                                    {/* Error Display */}
                                    {error && (
                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {error}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                                        <button
                                            onClick={handleStartMeeting}
                                            className="flex-1 relative group bg-green-600 text-white font-semibold py-3 md:py-4 text-sm md:text-base rounded-xl overflow-hidden transition-all duration-300 hover:bg-green-700"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Start Meeting Now</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
                                        >
                                            Back to Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white/10 p-4 flex flex-col items-center justify-center">
            {/* Progress Popup Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 md:space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg md:text-xl font-medium text-white">Creating Live Meeting</h3>
                            <p className="text-xs md:text-sm text-gray-500">Setting up your online meeting room...</p>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1: Initialization */}
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${creationStep >= 1 ? 'border-white animate-pulse' : 'border-white/10'
                                    }`}>
                                    {creationStep > 1 && (
                                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${creationStep >= 1 ? 'text-white' : 'text-gray-600'}`}>
                                    Initializing live meeting room
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out animate-pulse"
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-5xl">
                {/* Header Navigation */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-all duration-300 flex-shrink-0"
                    >
                        <svg className="w-3 h-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8"></div>
                </div>

                <div className="relative">
                    {/* Background Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

                    <div className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[550px]">

                        {/* Sidebar / Left Panel */}
                        <div className="w-full md:w-1/3 p-6 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
                            <header className="mb-6">
                                <h1 className="text-2xl font-light tracking-tight text-white mb-2">
                                    {mode === 'create' ? 'Create Meeting' : 'Join Meeting'}
                                </h1>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    {mode === 'create'
                                        ? 'Start a real-time session with audio, video, and screen sharing.'
                                        : 'Enter the secure meeting ID or URL to join an active session.'}
                                </p>
                            </header>

                            {/* Mode Toggle Tabs */}
                            <div className="flex flex-col gap-2 mt-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('create');
                                        setUrlError('');
                                    }}
                                    className={`py-3 px-4 rounded-xl font-medium text-xs text-left transition-all duration-300 flex items-center justify-between ${mode === 'create'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                        }`}
                                >
                                    <span>Create New Meeting</span>
                                    {mode === 'create' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('join');
                                        setError('');
                                    }}
                                    className={`py-3 px-4 rounded-xl font-medium text-xs text-left transition-all duration-300 flex items-center justify-between ${mode === 'join'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                        }`}
                                >
                                    <span>Join via Code/URL</span>
                                    {mode === 'join' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="mb-6 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {mode === 'join' && (
                                <form onSubmit={handleJoinMeeting} className="h-full flex flex-col justify-center max-w-sm mx-auto">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                                Meeting URL
                                            </label>
                                            <input
                                                type="text"
                                                value={meetingUrl}
                                                onChange={(e) => {
                                                    setMeetingUrl(e.target.value);
                                                    setUrlError('');
                                                }}
                                                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all duration-300"
                                                placeholder="Paste link here..."
                                                required
                                            />
                                            {urlError && (
                                                <p className="text-xs text-red-400 ml-1 animate-in fade-in slide-in-from-top-1">
                                                    {urlError}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-white text-black font-semibold py-3 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Join Meeting
                                        </button>
                                    </div>
                                </form>
                            )}

                            {mode === 'create' && (
                                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                    <div className="flex-1 space-y-5">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all duration-300"
                                                    placeholder="Meeting Title"
                                                    maxLength={200}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                                    Agenda (Optional)
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all duration-300 h-20 resize-none"
                                                    placeholder="Brief description..."
                                                    maxLength={1000}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                            <div className="flex items-end justify-between">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                                    Participants
                                                </label>
                                                <span className="text-[10px] text-gray-600 font-medium">
                                                    {selectedParticipants.length} SELECTED
                                                </span>
                                            </div>

                                            {loadingUsers ? (
                                                <div className="flex-1 flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-lg">
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[160px]">
                                                    {participants.map(user => {
                                                        const isSelected = selectedParticipants.includes(user.id);
                                                        return (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => handleParticipantToggle(user.id)}
                                                                className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${isSelected
                                                                    ? 'bg-white/[0.06] border-white/20'
                                                                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                                                                    }`}
                                                            >
                                                                <div className={`w-3 h-3 rounded-full border flex flex-col items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-white/20'}`}></div>
                                                                <div className="overflow-hidden">
                                                                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                                        {user.fullName || user.name || 'User'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-5 mt-auto">
                                        <button
                                            type="submit"
                                            disabled={loading || selectedParticipants.length === 0}
                                            className="w-full bg-white text-black font-semibold py-3 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <span className="animate-pulse">Creating...</span> : 'Create Meeting'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default CreateLiveMeeting;
