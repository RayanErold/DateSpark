import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-2.5-pro'
];

async function testModels() {
    for (const modelName of modelsToTest) {
        console.log(`Testing model: "${modelName}"...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello in one word.");
            console.log(`✅ SUCCESS [${modelName}]: "${result.response.text().trim()}"`);
            break; // Stop on first working model
        } catch (err) {
            console.log(`❌ FAILED [${modelName}]: ${err.message}`);
        }
    }
}

testModels();
