import { Rnnoise } from '@shiguredo/rnnoise-wasm';

const DEFAULT_OPTIONS = {
    highPassHz: 90,
    gateThreshold: 0.008,
    gateAttackMs: 6,
    gateReleaseMs: 100,
};

let rnnoiseLoadPromise = null;

function loadRnnoise() {
    if (!rnnoiseLoadPromise) {
        rnnoiseLoadPromise = Rnnoise.load();
    }
    return rnnoiseLoadPromise;
}

/** Ring buffer for denoised samples between RNNoise frames and ScriptProcessor output. */
class SampleQueue {
    constructor() {
        this.chunks = [];
        this.totalLength = 0;
    }

    push(samples) {
        this.chunks.push(samples);
        this.totalLength += samples.length;
    }

    pull(count) {
        const out = new Float32Array(count);
        let written = 0;

        while (written < count && this.chunks.length > 0) {
            const chunk = this.chunks[0];
            const take = Math.min(count - written, chunk.length);
            out.set(chunk.subarray(0, take), written);
            written += take;

            if (take === chunk.length) {
                this.chunks.shift();
            } else {
                this.chunks[0] = chunk.subarray(take);
            }
        }

        this.totalLength -= written;
        return out;
    }
}

/**
 * @param {MediaStream} inputStream
 * @param {Partial<typeof DEFAULT_OPTIONS>} options
 * @returns {Promise<{ stream: MediaStream, cleanup: () => void }>}
 */
export async function enhanceAudioStream(inputStream, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const rnnoise = await loadRnnoise();
    const denoiseState = rnnoise.createDenoiseState();
    const frameSize = rnnoise.frameSize;

    const audioContext = new AudioContext({ sampleRate: 48000 });
    const source = audioContext.createMediaStreamSource(inputStream);
    const destination = audioContext.createMediaStreamDestination();

    const highPass = audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = opts.highPassHz;
    highPass.Q.value = 0.7;

    const bufferSize = 2048;
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    let pendingIn = new Float32Array(0);
    const denoisedOut = new SampleQueue();

    processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        const merged = new Float32Array(pendingIn.length + input.length);
        merged.set(pendingIn);
        merged.set(input, pendingIn.length);

        let offset = 0;
        while (offset + frameSize <= merged.length) {
            const frameCopy = merged.slice(offset, offset + frameSize);
            denoiseState.processFrame(frameCopy);
            denoisedOut.push(frameCopy);
            offset += frameSize;
        }

        pendingIn = offset < merged.length ? merged.slice(offset) : new Float32Array(0);

        const pulled = denoisedOut.pull(output.length);
        output.set(pulled);
    };

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 10;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    const gateGain = audioContext.createGain();
    gateGain.gain.value = 1;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;

    source.connect(highPass);
    highPass.connect(processor);
    processor.connect(compressor);
    compressor.connect(gateGain);
    gateGain.connect(analyser);
    analyser.connect(destination);

    const data = new Float32Array(analyser.fftSize);
    let gateOpen = true;
    let rafId = null;

    const updateGate = () => {
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);
        const now = audioContext.currentTime;
        const attackSec = opts.gateAttackMs / 1000;
        const releaseSec = opts.gateReleaseMs / 1000;

        if (rms < opts.gateThreshold) {
            if (gateOpen) {
                gateGain.gain.setTargetAtTime(0, now, releaseSec);
                gateOpen = false;
            }
        } else if (!gateOpen) {
            gateGain.gain.setTargetAtTime(1, now, attackSec);
            gateOpen = true;
        }

        rafId = requestAnimationFrame(updateGate);
    };

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    rafId = requestAnimationFrame(updateGate);

    const cleanup = () => {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        processor.onaudioprocess = null;
        try {
            source.disconnect();
            highPass.disconnect();
            processor.disconnect();
            compressor.disconnect();
            gateGain.disconnect();
            analyser.disconnect();
        } catch {
            /* already disconnected */
        }
        denoiseState.destroy();
        audioContext.close().catch(() => {});
    };

    return { stream: destination.stream, cleanup, audioContext };
}

/** Stronger getUserMedia constraints for voice (browser + Chrome extras). */
export function getVoiceCaptureConstraints() {
    return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        sampleSize: { ideal: 16 },
        latency: { ideal: 0.01 },
        googEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppression: true,
        googHighpassFilter: true,
        voiceIsolation: true,
    };
}
