import axios from 'axios';
import { supabase } from './supabase';

// Use environment variables for production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
});

// Auth API
export const authAPI = {
    signUp: async (email, password, fullName) => {
        const response = await api.post('/auth/signup', { email, password, fullName });
        return response.data;
    },

    signIn: async (email, password) => {
        const response = await api.post('/auth/signin', { email, password });
        return response.data;
    },

    signOut: async () => {
        const response = await api.post('/auth/signout');
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

// Users API
export const usersAPI = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    }
};

// Meetings API
export const meetingsAPI = {
    create: async (meetingData) => {
        const response = await api.post('/meetings', meetingData);
        return response.data;
    },

    getAll: async () => {
        const response = await api.get('/meetings');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/meetings/${id}`);
        return response.data;
    },

    uploadAudio: async (id, files, participantIds) => {
        const formData = new FormData();
        files.forEach(file => formData.append('audioFiles', file));
        formData.append('participantIds', JSON.stringify(participantIds));

        const response = await api.post(`/meetings/${id}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    process: async (id) => {
        const response = await api.post(`/meetings/${id}/process`);
        return response.data;
    },

    getStatus: async (id) => {
        const response = await api.get(`/meetings/${id}/status`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/meetings/${id}`);
        return response.data;
    }
};

// Chat API
export const chatAPI = {
    sendMessage: async (meetingId, message) => {
        const response = await api.post(`/meetings/${meetingId}/chat`, { message });
        return response.data;
    },

    getHistory: async (meetingId) => {
        const response = await api.get(`/meetings/${meetingId}/chat/history`);
        return response.data;
    }
};

// Community Chat API
export const communityChatAPI = {
    getMessages: async (meetingId) => {
        const response = await api.get(`/community-chat/${meetingId}`);
        return response.data;
    },

    sendMessage: async (meetingId, message) => {
        const response = await api.post(`/community-chat/${meetingId}`, { message });
        return response.data;
    }
};

// Live Meetings API
export const liveMeetingsAPI = {
    create: async (meetingData) => {
        const response = await api.post('/live-meetings/create', meetingData);
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/live-meetings/${id}`);
        return response.data;
    },

    start: async (id) => {
        const response = await api.post(`/live-meetings/${id}/start`);
        return response.data;
    },

    end: async (id) => {
        const response = await api.post(`/live-meetings/${id}/end`);
        return response.data;
    },

    join: async (id) => {
        const response = await api.post(`/live-meetings/${id}/join`);
        return response.data;
    },

    leave: async (id) => {
        const response = await api.post(`/live-meetings/${id}/leave`);
        return response.data;
    },

    uploadRecording: async (id, audioBlob) => {
        const formData = new FormData();
        formData.append('recording', audioBlob, 'meeting-recording.webm');

        const response = await api.post(`/live-meetings/${id}/upload-recording`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default api;
