import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/data directory exists
const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const FILE_CACHE_PATH = path.join(DATA_DIR, 'places_cache.json');

// Initialize in-memory cache
const memoryCache = new NodeCache({ stdTTL: 86400 * 30 }); // Default 30 days TTL

let supabaseAdmin = null;
let supabaseCacheEnabled = false;
let localFileCache = {};

// Load local file cache at startup
try {
    if (fs.existsSync(FILE_CACHE_PATH)) {
        const fileContent = fs.readFileSync(FILE_CACHE_PATH, 'utf8');
        localFileCache = JSON.parse(fileContent);
        // Populate node-cache
        for (const [key, value] of Object.entries(localFileCache)) {
            memoryCache.set(key, value);
        }
        console.log(`[CacheService] Loaded ${Object.keys(localFileCache).length} cached entries from local file.`);
    }
} catch (err) {
    console.error('[CacheService] Failed to load local file cache:', err.message);
}

export const normalizeQueryKey = (str) => {
    if (!str) return '';
    let target = str;
    if (typeof str === 'object') {
        target = str.textQuery || JSON.stringify(str);
    }
    const clean = String(target)
        .toLowerCase()
        .replace(/^places_search_/, '')
        .replace(/\{|\}|"|'/g, '')
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        .trim();
    return `places_search_${clean}`;
};

export const normalizePlaceId = (placeId) => {
    if (!placeId) return null;
    const cleanId = String(placeId).replace(/^places\//, '').trim();
    return `place_id_${cleanId}`;
};

export const normalizeVenueKey = (venueName, city) => {
    if (!venueName) return null;
    const cleanName = String(venueName).toLowerCase().replace(/[^\w]/gi, '');
    const cleanCity = String(city || '').toLowerCase().replace(/[^\w]/gi, '');
    return `venue_${cleanName}_${cleanCity}`;
};

export const initCacheService = async (config) => {
    supabaseAdmin = config.supabaseAdmin;
    if (supabaseAdmin) {
        try {
            // Check if table exists
            const { data, error } = await supabaseAdmin
                .from('google_places_cache')
                .select('query')
                .limit(1);
            
            if (error) {
                if (error.message.includes('Could not find the table') || error.code === '42P01') {
                    console.warn('[CacheService] google_places_cache table does not exist in Supabase. Falling back to local file/memory cache.');
                    supabaseCacheEnabled = false;
                } else {
                    console.error('[CacheService] Error checking cache table in Supabase:', error.message);
                }
            } else {
                console.log('[CacheService] Supabase google_places_cache table is available and enabled.');
                supabaseCacheEnabled = true;
            }
        } catch (err) {
            console.error('[CacheService] Failed to check cache table:', err.message);
        }
    }
};

export const getCachedPlace = async (queryKey) => {
    if (!queryKey) return null;

    const normalizedKey = normalizeQueryKey(queryKey);
    const keysToTry = [normalizedKey];
    if (typeof queryKey === 'string' && queryKey !== normalizedKey) {
        keysToTry.push(queryKey);
    }

    for (const key of keysToTry) {
        // 1. Check in-memory cache
        const memVal = memoryCache.get(key);
        if (memVal) {
            return memVal;
        }

        // 2. Check Supabase cache if enabled
        if (supabaseCacheEnabled && supabaseAdmin) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('google_places_cache')
                    .select('result')
                    .eq('query', key)
                    .maybeSingle();

                if (!error && data && data.result) {
                    memoryCache.set(key, data.result);
                    return data.result;
                }
            } catch (err) {
                console.error(`[CacheService] Error reading from Supabase cache for key "${key}":`, err.message);
            }
        } else {
            // Check local file cache if Supabase not enabled
            if (localFileCache[key]) {
                memoryCache.set(key, localFileCache[key]);
                return localFileCache[key];
            }
        }
    }

    return null;
};

export const setCachedPlace = async (queryKey, result, extraKeys = []) => {
    if (!queryKey || !result) return;

    const primaryKey = normalizeQueryKey(queryKey);
    const allKeys = Array.from(new Set([primaryKey, ...extraKeys.filter(Boolean)]));

    for (const key of allKeys) {
        // 1. Save to memory cache
        memoryCache.set(key, result);

        // 2. Save to Supabase cache if enabled
        if (supabaseCacheEnabled && supabaseAdmin) {
            try {
                const { error } = await supabaseAdmin
                    .from('google_places_cache')
                    .upsert({ query: key, result: result, created_at: new Date().toISOString() });
                
                if (error) {
                    console.error(`[CacheService] Supabase upsert error for key "${key}":`, error.message);
                }
            } catch (err) {
                console.error(`[CacheService] Error writing to Supabase cache for key "${key}":`, err.message);
            }
        } else {
            // Save to local file cache
            localFileCache[key] = result;
        }
    }

    if (!supabaseCacheEnabled) {
        try {
            fs.writeFileSync(FILE_CACHE_PATH, JSON.stringify(localFileCache, null, 2), 'utf8');
        } catch (err) {
            console.error('[CacheService] Failed to write local file cache:', err.message);
        }
    }
};
