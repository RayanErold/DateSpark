import crypto from 'crypto';

/**
 * CollaborationService — Partner invite, stop voting, and surprise mode.
 */

const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Send a collaboration invite for a plan.
 * Creates a plan_collaborations row and emails the partner.
 */
export const invitePartner = async (supabase, emailService, { planId, ownerId, partnerEmail, isSurpriseMode }) => {
    const token = generateInviteToken();

    const { data, error } = await supabase
        .from('plan_collaborations')
        .insert([{
            plan_id: planId,
            owner_id: ownerId,
            invite_token: token,
            is_surprise_mode: !!isSurpriseMode,
            status: 'pending',
        }])
        .select()
        .single();

    if (error) throw error;

    const appUrl = process.env.VITE_APP_URL || 'https://datespark.live';
    const inviteLink = `${appUrl}/collab/accept?token=${token}`;

    if (emailService?.sendCollabInviteEmail) {
        await emailService.sendCollabInviteEmail({ partnerEmail, inviteLink, isSurpriseMode });
    }

    return { ...data, inviteLink };
};

/**
 * Accept an invite by token. Returns plan data (redacted if surprise mode).
 */
export const acceptInvite = async (supabase, token, partnerId) => {
    const { data: collab, error } = await supabase
        .from('plan_collaborations')
        .select('*')
        .eq('invite_token', token)
        .single();

    if (error || !collab) throw new Error('Invite not found.');
    if (collab.status === 'rejected') throw new Error('This invite was declined.');
    if (new Date(collab.expires_at) < new Date()) throw new Error('This invite has expired.');

    const { error: updateError } = await supabase
        .from('plan_collaborations')
        .update({ status: 'accepted', partner_id: partnerId })
        .eq('id', collab.id);

    if (updateError) throw updateError;

    // Fetch the plan
    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', collab.plan_id)
        .single();

    if (planError || !plan) throw new Error('Plan not found.');

    // In surprise mode, redact the itinerary for the partner
    if (collab.is_surprise_mode && plan.user_id !== partnerId) {
        return {
            plan: { ...plan, itinerary: null, description: null },
            isSurpriseMode: true,
            planId: collab.plan_id
        };
    }

    return { plan, isSurpriseMode: false, planId: collab.plan_id };
};

/**
 * Submit or update a vote on a stop.
 */
export const submitVote = async (supabase, { planId, stopIndex, userId, vote }) => {
    const { data, error } = await supabase
        .from('stop_votes')
        .upsert([{
            plan_id: planId,
            stop_index: stopIndex,
            user_id: userId,
            vote,
        }], { onConflict: 'plan_id,stop_index,user_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get aggregated vote summary for a plan.
 * Returns: { [stopIndex]: { love: N, maybe: N, skip: N, myVote: string|null } }
 */
export const getVoteSummary = async (supabase, planId, userId) => {
    const { data, error } = await supabase
        .from('stop_votes')
        .select('*')
        .eq('plan_id', planId);

    if (error) throw error;

    const summary = {};
    for (const vote of (data || [])) {
        if (!summary[vote.stop_index]) {
            summary[vote.stop_index] = { love: 0, maybe: 0, skip: 0, myVote: null };
        }
        summary[vote.stop_index][vote.vote] = (summary[vote.stop_index][vote.vote] || 0) + 1;
        if (vote.user_id === userId) {
            summary[vote.stop_index].myVote = vote.vote;
        }
    }
    return summary;
};

/**
 * Get the collaboration status for a plan.
 */
export const getCollabStatus = async (supabase, planId, userId) => {
    const { data, error } = await supabase
        .from('plan_collaborations')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;

    return {
        status: data.status,
        isSurpriseMode: data.is_surprise_mode,
        isOwner: data.owner_id === userId,
        isPartner: data.partner_id === userId,
        inviteToken: data.owner_id === userId ? data.invite_token : null,
    };
};

/**
 * Get all collaborations associated with a user (either owned or joined).
 */
export const getUserCollaborations = async (supabase, userId) => {
    const { data: collabs, error } = await supabase
        .from('plan_collaborations')
        .select('*, plans:plan_id (*)')
        .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const result = [];
    for (const collab of (collabs || [])) {
        let partnerName = 'Someone';
        let partnerAvatar = '';

        const otherUserId = collab.owner_id === userId ? collab.partner_id : collab.owner_id;
        if (otherUserId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, avatar_url')
                .eq('id', otherUserId)
                .single();
            if (profile) {
                partnerName = profile.first_name || 'Partner';
                partnerAvatar = profile.avatar_url || '';
            }
        } else if (collab.partner_email) {
            partnerName = collab.partner_email.split('@')[0];
        }

        result.push({
            ...collab,
            partnerName,
            partnerAvatar,
            plan: collab.plans
        });
    }

    return result;
};
