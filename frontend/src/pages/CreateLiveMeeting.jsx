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
            const pathMatch = urlObj.pathname.match(/\/live-meeting\/(\d+)/);

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
            <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white/10">
                <div className="max-w-3xl mx-auto px-6 py-12">
                    {/* Header Navigation */}
                    <div className="mb-10 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-all duration-300"
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
                            <div className="p-8 md:p-12">
                                {/* Success Icon */}
                                <div className="text-center mb-10">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h1 className="text-4xl font-light tracking-tight text-white mb-3">
                                        Live Meeting Created
                                    </h1>
                                    <p className="text-gray-500 text-sm">
                                        Your meeting is ready to start. Share the link with participants.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {/* Meeting Details */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                                        <h2 className="text-2xl font-medium text-white mb-2">
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
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={createdMeeting.joinUrl}
                                                readOnly
                                                className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                                            />
                                            <button
                                                onClick={copyJoinUrl}
                                                className="px-6 py-4 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300"
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
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <button
                                            onClick={handleStartMeeting}
                                            className="flex-1 relative group bg-green-600 text-white font-semibold py-4 rounded-xl overflow-hidden transition-all duration-300 hover:bg-green-700"
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
                                            className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
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
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white/10">
            {/* Progress Popup Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-8 space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-medium text-white">Creating Live Meeting</h3>
                            <p className="text-sm text-gray-500">Setting up your online meeting room...</p>
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

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header Navigation */}
                <div className="mb-10 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-all duration-300"
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
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-8 md:p-12">
                            {/* Mode Toggle Tabs */}
                            <div className="mb-10 flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('create');
                                        setUrlError('');
                                    }}
                                    className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${mode === 'create'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Create Meeting
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('join');
                                        setError('');
                                    }}
                                    className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${mode === 'join'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Join via URL
                                </button>
                            </div>

                            <header className="mb-10">
                                <h1 className="text-4xl font-light tracking-tight text-white mb-3">
                                    {mode === 'create' ? 'Create Live Meeting' : 'Join Live Meeting'}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {mode === 'create'
                                        ? 'Start a real-time online meeting with video, audio, and screen sharing.'
                                        : 'Enter the meeting URL shared with you to join the live session.'}
                                </p>
                            </header>

                            {error && (
                                <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Join via URL Form */}
                            {mode === 'join' && (
                                <form onSubmit={handleJoinMeeting} className="space-y-8">
                                    <section className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                                Meeting URL
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={meetingUrl}
                                                    onChange={(e) => {
                                                        setMeetingUrl(e.target.value);
                                                        setUrlError('');
                                                    }}
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                                                    placeholder="https://yourapp.com/live-meeting/12345"
                                                    required
                                                />
                                            </div>
                                            {urlError && (
                                                <p className="text-xs text-red-400 ml-1 mt-2 animate-in fade-in slide-in-from-top-1">
                                                    {urlError}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-600 ml-1 mt-2">
                                                Paste the meeting URL that was shared with you
                                            </p>
                                        </div>

                                        {/* Info Box */}
                                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="text-sm text-blue-300/80">
                                                <p className="font-medium mb-1">How to join:</p>
                                                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-300/60">
                                                    <li>Copy the meeting URL from the invitation or email</li>
                                                    <li>Paste it in the field above</li>
                                                    <li>Click "Join Meeting" to enter the live session</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </section>

                                    <footer className="pt-6 flex flex-col sm:flex-row gap-4">
                                        <button
                                            type="submit"
                                            className="relative group flex-1 bg-white text-black font-semibold py-4 rounded-xl overflow-hidden transition-all duration-300 hover:bg-gray-200"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Join Meeting</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/dashboard')}
                                            className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </footer>
                                </form>
                            )}

                            {/* Create Meeting Form */}
                            {mode === 'create' && (
                                <form onSubmit={handleSubmit} className="space-y-10">
                                    {/* Basic Info Section */}
                                    <section className="space-y-6">
                                        <div className="grid gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                                    Meeting Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300"
                                                    placeholder="e.g., Team Daily Standup"
                                                    maxLength={200}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all duration-300 h-32 resize-none"
                                                    placeholder="Add meeting agenda or objectives..."
                                                    maxLength={1000}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Participants Section */}
                                    <section className="space-y-4">
                                        <div className="flex items-end justify-between mb-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                                Select Participants
                                            </label>
                                            <span className="text-[10px] text-gray-600 font-medium">
                                                {selectedParticipants.length} / 10 SELECTED
                                            </span>
                                        </div>

                                        {loadingUsers ? (
                                            <div className="h-48 flex items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    <span className="text-xs text-gray-600">Loading directory...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {participants.map(user => {
                                                    const isSelected = selectedParticipants.includes(user.id);
                                                    return (
                                                        <label
                                                            key={user.id}
                                                            className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${isSelected
                                                                ? 'bg-white/[0.04] border-white/20 shadow-lg'
                                                                : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                                }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'
                                                                }`}>
                                                                {isSelected && (
                                                                    <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleParticipantToggle(user.id)}
                                                                className="hidden"
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                                    {user.fullName || user.name || 'User'}
                                                                </span>
                                                                <span className="text-[11px] text-gray-600 truncate">
                                                                    {user.email}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>

                                    {/* Action Buttons */}
                                    <footer className="pt-6 flex flex-col sm:flex-row gap-4">
                                        <button
                                            type="submit"
                                            disabled={loading || selectedParticipants.length === 0}
                                            className="relative group flex-1 bg-white text-black font-semibold py-4 rounded-xl overflow-hidden transition-all duration-300 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                                        <span>Creating...</span>
                                                    </>
                                                ) : (
                                                    <span>Create Live Meeting</span>
                                                )}
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/dashboard')}
                                            className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </footer>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
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
