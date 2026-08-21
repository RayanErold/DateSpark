import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Fetching supported models from Google API...");

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        if (data.models) {
            console.log("\nAVAILABLE MODELS FOR YOUR API KEY:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log("Error response:", JSON.stringify(data, null, 2));
        }
    })
    .catch(err => console.error("Fetch error:", err));
