import {
    transcribeAudio,
    generateNotes,
    extractTasks,
    extractGroupTasks,
    chatWithContext
} from '../src/services/aiService.js';

const SAMPLE_TRANSCRIPT = `
Alice: Good morning everyone. Let's review the Q2 roadmap.
Bob: I'll prepare the design mockups by Friday.
Alice: Great. We also need to finalize the API documentation before the client demo next week.
Bob: I can take the API docs. Alice, can you schedule the client demo?
Alice: Yes, I'll send the calendar invite today.
`;

const PARTICIPANTS = [
    { id: 'user-alice', name: 'Alice' },
    { id: 'user-bob', name: 'Bob' }
];

function createMinimalWavBuffer(durationSeconds = 1, sampleRate = 16000) {
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * 440 * t) * 0.2;
        buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
    }

    return buffer;
}

async function runTest(name, fn) {
    process.stdout.write(`Testing ${name}... `);
    try {
        await fn();
        console.log('OK');
        return true;
    } catch (error) {
        console.log('FAILED');
        console.error(`  ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('OpenAI integration test suite\n');

    const results = [];

    results.push(await runTest('generateNotes', async () => {
        const notes = await generateNotes(SAMPLE_TRANSCRIPT, 'Q2 Roadmap Review');
        if (!notes || notes.length < 50) {
            throw new Error('Notes output too short');
        }
    }));

    results.push(await runTest('extractTasks', async () => {
        const tasks = await extractTasks(SAMPLE_TRANSCRIPT, PARTICIPANTS);
        if (!Array.isArray(tasks) || tasks.length === 0) {
            throw new Error('No tasks extracted');
        }
        if (!tasks[0].title) {
            throw new Error('Task missing title field');
        }
    }));

    results.push(await runTest('extractGroupTasks', async () => {
        const tasks = await extractGroupTasks(SAMPLE_TRANSCRIPT, PARTICIPANTS);
        if (!Array.isArray(tasks) || tasks.length === 0) {
            throw new Error('No group tasks extracted');
        }
    }));

    results.push(await runTest('chatWithContext', async () => {
        const response = await chatWithContext(
            'What action items were assigned to Bob?',
            {
                transcript: SAMPLE_TRANSCRIPT,
                notes: 'Roadmap review meeting',
                tasks: [{ title: 'Prepare design mockups', assigneeId: 'user-bob' }]
            },
            []
        );
        if (!response || response.length < 10) {
            throw new Error('Chat response too short');
        }
    }));

    results.push(await runTest('transcribeAudio (whisper-1)', async () => {
        const wavBuffer = createMinimalWavBuffer(2);
        const transcript = await transcribeAudio(wavBuffer, 'test-tone.wav');
        if (typeof transcript !== 'string') {
            throw new Error('Transcript is not a string');
        }
    }));

    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log(`\n${passed}/${total} tests passed`);

    if (passed !== total) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Test suite crashed:', error);
    process.exit(1);
});
