import supabase from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload audio file to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {string} meetingId - Meeting ID for organizing files
 * @param {string} participantId - Participant ID
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export const uploadAudioFile = async (file, meetingId, participantId) => {
    try {
        const fileName = `${meetingId}/${participantId}_${Date.now()}_${file.originalname}`;
        const fileBuffer = fs.readFileSync(file.path);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('meeting-audio')
            .upload(fileName, fileBuffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('meeting-audio')
            .getPublicUrl(fileName);

        // Clean up temp file
        fs.unlinkSync(file.path);

        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up temp file on error
        if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw error;
    }
};

/**
 * Download audio file from Supabase Storage
 * @param {string} fileUrl - Public URL of the file
 * @returns {Promise<Buffer>} - File buffer
 */
export const downloadAudioFile = async (fileUrl) => {
    try {
        // Extract file path from URL
        const urlParts = fileUrl.split('/meeting-audio/');
        if (urlParts.length < 2) {
            throw new Error('Invalid file URL');
        }

        const filePath = urlParts[1];

        // Download from Supabase Storage
        const { data, error } = await supabase.storage
            .from('meeting-audio')
            .download(filePath);

        if (error) {
            throw new Error(`Download failed: ${error.message}`);
        }

        // Convert blob to buffer
        const buffer = Buffer.from(await data.arrayBuffer());
        return buffer;
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

export default {
    uploadAudioFile,
    downloadAudioFile
};
