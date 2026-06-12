import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
    apiKey: openaiApiKey
});

export default openai;
