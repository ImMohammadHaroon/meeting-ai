import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { liveMeetingsAPI } from '../services/api';
import { supabase } from '../services/supabase';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useIsMdUp } from '../hooks/useMediaQuery';
import MobileDrawer from '../components/MobileDrawer';

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const timerRef = useRef(null);
    const isMdUp = useIsMdUp();

    // WebRTC hook
    const {
        peers,
        localStream,
        isMuted,
        toggleMute,
        speakingUsers,
        isConnected,
        error: webrtcError,
        leaveMeeting: webrtcLeave,
        toggleScreenShare,
        isScreenSharing
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

    // Update audio/video elements for remote streams
    useEffect(() => {
        peers.forEach((peer, socketId) => {
            if (peer.stream) {
                // Audio
                const audioElement = document.getElementById(`audio-${socketId}`);
                if (audioElement && audioElement.srcObject !== peer.stream) {
                    audioElement.srcObject = peer.stream;
                }

                // Video (for screen share)
                const videoElement = document.getElementById(`video-${socketId}`);
                const videoTrack = peer.stream.getVideoTracks()[0];
                if (videoElement) {
                    if (videoTrack && videoTrack.readyState === 'live') {
                        videoElement.srcObject = peer.stream;
                        videoElement.style.display = 'block';
                    } else {
                        videoElement.style.display = 'none';
                    }
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

    // Check if anyone is sharing screen
    const activeScreenShare = Array.from(peers.entries()).find(([_, peer]) =>
        peer.stream && peer.stream.getVideoTracks().length > 0 && peer.stream.getVideoTracks()[0].readyState === 'live'
    );

    // Also check if local user is sharing
    const localVideoTrack = localStream?.getVideoTracks()[0];
    const isLocalSharing = localVideoTrack && localVideoTrack.readyState === 'live';

    const [isFullScreen, setIsFullScreen] = useState(false);
    const meetingContainerRef = useRef(null);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            meetingContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    // Listen for fullscreen change events (ESC key etc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (error) {
        return (
            <div className="h-screen w-full bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-lg text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!liveMeeting || !meeting) {
        return (
            <div className="h-screen w-full bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm animate-pulse">Connecting to secure meeting...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={meetingContainerRef}
            className="h-screen w-full bg-[#050505] text-gray-200 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <header className="bg-[#0A0A0A] border-b border-white/5 px-4 h-16 flex-shrink-0 flex items-center justify-between z-20">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    {/* Mobile Menu Button */}
                    {!isMdUp && (
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            aria-label="Open participants"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="min-w-0">
                        <h1 className="text-sm md:text-base font-medium text-white truncate">{meeting.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                {liveMeeting.status === 'live' ? 'Live' : 'Waiting'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                    <div className="hidden md:flex bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-xs md:text-sm text-gray-300">
                        {formatTime(elapsedTime)}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop Participant List */}
                {isMdUp && (
                    <aside className="w-72 bg-[#0A0A0A] border-r border-white/5 flex flex-col flex-shrink-0 z-10">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Participants ({participants.length + Array.from(peers.values()).filter(p => p.userInfo).length})
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {/* Current User */}
                            <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={`relative flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300 ${speakingUsers.has('local') ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}>
                                    {currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
                                    {isMuted && (
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-black">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 truncate font-medium">You</p>
                                    <p className="text-[10px] text-gray-500 truncate">{currentUser?.email}</p>
                                </div>
                                {isScreenSharing && (
                                    <svg className="w-4 h-4 text-green-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </div>

                            {/* Remote Participants */}
                            {Array.from(peers.entries()).map(([socketId, peer]) => {
                                if (!peer.userInfo) return null;
                                const hasVideo = peer.stream && peer.stream.getVideoTracks().length > 0 && peer.stream.getVideoTracks()[0].readyState === 'live';

                                return (
                                    <div key={socketId} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className={`relative flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-semibold text-emerald-300 ${speakingUsers.has(socketId) ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black' : ''}`}>
                                            {peer.userInfo.userName?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200 truncate font-medium">{peer.userInfo.userName}</p>
                                            <p className="text-[10px] text-gray-500">Online</p>
                                        </div>
                                        {hasVideo && (
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {/* Hidden audio element for remote stream */}
                                        <audio id={`audio-${socketId}`} autoPlay />
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                )}

                {/* Mobile Participant Drawer */}
                {!isMdUp && (
                    <MobileDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        title={`Participants (${participants.length + Array.from(peers.values()).filter(p => p.userInfo).length})`}
                    >
                        {/* Similar mobile list implementation */}
                        <div className="space-y-3">
                            {/* ... (Mobile list items same as desktop essentially, can be refactored to component later) ... */}
                            {/* Keeping existing mobile drawer content structure but styled consistently */}
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold text-sm">
                                        {currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-white">You</p>
                                        <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                                    </div>
                                    {isScreenSharing && <div className="text-xs text-green-400">Sharing</div>}
                                </div>
                            </div>
                            {Array.from(peers.entries()).map(([socketId, peer]) => {
                                if (!peer.userInfo) return null;
                                return (
                                    <div key={socketId} className="bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-300 font-semibold text-sm">
                                                {peer.userInfo.userName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-white">{peer.userInfo.userName}</p>
                                            </div>
                                        </div>
                                        <audio id={`audio-${socketId}`} autoPlay />
                                    </div>
                                );
                            })}
                        </div>
                    </MobileDrawer>
                )}

                {/* Center Stage (Video/Content) */}
                <main className="flex-1 flex flex-col relative bg-[#050505]">

                    {/* Stage Area */}
                    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                        {webrtcError && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm backdrop-blur-md z-30">
                                {webrtcError}
                            </div>
                        )}

                        <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center">
                            {/* Empty State */}
                            {!activeScreenShare && !isLocalSharing && (
                                <div className="text-center space-y-6">
                                    <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
                                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                                        <div className="relative w-full h-full bg-[#0A0A0A] border border-white/10 rounded-full flex items-center justify-center">
                                            <svg className="w-10 h-10 md:w-12 md:h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        {/* Audio Waves Animation */}
                                        {speakingUsers.size > 0 && (
                                            <>
                                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping"></div>
                                                <div className="absolute -inset-4 border border-blue-500/10 rounded-full animate-pulse delay-75"></div>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-light text-white mb-2">Voice Connected</h2>
                                        <p className="text-gray-500 text-sm">
                                            {peers.size > 0
                                                ? `Talking with ${peers.size} others`
                                                : 'Waiting for others to join...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Video Streams */}
                            {Array.from(peers.entries()).map(([socketId, peer]) => (
                                <div key={socketId} className={`relative w-full h-full flex items-center justify-center ${peer.stream && peer.stream.getVideoTracks().length > 0 && peer.stream.getVideoTracks()[0].readyState === 'live' ? 'block' : 'hidden'}`}>
                                    <video
                                        id={`video-${socketId}`}
                                        autoPlay
                                        playsInline
                                        className="max-w-full max-h-full rounded-xl shadow-2xl bg-black"
                                        style={{ display: 'none' }}
                                    />
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-medium">
                                        {peer.userInfo?.userName}'s Screen
                                    </div>
                                </div>
                            ))}

                            {isLocalSharing && (
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                    <video
                                        ref={video => {
                                            if (video && localStream) video.srcObject = localStream;
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="max-w-full max-h-full rounded-xl shadow-2xl border border-green-500/30 bg-black"
                                    />
                                    <div className="absolute top-8 left-8 bg-green-500/90 text-black px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                                        YOU ARE SHARING
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Control Bar (Floating) */}
                    <div className="h-20 lg:h-24 flex items-center justify-center md:pb-6 relative z-30">
                        <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 md:py-4 shadow-2xl flex items-center gap-4 md:gap-6">

                            {/* Mute Toggle */}
                            <button
                                onClick={toggleMute}
                                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isMuted ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/5 text-white hover:bg-white/10'
                                    }`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-black text-[10px] font-bold px-2 py-1 rounded">
                                    {isMuted ? 'Unmute' : 'Mute'}
                                </span>
                            </button>

                            {/* Share Screen Toggle */}
                            <button
                                onClick={toggleScreenShare}
                                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isScreenSharing ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/5 text-white hover:bg-white/10'
                                    }`}
                                title="Share Screen"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-black text-[10px] font-bold px-2 py-1 rounded w-max">
                                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                                </span>
                            </button>

                            {/* Full Screen Toggle */}
                            <button
                                onClick={toggleFullScreen}
                                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isFullScreen ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white hover:bg-white/10'
                                    }`}
                                title="Toggle Full Screen"
                            >
                                {isFullScreen ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-black text-[10px] font-bold px-2 py-1 rounded w-max">
                                    {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                                </span>
                            </button>

                            <div className="w-px h-8 bg-white/10 mx-2"></div>

                            {/* Leave / End Buttons */}
                            {isCreator ? (
                                <button
                                    onClick={handleEndMeeting}
                                    disabled={isEnding}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {isEnding ? 'Ending...' : 'End Meeting'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeaveMeeting}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors border border-white/5"
                                >
                                    Leave
                                </button>
                            )}
                        </div>
                    </div>
                </main>
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
}

export default LiveMeeting;
