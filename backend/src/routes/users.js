import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users from the same organization (for participant selection)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // First, get the user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        // If user has no organization, return empty list
        if (!membership) {
            return res.json({ users: [] });
        }

        // Get all members from the same organization
        const { data: orgMembers, error: membersError } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', membership.organization_id);

        if (membersError) {
            console.error('Get org members error:', membersError);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        // Get user details from Supabase Auth for each member
        const formattedUsers = await Promise.all(
            orgMembers.map(async (member) => {
                const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
                return {
                    id: member.user_id,
                    email: user?.email,
                    fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                    createdAt: user?.created_at
                };
            })
        );

        // Filter out null entries and current user
        const filteredUsers = formattedUsers.filter(u => u && u.id !== userId);

        res.json({ users: filteredUsers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
