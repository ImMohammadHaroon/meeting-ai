import groq from '../config/groq.js';
import fs from 'fs';
import path from 'path';

/**
 * Transcribe and translate audio file to English using Groq Whisper API
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} - English transcript text (translated and corrected)
 */
export const transcribeAudio = async (audioBuffer, fileName) => {
    try {
        // Save buffer to temporary file
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, audioBuffer);

        // Create file stream for Groq API
        const file = fs.createReadStream(tempFilePath);

        // Use Whisper's TRANSLATION endpoint to automatically convert non-English audio to English
        // This works for Urdu, Urdu-English mix, and all other languages
        const translation = await groq.audio.translations.create({
            file: file,
            model: 'whisper-large-v3',
            response_format: 'json',
            temperature: 0.0
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        // Post-process the transcript to fix grammar and sentence structure
        const correctedText = await correctSentences(translation.text);

        return correctedText;
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
    }
};

/**
 * Correct grammar and sentence structure in transcript
 * @param {string} text - Raw transcript text
 * @returns {Promise<string>} - Corrected text
 */
const correctSentences = async (text) => {
    try {
        const prompt = `You are a professional transcript editor. Your task is to correct grammar, fix incomplete sentences, and improve clarity while preserving the original meaning.

Original Transcript:
${text}

Instructions:
1. Fix grammatical errors
2. Complete any incomplete sentences
3. Improve sentence structure and clarity
4. Maintain the original meaning and content
5. Keep the same tone and style
6. Do NOT add new information or remove important details

Return ONLY the corrected transcript, nothing else.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional transcript editor. Correct grammar and sentences while preserving meaning.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 4000
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Sentence correction error:', error);
        // If correction fails, return original text
        return text;
    }
};

/**
 * Generate meeting notes from transcript using Groq
 * @param {string} transcript - Full meeting transcript
 * @param {string} meetingTitle - Meeting title for context
 * @returns {Promise<string>} - Generated notes
 */
export const generateNotes = async (transcript, meetingTitle) => {
    try {
        const prompt = `You are an AI assistant that generates professional meeting notes. 

Meeting Title: ${meetingTitle}

Transcript:
${transcript}

Generate comprehensive meeting notes with the following sections:
1. Summary
2. Key Discussion Points
3. Decisions Made
4. Action Items
5. Next Steps

Format the notes in a clear, professional manner.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional meeting notes assistant. Generate clear, concise, and well-structured meeting notes.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Notes generation error:', error);
        throw new Error(`Notes generation failed: ${error.message}`);
    }
};

/**
 * Extract tasks from transcript with assignees
 * @param {string} transcript - Full meeting transcript
 * @param {Array} participants - Array of participant objects {id, name}
 * @returns {Promise<Array>} - Array of task objects {title, assigneeId}
 */
export const extractTasks = async (transcript, participants) => {
    try {
        const participantList = participants.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');

        const prompt = `You are an AI assistant that extracts action items and tasks from meeting transcripts.

Transcript:
${transcript}

Participants:
${participantList}

Extract all action items and tasks from the transcript. For each task:
1. Identify the task description
2. Assign it to the most appropriate participant based on context
3. If no clear assignee can be determined, set assigneeId to null

Return a JSON array of tasks in this exact format:
[
  {
    "title": "Task description",
    "assigneeId": "participant-id-or-null"
  }
]

Only return the JSON array, nothing else.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a task extraction assistant. Extract action items and assign them to participants. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1500
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let tasks = [];
        try {
            // Remove markdown code blocks if present
            const jsonText = responseText.replace(/```json\n?|```\n?/g, '').trim();
            tasks = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse tasks JSON:', parseError);
            tasks = [];
        }

        return tasks;
    } catch (error) {
        console.error('Task extraction error:', error);
        throw new Error(`Task extraction failed: ${error.message}`);
    }
};

/**
 * Extract tasks from transcript with assignees for Group Meetings
 * @param {string} transcript - Full meeting transcript
 * @param {Array} participants - Array of participant objects {id, name}
 * @returns {Promise<Array>} - Array of task objects {title, assigneeId}
 */
export const extractGroupTasks = async (transcript, participants) => {
    try {
        const participantList = participants.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');

        const prompt = `You are an AI assistant that extracts action items and tasks from a GROUP MEETING transcript.
        
This transcript is from a single audio recording where multiple people are speaking.
Your goal is to:
1. Infer who is speaking based on the context and content of the transcript.
2. Identify action items and tasks.
3. Assign each task to the correct participant from the provided list.

Transcript:
${transcript}

Participants:
${participantList}

Instructions:
1. Analyze the text to distinguish between speakers.
2. Extract all action items.
3. Assign each task to the most appropriate participant.
4. If you cannot determine the assignee with high confidence, set assigneeId to null.
5. Ignore background noise or irrelevant chatter.

Return a JSON array of tasks in this exact format:
[
  {
    "title": "Task description",
    "assigneeId": "participant-id-or-null"
  }
]

Only return the JSON array, nothing else.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a task extraction assistant for group meetings. Identify speakers and tasks from context.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1500
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let tasks = [];
        try {
            // Remove markdown code blocks if present
            const jsonText = responseText.replace(/```json\n?|```\n?/g, '').trim();
            tasks = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse tasks JSON:', parseError);
            tasks = [];
        }

        return tasks;
    } catch (error) {
        console.error('Task extraction error:', error);
        throw new Error(`Task extraction failed: ${error.message}`);
    }
};

/**
 * Generate chatbot response with meeting context
 * @param {string} userMessage - User's message
 * @param {Object} context - Meeting context {transcript, notes, tasks}
 * @param {Array} chatHistory - Previous chat messages
 * @returns {Promise<string>} - Chatbot response
 */
export const chatWithContext = async (userMessage, context, chatHistory = []) => {
    try {
        const contextPrompt = `You are a helpful AI assistant with access to meeting information.

Meeting Context:
- Transcript: ${context.transcript ? context.transcript.substring(0, 3000) + '...' : 'Not available'}
- Notes: ${context.notes || 'Not available'}
- Tasks: ${context.tasks ? JSON.stringify(context.tasks) : 'No tasks'}

Answer the user's questions based on this meeting context. Be concise and helpful.`;

        // Build messages array with chat history
        const messages = [
            {
                role: 'system',
                content: contextPrompt
            }
        ];

        // Add chat history (last 10 messages for context)
        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
            messages.push({ role: 'user', content: msg.message });
            messages.push({ role: 'assistant', content: msg.response });
        }

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.5,
            max_tokens: 1000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Chat error:', error);
        throw new Error(`Chat failed: ${error.message}`);
    }
};

export default {
    transcribeAudio,
    generateNotes,
    extractTasks,
    extractGroupTasks,
    chatWithContext
};
