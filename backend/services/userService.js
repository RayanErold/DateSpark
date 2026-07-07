/**
 * UserService — Manages user lifecycle, usage limits, and profiles.
 */

export const checkUsageLimits = async (supabase, userId, type) => {
    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profile) return { allowed: true, isPremium: false };

        const isPremium = !!profile.is_premium;
        if (isPremium) return { allowed: true, isPremium, profile };

        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)
            .single();

        const limits = { classic: 50, guided: 50, swap: 100, save_weekly: 100 };
        const now = new Date();
        const lastUpdate = usage ? new Date(usage.updated_at || usage.created_at) : null;

        const cooldownMs = type.endsWith('_weekly') ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const isCooldownActive = lastUpdate && (now - lastUpdate < cooldownMs);

        if (usage && isCooldownActive && usage.count >= limits[type]) {
            return { allowed: false, isPremium, profile };
        }

        if (!usage) {
            await supabase.from('usage_tracking').insert([{ user_id: userId, type, count: 1 }]);
        } else if (!isCooldownActive) {
            await supabase.from('usage_tracking').update({ count: 1, updated_at: now.toISOString() }).eq('id', usage.id);
        } else {
            await supabase.from('usage_tracking').update({ count: usage.count + 1, updated_at: now.toISOString() }).eq('id', usage.id);
        }
        return { allowed: true, isPremium, profile };
    } catch (err) {
        console.error('[Usage Error]', err);
        return { allowed: true, isPremium: false };
    }
};

export const getUserPremiumStatus = async (supabase, userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return {
        isPremium: !!data?.is_premium,
        isAdmin: !!data?.is_admin,
        premium_expiry: data?.premium_expiry,
        referral_code: data?.referral_code,
        referral_count: data?.referral_count
    };
};

export const getUserUsage = async (supabase, userId) => {
    const { data } = await supabase.from('usage_tracking').select('*').eq('user_id', userId);
    const usage = { classic: 0, guided: 0, swap: 0, save_weekly: 0 };
    const limits = { classic: 2, guided: 2, swap: 3, save_weekly: 3 };
    data?.forEach(u => { usage[u.type] = u.count; });
    return { usage, limits };
};

export const updateAvatar = async (supabaseAdmin, userId, fileData, contentType) => {
    const fileExt = contentType?.split('/')[1] || 'png';
    const filePath = `${userId}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, fileData, { upsert: true, contentType });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { avatar_url: publicUrl }
    });

    return publicUrl;
};

/**
 * Apply a subscription plan to a user's profile.
 * Called by gift card redemption and webhook handlers.
 * planType: '24H' | 'COUPLES_MONTH' | 'COUPLES_YEAR' | 'ELITE'
 */
export const applySubscriptionPlan = async (supabaseAdmin, userId, planType) => {
    const now = new Date();
    let expiryDate = null;

    if (planType === '24H') {
        expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (planType === 'COUPLES_MONTH' || planType === 'ELITE') {
        expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (planType === 'COUPLES_YEAR') {
        expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
            is_premium: true,
            premium_expiry: expiryDate ? expiryDate.toISOString() : null,
            updated_at: now.toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const awardXPAndCheckStreak = async (supabase, userId, xpAmount) => {
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) {
        const defaultProfile = {
            id: userId,
            xp: 0,
            level: 1,
            streak_count: 0,
            completed_challenges: [],
            last_date_completed_at: null
        };
        const { data: inserted } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single();
        profile = inserted || defaultProfile;
    }

    let newXP = (profile.xp || 0) + xpAmount;
    let newLevel = profile.level || 1;
    if (newXP >= 100) {
        const levelUps = Math.floor(newXP / 100);
        newLevel += levelUps;
        newXP = newXP % 100;
    }

    const now = new Date();
    let newStreak = profile.streak_count || 0;
    const lastCompleted = profile.last_date_completed_at ? new Date(profile.last_date_completed_at) : null;

    if (!lastCompleted) {
        newStreak = 1;
    } else {
        const diffTime = Math.abs(now - lastCompleted);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 10) {
            newStreak = 1; // Reset streak if inactive for more than 10 days
        } else if (diffDays >= 2 && diffDays <= 10) {
            newStreak += 1; // Increment streak if completing dates regularly
        }
    }

    const { data: updated, error } = await supabase
        .from('profiles')
        .update({
            xp: newXP,
            level: newLevel,
            streak_count: newStreak,
            last_date_completed_at: now.toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return updated;
};
