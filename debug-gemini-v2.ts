import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * DEBUG SCRIPT: Test Gemini connectivity and available models.
 * 
 * RUN AS: 
 * node --env-file=.env -r ts-node/register debug-gemini-v2.ts
 */

async function testModel(genAI: any, modelName: string) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        console.log(`  ✅ ${modelName} works:`, result.response.text().substring(0, 50).replace(/\n/g, ' '), '...');
    } catch (e) {
        console.error(`  ❌ ${modelName} failed:`, (e as Error).message);
    }
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY not set in environment.');
        console.log('Ensure you are running with: node --env-file=.env ...');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    await testModel(genAI, 'gemini-1.5-pro');
    await testModel(genAI, 'gemini-1.5-flash');
    await testModel(genAI, 'gemini-2.0-flash');
}

main();
