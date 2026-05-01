import * as itineraryService from './itineraryService.js';
import * as userService from './userService.js';

/**
 * GenerationService — High-level orchestrator for date generation.
 * Handles usage checks, AI generation, and persistence.
 */

export const generatePlanFlow = async (supabase, userId, params, type = 'classic') => {
    // 1. Check Usage Limits
    const usage = await userService.checkUsageLimits(supabase, userId, type);
    if (!usage.allowed) {
        throw { status: 403, message: 'Limit reached', code: 'LIMIT_REACHED' };
    }

    // 2. Generate Itinerary (Switch between AI and Google based on type)
    let aiResult;
    if (type === 'guided') {
        aiResult = await itineraryService.generateGoogleDate(params);
    } else {
        aiResult = await itineraryService.generateAIDate(params);
    }

    // 3. Persist to Database
    const savedPlan = await itineraryService.savePlan(supabase, userId, params, aiResult);

    return savedPlan;
};

export const recreatePlanFlow = async (supabase, userId, planId, type = 'classic') => {
    // 1. Check Usage Limits
    const usage = await userService.checkUsageLimits(supabase, userId, type);
    if (!usage.allowed) {
        throw { status: 403, message: 'Limit reached', code: 'LIMIT_REACHED' };
    }

    // 2. Recreate Plan (ItineraryService handles the lookup and re-generation)
    const newPlan = await itineraryService.recreatePlan(supabase, planId);

    return newPlan;
};
