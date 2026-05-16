import { useRef, useState } from 'react';

const PREFERRED_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg'
];

const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

/**
 * Custom hook for recording audio during live meeting
 * Uses MediaRecorder API for browser-based recording
 */
export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const stopResolveRef = useRef(null);

    const startRecording = (stream) => {
        try {
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            const blobType = mimeType || 'audio/webm';

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = chunksRef.current.length > 0
                    ? new Blob(chunksRef.current, { type: blobType })
                    : null;
                setRecordedBlob(blob);
                setIsRecording(false);
                if (stopResolveRef.current) {
                    stopResolveRef.current(blob);
                    stopResolveRef.current = null;
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setIsRecording(false);
                if (stopResolveRef.current) {
                    stopResolveRef.current(null);
                    stopResolveRef.current = null;
                }
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            console.log('Recording started', mimeType || '(browser default)');
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    /**
     * Stop recording and resolve with the final blob when MediaRecorder finishes.
     * @returns {Promise<Blob|null>}
     */
    const stopRecording = () => {
        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
                const mimeType = getSupportedMimeType() || 'audio/webm';
                const existing = chunksRef.current.length > 0
                    ? new Blob(chunksRef.current, { type: mimeType })
                    : null;
                resolve(existing);
                return;
            }

            stopResolveRef.current = resolve;
            recorder.stop();
            console.log('Recording stopped');
        });
    };

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
