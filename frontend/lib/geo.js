export const isLocationInServiceArea = (locationStr, lat, lng) => {
    if (!locationStr && lat === null) return false;
    
    // Bounding box for NYC + New Jersey (Roughly 38.9 to 41.4 Lat, -75.6 to -73.7 Lng)
    // covers the state of NJ and all of NYC
    const isWithinCoords = lat >= 38.9 && lat <= 41.4 && lng >= -75.6 && lng <= -73.7;
    if (lat !== null && lng !== null) return isWithinCoords;

    // Fallback to string check for common service area identifiers
    const serviceKeywords = [
        'new york', 'brooklyn', 'queens', 'bronx', 'staten island', 'manhattan', 'ny', 
        'nj', 'new jersey', 'jersey city', 'hoboken', 'newark', 'weehawken', 'union city',
        'bayonne', 'edgewater', 'fort lee', 'north bergen', 'guttenberg', 'princeton',
        'trenton', 'atlantic city', 'morristown', 'montclair', 'paramus', 'asbury park'
    ];
    const zipPrefixes = [
        '100', '101', '102', '103', '104', '110', '111', '112', '113', '114', '116', // NYC
        '07', '08' // NJ
    ];
    
    const lowerLoc = (locationStr || '').toLowerCase().trim();
    const hasKeyword = serviceKeywords.some(kw => lowerLoc.includes(kw));
    const hasZip = zipPrefixes.some(prefix => {
        const regex = new RegExp(`(^|\\s|\\W)${prefix}\\d{2}($|\\s|\\W)`);
        return regex.test(lowerLoc);
    });

    return hasKeyword || hasZip;
};
