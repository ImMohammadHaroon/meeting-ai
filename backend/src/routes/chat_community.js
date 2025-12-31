import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/community-chat/:meetingId
 * Get all community messages for a meeting
 */
router.get('/:meetingId', authMiddleware, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.id;

        // Verify user has access to this meeting
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select(`
                id,
                meeting_participants(user_id)
            `)
            .eq('id', meetingId)
            .single();

        if (meetingError || !meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if user is creator or participant
        const { data: meetingData } = await supabase
            .from('meetings')
            .select('created_by')
            .eq('id', meetingId)
            .single();

        const isCreator = meetingData?.created_by === userId;
        const isParticipant = meeting.meeting_participants?.some(p => p.user_id === userId);

        if (!isCreator && !isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch all messages for this meeting
        const { data: messages, error: messagesError } = await supabase
            .from('community_messages')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }

        // Enrich messages with user data
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        let enrichedMessages = messages || [];
        if (!usersError && users) {
            enrichedMessages = enrichedMessages.map(message => {
                const user = users.find(u => u.id === message.user_id);
                return {
                    ...message,
                    user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
                    user_email: user?.email || ''
                };
            });
        }

        res.json({ messages: enrichedMessages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * POST /api/community-chat/:meetingId
 * Send a new message to the community chat
 */
router.post('/:meetingId', authMiddleware, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Verify user has access to this meeting
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select(`
                id,
                created_by,
                meeting_participants(user_id)
            `)
            .eq('id', meetingId)
            .single();

        if (meetingError || !meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if user is creator or participant
        const isCreator = meeting.created_by === userId;
        const isParticipant = meeting.meeting_participants?.some(p => p.user_id === userId);

        if (!isCreator && !isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Insert the message
        const { data: newMessage, error: insertError } = await supabase
            .from('community_messages')
            .insert({
                meeting_id: meetingId,
                user_id: userId,
                message: message.trim()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting message:', insertError);
            return res.status(500).json({ error: 'Failed to send message' });
        }

        // Get user data for the response
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

        const enrichedMessage = {
            ...newMessage,
            user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
            user_email: user?.email || ''
        };

        res.status(201).json({ message: enrichedMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
