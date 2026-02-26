import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        const scenarios = [
            { model: 'gemini-2.0-flash', version: 'v1beta' },
            { model: 'gemini-2.0-flash', version: 'v1' },
            { model: 'gemini-1.5-flash', version: 'v1' },
            { model: 'gemini-1.5-pro', version: 'v1' }
        ];

        for (const scenario of scenarios) {
            console.log(`Testing model: ${scenario.model} (API version: ${scenario.version})...`);
            try {
                const model = genAI.getGenerativeModel({ model: scenario.model }, { apiVersion: scenario.version });
                const result = await model.generateContent("Hello, respond with 'OK' if you see this.");
                const response = await result.response;
                console.log(`✅ ${scenario.model} (${scenario.version}) is working:`, response.text().trim());
                break;
            } catch (err: any) {
                console.error(`❌ ${scenario.model} (${scenario.version}) failed:`, err.message);
            }
        }
    }
    catch (error) {
        console.error('Gemini Debug Failed:', error);
    }
}

testGemini();
