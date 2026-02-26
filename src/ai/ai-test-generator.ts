import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface TestGenerationRequest {
    featureName: string;
    featureDescription: string;
    userStory?: string;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    existingSelectors?: string[];
    apiEndpoints?: string[];
    /** Real HTML snippet of the page — used to ground Claude in real selectors */
    pageHtml?: string;
    /** Test credentials to use in generated tests */
    credentials?: {
        user: { email: string; password: string };
        admin?: { email: string; password: string };
    };
    /** Base URL of the running application */
    baseUrl?: string;
}

export interface GeneratedTest {
    testCode: string;
    testName: string;
    description: string;
    qualityScore: number;
    riskAlignment: number;
    generatedAt: Date;
}

interface AIProvider {
    generate(prompt: string): Promise<string>;
}

class ClaudeProvider implements AIProvider {
    private client: Anthropic;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude');
        }
        this.client = new Anthropic({ apiKey });
        this.model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
        this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
        this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    }

    async generate(prompt: string): Promise<string> {
        const message = await this.client.messages.create({
            model: this.model,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            messages: [{ role: 'user', content: prompt }],
        });

        return message.content[0].type === 'text' ? message.content[0].text : '';
    }
}

class GeminiProvider implements AIProvider {
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required for Gemini');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({
            model: process.env.AI_MODEL || 'gemini-1.5-pro'
        });
    }

    async generate(prompt: string): Promise<string> {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}

class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required for OpenAI');
        }
        this.client = new OpenAI({ apiKey });
        this.model = process.env.AI_MODEL || 'gpt-4o';
        this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
        this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    }

    async generate(prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
        });

        return response.choices[0]?.message?.content || '';
    }
}

export class AITestGenerator {
    private provider: AIProvider;

    constructor() {
        const providerType = (process.env.AI_PROVIDER || 'claude').toLowerCase();

        if (providerType === 'gemini') {
            this.provider = new GeminiProvider();
        } else if (providerType === 'openai') {
            this.provider = new OpenAIProvider();
        } else {
            this.provider = new ClaudeProvider();
        }
    }

    /**
     * Validate selectors against the DOM structure
     */
    private validateSelectors(selectors: string[]): string[] {
        const validSelectors: string[] = [];
        const domPath = path.resolve(__dirname, '../../demo-app/public/index.html');
        const domContent = fs.readFileSync(domPath, 'utf-8');

        selectors.forEach((selector) => {
            if (domContent.includes(`data-testid="${selector}"`)) {
                validSelectors.push(selector);
            }
        });

        return validSelectors;
    }

    /**
     * Generate a Cypress test using AI based on feature requirements
     */
    async generateTest(request: TestGenerationRequest): Promise<GeneratedTest> {
        // Validate selectors before generating the test
        const validatedSelectors = request.existingSelectors
            ? this.validateSelectors(request.existingSelectors)
            : [];

        const prompt = this.buildPrompt({ ...request, existingSelectors: validatedSelectors });

        try {
            const responseText = await this.provider.generate(prompt);
            const testCode = this.extractTestCode(responseText);
            const testName = this.extractTestName(testCode);

            return {
                testCode,
                testName,
                description: request.featureDescription,
                qualityScore: 0,
                riskAlignment: this.calculateRiskAlignment(request.riskLevel),
                generatedAt: new Date(),
            };
        } catch (error) {
            throw new Error(`AI test generation failed: ${error}`);
        }
    }

    private buildPrompt(request: TestGenerationRequest): string {
        const riskGuidance = this.getRiskGuidance(request.riskLevel);
        const baseUrl = request.baseUrl || 'http://localhost:3000';
        const creds = request.credentials;
        const userCred = creds?.user ? `email: ${creds.user.email} / password: ${creds.user.password}` : 'user@shop.com / user123';
        const adminCred = creds?.admin ? `email: ${creds.admin.email} / password: ${creds.admin.password}` : 'admin@shop.com / admin123';

        return `You are an expert QA automation engineer specializing in Cypress testing.

Generate a comprehensive, REAL Cypress E2E test for the following feature of a demo e-commerce SPA.

**Feature Name**: ${request.featureName}
**Description**: ${request.featureDescription}
${request.userStory ? `**User Story**: ${request.userStory}` : ''}
**Risk Level**: ${request.riskLevel.toUpperCase()}
**Base URL**: ${baseUrl}

${riskGuidance}

${request.existingSelectors && request.existingSelectors.length > 0
                ? `**Verified data-testid selectors available in this page**:\n${request.existingSelectors.map((s) => `  [data-testid="${s}"]`).join('\n')}`
                : ''}

${request.apiEndpoints && request.apiEndpoints.length > 0
                ? `**Real API Endpoints**:\n${request.apiEndpoints.map((e) => `  ${e}`).join('\n')}`
                : ''}

${request.pageHtml
                ? `**Actual HTML of this page section** (use ONLY the selectors present here):
\`\`\`html
${request.pageHtml.substring(0, 3000)}
\`\`\``
                : ''}

**Test Credentials**:
- User : ${userCred}
- Admin: ${adminCred}

**Requirements**:
1. Use TypeScript syntax
2. ONLY use data-testid selectors that exist in the verified selectors list above — do NOT invent new ones
3. Use cy.intercept() to spy on API calls and cy.wait() on those aliases. **NOTE**: Search and category filtering are handled CLIENT-SIDE in this app; do NOT use cy.intercept or cy.wait for search/filter actions.
4. Include at least one negative test case (e.g. wrong password, empty form)
5. Use cy.request() for API-level setup/teardown (e.g. clearing cart, logging in via API)
6. base URL is ${baseUrl} — use cy.visit('/') not cy.visit('${baseUrl}')
7. For login, use the custom command cy.login(email, password) which is already defined
8. Add meaningful describe and it descriptions
9. Each it() block should be independent — use beforeEach for shared setup
10. Add comments explaining WHY not just WHAT

**Output Format**:
Provide ONLY the TypeScript test code wrapped in a single typescript code block. No explanations outside the block.

\`\`\`typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle happy path', () => {
    // ...
  });

  it('should handle error scenario', () => {
    // ...
  });
});
\`\`\``;
    }

    private getRiskGuidance(riskLevel: string): string {
        const guidance = {
            critical: `**CRITICAL RISK**: This feature is mission-critical...`,
            high: `**HIGH RISK**: This feature is important...`,
            medium: `**MEDIUM RISK**: This feature is standard...`,
            low: `**LOW RISK**: This feature is low priority...`,
        };
        return guidance[riskLevel as keyof typeof guidance] || guidance.medium;
    }

    private extractTestCode(response: string): string {
        const codeBlockRegex = /```typescript\n([\s\S]*?)\n```/;
        const match = response.match(codeBlockRegex);

        if (match && match[1]) {
            return match[1].trim();
        }

        const genericCodeBlock = /```\n([\s\S]*?)\n```/;
        const genericMatch = response.match(genericCodeBlock);

        if (genericMatch && genericMatch[1]) {
            return genericMatch[1].trim();
        }

        return response.trim();
    }

    private extractTestName(testCode: string): string {
        const describeMatch = testCode.match(/describe\(['"]([^'"]+)['"]/);
        if (describeMatch && describeMatch[1]) {
            return describeMatch[1];
        }
        return 'Generated Test';
    }

    private calculateRiskAlignment(riskLevel: string): number {
        const scores = { critical: 100, high: 80, medium: 60, low: 40 };
        return scores[riskLevel as keyof typeof scores] || 50;
    }

    async saveTest(test: GeneratedTest, outputDir: string): Promise<string> {
        const fileName = this.sanitizeFileName(test.testName);
        const filePath = path.join(outputDir, `${fileName}.cy.ts`);

        const fileContent = `// AI-Generated Test
// Generated: ${test.generatedAt.toISOString()}
// Description: ${test.description}

${test.testCode}
`;

        await fs.promises.mkdir(outputDir, { recursive: true });
        await fs.promises.writeFile(filePath, fileContent, 'utf-8');

        return filePath;
    }

    private sanitizeFileName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
