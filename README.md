#  Meeting AI: Full-Stack LLM-Powered Meeting Management Platform

[Live Demo](https://meetingai.dev)

##  Transforming Conversations into Actionable Intelligence

**Meeting AI** is a robust, production-grade full-stack application engineered to eliminate the inefficiencies of traditional meeting workflows. By integrating high-speed Large Language Models (LLMs) and real-time communication technologies, it automates the entire post-meeting process—from transcription to task assignment—allowing teams to focus purely on collaboration and decision-making.

This platform is built for modern teams seeking a seamless, secure, and highly performant solution for meeting documentation and follow-up.

##  Core Capabilities and Value Proposition


| Feature                            | Technical Implementation                                                                                                                   | Key Benefit                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Real-Time Conferencing**         | **WebRTC** for peer-to-peer audio/video streams, managed by **Socket.io** signaling.                                                       | Conduct secure, high-quality live meetings without relying on external services.            |
| **High-Fidelity Transcription**    | Utilizes the **Groq Whisper API** for rapid, accurate audio-to-text conversion, including automatic translation to English.                | Provides a complete, corrected, and reliable record of every discussion point instantly.    |
| **Intelligent Summarization**      | **Groq LLaMA 3.3** generates structured meeting notes, summarizing key points, decisions, and next steps in a professional format.         | Reduces manual effort and ensures consistent, high-quality documentation for every meeting. |
| **Automated Task Extraction**      | LLM-driven analysis of the transcript to identify action items and assign them to the correct participant based on conversational context. | Drives accountability and ensures critical follow-up tasks are never missed.                |
| **Contextual Q&A Chatbot**         | An integrated AI assistant that uses the meeting transcript as its sole knowledge base to answer specific user queries.                    | Enables quick information retrieval and deep understanding of past discussions.             |
| **Secure Organization Management** | **Supabase Auth** and **PostgreSQL RLS** enforce domain-based team access and granular data security policies.                             | Guarantees a private and compliant workspace for sensitive corporate data.                  |


##  Technical Architecture Deep Dive

Meeting AI is structured as a modular, high-performance application, separating the user interface from the business logic and AI processing.

### Frontend: React, Vite, and Tailwind CSS

- **Framework**: **React.js** with **Vite** for a blazing-fast development and build experience.
- **Styling**: **Tailwind CSS** implements a professional, responsive UI with a modern "glassmorphism" aesthetic.
- **Real-Time**: Custom **React Hooks** manage the complex state of WebRTC connections and Socket.io events.

### Backend: Node.js, Express, and Groq

- **API Server**: **Node.js** with **Express** provides a scalable RESTful API for managing users, meetings, and chat history.
- **AI Integration**: Direct use of the **Groq SDK** for all LLM operations, ensuring maximum speed and efficiency for transcription and generation tasks.
- **Data & Storage**: **Supabase** serves as the unified backend for:
  - **Authentication**: User sign-up and sign-in.
  - **Database**: PostgreSQL with robust **Row Level Security (RLS)** policies for data isolation.
  - **Storage**: Secure storage of raw audio files.

##  Performance Advantage: Why Groq?

This application is designed for speed. By utilizing the **Groq API**, which runs models like LLaMA 3.3 and Whisper on specialized LPU™ Inference Engines, Meeting AI achieves significantly lower latency for AI tasks compared to traditional GPU-based solutions. This performance is critical for delivering near-instantaneous transcription and summarization, enhancing the overall user experience.

##  Getting Started (Developer Setup)

### Prerequisites

- Node.js 16+ and npm
- A **Supabase** account and project
- A **Groq API Key**

### 1. Supabase Configuration

1. Create a new Supabase project.
2. Execute the SQL schema from `supabase_schema.sql` to set up the `meetings`, `tasks`, and `chat_messages` tables, including all necessary **RLS policies**.
3. Create a public storage bucket named `meeting-audio`.

### 2. Environment Variables

Configure your credentials in the respective `.env` files:

`**backend/.env`**

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
# Optional: SMTP details for email invitations
```

`**frontend/.env**`

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation and Local Run

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run the application
# Terminal 1: Backend Server
cd backend
npm run dev

# Terminal 2: Frontend Client
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Mobile app (Flutter)

A Flutter iOS/Android client lives in [`meeting_ai/`](meeting_ai/). See [`meeting_ai/README.md`](meeting_ai/README.md) for setup, backend URL configuration, and build instructions.

## 📄 License

This project is released under the **MIT License**.