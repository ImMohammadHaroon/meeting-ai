import { useEffect, useRef, useCallback } from 'react';
import { MeetingAudioMixer } from '../utils/meetingAudioMixer';
import { useAudioRecorder } from './useAudioRecorder';

const LOCAL_STREAM_ID = 'local';

/**
 * Records a single mixed audio file (local mic + all remote participants) for the meeting host.
 * @param {{ enabled: boolean, localStream: MediaStream | null, peers: Map<string, { stream?: MediaStream }> }} options
 */
export const useMeetingRecording = ({ enabled, localStream, peers }) => {
    const mixerRef = useRef(null);
    const peerIdsRef = useRef(new Set());
    const mixerReadyRef = useRef(false);

    const {
        isRecording,
        recordedBlob,
        startRecording,
        stopRecording,
        resetRecording
    } = useAudioRecorder();

    const tryStartRecorder = useCallback(() => {
        const mixer = mixerRef.current;
        if (!mixer || isRecording) return;

        const mixedStream = mixer.getMixedStream();
        if (mixedStream.getAudioTracks().length > 0) {
            startRecording(mixedStream);
        }
    }, [isRecording, startRecording]);

    const syncPeerStreams = useCallback((peerMap) => {
        const mixer = mixerRef.current;
        if (!mixer) return;

        const nextIds = new Set();

        peerMap.forEach((peer, socketId) => {
            if (peer.stream?.getAudioTracks().some((t) => t.readyState !== 'ended')) {
                const id = `peer-${socketId}`;
                nextIds.add(id);
                mixer.addStream(id, peer.stream);
            }
        });

        peerIdsRef.current.forEach((id) => {
            if (!nextIds.has(id)) {
                mixer.removeStream(id);
            }
        });

        peerIdsRef.current = nextIds;
        tryStartRecorder();
    }, [tryStartRecorder]);

    // Initialize mixer when meeting goes live (host only)
    useEffect(() => {
        if (!enabled) {
            mixerReadyRef.current = false;
            return;
        }

        if (mixerReadyRef.current) return;

        const mixer = new MeetingAudioMixer();
        mixerRef.current = mixer;
        mixerReadyRef.current = true;

        const init = async () => {
            try {
                await mixer.resume();
                if (localStream) {
                    mixer.addStream(LOCAL_STREAM_ID, localStream);
                }
                syncPeerStreams(peers);
                tryStartRecorder();
            } catch (err) {
                console.error('Failed to start mixed meeting recording:', err);
                mixerReadyRef.current = false;
                mixer.dispose();
                mixerRef.current = null;
            }
        };

        init();
    }, [enabled, localStream, syncPeerStreams, peers, tryStartRecorder]);

    // Sync local stream when it becomes available after mixer init
    useEffect(() => {
        if (!enabled || !mixerRef.current || !localStream) return;
        mixerRef.current.addStream(LOCAL_STREAM_ID, localStream);
        tryStartRecorder();
    }, [enabled, localStream, tryStartRecorder]);

    // Add/remove remote participants in the active mix
    useEffect(() => {
        if (!enabled || !mixerRef.current) return;
        syncPeerStreams(peers);
    }, [enabled, peers, syncPeerStreams]);

    const finalizeRecording = useCallback(async () => {
        let blob = recordedBlob;
        if (isRecording) {
            blob = await stopRecording();
        }

        if (mixerRef.current) {
            mixerRef.current.dispose();
            mixerRef.current = null;
        }

        peerIdsRef.current.clear();
        mixerReadyRef.current = false;

        return blob;
    }, [isRecording, recordedBlob, stopRecording]);

    const disposeWithoutSave = useCallback(() => {
        if (mixerRef.current) {
            mixerRef.current.dispose();
            mixerRef.current = null;
        }
        peerIdsRef.current.clear();
        mixerReadyRef.current = false;
        resetRecording();
    }, [resetRecording]);

    return {
        isRecording,
        recordedBlob,
        finalizeRecording,
        disposeWithoutSave
    };
};
