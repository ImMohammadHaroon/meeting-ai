import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (for participant selection)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Get all users from Supabase Auth
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Format user data
        const formattedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email.split('@')[0],
            createdAt: user.created_at
        }));

        res.json({ users: formattedUsers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
