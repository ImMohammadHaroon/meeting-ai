import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationsAPI } from '../services/api';
import { supabase } from '../services/supabase';

const OrganizationContext = createContext(null);

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

export const OrganizationProvider = ({ children }) => {
    const [organizations, setOrganizations] = useState([]);
    const [activeOrganization, setActiveOrganization] = useState(null);
    const [activeRole, setActiveRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all organizations on mount (only if authenticated)
    const fetchOrganizations = useCallback(async () => {
        try {
            // Check if user is authenticated first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return; // Not authenticated, don't fetch orgs
            }

            setLoading(true);
            setError(null);

            const { organizations: orgs } = await organizationsAPI.getAllMyOrgs();
            setOrganizations(orgs || []);

            // Get user's active org from metadata
            const { data: { user } } = await supabase.auth.getUser();
            const activeOrgId = user?.user_metadata?.active_organization_id;

            if (orgs && orgs.length > 0) {
                // Find the active org or default to first one
                const active = activeOrgId
                    ? orgs.find(o => o.id === activeOrgId)
                    : orgs[0];

                if (active) {
                    setActiveOrganization(active);
                    setActiveRole(active.role);
                } else if (orgs.length > 0) {
                    // If stored active org not found, use first one
                    setActiveOrganization(orgs[0]);
                    setActiveRole(orgs[0].role);
                }
            } else {
                setActiveOrganization(null);
                setActiveRole(null);
            }
        } catch (err) {
            console.error('Failed to fetch organizations:', err);
            setError(err.message || 'Failed to fetch organizations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrganizations();

        // Also listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                fetchOrganizations();
            } else if (event === 'SIGNED_OUT') {
                setOrganizations([]);
                setActiveOrganization(null);
                setActiveRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchOrganizations]);

    // Switch to a different organization
    const switchOrganization = useCallback(async (orgId) => {
        try {
            const { organization, role } = await organizationsAPI.switchOrganization(orgId);
            setActiveOrganization(organization);
            setActiveRole(role);
            return { success: true, organization };
        } catch (err) {
            console.error('Failed to switch organization:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to switch organization' };
        }
    }, []);

    // Leave an organization
    const leaveOrganization = useCallback(async (orgId) => {
        try {
            await organizationsAPI.leaveOrganization(orgId);

            // Remove from local state
            const updatedOrgs = organizations.filter(o => o.id !== orgId);
            setOrganizations(updatedOrgs);

            // If we left the active org, switch to another
            if (activeOrganization?.id === orgId) {
                if (updatedOrgs.length > 0) {
                    await switchOrganization(updatedOrgs[0].id);
                } else {
                    setActiveOrganization(null);
                    setActiveRole(null);
                }
            }

            return { success: true };
        } catch (err) {
            console.error('Failed to leave organization:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to leave organization' };
        }
    }, [organizations, activeOrganization, switchOrganization]);

    // Add organization to local state (after create/join)
    const addOrganization = useCallback((org) => {
        setOrganizations(prev => [...prev, org]);
    }, []);

    // Refresh organizations list
    const refreshOrganizations = useCallback(async () => {
        await fetchOrganizations();
    }, [fetchOrganizations]);

    const value = {
        // State
        organizations,
        activeOrganization,
        activeRole,
        loading,
        error,
        hasOrganizations: organizations.length > 0,

        // Actions
        switchOrganization,
        leaveOrganization,
        addOrganization,
        refreshOrganizations,
        setActiveOrganization
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};

export default OrganizationContext;
