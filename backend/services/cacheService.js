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
    
    // 1. Check in-memory cache
    const memVal = memoryCache.get(queryKey);
    if (memVal) {
        return memVal;
    }

    // 2. Check Supabase cache if enabled
    if (supabaseCacheEnabled && supabaseAdmin) {
        try {
            const { data, error } = await supabaseAdmin
                .from('google_places_cache')
                .select('result')
                .eq('query', queryKey)
                .maybeSingle();

            if (!error && data && data.result) {
                memoryCache.set(queryKey, data.result);
                return data.result;
            }
        } catch (err) {
            console.error(`[CacheService] Error reading from Supabase cache:`, err.message);
        }
    } else {
        // Check local file cache if Supabase not enabled
        if (localFileCache[queryKey]) {
            memoryCache.set(queryKey, localFileCache[queryKey]);
            return localFileCache[queryKey];
        }
    }

    return null;
};

export const setCachedPlace = async (queryKey, result) => {
    if (!queryKey || !result) return;

    // 1. Save to memory cache
    memoryCache.set(queryKey, result);

    // 2. Save to Supabase cache if enabled
    if (supabaseCacheEnabled && supabaseAdmin) {
        try {
            const { error } = await supabaseAdmin
                .from('google_places_cache')
                .upsert({ query: queryKey, result: result, created_at: new Date().toISOString() });
            
            if (error) {
                console.error('[CacheService] Supabase upsert error:', error.message);
            }
        } catch (err) {
            console.error('[CacheService] Error writing to Supabase cache:', err.message);
        }
    } else {
        // Save to local file cache
        localFileCache[queryKey] = result;
        try {
            fs.writeFileSync(FILE_CACHE_PATH, JSON.stringify(localFileCache, null, 2), 'utf8');
        } catch (err) {
            console.error('[CacheService] Failed to write local file cache:', err.message);
        }
    }
};
