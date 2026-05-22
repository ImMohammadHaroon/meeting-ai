import express from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { sendInvitationEmail, mapEmailError } from '../services/email.js';

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
 * Generate a URL-friendly slug from organization name
 */
const generateSlug = async (name) => {
    // Convert to lowercase, replace spaces with hyphens, remove special chars
    let baseSlug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Ensure minimum length
    if (baseSlug.length < 3) {
        baseSlug = baseSlug + '-org';
    }

    let slug = baseSlug;
    let counter = 0;

    // Check for uniqueness
    while (true) {
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!existing) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
    }

    return slug;
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

        // Multi-org: Users can now create/join multiple organizations
        // Generate unique slug for the organization
        const slug = await generateSlug(name);

        // Extract domain from user's email
        const domain = extractDomain(userEmail);
        const inviteCode = generateInviteCode();

        // Create the organization with slug
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name,
                slug,
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

        // Find organization by invite code
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (orgError || !org) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        // Multi-org: Check if already member of THIS specific org
        const { data: existingMembership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', userId)
            .eq('organization_id', org.id)
            .single();

        if (existingMembership) {
            return res.status(400).json({ error: 'You are already a member of this organization' });
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
/**
 * GET /api/organizations/members
 * Get members of an organization
 */
router.get('/members', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check if user is member of this specific organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
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
        const { organizationId } = req.body;
        const userId = req.user.id;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check if user is admin of this specific organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
        }

        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can regenerate invite codes' });
        }

        const newInviteCode = generateInviteCode();

        // Update the invite code
        const { data: org, error } = await supabase
            .from('organizations')
            .update({ invite_code: newInviteCode })
            .eq('id', organizationId)
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
        const { email, organizationId } = req.body;
        const userId = req.user.id;
        const inviterEmail = req.user.email;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Get user's membership for this specific organization
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
            .eq('organization_id', organizationId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
        }

        const org = Array.isArray(membership.organizations)
            ? membership.organizations[0]
            : membership.organizations;

        if (!org) {
            return res.status(500).json({ error: 'Organization data could not be loaded' });
        }

        // Validate email domain matches organization domain
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (emailDomain !== org.domain?.toLowerCase()) {
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
        console.error('Send invitation error:', error?.code || '', error?.message || error);
        const mapped = mapEmailError(error);
        return res.status(mapped.status).json({
            error: mapped.error,
            ...(mapped.details ? { details: mapped.details } : {}),
        });
    }
});

/**
 * DELETE /api/organizations/members/:userId
 * Remove a member from the organization
 */
router.delete('/members/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const { organizationId } = req.query; // Pass org ID as query param
        const requesterId = req.user.id;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check if requester is admin of this specific organization
        const { data: requesterMembership } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', requesterId)
            .eq('organization_id', organizationId)
            .single();

        if (!requesterMembership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
        }

        if (requesterMembership.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }

        // Verify target user belongs to the same organization
        const { data: targetMembership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', targetUserId)
            .single();

        if (!targetMembership || targetMembership.organization_id !== requesterMembership.organization_id) {
            return res.status(404).json({ error: 'Member not found in your organization' });
        }

        // Remove the member
        const { error: removeError } = await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', targetUserId)
            .eq('organization_id', requesterMembership.organization_id);

        if (removeError) {
            return res.status(500).json({ error: 'Failed to remove member' });
        }

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

const GOOGLE_MEET_ORG_NAME = 'Google Meet';

/**
 * GET /api/organizations/google-meet
 * Get or create the "Google Meet" organization for Chrome extension recordings
 */
router.get('/google-meet', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        const { data: memberships, error: memberError } = await supabase
            .from('organization_members')
            .select(`
                organizations (
                    id,
                    name,
                    slug,
                    domain,
                    invite_code,
                    created_at
                )
            `)
            .eq('user_id', userId);

        if (memberError) {
            return res.status(500).json({ error: 'Failed to fetch organizations' });
        }

        const existing = (memberships || []).find((m) => {
            const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
            return org?.name === GOOGLE_MEET_ORG_NAME;
        });

        if (existing) {
            const org = Array.isArray(existing.organizations)
                ? existing.organizations[0]
                : existing.organizations;
            return res.json({ organization: org });
        }

        const slug = await generateSlug(GOOGLE_MEET_ORG_NAME);
        const domain = extractDomain(userEmail);
        const inviteCode = generateInviteCode();

        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: GOOGLE_MEET_ORG_NAME,
                slug,
                domain,
                invite_code: inviteCode,
                created_by: userId
            })
            .select()
            .single();

        if (orgError) {
            console.error('Create Google Meet org error:', orgError);
            return res.status(500).json({ error: 'Failed to create Google Meet organization' });
        }

        const { error: memberInsertError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: org.id,
                user_id: userId,
                role: 'admin'
            });

        if (memberInsertError) {
            await supabase.from('organizations').delete().eq('id', org.id);
            return res.status(500).json({ error: 'Failed to add you to Google Meet organization' });
        }

        res.status(201).json({ organization: org });
    } catch (error) {
        console.error('Google Meet org error:', error);
        res.status(500).json({ error: 'Failed to get Google Meet organization' });
    }
});

/**
 * GET /api/organizations/all
 * Get ALL organizations user belongs to (multi-org support)
 */
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all organizations the user is a member of
        const { data: memberships, error: memberError } = await supabase
            .from('organization_members')
            .select(`
                role,
                joined_at,
                organizations (
                    id,
                    name,
                    slug,
                    domain,
                    invite_code,
                    created_at
                )
            `)
            .eq('user_id', userId);

        if (memberError) {
            console.error('Get all orgs error:', memberError);
            return res.status(500).json({ error: 'Failed to fetch organizations' });
        }

        // Transform the data
        const organizations = (memberships || []).map(m => ({
            ...m.organizations,
            role: m.role,
            joinedAt: m.joined_at
        }));

        res.json({ organizations });
    } catch (error) {
        console.error('Get all organizations error:', error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

/**
 * POST /api/organizations/switch
 * Switch user's active organization
 */
router.post('/switch', authMiddleware, async (req, res) => {
    try {
        const { organizationId } = req.body;
        const userId = req.user.id;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Verify user is member of this organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select(`
                role,
                organizations (
                    id,
                    name,
                    slug,
                    domain,
                    invite_code,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
        }

        // Update user metadata with active organization
        // This is stored in Supabase Auth user_metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                active_organization_id: organizationId
            }
        });

        if (updateError) {
            console.error('Update active org error:', updateError);
            return res.status(500).json({ error: 'Failed to switch organization' });
        }

        res.json({
            message: 'Organization switched successfully',
            organization: membership.organizations,
            role: membership.role
        });
    } catch (error) {
        console.error('Switch organization error:', error);
        res.status(500).json({ error: 'Failed to switch organization' });
    }
});

/**
 * POST /api/organizations/leave
 * Leave an organization (user removes themselves)
 */
router.post('/leave', authMiddleware, async (req, res) => {
    try {
        const { organizationId } = req.body;
        const userId = req.user.id;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Get user's membership in this org
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this organization' });
        }

        // If user is admin, check if there are other admins
        if (membership.role === 'admin') {
            const { data: otherAdmins } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('role', 'admin')
                .neq('user_id', userId);

            if (!otherAdmins || otherAdmins.length === 0) {
                // Check if there are other members at all
                const { data: otherMembers } = await supabase
                    .from('organization_members')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .neq('user_id', userId);

                if (otherMembers && otherMembers.length > 0) {
                    return res.status(400).json({
                        error: 'You are the only admin. Please promote another member to admin before leaving.'
                    });
                }
                // If no other members, org will be empty after leaving (could auto-delete)
            }
        }

        // Remove user from organization
        const { error: removeError } = await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', userId)
            .eq('organization_id', organizationId);

        if (removeError) {
            console.error('Leave org error:', removeError);
            return res.status(500).json({ error: 'Failed to leave organization' });
        }

        // If this was user's active org, clear it from metadata
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        if (user?.user_metadata?.active_organization_id === organizationId) {
            // Get user's remaining organizations
            const { data: remainingOrgs } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', userId)
                .limit(1);

            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: {
                    active_organization_id: remainingOrgs?.[0]?.organization_id || null
                }
            });
        }

        res.json({ message: 'Successfully left organization' });
    } catch (error) {
        console.error('Leave organization error:', error);
        res.status(500).json({ error: 'Failed to leave organization' });
    }
});

export default router;
