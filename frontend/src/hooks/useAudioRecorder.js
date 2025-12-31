import { useRef, useState } from 'react';

/**
 * Custom hook for recording audio during live meeting
 * Uses MediaRecorder API for browser-based recording
 * @returns {Object} - Recording controls and state
 */
export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    /**
     * Start recording with the given audio stream
     * @param {MediaStream} stream - The audio stream to record
     */
    const startRecording = (stream) => {
        try {
            // Create MediaRecorder with WebM format
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                setIsRecording(false);
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            console.log('Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    /**
     * Stop recording
     */
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            console.log('Recording stopped');
        }
    };

    /**
     * Reset recorded blob
     */
    const resetRecording = () => {
        setRecordedBlob(null);
        chunksRef.current = [];
    };

    return {
        isRecording,
        recordedBlob,
        startRecording,
        stopRecording,
        resetRecording
    };
};
