import express from 'express';
import multer from 'multer';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { uploadAudioFile, downloadAudioFile } from '../services/storageService.js';
import { transcribeAudio, generateNotes, extractTasks, extractGroupTasks } from '../services/groqService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'temp/',
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/mp4'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP3, WAV, and M4A files are allowed'));
        }
    }
});

/**
 * POST /api/meetings
 * Create a new meeting
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, participantIds } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Create meeting in database
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .insert({
                title,
                description: description || '',
                created_by: userId,
                processed: false,
                type: req.body.type || 'standard'
            })
            .select()
            .single();

        if (meetingError) {
            return res.status(500).json({ error: meetingError.message });
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

        res.status(201).json({ meeting });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

/**
 * GET /api/meetings
 * Get all meetings for current user
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get meetings where user is the creator
        const { data: createdMeetings, error: createdError } = await supabase
            .from('meetings')
            .select(`
        *,
        meeting_participants (
          user_id
        )
      `)
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (createdError) {
            return res.status(500).json({ error: createdError.message });
        }

        // Get meetings where user is a participant
        const { data: participantMeetings, error: participantError } = await supabase
            .from('meeting_participants')
            .select(`
        meeting_id,
        meetings (
          *,
          meeting_participants (
            user_id
          )
        )
      `)
            .eq('user_id', userId);

        if (participantError) {
            return res.status(500).json({ error: participantError.message });
        }

        // Extract meetings from participant results
        const participantMeetingsData = participantMeetings
            .filter(p => p.meetings)
            .map(p => p.meetings);

        // Merge and deduplicate meetings
        const allMeetings = [...(createdMeetings || [])];
        participantMeetingsData.forEach(meeting => {
            if (!allMeetings.find(m => m.id === meeting.id)) {
                allMeetings.push(meeting);
            }
        });

        // Sort by created_at descending
        allMeetings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ meetings: allMeetings });
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

/**
 * GET /api/meetings/:id
 * Get meeting details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Get meeting with participants and tasks
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select(`
        *,
        meeting_participants (
          id,
          user_id,
          audio_file_url
        )
      `)
            .eq('id', id)
            .single();

        if (meetingError) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Enrich participants with user data
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

        // Get tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('meeting_id', id);

        // Enrich tasks with user data
        let enrichedTasks = tasks || [];
        if (enrichedTasks.length > 0) {
            const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

            if (!usersError && users) {
                enrichedTasks = enrichedTasks.map(task => {
                    if (task.assignee_id) {
                        const user = users.find(u => u.id === task.assignee_id);
                        return {
                            ...task,
                            assignee_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
                            assignee_email: user?.email || ''
                        };
                    }
                    return task;
                });
            }
        }

        res.json({ meeting, tasks: enrichedTasks });
    } catch (error) {
        console.error('Get meeting error:', error);
        res.status(500).json({ error: 'Failed to fetch meeting' });
    }
});

/**
 * POST /api/meetings/:id/upload
 * Upload audio files for participants
 */
router.post('/:id/upload', authMiddleware, upload.array('audioFiles', 10), async (req, res) => {
    try {
        const { id: meetingId } = req.params;
        const files = req.files;
        const participantIds = JSON.parse(req.body.participantIds || '[]');

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No audio files provided' });
        }

        // Verify meeting exists
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('id, type')
            .eq('id', meetingId)
            .single();

        if (meetingError) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (meeting.type === 'group') {
            if (files.length !== 1) {
                return res.status(400).json({ error: 'Group meetings require exactly one audio file' });
            }

            try {
                // Upload single file for the meeting
                const file = files[0];
                const fileUrl = await uploadAudioFile(file, meetingId, 'group_audio');

                // Update meeting record
                await supabase
                    .from('meetings')
                    .update({ audio_file_url: fileUrl })
                    .eq('id', meetingId);

                return res.json({
                    message: 'Group audio uploaded successfully',
                    fileUrl
                });
            } catch (error) {
                console.error('Group upload failed:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        if (files.length !== participantIds.length) {
            return res.status(400).json({ error: 'Number of files must match number of participants' });
        }

        // Upload files and update participants
        const uploadPromises = files.map(async (file, index) => {
            const participantId = participantIds[index];

            try {
                // Upload to Supabase Storage
                const fileUrl = await uploadAudioFile(file, meetingId, participantId);

                // Update participant record
                await supabase
                    .from('meeting_participants')
                    .update({ audio_file_url: fileUrl })
                    .eq('meeting_id', meetingId)
                    .eq('user_id', participantId);

                return { participantId, fileUrl, success: true };
            } catch (error) {
                console.error(`Upload failed for participant ${participantId}:`, error);
                return { participantId, success: false, error: error.message };
            }
        });

        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(r => r.success).length;

        res.json({
            message: `Uploaded ${successCount} of ${files.length} files`,
            results
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload files' });
    }
});

/**
 * POST /api/meetings/:id/process
 * Process meeting: transcribe audio, generate notes and tasks
 */
router.post('/:id/process', authMiddleware, async (req, res) => {
    try {
        const { id: meetingId } = req.params;

        // Get meeting with participants
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select(`
        *,
        meeting_participants (
          id,
          user_id,
          audio_file_url
        )
      `)
            .eq('id', meetingId)
            .single();

        if (meetingError) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Extract participants early for use in processing
        const participants = meeting.meeting_participants || [];

        // Check if audio files are uploaded
        if (meeting.type === 'group') {
            if (!meeting.audio_file_url) {
                return res.status(400).json({ error: 'No group audio file uploaded' });
            }
        } else {
            const audioFiles = participants.filter(p => p.audio_file_url);

            if (audioFiles.length === 0) {
                return res.status(400).json({ error: 'No audio files uploaded' });
            }
        }

        // Start processing (this will be async)
        console.log(`Starting async processing for meeting ${meetingId} (Type: ${meeting.type || 'standard'})`);
        console.log(`Meeting has ${participants.length} participants`);
        res.json({ message: 'Processing started', meetingId });

        // Process asynchronously
        processMetingAsync(meetingId, meeting, participants).catch(error => {
            console.error('Background processing error:', error);
        });

    } catch (error) {
        console.error('Process meeting error:', error);
        res.status(500).json({ error: 'Failed to start processing' });
    }
});

/**
 * Async function to process meeting
 */
async function processMetingAsync(meetingId, meeting, participants) {
    try {
        console.log(`Processing meeting ${meetingId} (Type: ${meeting.type || 'standard'})...`);
        let fullTranscript = '';

        if (meeting.type === 'group') {
            // Group meeting processing
            if (!meeting.audio_file_url) {
                throw new Error('No audio file found for group meeting');
            }

            console.log('Transcribing group audio...');
            const audioBuffer = await downloadAudioFile(meeting.audio_file_url);
            const fileName = `group_${meetingId}.mp3`;
            fullTranscript = await transcribeAudio(audioBuffer, fileName);

        } else {
            // Standard meeting processing
            // Transcribe all audio files
            const transcripts = [];
            for (const participant of participants) {
                if (participant.audio_file_url) {
                    try {
                        console.log(`Transcribing audio for participant ${participant.user_id}...`);
                        const audioBuffer = await downloadAudioFile(participant.audio_file_url);
                        const fileName = `participant_${participant.user_id}.mp3`;
                        const transcript = await transcribeAudio(audioBuffer, fileName);
                        transcripts.push({
                            participantId: participant.user_id,
                            transcript
                        });
                    } catch (error) {
                        console.error(`Transcription failed for participant ${participant.user_id}:`, error);
                    }
                }
            }

            if (transcripts.length === 0) {
                throw new Error('No transcripts generated');
            }

            // Combine transcripts
            fullTranscript = transcripts.map(t => t.transcript).join('\n\n');
        }

        // Generate notes
        console.log('Generating meeting notes...');
        const notes = await generateNotes(fullTranscript, meeting.title);

        // Get participant details for task extraction
        const { data: users } = await supabase.auth.admin.listUsers();
        const participantDetails = participants.map(p => {
            const user = users.users.find(u => u.id === p.user_id);
            return {
                id: p.user_id,
                name: user?.user_metadata?.full_name || user?.email || 'Unknown'
            };
        });

        // Extract tasks
        console.log('Extracting tasks...');
        let extractedTasks = [];
        if (meeting.type === 'group') {
            extractedTasks = await extractGroupTasks(fullTranscript, participantDetails);
        } else {
            extractedTasks = await extractTasks(fullTranscript, participantDetails);
        }

        // Save tasks to database
        if (extractedTasks.length > 0) {
            const tasksToInsert = extractedTasks.map(task => ({
                meeting_id: meetingId,
                title: task.title,
                assignee_id: task.assigneeId
            }));

            await supabase.from('tasks').insert(tasksToInsert);
        }

        // Update meeting with transcript and notes
        await supabase
            .from('meetings')
            .update({
                transcript: fullTranscript,
                notes: notes,
                processed: true
            })
            .eq('id', meetingId);

        console.log(`Meeting ${meetingId} processed successfully`);
    } catch (error) {
        console.error('Processing error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            meetingId,
            meetingType: meeting.type
        });

        // Mark meeting as processed with error
        await supabase
            .from('meetings')
            .update({
                processed: true,
                notes: `Error during processing: ${error.message}`
            })
            .eq('id', meetingId);
    }
}

/**
 * GET /api/meetings/:id/status
 * Get processing status
 */
router.get('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: meeting, error } = await supabase
            .from('meetings')
            .select('processed, notes, transcript')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json({
            processed: meeting.processed,
            hasTranscript: !!meeting.transcript,
            hasNotes: !!meeting.notes
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

/**
 * DELETE /api/meetings/:id
 * Delete a meeting
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if meeting exists and user is the creator
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('id, created_by')
            .eq('id', id)
            .single();

        if (meetingError || !meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Only the creator can delete the meeting
        if (meeting.created_by !== userId) {
            return res.status(403).json({ error: 'You do not have permission to delete this meeting' });
        }

        // Delete associated tasks first (due to foreign key constraints)
        await supabase
            .from('tasks')
            .delete()
            .eq('meeting_id', id);

        // Delete community chat messages
        await supabase
            .from('community_chat')
            .delete()
            .eq('meeting_id', id);

        // Delete chat history
        await supabase
            .from('chat_history')
            .delete()
            .eq('meeting_id', id);

        // Delete meeting participants
        await supabase
            .from('meeting_participants')
            .delete()
            .eq('meeting_id', id);

        // Delete the meeting itself
        const { error: deleteError } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({ error: 'Failed to delete meeting' });
        }

        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Delete meeting error:', error);
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
});

export default router;
