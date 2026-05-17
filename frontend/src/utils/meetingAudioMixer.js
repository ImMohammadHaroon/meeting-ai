/**
 * Mixes multiple MediaStreams (local + remote WebRTC) into one stream for MediaRecorder.
 */
export class MeetingAudioMixer {
    constructor() {
        this.audioContext = new AudioContext();
        this.destination = this.audioContext.createMediaStreamDestination();
        /** @type {Map<string, { source: MediaStreamAudioSourceNode, stream: MediaStream }>} */
        this.sources = new Map();
    }

    async resume() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * @param {string} id
     * @param {MediaStream} mediaStream
     */
    addStream(id, mediaStream) {
        if (!mediaStream) return;

        const audioTracks = mediaStream.getAudioTracks().filter((t) => t.readyState !== 'ended');
        if (audioTracks.length === 0) return;

        this.removeStream(id);

        const audioOnly = new MediaStream(audioTracks);
        const source = this.audioContext.createMediaStreamSource(audioOnly);
        source.connect(this.destination);
        this.sources.set(id, { source, stream: mediaStream });

        audioTracks.forEach((track) => {
            track.onended = () => {
                if (this.sources.has(id)) {
                    this.removeStream(id);
                }
            };
        });
    }

    /**
     * @param {string} id
     */
    removeStream(id) {
        const entry = this.sources.get(id);
        if (!entry) return;
        try {
            entry.source.disconnect();
        } catch {
            // already disconnected
        }
        this.sources.delete(id);
    }

    getMixedStream() {
        return this.destination.stream;
    }

    dispose() {
        this.sources.forEach((_, id) => this.removeStream(id));
        this.sources.clear();
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(() => {});
        }
    }
}
