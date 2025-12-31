import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveMeetingsAPI } from '../services/api';
import { supabase } from '../services/supabase';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

function LiveMeeting() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [liveMeeting, setLiveMeeting] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef(null);

    // WebRTC hook
    const {
        peers,
        localStream,
        isMuted,
        toggleMute,
        speakingUsers,
        isConnected,
        error: webrtcError,
        leaveMeeting: webrtcLeave
    } = useWebRTC(
        liveMeeting?.room_id,
        currentUser?.id,
        currentUser?.user_metadata?.full_name || currentUser?.email || 'User'
    );

    // Audio recorder hook
    const { isRecording, recordedBlob, startRecording, stopRecording } = useAudioRecorder();

    useEffect(() => {
        fetchCurrentUser();
        fetchMeetingDetails();
    }, [id]);

    useEffect(() => {
        if (liveMeeting && currentUser) {
            // Join meeting (record in database)
            liveMeetingsAPI.join(id).catch(console.error);

            // Start timer
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [liveMeeting, currentUser, id]);

    // Start recording when local stream is available
    useEffect(() => {
        if (localStream && !isRecording && liveMeeting?.status === 'live') {
            startRecording(localStream);
        }
    }, [localStream, liveMeeting]);

    // Create audio elements for remote streams
    useEffect(() => {
        peers.forEach((peer, socketId) => {
            if (peer.stream) {
                const audioElement = document.getElementById(`audio-${socketId}`);
                if (audioElement) {
                    audioElement.srcObject = peer.stream;
                }
            }
        });
    }, [peers]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchMeetingDetails = async () => {
        try {
            const response = await liveMeetingsAPI.getById(id);
            setLiveMeeting(response.liveMeeting);
            setMeeting(response.meeting);
            setParticipants(response.meeting.meeting_participants || []);

            if (response.liveMeeting.status === 'ended') {
                setError('This meeting has ended');
                setTimeout(() => navigate(`/meetings/${response.liveMeeting.meeting_id}`), 3000);
            }
        } catch (err) {
            console.error('Error fetching meeting:', err);
            setError('Failed to load meeting. Redirecting...');
            setTimeout(() => navigate('/dashboard'), 3000);
        }
    };

    const handleEndMeeting = async () => {
        if (!confirm('Are you sure you want to end this meeting for everyone?')) {
            return;
        }

        setIsEnding(true);

        try {
            // Stop recording
            if (isRecording) {
                stopRecording();
            }

            // Upload recording
            if (recordedBlob) {
                await liveMeetingsAPI.uploadRecording(id, recordedBlob);
            }

            // End meeting
            await liveMeetingsAPI.end(id);

            // Leave WebRTC
            webrtcLeave();

            // Navigate to meeting details
            navigate(`/meetings/${liveMeeting.meeting_id}`);
        } catch (err) {
            console.error('Error ending meeting:', err);
            setError('Failed to end meeting properly');
            setIsEnding(false);
        }
    };

    const handleLeaveMeeting = async () => {
        try {
            // Leave WebRTC
            webrtcLeave();

            // Record leave in database
            await liveMeetingsAPI.leave(id);

            // Navigate away
            navigate('/dashboard');
        } catch (err) {
            console.error('Error leaving meeting:', err);
            navigate('/dashboard');
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isCreator = meeting && currentUser && meeting.created_by === currentUser.id;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!liveMeeting || !meeting) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading meeting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{meeting.title}</h1>
                        <p className="text-sm text-gray-400">
                            {liveMeeting.status === 'live' ? 'Meeting in Progress' : 'Waiting to start...'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        {/* Timer */}
                        <div className="bg-gray-700 px-4 py-2 rounded font-mono">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Participant List */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">
                        Participants ({participants.length + Array.from(peers.values()).filter(p => p.userInfo).length})
                    </h2>
                    <div className="space-y-3">
                        {/* Current User */}
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-semibold relative ${speakingUsers.has('local') ? 'ring-4 ring-green-500' : ''}`}>
                                    {currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">You</p>
                                    <p className="text-xs text-gray-400">{currentUser?.email}</p>
                                </div>
                                {isMuted && (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Remote Participants */}
                        {Array.from(peers.entries()).map(([socketId, peer]) => {
                            if (!peer.userInfo) return null;

                            return (
                                <div key={socketId} className="bg-gray-700 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-semibold ${speakingUsers.has(socketId) ? 'ring-4 ring-green-500' : ''}`}>
                                            {peer.userInfo.userName?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{peer.userInfo.userName}</p>
                                            <p className="text-xs text-gray-400">Connected</p>
                                        </div>
                                    </div>
                                    {/* Hidden audio element for remote stream */}
                                    <audio id={`audio-${socketId}`} autoPlay />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {webrtcError && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-lg mb-4 max-w-md">
                            {webrtcError}
                        </div>
                    )}

                    <div className="text-center">
                        <svg className="w-24 h-24 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <h2 className="text-2xl font-semibold mb-2">Voice Meeting</h2>
                        <p className="text-gray-400">
                            {isRecording ? 'Recording in progress...' : 'Connecting...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                    {/* Mute/Unmute Button */}
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>

                    {/* Leave Button */}
                    {!isCreator && (
                        <button
                            onClick={handleLeaveMeeting}
                            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition"
                        >
                            Leave Meeting
                        </button>
                    )}

                    {/* End Meeting Button (Creator Only) */}
                    {isCreator && (
                        <button
                            onClick={handleEndMeeting}
                            disabled={isEnding}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-full font-semibold transition"
                        >
                            {isEnding ? 'Ending...' : 'End Meeting'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LiveMeeting;
