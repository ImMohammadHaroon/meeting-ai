import { useState, useRef, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';

const OrganizationSwitcher = ({ onCreateOrJoin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const {
        organizations,
        activeOrganization,
        switchOrganization,
        loading
    } = useOrganization();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = async (orgId) => {
        if (orgId === activeOrganization?.id) {
            setIsOpen(false);
            return;
        }

        await switchOrganization(orgId);
        setIsOpen(false);
    };

    const handleCreateOrJoin = () => {
        setIsOpen(false);
        onCreateOrJoin?.();
    };

    if (loading) {
        return (
            <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
        );
    }

    if (!activeOrganization) {
        return (
            <button
                onClick={handleCreateOrJoin}
                className="flex items-center gap-2 px-3 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create/Join Org</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm"
            >
                {/* Org Avatar */}
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    {activeOrganization.name?.charAt(0)?.toUpperCase() || 'O'}
                </div>

                {/* Org Name */}
                <span className="text-white/90 font-medium max-w-[120px] truncate hidden md:inline">
                    {activeOrganization.name}
                </span>

                {/* Dropdown Arrow */}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Your Organizations
                        </p>
                    </div>

                    {/* Organizations List */}
                    <div className="max-h-[240px] overflow-y-auto">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSwitch(org.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${org.id === activeOrganization?.id ? 'bg-white/5' : ''
                                    }`}
                            >
                                {/* Org Avatar */}
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                    {org.name?.charAt(0)?.toUpperCase() || 'O'}
                                </div>

                                {/* Org Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">
                                        {org.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        @{org.domain || org.slug}
                                    </p>
                                </div>

                                {/* Active Indicator */}
                                {org.id === activeOrganization?.id && (
                                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}

                                {/* Role Badge */}
                                {org.role === 'admin' && org.id !== activeOrganization?.id && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full flex-shrink-0">
                                        Admin
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-white/10">
                        <button
                            onClick={handleCreateOrJoin}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white/70 hover:text-white"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span className="text-sm">Create or Join Organization</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationSwitcher;
