import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI, usersAPI } from '../services/api';

const CreateMeeting = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participants, setParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [audioFiles, setAudioFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    
    // Progress state for the popup
    const [creationStep, setCreationStep] = useState(0); // 0: Idle, 1: Creating, 2: Uploading, 3: Processing
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await usersAPI.getAll();
            setParticipants(data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
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

    const handleFileChange = (e, index) => {
        const file = e.target.files[0];

        if (!file) return;

        // Validate file type
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/mp4'];
        const isValidType = allowedTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a)$/i);

        if (!isValidType) {
            setError('Only MP3, WAV, and M4A files are allowed');
            return;
        }

        // Validate file size (25MB)
        if (file.size > 25 * 1024 * 1024) {
            setError('File size must be less than 25MB');
            return;
        }

        setAudioFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = file;
            return newFiles;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setCreationStep(1); // Step 1: Creating Meeting

        try {
            if (!title) {
                throw new Error('Title is required');
            }

            if (selectedParticipants.length === 0) {
                throw new Error('Please select at least one participant');
            }

            if (audioFiles.length !== selectedParticipants.length || audioFiles.some(f => !f)) {
                throw new Error('Please upload audio file for each participant');
            }

            // Create meeting
            const { meeting } = await meetingsAPI.create({
                title,
                description,
                participantIds: selectedParticipants
            });

            setCreationStep(2); // Step 2: Uploading Audio

            // Upload audio files
            await meetingsAPI.uploadAudio(meeting.id, audioFiles, selectedParticipants);

            setCreationStep(3); // Step 3: Triggering Processing

            // Trigger processing
            await meetingsAPI.process(meeting.id);

            // Navigate to meeting detail page
            navigate(`/meetings/${meeting.id}`);
        } catch (error) {
            setError(error.message || 'Failed to create meeting');
            setCreationStep(0); // Reset on error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white/10">
            {/* Progress Popup Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-8 space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-medium text-white">Creating Meeting</h3>
                            <p className="text-sm text-gray-500">Please wait while we set everything up.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1: Initialization */}
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    creationStep > 1 ? 'bg-white border-white' : creationStep === 1 ? 'border-white animate-pulse' : 'border-white/10'
                                }`}>
                                    {creationStep > 1 && (
                                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${creationStep >= 1 ? 'text-white' : 'text-gray-600'}`}>
                                    Initializing meeting record
                                </span>
                            </div>

                            {/* Step 2: Upload */}
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    creationStep > 2 ? 'bg-white border-white' : creationStep === 2 ? 'border-white animate-pulse' : 'border-white/10'
                                }`}>
                                    {creationStep > 2 && (
                                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${creationStep >= 2 ? 'text-white' : 'text-gray-600'}`}>
                                    Uploading participant recordings
                                </span>
                            </div>

                            {/* Step 3: Processing */}
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    creationStep > 3 ? 'bg-white border-white' : creationStep === 3 ? 'border-white animate-pulse' : 'border-white/10'
                                }`}>
                                    {creationStep > 3 && (
                                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${creationStep >= 3 ? 'text-white' : 'text-gray-600'}`}>
                                    Starting transcription engine
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out"
                                style={{ width: `${(creationStep / 3) * 100}%` }}
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
                            <header className="mb-10">
                                <h1 className="text-4xl font-light tracking-tight text-white mb-3">
                                    Create New Meeting
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Configure your meeting details and upload participant recordings.
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
                                                placeholder="e.g., Strategic Q4 Planning"
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
                                                placeholder="Outline the objectives and key topics..."
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
                                                        className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                                                            isSelected 
                                                            ? 'bg-white/[0.04] border-white/20 shadow-lg' 
                                                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                            isSelected ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'
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
                                                                {user.fullName}
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

                                {/* Audio Upload Section */}
                                {selectedParticipants.length > 0 && (
                                    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">
                                                Participant Recordings
                                            </label>
                                            <p className="text-[11px] text-gray-600 ml-1">
                                                Upload individual audio files for each selected participant (Max 25MB, MP3/WAV/M4A).
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {selectedParticipants.map((participantId, index) => {
                                                const participant = participants.find(p => p.id === participantId);
                                                const hasFile = !!audioFiles[index];
                                                return (
                                                    <div key={participantId} className="group bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all duration-300">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${hasFile ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-500'}`}>
                                                                    {index + 1}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-300">
                                                                    {participant?.fullName || 'Unknown User'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="relative flex-1 max-w-md">
                                                                <input
                                                                    type="file"
                                                                    accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
                                                                    onChange={(e) => handleFileChange(e, index)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                    required
                                                                />
                                                                <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs transition-all duration-300 ${
                                                                    hasFile 
                                                                    ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                                                                    : 'bg-white/5 border-white/10 text-gray-500 group-hover:border-white/20'
                                                                }`}>
                                                                    <span className="truncate max-w-[200px]">
                                                                        {hasFile ? audioFiles[index].name : 'Choose audio file...'}
                                                                    </span>
                                                                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

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
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <span>Create Meeting</span>
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

export default CreateMeeting;
