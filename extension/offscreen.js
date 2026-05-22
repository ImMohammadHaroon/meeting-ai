/**
 * Offscreen document — captures tab audio using stream ID from the service worker.
 */

let mediaRecorder = null;
let recordedChunks = [];
let mediaStream = null;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startRecording(streamId) {
  recordedChunks = [];

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.start(1000);
}

async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.onstop = async () => {
      try {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const audioBase64 = await blobToBase64(blob);

        mediaStream?.getTracks().forEach((t) => t.stop());
        mediaStream = null;
        mediaRecorder = null;
        recordedChunks = [];

        resolve({ audioBase64, mimeType });
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.stop();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  (async () => {
    try {
      if (message.action === 'START_RECORDING') {
        await startRecording(message.streamId);
        sendResponse({ ok: true });
        return;
      }

      if (message.action === 'STOP_RECORDING') {
        const result = await stopRecording();
        sendResponse({ ok: true, ...result });
        return;
      }
    } catch (err) {
      console.error('[Meeting AI offscreen]', err);
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true;
});
