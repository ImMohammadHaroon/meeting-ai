import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';


// ICE servers configuration (Google STUN servers)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

/**
 * Custom hook for managing WebRTC connections in a live meeting
 * @param {string} roomId - The meeting room ID
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @returns {Object} - WebRTC state and controls
 */
export const useWebRTC = (roomId, userId, userName) => {
    const [peers, setPeers] = useState(new Map()); // socketId -> { connection, stream, userInfo }
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [speakingUsers, setSpeakingUsers] = useState(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map());

    useEffect(() => {
        if (!roomId || !userId || !userName) return;

        // Initialize socket connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            initializeMedia();
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            const isCorsError = err.message.includes('CORS') || err.message.includes('cors');
            if (isCorsError) {
                console.error('Socket.io CORS Error:', err.message);
            }
            setError('Failed to connect to server');
        });

        // Handle existing participants
        socket.on('room-participants', (participants) => {
            console.log('Existing participants:', participants);
            participants.forEach(participant => {
                createPeerConnection(participant.socketId, participant);
            });
        });

        // Handle new user joining
        socket.on('user-joined', ({ userId: newUserId, userName: newUserName, socketId }) => {
            console.log(`User joined: ${newUserName}`);
            createPeerConnection(socketId, { userId: newUserId, userName: newUserName }, true);
        });

        // Handle user leaving
        socket.on('user-left', ({ socketId }) => {
            console.log(`User left: ${socketId}`);
            closePeerConnection(socketId);
        });

        // Handle WebRTC offer
        socket.on('offer', async ({ offer, from, userId: fromUserId, userName: fromUserName }) => {
            console.log(`Received offer from ${from}`);
            await handleOffer(offer, from, { userId: fromUserId, userName: fromUserName });
        });

        // Handle WebRTC answer
        socket.on('answer', async ({ answer, from }) => {
            console.log(`Received answer from ${from}`);
            const peer = peersRef.current.get(from);
            if (peer) {
                await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // Handle ICE candidate
        socket.on('ice-candidate', async ({ candidate, from }) => {
            const peer = peersRef.current.get(from);
            if (peer && candidate) {
                await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Handle mute/unmute
        socket.on('user-muted', ({ socketId }) => {
            // Update UI to show user is muted (optional)
            console.log(`User ${socketId} muted`);
        });

        socket.on('user-unmuted', ({ socketId }) => {
            console.log(`User ${socketId} unmuted`);
        });

        // Handle speaking indicators
        socket.on('user-speaking', ({ socketId, isSpeaking }) => {
            setSpeakingUsers(prev => {
                const updated = new Set(prev);
                if (isSpeaking) {
                    updated.add(socketId);
                } else {
                    updated.delete(socketId);
                }
                return updated;
            });
        });

        return () => {
            cleanup();
            socket.disconnect();
        };
    }, [roomId, userId, userName]);

    // Initialize local media stream
    const initializeMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });

            localStreamRef.current = stream;
            setLocalStream(stream);

            // Join room after getting media
            socketRef.current.emit('join-room', { roomId, userId, userName });
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Microphone access denied. Please enable microphone permissions.');
        }
    };

    // Create peer connection for a remote user
    const createPeerConnection = async (socketId, userInfo, shouldCreateOffer = false) => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Add local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
            console.log(`Received track from ${socketId}`);
            const [remoteStream] = event.streams;
            updatePeerStream(socketId, remoteStream);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: socketId
                });
            }
        };

        // Store peer connection
        const peerData = { connection: peerConnection, stream: null, userInfo };
        peersRef.current.set(socketId, peerData);
        setPeers(new Map(peersRef.current));

        // Create offer if necessary
        if (shouldCreateOffer) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socketRef.current.emit('offer', { offer, to: socketId });
        }
    };

    // Handle received offer
    const handleOffer = async (offer, from, userInfo) => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Add local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            updatePeerStream(from, remoteStream);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: from
                });
            }
        };

        // Store peer connection
        const peerData = { connection: peerConnection, stream: null, userInfo };
        peersRef.current.set(from, peerData);
        setPeers(new Map(peersRef.current));

        // Create answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketRef.current.emit('answer', { answer, to: from });
    };

    // Update peer stream
    const updatePeerStream = (socketId, stream) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
            peer.stream = stream;
            peersRef.current.set(socketId, peer);
            setPeers(new Map(peersRef.current));
        }
    };

    // Close peer connection
    const closePeerConnection = (socketId) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
            peer.connection.close();
            peersRef.current.delete(socketId);
            setPeers(new Map(peersRef.current));
        }
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                if (audioTrack.enabled) {
                    socketRef.current.emit('unmute');
                } else {
                    socketRef.current.emit('mute');
                }
            }
        }
    };

    // Leave meeting cleanup
    const leaveMeeting = () => {
        cleanup();
        if (socketRef.current) {
            socketRef.current.emit('leave-room');
            socketRef.current.disconnect();
        }
    };

    // Cleanup function
    const cleanup = () => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        peersRef.current.forEach(peer => {
            peer.connection.close();
        });

        peersRef.current.clear();
        setPeers(new Map());
    };

    return {
        peers,
        localStream,
        isMuted,
        toggleMute,
        speakingUsers,
        isConnected,
        error,
        leaveMeeting
    };
};
