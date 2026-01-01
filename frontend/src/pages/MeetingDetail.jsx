import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsAPI, communityChatAPI } from '../services/api';
import { supabase } from '../services/supabase';
import Chatbot from '../components/Chatbot';
import ReactMarkdown from 'react-markdown';

const MeetingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingStatus, setProcessingStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('transcript');
    const [communityMessages, setCommunityMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchMeetingDetails();
        getCurrentUser();

        // Poll for processing status if not processed
        const interval = setInterval(() => {
            checkProcessingStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [id]);

    // Poll for community messages when on chat tab
    useEffect(() => {
        if (activeTab === 'community-chat') {
            fetchCommunityMessages();
            const chatInterval = setInterval(() => {
                fetchCommunityMessages();
            }, 3000);
            return () => clearInterval(chatInterval);
        }
    }, [activeTab, id]);

    const fetchMeetingDetails = async () => {
        try {
            const data = await meetingsAPI.getById(id);
            setMeeting(data.meeting);
            setTasks(data.tasks || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch meeting:', error);
            setError('Failed to load meeting details');
            setLoading(false);
        }
    };

    const checkProcessingStatus = async () => {
        try {
            const status = await meetingsAPI.getStatus(id);
            setProcessingStatus(status);

            // Refresh data if newly processed
            if (status.processed && !meeting?.processed) {
                fetchMeetingDetails();
            }
        } catch (error) {
            console.error('Failed to check status:', error);
        }
    };

    const getCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id);
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
    };

    const fetchCommunityMessages = async () => {
        try {
            const data = await communityChatAPI.getMessages(id);
            setCommunityMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to fetch community messages:', error);
        }
    };

    const sendCommunityMessage = async () => {
        if (!newMessage.trim() || sendingMessage) return;

        setSendingMessage(true);
        try {
            await communityChatAPI.sendMessage(id, newMessage.trim());
            setNewMessage('');
            // Immediately fetch messages to show the new one
            await fetchCommunityMessages();
            // Scroll to bottom
            setTimeout(() => {
                const chatContainer = document.getElementById('community-chat-container');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCommunityMessage();
        }
    };

    const handleDeleteMeeting = async () => {
        setDeleting(true);
        try {
            await meetingsAPI.delete(id);
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            alert(error.response?.data?.error || 'Failed to delete meeting');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const tabs = [
        { id: 'transcript', label: 'Transcript' },
        { id: 'notes', label: 'Notes' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'audio', label: 'Audio' },
        { id: 'assistant', label: 'Meeting Assistant' },
        { id: 'community-chat', label: 'Community Chat' },
        { id: 'details', label: 'Meeting Detail' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transcript':
                return (
                    <div className="h-full flex flex-col p-6">
                        <h2 className="text-3xl font-bold mb-6 text-gradient flex-shrink-0">Transcript</h2>
                        {meeting.transcript ? (
                            <div className="bg-white/5 rounded-lg p-6 flex-1 overflow-y-auto custom-scrollbar">
                                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                                    {meeting.transcript}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center flex-1">
                                <p className="text-white/50 text-lg">
                                    {meeting.processed
                                        ? 'No transcript available'
                                        : 'Transcript will appear here after processing...'}
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'notes':
                return (
                    <div className="h-full flex flex-col p-6">
                        <h2 className="text-3xl font-bold mb-6 text-gradient flex-shrink-0">Meeting Notes</h2>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {meeting.description && (
                                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                                    <label className="text-white/50 text-sm block mb-2">Description</label>
                                    <p className="text-white/80">{meeting.description}</p>
                                </div>
                            )}
                            {meeting.notes ? (
                                <div className="bg-white/5 rounded-lg p-8">
                                    <div className="text-white/80 prose prose-invert max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-6 mt-8 first:mt-0" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-5 mt-8 first:mt-0" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-white mb-4 mt-6 first:mt-0" {...props} />,
                                                p: ({ node, ...props }) => <p className="text-white/80 mb-4 leading-loose text-base" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-5 mt-3 space-y-2 text-white/80 pl-6" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-5 mt-3 space-y-2 text-white/80 pl-6" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-white/80 leading-relaxed pl-2" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                                em: ({ node, ...props }) => <em className="italic text-white/90" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500 pl-6 py-3 my-6 text-white/70 italic bg-white/5 rounded-r-lg" {...props} />,
                                                code: ({ node, inline, ...props }) =>
                                                    inline
                                                        ? <code className="bg-white/10 px-2 py-1 rounded text-sm text-purple-300 font-mono" {...props} />
                                                        : <code className="block bg-white/10 p-4 rounded-lg text-sm text-purple-300 overflow-x-auto my-4 font-mono leading-relaxed" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-purple-400 hover:text-purple-300 underline decoration-purple-400/50 hover:decoration-purple-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                                hr: ({ node, ...props }) => <hr className="border-white/20 my-8" {...props} />,
                                            }}
                                        >
                                            {meeting.notes}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64">
                                    <p className="text-white/50 text-lg">
                                        {meeting.processed
                                            ? 'No notes available'
                                            : 'Notes will appear here after processing...'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'tasks':
                return (
                    <div className="h-full flex flex-col p-6">
                        <h2 className="text-3xl font-bold mb-6 text-gradient flex-shrink-0">Tasks Assigned</h2>
                        {tasks.length > 0 ? (
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {tasks.map((task, index) => (
                                    <div
                                        key={task.id}
                                        className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-lg mb-2">{task.title}</p>
                                                {task.description && (
                                                    <p className="text-white/60 text-sm mb-2">{task.description}</p>
                                                )}
                                                {task.assignee_id && (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-xs text-white/50">Assigned to:</span>
                                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                                            {task.assignee_name || task.assignee_id}
                                                        </span>
                                                        {task.assignee_email && (
                                                            <span className="text-xs text-white/40">({task.assignee_email})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center flex-1">
                                <p className="text-white/50 text-lg">
                                    {meeting.processed
                                        ? 'No tasks extracted from this meeting'
                                        : 'Tasks will appear after processing...'}
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'audio':
                return (
                    <div className="h-full flex flex-col p-6">
                        <h2 className="text-3xl font-bold mb-6 text-gradient flex-shrink-0">Meeting Audio</h2>

                        {/* Group Meeting Audio */}
                        {meeting.type === 'group' && meeting.audio_file_url ? (
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                                            🎙️
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-lg mb-1">
                                                Group Meeting Audio
                                            </p>
                                            <p className="text-white/50 text-sm">
                                                Complete recording of the group discussion
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <audio
                                            controls
                                            className="w-full"
                                            style={{
                                                filter: 'invert(1) hue-rotate(180deg)',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <source src={meeting.audio_file_url} type="audio/mpeg" />
                                            <source src={meeting.audio_file_url} type="audio/wav" />
                                            <source src={meeting.audio_file_url} type="audio/mp4" />
                                            <source src={meeting.audio_file_url} type="audio/webm" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            </div>
                        ) : meeting.meeting_participants?.some(p => p.audio_file_url) ? (
                            /* Standard Meeting - Participant Audio Files */
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                {meeting.meeting_participants.map((participant, index) => (
                                    participant.audio_file_url && (
                                        <div
                                            key={participant.id}
                                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium text-lg mb-1">
                                                        {participant.user_name || `Participant ${index + 1}`}
                                                    </p>
                                                    <p className="text-white/50 text-sm">
                                                        {participant.user_email || `User ID: ${participant.user_id}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <audio
                                                    controls
                                                    className="w-full"
                                                    style={{
                                                        filter: 'invert(1) hue-rotate(180deg)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <source src={participant.audio_file_url} type="audio/mpeg" />
                                                    <source src={participant.audio_file_url} type="audio/wav" />
                                                    <source src={participant.audio_file_url} type="audio/mp4" />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            /* No Audio Available */
                            <div className="flex items-center justify-center flex-1">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🎙️</div>
                                    <p className="text-white/50 text-lg">
                                        No audio files uploaded yet
                                    </p>
                                    <p className="text-white/30 text-sm mt-2">
                                        {meeting.type === 'group'
                                            ? 'Upload a group audio recording to see it here'
                                            : 'Upload participant audio files to see them here'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'community-chat':
                return (
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-white/10 flex-shrink-0">
                            <h2 className="text-3xl font-bold text-gradient">Community Chat</h2>
                            <p className="text-white/50 text-sm mt-2">Team discussion about this meeting</p>
                        </div>

                        {/* Messages Container */}
                        <div
                            id="community-chat-container"
                            className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4"
                        >
                            {communityMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="text-white/50 text-lg">No messages yet</p>
                                        <p className="text-white/30 text-sm mt-2">Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                communityMessages.map((msg) => {
                                    const isCurrentUser = msg.user_id === currentUserId;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            {/* Avatar */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isCurrentUser
                                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                                : 'bg-white/10'
                                                }`}>
                                                {(msg.user_name || msg.user_email || 'U')[0].toUpperCase()}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                <div className={`text-xs text-white/50 mb-1 px-2 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                                    {msg.user_name || msg.user_email}
                                                </div>
                                                <div className={`rounded-2xl px-4 py-3 ${isCurrentUser
                                                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                                                    : 'bg-white/5 border border-white/10'
                                                    }`}>
                                                    <p className="text-white/90 whitespace-pre-wrap break-words">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                                <div className="text-xs text-white/30 mt-1 px-2">
                                                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-white/10 flex-shrink-0">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    disabled={sendingMessage}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                                />
                                <button
                                    onClick={sendCommunityMessage}
                                    disabled={!newMessage.trim() || sendingMessage}
                                    className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                                >
                                    {sendingMessage ? '...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'details':
                return (
                    <div className="h-full flex flex-col p-6">
                        <h2 className="text-3xl font-bold mb-6 text-gradient flex-shrink-0">Meeting Details</h2>
                        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Basic Info */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold mb-4 text-white">Basic Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/50 text-sm">Meeting Title</label>
                                        <p className="text-white text-lg font-medium mt-1">{meeting.title}</p>
                                    </div>

                                    <div>
                                        <label className="text-white/50 text-sm">Status</label>
                                        <div className="mt-2">
                                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${meeting.processed
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                {meeting.processed ? '✓ Processed' : '⏳ Processing...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold mb-4 text-white">Timeline</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <div>
                                            <p className="text-white/50 text-sm">Created</p>
                                            <p className="text-white">
                                                {new Date(meeting.created_at).toLocaleString('en-US', {
                                                    dateStyle: 'full',
                                                    timeStyle: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {meeting.updated_at && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <div>
                                                <p className="text-white/50 text-sm">Last Updated</p>
                                                <p className="text-white">
                                                    {new Date(meeting.updated_at).toLocaleString('en-US', {
                                                        dateStyle: 'full',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold mb-4 text-white">Participants</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                                        {meeting.meeting_participants?.length || 0}
                                    </div>
                                    <div>
                                        <p className="text-white text-lg font-medium">
                                            {meeting.meeting_participants?.length || 0} Participant(s)
                                        </p>
                                        <p className="text-white/50 text-sm">Total attendees in this meeting</p>
                                    </div>
                                </div>
                            </div>

                            {/* Audio File */}
                            {meeting.audio_file_path && (
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h3 className="text-xl font-semibold mb-4 text-white">Recording</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🎙️</div>
                                        <div>
                                            <p className="text-white/80">Audio file uploaded</p>
                                            <p className="text-white/50 text-sm mt-1">
                                                {meeting.audio_file_path.split('/').pop()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                    <p className="mt-4 text-white/60">Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (error || !meeting) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-black/90 rounded-xl p-8 text-center">
                        <p className="text-red-400 mb-4">{error || 'Meeting not found'}</p>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="flex h-screen">
                {/* Sidebar - Always visible */}
                <div className="w-72 bg-black border-r border-white/10 flex flex-col flex-shrink-0">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <span>←</span>
                                <span>Back to Dashboard</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-300"
                                title="Delete meeting"
                            >
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                        <h1 className="text-2xl font-bold text-gradient">{meeting.title}</h1>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>

                {/* Main Content Area - Completely Full Space */}
                <div className="flex-1 h-screen overflow-hidden">
                    {activeTab === 'assistant' ? (
                        // Chatbot takes COMPLETE full space - NO padding, NO margin, NO wrapper
                        meeting.processed ? (
                            <Chatbot meetingId={id} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-black">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <p className="text-white/50 text-lg">
                                        Meeting Assistant will be available after processing is complete
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        // Other tabs content
                        <div className="h-full flex flex-col overflow-hidden bg-black">
                            {/* Processing Status */}
                            {!meeting.processed && processingStatus && (
                                <div className="bg-black/90 p-4 border-b border-white/10 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                                        <span className="text-white/80">
                                            Processing meeting audio... This may take a few minutes.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Tab Content */}
                            <div className="flex-1 overflow-hidden bg-black/90">
                                {renderTabContent()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        {/* Warning Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-white text-center mb-3">
                            Delete Meeting?
                        </h3>

                        {/* Message */}
                        <p className="text-white/70 text-center mb-2">
                            Are you sure you want to delete
                        </p>
                        <p className="text-white font-semibold text-center mb-6">
                            "{meeting.title}"
                        </p>
                        <p className="text-red-400/80 text-sm text-center mb-8">
                            This action cannot be undone. All meeting data, transcripts, notes, and tasks will be permanently deleted.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMeeting}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingDetail;