import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import meetingsRoutes from './routes/meetings.js';
import chatRoutes from './routes/chat.js';
import communityChatRoutes from './routes/chat_community.js';
import liveMeetingsRoutes from './routes/liveMeetings.js';
import { setupSignalingHandlers } from './sockets/signalingHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/meetings', chatRoutes);
app.use('/api/community-chat', communityChatRoutes);
app.use('/api/live-meetings', liveMeetingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Setup Socket.io signaling handlers
setupSignalingHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.io server ready for WebRTC signaling`);
});

export default app;


