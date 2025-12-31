import supabase from '../config/supabase.js';
import { downloadAudioFile } from './storageService.js';
import { transcribeAudio, generateNotes, extractTasks } from './groqService.js';

/**
 * Process live meeting after it ends
 * Transcribes audio, generates notes, extracts tasks using Groq
 * @param {Object} liveMeeting - Live meeting object with recording_url
 */
export const processLiveMeetingAsync = async (liveMeeting) => {
    try {
        const meetingId = liveMeeting.meeting_id;
        const meeting = liveMeeting.meetings || await getMeeting(meetingId);

        console.log(`Processing live meeting ${liveMeeting.id} (meeting ${meetingId})...`);

        if (!liveMeeting.recording_url) {
            throw new Error('No recording available');
        }

        // Download recording from storage
        console.log('Downloading recording...');
        const audioBuffer = await downloadAudioFile(liveMeeting.recording_url);

        // Transcribe audio using Groq Whisper
        console.log('Transcribing audio with Groq Whisper...');
        const transcript = await transcribeAudio(audioBuffer, 'live-meeting.webm');

        // Generate notes using Groq
        console.log('Generating meeting notes with Groq...');
        const notes = await generateNotes(transcript, meeting.title);

        // Get participants for task extraction
        const { data: participants } = await supabase
            .from('meeting_participants')
            .select('user_id')
            .eq('meeting_id', meetingId);

        const { data: { users } } = await supabase.auth.admin.listUsers();
        const participantDetails = participants.map(p => {
            const user = users.find(u => u.id === p.user_id);
            return {
                id: p.user_id,
                name: user?.user_metadata?.full_name || user?.email || 'Unknown'
            };
        });

        // Extract tasks using Groq
        console.log('Extracting tasks with Groq...');
        const extractedTasks = await extractTasks(transcript, participantDetails);

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
                transcript: transcript,
                notes: notes,
                processed: true
            })
            .eq('id', meetingId);

        console.log(`Live meeting ${liveMeeting.id} processed successfully with Groq`);
    } catch (error) {
        console.error('Live meeting processing error:', error);

        // Mark as processed with error
        await supabase
            .from('meetings')
            .update({
                processed: true,
                notes: `Error during processing: ${error.message}`
            })
            .eq('id', liveMeeting.meeting_id);
    }
};

/**
 * Helper to get meeting details
 */
const getMeeting = async (meetingId) => {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

    if (error) {
        throw new Error(`Failed to get meeting: ${error.message}`);
    }

    return data;
};

export default {
    processLiveMeetingAsync
};
