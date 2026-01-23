import { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';

const OrganizationPanel = ({ organization, userRole, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Email invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteError, setInviteError] = useState('');

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
        }
    }, [isOpen]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { members } = await organizationsAPI.getMembers();
            setMembers(members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(organization.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleRegenerateCode = async () => {
        if (!confirm('Are you sure? The old invite code will stop working.')) return;

        setRegenerating(true);
        try {
            const { inviteCode } = await organizationsAPI.regenerateInvite();
            onUpdate({ ...organization, invite_code: inviteCode });
        } catch (error) {
            console.error('Failed to regenerate code:', error);
        } finally {
            setRegenerating(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');
        setSendingInvite(true);

        try {
            await organizationsAPI.sendInvite(inviteEmail);
            setInviteSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setTimeout(() => setInviteSuccess(''), 5000);
        } catch (error) {
            setInviteError(error.response?.data?.error || 'Failed to send invitation');
        } finally {
            setSendingInvite(false);
        }
    };

    if (!organization) return null;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm text-white/70 hover:text-white"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden md:inline">Manage Org</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A0A0A]">
                            <div>
                                <h2 className="text-xl font-semibold text-white">{organization.name}</h2>
                                <p className="text-sm text-gray-500">@{organization.domain}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Email Invite Section */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 block">
                                    Invite by Email
                                </label>
                                <form onSubmit={handleSendInvite} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder={`colleague@${organization.domain}`}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingInvite || !inviteEmail}
                                        className="px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
                                    >
                                        {sendingInvite ? 'Sending...' : 'Send Invite'}
                                    </button>
                                </form>
                                {inviteSuccess && (
                                    <p className="mt-2 text-sm text-green-400">{inviteSuccess}</p>
                                )}
                                {inviteError && (
                                    <p className="mt-2 text-sm text-red-400">{inviteError}</p>
                                )}
                            </div>

                            {/* Invite Code Section */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 block">
                                    Or Share Invite Code
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-white text-center">
                                        {organization.invite_code}
                                    </div>
                                    <button
                                        onClick={handleCopyCode}
                                        className={`p-3 rounded-xl border transition-all ${copied
                                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        title="Copy invite code"
                                    >
                                        {copied ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Share this code with team members who have @{organization.domain} email addresses
                                </p>
                                {isAdmin && (
                                    <button
                                        onClick={handleRegenerateCode}
                                        disabled={regenerating}
                                        className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                    >
                                        {regenerating ? 'Regenerating...' : 'Regenerate invite code'}
                                    </button>
                                )}
                            </div>

                            {/* Members Section */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 block">
                                    Members ({members.length})
                                </label>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                                                        {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white">{member.fullName}</p>
                                                        <p className="text-xs text-gray-500">{member.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full ${member.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-300'
                                                        : 'bg-white/10 text-gray-400'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrganizationPanel;
