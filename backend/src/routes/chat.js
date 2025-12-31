import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { chatWithContext } from '../services/groqService.js';

const router = express.Router();

/**
 * POST /api/meetings/:id/chat
 * Send message to meeting chatbot
 */
router.post('/:id/chat', authMiddleware, async (req, res) => {
    try {
        const { id: meetingId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get meeting context
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('transcript, notes, processed')
            .eq('id', meetingId)
            .single();

        if (meetingError) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (!meeting.processed) {
            return res.status(400).json({
                error: 'Meeting not yet processed. Please wait for the meeting to be processed before using the chat feature.'
            });
        }

        if (!meeting.transcript || !meeting.notes) {
            return res.status(400).json({
                error: 'Meeting processing incomplete. Transcript or notes are missing.'
            });
        }

        // Get tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('meeting_id', meetingId);

        // Get chat history
        const { data: chatHistory } = await supabase
            .from('chat_messages')
            .select('message, response')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        // Generate response
        const context = {
            transcript: meeting.transcript,
            notes: meeting.notes,
            tasks: tasks || []
        };

        const response = await chatWithContext(message, context, chatHistory || []);

        // Save chat message
        await supabase
            .from('chat_messages')
            .insert({
                meeting_id: meetingId,
                user_id: userId,
                message,
                response
            });

        res.json({ response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

/**
 * GET /api/meetings/:id/chat/history
 * Get chat history for a meeting
 */
router.get('/:id/chat/history', authMiddleware, async (req, res) => {
    try {
        const { id: meetingId } = req.params;

        const { data: chatHistory, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ chatHistory: chatHistory || [] });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

export default router;
