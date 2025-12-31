import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable');
}

// Initialize Groq client
export const groq = new Groq({
    apiKey: groqApiKey
});

export default groq;
