# Meeting AI — TOP 10 FYP Code Snippets (Full)

Recommended for a 40–50 page FYP report. Each entry includes full code, file path, and explanation.

| # | ID | Feature | Source |
|---|-----|---------|--------|
| 1 | 9.2 | Async AI Processing Pipeline | Backend |
| 2 | 7.1 | Groq Whisper Transcription | Backend |
| 3 | 8.1 | AI Meeting Notes (LLaMA) | Backend |
| 4 | 5.1 | WebRTC Peer Connection | Frontend |
| 5 | 4.2 | Socket.io Room Join / Signaling | Backend |
| 6 | 3.3 | End Meeting + Trigger AI | Backend |
| 7 | 10.1 | Context-Aware AI Chatbot | Backend |
| 8 | 16.2 | Chrome Extension Upload Flow | Extension |
| 9 | 1.3 | JWT Authentication Middleware | Backend |
| 10 | 6.4 | Host End Meeting + Recording Upload | Frontend |

---

## Code Snippet 1 — 9.2: Async AI Processing Pipeline

**Source:** Backend  
**File:** `backend/src/routes/meetings.js`

```javascript
async function processMetingAsync(meetingId, meeting, participants) {
    try {
        console.log(`Processing meeting ${meetingId} (Type: ${meeting.type || 'standard'})...`);
        let fullTranscript = '';

        if (meeting.type === 'group') {
            if (!meeting.audio_file_url) {
                throw new Error('No audio file found for group meeting');
            }
            const audioBuffer = await downloadAudioFile(meeting.audio_file_url);
            const fileName = `group_${meetingId}.mp3`;
            fullTranscript = await transcribeAudio(audioBuffer, fileName);
        } else {
            const transcripts = [];
            for (const participant of participants) {
                if (participant.audio_file_url) {
                    const audioBuffer = await downloadAudioFile(participant.audio_file_url);
                    const fileName = `participant_${participant.user_id}.mp3`;
                    const transcript = await transcribeAudio(audioBuffer, fileName);
                    transcripts.push({ participantId: participant.user_id, transcript });
                }
            }
            if (transcripts.length === 0) {
                throw new Error('No transcripts generated');
            }
            fullTranscript = transcripts.map(t => t.transcript).join('\n\n');
        }

        const notes = await generateNotes(fullTranscript, meeting.title);

        const { data: users } = await supabase.auth.admin.listUsers();
        const participantDetails = participants.map(p => {
            const user = users.users.find(u => u.id === p.user_id);
            return {
                id: p.user_id,
                name: user?.user_metadata?.full_name || user?.email || 'Unknown'
            };
        });

        let extractedTasks = [];
        if (meeting.type === 'group') {
            extractedTasks = await extractGroupTasks(fullTranscript, participantDetails);
        } else {
            extractedTasks = await extractTasks(fullTranscript, participantDetails);
        }

        if (extractedTasks.length > 0) {
            const tasksToInsert = extractedTasks.map(task => ({
                meeting_id: meetingId,
                title: task.title,
                assignee_id: task.assigneeId
            }));
            await supabase.from('tasks').insert(tasksToInsert);
        }

        await supabase
            .from('meetings')
            .update({
                transcript: fullTranscript,
                notes: notes,
                processed: true
            })
            .eq('id', meetingId);

        console.log(`Meeting ${meetingId} processed successfully`);
    } catch (error) {
        await supabase
            .from('meetings')
            .update({
                processed: true,
                notes: `Error during processing: ${error.message}`
            })
            .eq('id', meetingId);
    }
}
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | End-to-end async pipeline: download audio → STT → summary → tasks → database. |
| **Input** | `meetingId`, meeting row (with `audio_file_url` or per-participant URLs), participants array. |
| **Processing** | Whisper transcription; LLaMA notes; task extraction (standard or group); Supabase inserts/updates. |
| **Output** | `meetings.transcript`, `meetings.notes`, `processed: true`, rows in `tasks`. |
| **Importance** | Unifies all AI steps for standard, group, and Chrome extension meetings. |

**Report placement:** Chapter 5 (Methodology), Chapter 6 (Implementation — AI Modules)

---

## Code Snippet 2 — 7.1: Groq Whisper Transcription

**Source:** Backend  
**File:** `backend/src/services/groqService.js`

```javascript
export const transcribeAudio = async (audioBuffer, fileName) => {
    try {
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, audioBuffer);

        const file = fs.createReadStream(tempFilePath);

        // Whisper translation: non-English audio → English
        const translation = await groq.audio.translations.create({
            file: file,
            model: 'whisper-large-v3',
            response_format: 'json',
            temperature: 0.0
        });

        fs.unlinkSync(tempFilePath);

        const correctedText = await correctSentences(translation.text);
        return correctedText;
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
    }
};
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Converts meeting audio to English text using Groq Whisper API. |
| **Input** | Audio `Buffer` and temporary filename. |
| **Processing** | Writes temp file; `groq.audio.translations.create` with `whisper-large-v3`; LLaMA grammar correction. |
| **Output** | Corrected English transcript string. |
| **Importance** | Primary speech-to-text layer for summaries, tasks, and chatbot context. |

**Report placement:** Chapter 5 (Methodology — STT), Chapter 6 (Implementation — AI)

---

## Code Snippet 3 — 8.1: AI Meeting Notes Generation

**Source:** Backend  
**File:** `backend/src/services/groqService.js`

```javascript
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
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Produces structured meeting summaries from full transcripts. |
| **Input** | Transcript text and meeting title. |
| **Processing** | Prompt engineering with five sections; LLaMA 3.3 chat completion. |
| **Output** | Markdown-style notes stored in `meetings.notes`. |
| **Importance** | Key AI deliverable displayed on the Meeting Detail page. |

**Report placement:** Chapter 5 (Methodology — Summarization), Chapter 6 (Implementation — AI)

---

## Code Snippet 4 — 5.1: WebRTC Peer Connection Setup

**Source:** Frontend  
**File:** `frontend/src/hooks/useWebRTC.js`

```javascript
const createPeerConnection = async (socketId, userInfo, shouldCreateOffer = false) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current);
        });
    }

    peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        updatePeerStream(socketId, remoteStream);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socketRef.current.emit('ice-candidate', {
                candidate: event.candidate,
                to: socketId
            });
        }
    };

    const peerData = { connection: peerConnection, stream: null, userInfo };
    peersRef.current.set(socketId, peerData);
    setPeers(new Map(peersRef.current));

    if (shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current.emit('offer', { offer, to: socketId });
    }
};
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Establishes a peer-to-peer WebRTC connection per remote participant. |
| **Input** | Remote `socketId`, user metadata, optional `shouldCreateOffer` flag. |
| **Processing** | Adds local audio tracks; handles `ontrack` and ICE; creates/sends SDP offer if initiator. |
| **Output** | Stored `RTCPeerConnection` and Socket.io signaling messages. |
| **Importance** | Core real-time audio transport in live meetings. |

**Report placement:** Chapter 4 (System Design — WebRTC), Chapter 6 (Implementation — Live Meetings)

---

## Code Snippet 5 — 4.2: Socket.io User Join Room Event

**Source:** Backend  
**File:** `backend/src/sockets/signalingHandler.js`

```javascript
socket.on('join-room', ({ roomId, userId, userName }) => {
    console.log(`User ${userName} (${userId}) joining room ${roomId}`);

    socket.join(roomId);
    socket.userId = userId;
    socket.userName = userName;
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    socket.to(roomId).emit('user-joined', {
        userId,
        userName,
        socketId: socket.id
    });

    const participants = Array.from(rooms.get(roomId))
        .filter(id => id !== socket.id)
        .map(id => {
            const participant = io.sockets.sockets.get(id);
            return {
                userId: participant?.userId,
                userName: participant?.userName,
                socketId: id
            };
        })
        .filter(p => p.userId);

    socket.emit('room-participants', participants);

    console.log(`Room ${roomId} now has ${rooms.get(roomId).size} participants`);
});
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Registers a client in a meeting room and synchronizes participant lists for WebRTC mesh. |
| **Input** | `roomId`, `userId`, `userName` from client emit. |
| **Processing** | Socket.io room join; in-memory `rooms` map; broadcast `user-joined`; send existing peers. |
| **Output** | `user-joined` to peers; `room-participants` to the joiner. |
| **Importance** | Enables multi-party P2P setup by exposing peer socket IDs. |

**Report placement:** Chapter 4 (System Design — Real-Time), Chapter 6 (Implementation — Socket.io)

---

## Code Snippet 6 — 3.3: End Meeting and Trigger AI Processing

**Source:** Backend  
**File:** `backend/src/routes/liveMeetings.js`

```javascript
router.post('/:id/end', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: liveMeeting, error } = await supabase
            .from('live_meetings')
            .select('*, meetings(*)')
            .eq('id', id)
            .single();

        if (error || !liveMeeting) {
            return res.status(404).json({ error: 'Live meeting not found' });
        }

        if (liveMeeting.meetings.created_by !== userId) {
            return res.status(403).json({ error: 'Only the meeting creator can end the meeting' });
        }

        await supabase
            .from('live_meetings')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', id);

        await supabase
            .from('live_participants')
            .update({ is_connected: false, left_at: new Date().toISOString() })
            .eq('live_meeting_id', id);

        res.json({ message: 'Meeting ended', status: 'ended' });

        const { data: freshLiveMeeting } = await supabase
            .from('live_meetings')
            .select('*, meetings(*)')
            .eq('id', id)
            .single();

        if (freshLiveMeeting?.recording_url) {
            processLiveMeetingAsync(freshLiveMeeting).catch(err => {
                console.error('Background processing error:', err);
            });
        } else {
            await supabase
                .from('meetings')
                .update({
                    processed: true,
                    notes: 'No recording was captured for this live meeting...',
                    transcript: null
                })
                .eq('id', liveMeeting.meeting_id);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to end meeting' });
    }
});
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Ends the live session, disconnects participants, and starts post-meeting AI processing. |
| **Input** | Live meeting `id`; authenticated host `userId`. |
| **Processing** | Authorization check; status `ended`; participant cleanup; conditional `processLiveMeetingAsync`. |
| **Output** | Immediate JSON response; background Whisper + LLaMA pipeline if recording exists. |
| **Importance** | Bridges real-time meeting lifecycle to AI intelligence. |

**Report placement:** Chapter 6 (Implementation — Live Meetings), Chapter 7 (Testing / Workflow)

---

## Code Snippet 7 — 10.1: Context-Aware AI Chatbot

**Source:** Backend  
**File:** `backend/src/services/groqService.js`

```javascript
export const chatWithContext = async (userMessage, context, chatHistory = []) => {
    try {
        const contextPrompt = `You are a helpful AI assistant with access to meeting information.

Meeting Context:
- Transcript: ${context.transcript ? context.transcript.substring(0, 3000) + '...' : 'Not available'}
- Notes: ${context.notes || 'Not available'}
- Tasks: ${context.tasks ? JSON.stringify(context.tasks) : 'No tasks'}

Answer the user's questions based on this meeting context. Be concise and helpful.`;

        const messages = [
            { role: 'system', content: contextPrompt }
        ];

        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
            messages.push({ role: 'user', content: msg.message });
            messages.push({ role: 'assistant', content: msg.response });
        }

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
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Answers user questions grounded in meeting transcript, notes, and tasks. |
| **Input** | User message; `{ transcript, notes, tasks }`; prior chat turns. |
| **Processing** | Builds system prompt with truncated transcript; adds last 10 turns; LLaMA completion. |
| **Output** | Natural language assistant reply (saved via `/api/meetings/:id/chat`). |
| **Importance** | RAG-style Q&A over processed meeting knowledge. |

**Report placement:** Chapter 5 (Methodology — Conversational AI), Chapter 6 (Implementation — Chatbot)

---

## Code Snippet 8 — 16.2: Chrome Extension Tab Capture and Upload

**Source:** Extension  
**File:** `extension/background.js`

```javascript
async function stopRecordingAndUpload(meta = {}) {
  const response = await sendToOffscreen({ action: 'STOP_RECORDING' });
  await closeOffscreenDocument();

  if (!response?.audioBase64) {
    throw new Error('No recording data received');
  }

  const bytes = Uint8Array.from(atob(response.audioBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: response.mimeType || 'audio/webm' });

  const org = await getGoogleMeetOrg();
  const title =
    meta.title ||
    `Google Meet – ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
  const description = meta.meetUrl
    ? `Recorded from Google Meet\n${meta.meetUrl}`
    : 'Recorded from Google Meet via Chrome extension';

  const meeting = await createMeeting({
    title,
    description,
    organizationId: org.id
  });

  await uploadExtensionAudio(meeting.id, blob);
  await processMeeting(meeting.id);

  const { appUrl } = await chrome.storage.sync.get(['appUrl']);
  const base = appUrl || DEFAULT_APP_URL;

  if (recordingTabId) {
    chrome.tabs.sendMessage(recordingTabId, {
      action: 'UPLOAD_COMPLETE',
      meetingId: meeting.id,
      meetingUrl: `${base}/meetings/${meeting.id}`
    }).catch(() => {});
  }

  recordingTabId = null;

  return { meetingId: meeting.id, meetingUrl: `${base}/meetings/${meeting.id}` };
}
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Converts Google Meet tab audio into a Meeting AI record and runs the same AI pipeline as the web app. |
| **Input** | Base64 WebM from offscreen document; optional Meet title and URL. |
| **Processing** | Blob rebuild → create group meeting → upload audio → `POST /process`. |
| **Output** | `meetingId` and `meetingUrl` for the content script toast/link. |
| **Importance** | End-to-end extension integration; key project differentiator. |

**Report placement:** Chapter 6 (Implementation — Chrome Extension), Appendix

---

## Code Snippet 9 — 1.3: JWT Authentication Middleware

**Source:** Backend  
**File:** `backend/src/middleware/auth.js`

```javascript
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Protects API routes by validating Supabase JWT on every request. |
| **Input** | `Authorization: Bearer <token>` header. |
| **Processing** | Parses token; verifies via `supabase.auth.getUser`; attaches `req.user`. |
| **Output** | Calls `next()` on success; 401/500 JSON on failure. |
| **Importance** | Central security gate for meetings, organizations, AI, and uploads. |

**Report placement:** Chapter 6 (Implementation — Security), Chapter 8 (Security Analysis)

---

## Code Snippet 10 — 6.4: Host End Meeting with Recording Upload

**Source:** Frontend  
**File:** `frontend/src/pages/LiveMeeting.jsx`

```javascript
const handleEndMeeting = async () => {
    if (!confirm('Are you sure you want to end this meeting for everyone?')) {
        return;
    }

    setIsEnding(true);

    try {
        const blob = await finalizeRecording();

        if (blob && blob.size > 0) {
            await liveMeetingsAPI.uploadRecording(id, blob);
        } else {
            console.warn('No meeting recording captured');
        }

        await liveMeetingsAPI.end(id);

        webrtcLeave();

        navigate(`/meetings/${liveMeeting.meeting_id}`);
    } catch (err) {
        console.error('Error ending meeting:', err);
        setError('Failed to end meeting properly');
        setIsEnding(false);
    }
};
```

**Explanation:**

| Field | Description |
|-------|-------------|
| **Purpose** | Orchestrates stop-recording → upload → end → redirect for the meeting host. |
| **Input** | User confirmation; mixed audio blob from `useMeetingRecording` / `finalizeRecording`. |
| **Processing** | Upload via REST; end meeting API; tear down WebRTC; navigate to detail page. |
| **Output** | User lands on Meeting Detail to poll for AI transcript/notes/tasks. |
| **Importance** | Completes the live meeting user journey from capture to AI results. |

**Report placement:** Chapter 6 (Implementation — Frontend / Live Meetings), Chapter 7 (Workflow)

---

## Suggested Order in FYP Report (Appendix / Implementation)

1. **1.3** — Security foundation  
2. **4.2** — Real-time signaling  
3. **5.1** — WebRTC peers  
4. **6.4** — Host end + upload (frontend flow)  
5. **3.3** — End meeting + AI trigger (backend flow)  
6. **7.1** — Whisper STT  
7. **8.1** — LLaMA summarization  
8. **9.2** — Full AI pipeline  
9. **10.1** — Context chatbot  
10. **16.2** — Google Meet extension  

---

*Subset of `FYP_CODE_SNIPPETS.md` — TOP 10 only, full listings.*
