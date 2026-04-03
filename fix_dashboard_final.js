const fs = require('fs');
const path = 'c:/Users/Erold Rayan/Downloads/Million Dollar Web app Ideas/Date Planner app/src/pages/Dashboard.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // Look for fetchUserData(); followed by return () => clearTimeout(timeout);
    // There are some spaces and newlines between them.
    const searchPattern = /fetchUserData\(\);\s+return \(\) => clearTimeout\(timeout\);/m;
    
    const replacement = `fetchUserData();
        
        // Safety timeout to prevent infinite "Loading..." hang
        const timeout = setTimeout(() => {
            setIsLoading(current => {
                if (current) {
                    console.warn('Dashboard - Fetch timed out, forcing load completion');
                    return false;
                }
                return current;
            });
        }, 8000);

        return () => clearTimeout(timeout);`;

    if (searchPattern.test(content)) {
        const newContent = content.replace(searchPattern, replacement);
        fs.writeFileSync(path, newContent);
        console.log('SUCCESS: File patched successfully.');
    } else {
        console.error('ERROR: Could not find the pattern to replace.');
        // Fallback: search for just the return statement if fetchUserData is missing or far away
        const fallbackPattern = /return \(\) => clearTimeout\(timeout\);/;
        if (fallbackPattern.test(content)) {
            console.log('Trying fallback pattern...');
            const newContent = content.replace(fallbackPattern, replacement);
            fs.writeFileSync(path, newContent);
            console.log('SUCCESS: File patched with fallback.');
        } else {
            process.exit(1);
        }
    }
} catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
}
