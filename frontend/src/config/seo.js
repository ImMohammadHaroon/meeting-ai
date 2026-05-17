const DEFAULT_SITE_URL = 'https://meetingai.dev';

export const SITE_NAME = 'Meeting AI';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

export const DEFAULT_DESCRIPTION =
  'AI-powered meeting platform: transcribe audio, generate summaries and action items, run live WebRTC rooms, and ask questions about any meeting with an AI assistant.';

export const DEFAULT_KEYWORDS = [
  'meeting AI',
  'meeting transcription',
  'AI meeting notes',
  'meeting summarization',
  'action items',
  'live meetings',
  'WebRTC meetings',
  'team collaboration',
  'meeting assistant',
  'meeting owl',
].join(', ');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

export const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/signup', changefreq: 'monthly', priority: '0.8' },
  { path: '/signin', changefreq: 'monthly', priority: '0.7' },
];

export const FAQ_SCHEMA_ITEMS = [
  {
    question: 'What is Meeting AI?',
    answer:
      'Meeting AI is a full-stack platform that transforms meeting audio into transcripts, summaries, action items, and provides an AI chatbot to answer questions about your meetings. It supports standard, group, and live meetings.',
  },
  {
    question: 'How does audio transcription work?',
    answer:
      'Upload your audio file (MP3, WAV, M4A, OGG), and our system uses Groq Whisper API to transcribe it with high accuracy. The transcript is then used to generate notes and extract tasks automatically.',
  },
  {
    question: 'What is the AI Assistant chatbot?',
    answer:
      'The chatbot uses your meeting transcript as knowledge base. You can ask questions like "What decisions were made?" or "What tasks were assigned?" and get instant AI-powered answers.',
  },
  {
    question: 'How do live meetings work?',
    answer:
      'Live meetings use WebRTC for peer-to-peer audio. The meeting creator gets a unique room link to share with participants. Features include mute/unmute and screen sharing.',
  },
  {
    question: 'How do organizations work?',
    answer:
      'Organizations are team workspaces where you collaborate. Create an organization with a unique invite code, and members join using that code. Their email domain must match your organization\'s domain.',
  },
  {
    question: 'What types of meetings can I create?',
    answer:
      'Standard meetings (multiple participants with individual audio), group meetings (single audio file), and live meetings (real-time WebRTC audio sessions).',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We use Supabase Auth with JWT tokens and PostgreSQL Row Level Security (RLS) to ensure your meeting data is private and only accessible to authorized participants.',
  },
];

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
