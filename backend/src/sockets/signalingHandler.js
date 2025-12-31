/**
 * WebRTC Signaling Handler using Socket.io
 * Manages peer-to-peer connection setup for live meetings
 */

const rooms = new Map(); // roomId -> Set of socket IDs

export const setupSignalingHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a live meeting room
        socket.on('join-room', ({ roomId, userId, userName }) => {
            console.log(`User ${userName} (${userId}) joining room ${roomId}`);

            socket.join(roomId);
            socket.userId = userId;
            socket.userName = userName;
            socket.roomId = roomId;

            // Track room participants
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            rooms.get(roomId).add(socket.id);

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                userId,
                userName,
                socketId: socket.id
            });

            // Send current participants to the new user
            const participants = Array.from(rooms.get(roomId))
                .filter(id => id !== socket.id)
                .map(id => {
                    const participant = io.sockets.sockets.get(id);
                    return {
                        userId: participant?.userId,
                        userName: participant?.userName,
                        socketId: id
                    };
                })
                .filter(p => p.userId);

            socket.emit('room-participants', participants);

            console.log(`Room ${roomId} now has ${rooms.get(roomId).size} participants`);
        });

        // WebRTC offer
        socket.on('offer', ({ offer, to }) => {
            console.log(`Forwarding offer from ${socket.id} to ${to}`);
            io.to(to).emit('offer', {
                offer,
                from: socket.id,
                userId: socket.userId,
                userName: socket.userName
            });
        });

        // WebRTC answer
        socket.on('answer', ({ answer, to }) => {
            console.log(`Forwarding answer from ${socket.id} to ${to}`);
            io.to(to).emit('answer', {
                answer,
                from: socket.id
            });
        });

        // ICE candidate
        socket.on('ice-candidate', ({ candidate, to }) => {
            io.to(to).emit('ice-candidate', {
                candidate,
                from: socket.id
            });
        });

        // Mute/unmute events
        socket.on('mute', () => {
            if (socket.roomId) {
                socket.to(socket.roomId).emit('user-muted', {
                    userId: socket.userId,
                    socketId: socket.id
                });
            }
        });

        socket.on('unmute', () => {
            if (socket.roomId) {
                socket.to(socket.roomId).emit('user-unmuted', {
                    userId: socket.userId,
                    socketId: socket.id
                });
            }
        });

        // Speaking indicator
        socket.on('speaking', ({ isSpeaking }) => {
            if (socket.roomId) {
                socket.to(socket.roomId).emit('user-speaking', {
                    userId: socket.userId,
                    socketId: socket.id,
                    isSpeaking
                });
            }
        });

        // Leave room
        socket.on('leave-room', () => {
            handleUserLeave(socket);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            handleUserLeave(socket);
        });
    });

    // Helper function to handle user leaving
    const handleUserLeave = (socket) => {
        if (socket.roomId) {
            const roomId = socket.roomId;

            // Remove from room tracking
            if (rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id);

                // Clean up empty rooms
                if (rooms.get(roomId).size === 0) {
                    rooms.delete(roomId);
                }
            }

            // Notify others
            socket.to(roomId).emit('user-left', {
                userId: socket.userId,
                socketId: socket.id
            });

            socket.leave(roomId);
            console.log(`User ${socket.userId} left room ${roomId}`);
        }
    };
};
