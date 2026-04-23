/**
 * Shared Google Maps loader configuration.
 *
 * CRITICAL: The `libraries` array MUST be defined as a module-level constant
 * (not inline) and shared across ALL components. If each component creates its
 * own `useJsApiLoader({ libraries: [...] })` with a different reference, the
 * Google Maps script loader (a singleton) will throw:
 *   "Loader must not be called again with different options."
 *
 * Solution: Every component that needs Google Maps imports `useGoogleMaps`
 * from this file instead of calling `useJsApiLoader` directly.
 */
import { useJsApiLoader } from '@react-google-maps/api';

// ⚠️ Keep this as a module-level constant — never define it inline inside a component.
const LIBRARIES = ['places'];

/**
 * Drop-in replacement for useJsApiLoader.
 * Returns { isLoaded, loadError } — same API as the original hook.
 */
export const useGoogleMaps = () => {
    return useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    });
};
