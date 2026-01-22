import express from 'express';
import { nanoid } from 'nanoid';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { uploadAudioFile } from '../services/storageService.js';
import { processLiveMeetingAsync } from '../services/processLiveMeeting.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for recording uploads
const upload = multer({
    dest: 'temp/',
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB for live recordings
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/ogg'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(webm|mp3|wav|mp4|ogg)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed'));
        }
    }
});

/**
 * POST /api/live-meetings/create
 * Create a new live meeting
 */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, description, participantIds } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Create base meeting record
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .insert({
                title,
                description: description || '',
                created_by: userId,
                processed: false
            })
            .select()
            .single();

        if (meetingError) {
            return res.status(500).json({ error: meetingError.message });
        }

        // Generate unique room ID
        const roomId = nanoid(12);

        // Create live meeting record
        const { data: liveMeeting, error: liveMeetingError } = await supabase
            .from('live_meetings')
            .insert({
                meeting_id: meeting.id,
                room_id: roomId,
                status: 'scheduled'
            })
            .select()
            .single();

        if (liveMeetingError) {
            // Rollback meeting creation
            await supabase.from('meetings').delete().eq('id', meeting.id);
            return res.status(500).json({ error: liveMeetingError.message });
        }

        // Add participants
        if (participantIds && participantIds.length > 0) {
            const participants = participantIds.map(participantId => ({
                meeting_id: meeting.id,
                user_id: participantId
            }));

            const { error: participantsError } = await supabase
                .from('meeting_participants')
                .insert(participants);

            if (participantsError) {
                console.error('Error adding participants:', participantsError);
            }
        }

        // Generate join URL
        const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/live-meeting/${liveMeeting.id}`;

        res.status(201).json({
            meeting,
            liveMeeting,
            joinUrl,
            roomId
        });
    } catch (error) {
        console.error('Create live meeting error:', error);
        res.status(500).json({ error: 'Failed to create live meeting' });
    }
});

/**
 * GET /api/live-meetings/:id
 * Get live meeting details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Get live meeting with base meeting data
        const { data: liveMeeting, error: liveMeetingError } = await supabase
            .from('live_meetings')
            .select(`
                *,
                meetings (
                    *,
                    meeting_participants (
                        id,
                        user_id
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (liveMeetingError) {
            return res.status(404).json({ error: 'Live meeting not found' });
        }

        // Enrich participants with user data
        const meeting = liveMeeting.meetings;
        if (meeting.meeting_participants && meeting.meeting_participants.length > 0) {
            const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

            if (!usersError && users) {
                meeting.meeting_participants = meeting.meeting_participants.map(participant => {
                    const user = users.find(u => u.id === participant.user_id);
                    return {
                        ...participant,
                        user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
                        user_email: user?.email || ''
                    };
                });
            }
        }

        res.json({ liveMeeting, meeting });
    } catch (error) {
        console.error('Get live meeting error:', error);
        res.status(500).json({ error: 'Failed to fetch live meeting' });
    }
});

/**
 * POST /api/live-meetings/:id/start
 * Start a live meeting
 */
router.post('/:id/start', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get live meeting
        const { data: liveMeeting, error } = await supabase
            .from('live_meetings')
            .select('*, meetings(*)')
            .eq('id', id)
            .single();

        if (error || !liveMeeting) {
            return res.status(404).json({ error: 'Live meeting not found' });
        }

        // Verify user is the creator
        if (liveMeeting.meetings.created_by !== userId) {
            return res.status(403).json({ error: 'Only the meeting creator can start the meeting' });
        }

        // Update status to live
        const { error: updateError } = await supabase
            .from('live_meetings')
            .update({
                status: 'live',
                started_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            return res.status(500).json({ error: 'Failed to start meeting' });
        }

        // Create AI bot participant (optional - visible in participant list)
        const botEmail = process.env.AI_BOT_EMAIL || 'ai-bot@meetai.internal';
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const botUser = users.find(u => u.email === botEmail);

        if (botUser) {
            // Add bot as live participant
            await supabase
                .from('live_participants')
                .insert({
                    live_meeting_id: id,
                    user_id: botUser.id,
                    is_bot: true,
                    is_connected: true
                })
                .onConflict('live_meeting_id,user_id')
                .ignore();
        }

        res.json({ message: 'Meeting started', status: 'live' });
    } catch (error) {
        console.error('Start meeting error:', error);
        res.status(500).json({ error: 'Failed to start meeting' });
    }
});

/**
 * POST /api/live-meetings/:id/end
 * End a live meeting and trigger processing
 */
router.post('/:id/end', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get live meeting
        const { data: liveMeeting, error } = await supabase
            .from('live_meetings')
            .select('*, meetings(*)')
            .eq('id', id)
            .single();

        if (error || !liveMeeting) {
            return res.status(404).json({ error: 'Live meeting not found' });
        }

        // Verify user is the creator
        if (liveMeeting.meetings.created_by !== userId) {
            return res.status(403).json({ error: 'Only the meeting creator can end the meeting' });
        }

        // Update status to ended
        const { error: updateError } = await supabase
            .from('live_meetings')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            return res.status(500).json({ error: 'Failed to end meeting' });
        }

        // Mark all participants as disconnected
        await supabase
            .from('live_participants')
            .update({ is_connected: false, left_at: new Date().toISOString() })
            .eq('live_meeting_id', id);

        res.json({ message: 'Meeting ended', status: 'ended' });

        // Trigger processing asynchronously (if recording exists)
        if (liveMeeting.recording_url) {
            processLiveMeetingAsync(liveMeeting).catch(err => {
                console.error('Background processing error:', err);
            });
        }
    } catch (error) {
        console.error('End meeting error:', error);
        res.status(500).json({ error: 'Failed to end meeting' });
    }
});

/**
 * POST /api/live-meetings/:id/upload-recording
 * Upload meeting recording
 */
router.post('/:id/upload-recording', authMiddleware, upload.single('recording'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No recording file provided' });
        }

        // Get live meeting
        const { data: liveMeeting, error } = await supabase
            .from('live_meetings')
            .select('*, meetings(*)')
            .eq('id', id)
            .single();

        if (error || !liveMeeting) {
            return res.status(404).json({ error: 'Live meeting not found' });
        }

        // Upload to Supabase Storage
        const fileUrl = await uploadAudioFile(file, liveMeeting.meetings.id, 'live-recording');

        // Save recording URL to live_meetings
        await supabase
            .from('live_meetings')
            .update({ recording_url: fileUrl })
            .eq('id', id);

        // Save to meeting_recordings table
        await supabase
            .from('meeting_recordings')
            .insert({
                live_meeting_id: id,
                file_url: fileUrl,
                file_size: file.size
            });

        res.json({ message: 'Recording uploaded', fileUrl });

        // Trigger processing if meeting has ended
        if (liveMeeting.status === 'ended') {
            const updatedLiveMeeting = { ...liveMeeting, recording_url: fileUrl };
            processLiveMeetingAsync(updatedLiveMeeting).catch(err => {
                console.error('Background processing error:', err);
            });
        }
    } catch (error) {
        console.error('Upload recording error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload recording' });
    }
});

/**
 * POST /api/live-meetings/:id/join
 * Record when a user joins
 */
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Record participant join
        const { error } = await supabase
            .from('live_participants')
            .insert({
                live_meeting_id: id,
                user_id: userId,
                is_connected: true
            })
            .onConflict('live_meeting_id,user_id')
            .merge(['is_connected', 'joined_at']);

        if (error) {
            console.error('Join error:', error);
        }

        res.json({ message: 'Joined meeting' });
    } catch (error) {
        console.error('Join meeting error:', error);
        res.status(500).json({ error: 'Failed to join meeting' });
    }
});

/**
 * POST /api/live-meetings/:id/leave
 * Record when a user leaves
 */
router.post('/:id/leave', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Update participant status
        await supabase
            .from('live_participants')
            .update({
                is_connected: false,
                left_at: new Date().toISOString()
            })
            .eq('live_meeting_id', id)
            .eq('user_id', userId);

        res.json({ message: 'Left meeting' });
    } catch (error) {
        console.error('Leave meeting error:', error);
        res.status(500).json({ error: 'Failed to leave meeting' });
    }
});

export default router;
