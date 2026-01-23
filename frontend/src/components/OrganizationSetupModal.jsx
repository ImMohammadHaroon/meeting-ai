import { useState } from 'react';
import { organizationsAPI } from '../services/api';

const OrganizationSetupModal = ({ isOpen, onComplete, userEmail }) => {
    const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'
    const [orgName, setOrgName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Extract domain from email for display
    const emailDomain = userEmail?.split('@')[1] || '';

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await organizationsAPI.create(orgName);
            onComplete(data.organization);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinOrg = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await organizationsAPI.join(inviteCode);
            onComplete(data.organization);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to join organization');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white text-center">
                        {mode === 'choose' && 'Welcome! Set Up Your Organization'}
                        {mode === 'create' && 'Create Organization'}
                        {mode === 'join' && 'Join Organization'}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mt-2">
                        {mode === 'choose' && 'Create a new organization or join an existing one'}
                        {mode === 'create' && `Your organization domain will be @${emailDomain}`}
                        {mode === 'join' && 'Enter the invite code shared with you'}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {mode === 'choose' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('create')}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Create Organization</h3>
                                        <p className="text-gray-500 text-sm">Start a new organization and invite your team</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('join')}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Join Organization</h3>
                                        <p className="text-gray-500 text-sm">Join with an invite code from your team</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {mode === 'create' && (
                        <form onSubmit={handleCreateOrg} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="e.g., Acme Corp"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-400 text-sm">
                                    <strong>Note:</strong> Only users with <strong>@{emailDomain}</strong> email addresses will be able to join your organization.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('choose'); setError(''); }}
                                    className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !orgName.trim()}
                                    className="flex-1 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    )}

                    {mode === 'join' && (
                        <form onSubmit={handleJoinOrg} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Invite Code
                                </label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="e.g., ABC123"
                                    maxLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest font-mono placeholder:text-gray-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <p className="text-gray-500 text-sm text-center">
                                Ask your organization admin for the invite code
                            </p>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('choose'); setError(''); }}
                                    className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || inviteCode.length !== 6}
                                    className="flex-1 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Joining...' : 'Join'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationSetupModal;
