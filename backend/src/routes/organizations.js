import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { sendInvitationEmail } from '../services/email.js';

const router = express.Router();

/**
 * Generate a random 6-character invite code
 */
const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Extract domain from email
 */
const extractDomain = (email) => {
    return email.split('@')[1]?.toLowerCase() || '';
};

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!name) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        // Check if user already belongs to an organization
        const { data: existingMembership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingMembership) {
            return res.status(400).json({ error: 'You already belong to an organization' });
        }

        // Extract domain from user's email
        const domain = extractDomain(userEmail);
        const inviteCode = generateInviteCode();

        // Create the organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name,
                domain,
                invite_code: inviteCode,
                created_by: userId
            })
            .select()
            .single();

        if (orgError) {
            console.error('Create org error:', orgError);
            return res.status(500).json({ error: 'Failed to create organization' });
        }

        // Add user as admin member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: org.id,
                user_id: userId,
                role: 'admin'
            });

        if (memberError) {
            console.error('Add member error:', memberError);
            // Rollback - delete the organization
            await supabase.from('organizations').delete().eq('id', org.id);
            return res.status(500).json({ error: 'Failed to add you to organization' });
        }

        res.status(201).json({
            message: 'Organization created successfully',
            organization: org
        });
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({ error: 'Failed to create organization' });
    }
});

/**
 * POST /api/organizations/join
 * Join an organization using invite code
 */
router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code is required' });
        }

        // Check if user already belongs to an organization
        const { data: existingMembership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingMembership) {
            return res.status(400).json({ error: 'You already belong to an organization' });
        }

        // Find organization by invite code
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (orgError || !org) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        // Check if user's email domain matches organization domain
        const userDomain = extractDomain(userEmail);
        if (userDomain !== org.domain) {
            return res.status(403).json({
                error: `Only users with @${org.domain} email can join this organization`
            });
        }

        // Add user as member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: org.id,
                user_id: userId,
                role: 'member'
            });

        if (memberError) {
            console.error('Join org error:', memberError);
            return res.status(500).json({ error: 'Failed to join organization' });
        }

        res.json({
            message: 'Successfully joined organization',
            organization: org
        });
    } catch (error) {
        console.error('Join organization error:', error);
        res.status(500).json({ error: 'Failed to join organization' });
    }
});

/**
 * GET /api/organizations/me
 * Get current user's organization
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's organization membership
        const { data: membership, error: memberError } = await supabase
            .from('organization_members')
            .select(`
                role,
                joined_at,
                organizations (
                    id,
                    name,
                    domain,
                    invite_code,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .single();

        if (memberError || !membership) {
            return res.json({ organization: null });
        }

        res.json({
            organization: membership.organizations,
            role: membership.role,
            joinedAt: membership.joined_at
        });
    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization' });
    }
});

/**
 * GET /api/organizations/members
 * Get all members of user's organization
 */
router.get('/members', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // First get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not part of any organization' });
        }

        // Get all members of this organization
        const { data: members, error: membersError } = await supabase
            .from('organization_members')
            .select('user_id, role, joined_at')
            .eq('organization_id', membership.organization_id);

        if (membersError) {
            return res.status(500).json({ error: 'Failed to fetch members' });
        }

        // Get user details from Supabase Auth for each member
        const memberDetails = await Promise.all(
            members.map(async (member) => {
                const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
                return {
                    id: member.user_id,
                    email: user?.email,
                    fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                    role: member.role,
                    joinedAt: member.joined_at
                };
            })
        );

        res.json({ members: memberDetails });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

/**
 * POST /api/organizations/regenerate-invite
 * Generate a new invite code (admin only)
 */
router.post('/regenerate-invite', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user is admin of their organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not part of any organization' });
        }

        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can regenerate invite codes' });
        }

        const newInviteCode = generateInviteCode();

        // Update the invite code
        const { data: org, error } = await supabase
            .from('organizations')
            .update({ invite_code: newInviteCode })
            .eq('id', membership.organization_id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to regenerate invite code' });
        }

        res.json({
            message: 'Invite code regenerated',
            inviteCode: org.invite_code
        });
    } catch (error) {
        console.error('Regenerate invite error:', error);
        res.status(500).json({ error: 'Failed to regenerate invite code' });
    }
});

/**
 * POST /api/organizations/invite
 * Send an invitation email to a user
 */
router.post('/invite', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.user.id;
        const inviterEmail = req.user.email;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Get user's membership and organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select(`
                organization_id,
                role,
                organizations (
                    id,
                    name,
                    domain,
                    invite_code
                )
            `)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not part of any organization' });
        }

        const org = membership.organizations;

        // Validate email domain matches organization domain
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (emailDomain !== org.domain) {
            return res.status(400).json({
                error: `Can only invite users with @${org.domain} email addresses`
            });
        }

        // Get inviter's name
        const { data: { user: inviterUser } } = await supabase.auth.admin.getUserById(userId);
        const inviterName = inviterUser?.user_metadata?.full_name || inviterEmail.split('@')[0];

        // Determine signup URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const signupUrl = `${frontendUrl}/signup`;

        // Send invitation email
        await sendInvitationEmail({
            to: email,
            organizationName: org.name,
            inviteCode: org.invite_code,
            inviterName,
            signupUrl
        });

        res.json({
            message: `Invitation sent to ${email}`,
            email
        });
    } catch (error) {
        console.error('Send invitation error:', error);
        if (error.message === 'Email service not configured') {
            return res.status(503).json({
                error: 'Email service not configured. Please contact administrator.'
            });
        }
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

export default router;
