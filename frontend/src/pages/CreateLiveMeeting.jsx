import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveMeetingsAPI, usersAPI } from '../services/api';
import { supabase } from '../services/supabase';

function CreateLiveMeeting() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdMeeting, setCreatedMeeting] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { users } = await usersAPI.getAll();
            const { data: { user } } = await supabase.auth.getUser();

            // Filter out current user
            const filteredUsers = users.filter(u => u.id !== user?.id);
            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleParticipantToggle = (userId) => {
        setSelectedParticipants(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Please enter a meeting title');
            return;
        }

        if (selectedParticipants.length === 0) {
            setError('Please select at least one participant');
            return;
        }

        setLoading(true);

        try {
            const response = await liveMeetingsAPI.create({
                title: title.trim(),
                description: description.trim(),
                participantIds: selectedParticipants
            });

            setCreatedMeeting(response);
        } catch (err) {
            console.error('Error creating live meeting:', err);
            setError(err.response?.data?.error || 'Failed to create live meeting');
            setLoading(false);
        }
    };

    const handleStartMeeting = async () => {
        try {
            await liveMeetingsAPI.start(createdMeeting.liveMeeting.id);
            navigate(`/live-meeting/${createdMeeting.liveMeeting.id}`);
        } catch (err) {
            console.error('Error starting meeting:', err);
            setError('Failed to start meeting');
        }
    };

    const copyJoinUrl = () => {
        navigator.clipboard.writeText(createdMeeting.joinUrl);
        alert('Join URL copied to clipboard!');
    };

    if (createdMeeting) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
                        <div className="text-center mb-8">
                            <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h1 className="text-3xl font-bold mb-2">Live Meeting Created</h1>
                            <p className="text-gray-400">Your live meeting is ready to start</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">{createdMeeting.meeting.title}</h2>
                                {createdMeeting.meeting.description && (
                                    <p className="text-gray-400">{createdMeeting.meeting.description}</p>
                                )}
                            </div>

                            <div className="bg-gray-700 rounded p-4">
                                <label className="block text-sm font-medium mb-2">Join URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={createdMeeting.joinUrl}
                                        readOnly
                                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
                                    />
                                    <button
                                        onClick={copyJoinUrl}
                                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    Share this link with participants to join the meeting
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={handleStartMeeting}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded transition"
                                >
                                    Start Meeting
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded transition"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
                    <h1 className="text-3xl font-bold mb-6">Create Live Meeting</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                Meeting Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder="Enter meeting title"
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                                placeholder="Add any meeting details or agenda..."
                                maxLength={1000}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Select Participants *
                            </label>
                            <div className="bg-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                                {users.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No users available</p>
                                ) : (
                                    <div className="space-y-2">
                                        {users.map(user => (
                                            <label
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 bg-gray-600 rounded cursor-pointer hover:bg-gray-550 transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedParticipants.includes(user.id)}
                                                    onChange={() => handleParticipantToggle(user.id)}
                                                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
                                                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.name || 'User'}</p>
                                                        <p className="text-sm text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedParticipants.length > 0 && (
                                <p className="text-sm text-gray-400 mt-2">
                                    {selectedParticipants.length} participant(s) selected
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded transition"
                        >
                            {loading ? 'Creating...' : 'Create Live Meeting'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateLiveMeeting;
