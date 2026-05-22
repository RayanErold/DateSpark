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
