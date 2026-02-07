import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface TestGenerationRequest {
    featureName: string;
    featureDescription: string;
    userStory?: string;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    existingSelectors?: string[];
    apiEndpoints?: string[];
}

export interface GeneratedTest {
    testCode: string;
    testName: string;
    description: string;
    qualityScore: number;
    riskAlignment: number;
    generatedAt: Date;
}

export class AITestGenerator {
    private client: Anthropic;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        this.client = new Anthropic({ apiKey });
        this.model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
        this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
        this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    }

    /**
     * Generate a Cypress test using AI based on feature requirements
     */
    async generateTest(request: TestGenerationRequest): Promise<GeneratedTest> {
        const prompt = this.buildPrompt(request);

        try {
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            const responseText = message.content[0].type === 'text'
                ? message.content[0].text
                : '';

            const testCode = this.extractTestCode(responseText);
            const testName = this.extractTestName(testCode);

            return {
                testCode,
                testName,
                description: request.featureDescription,
                qualityScore: 0, // Will be calculated by TestQualityScorer
                riskAlignment: this.calculateRiskAlignment(request.riskLevel),
                generatedAt: new Date(),
            };
        } catch (error) {
            throw new Error(`AI test generation failed: ${error}`);
        }
    }

    /**
     * Build the prompt for AI test generation
     */
    private buildPrompt(request: TestGenerationRequest): string {
        const riskGuidance = this.getRiskGuidance(request.riskLevel);

        return `You are an expert QA automation engineer specializing in Cypress testing.

Generate a comprehensive Cypress test for the following feature:

**Feature Name**: ${request.featureName}
**Description**: ${request.featureDescription}
${request.userStory ? `**User Story**: ${request.userStory}` : ''}
**Risk Level**: ${request.riskLevel.toUpperCase()}

${riskGuidance}

${request.existingSelectors ? `**Available Selectors**: ${request.existingSelectors.join(', ')}` : ''}
${request.apiEndpoints ? `**API Endpoints**: ${request.apiEndpoints.join(', ')}` : ''}

**Requirements**:
1. Use TypeScript syntax
2. Use data-testid selectors (e.g., [data-testid="element-name"])
3. Include proper assertions using Cypress best practices
4. Add meaningful test descriptions
5. Handle async operations properly
6. Include edge cases and error scenarios
7. Use custom commands if appropriate (cy.login, cy.addToCart)
8. Add comments explaining complex logic
9. Follow the Page Object Model pattern where applicable
10. Ensure the test is maintainable and readable

**Output Format**:
Provide ONLY the TypeScript test code wrapped in a code block. Do not include explanations outside the code block.

Example structure:
\`\`\`typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Test implementation
  });
});
\`\`\``;
    }

    /**
     * Get risk-specific guidance for test generation
     */
    private getRiskGuidance(riskLevel: string): string {
        const guidance = {
            critical: `**CRITICAL RISK**: This feature is mission-critical. The test MUST include:
- Comprehensive positive and negative test cases
- Boundary value testing
- Error handling validation
- Data integrity checks
- Security considerations
- Rollback/recovery scenarios`,

            high: `**HIGH RISK**: This feature is important. The test should include:
- Multiple test scenarios covering main workflows
- Error handling
- Data validation
- Edge cases`,

            medium: `**MEDIUM RISK**: This feature is standard. The test should include:
- Happy path testing
- Basic error handling
- Common edge cases`,

            low: `**LOW RISK**: This feature is low priority. The test should include:
- Basic happy path testing
- Simple validation`,
        };

        return guidance[riskLevel as keyof typeof guidance] || guidance.medium;
    }

    /**
     * Extract test code from AI response
     */
    private extractTestCode(response: string): string {
        const codeBlockRegex = /```typescript\n([\s\S]*?)\n```/;
        const match = response.match(codeBlockRegex);

        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback: try to extract any code block
        const genericCodeBlock = /```\n([\s\S]*?)\n```/;
        const genericMatch = response.match(genericCodeBlock);

        if (genericMatch && genericMatch[1]) {
            return genericMatch[1].trim();
        }

        // If no code block found, return the entire response
        return response.trim();
    }

    /**
     * Extract test name from generated code
     */
    private extractTestName(testCode: string): string {
        const describeMatch = testCode.match(/describe\(['"]([^'"]+)['"]/);
        if (describeMatch && describeMatch[1]) {
            return describeMatch[1];
        }
        return 'Generated Test';
    }

    /**
     * Calculate risk alignment score
     */
    private calculateRiskAlignment(riskLevel: string): number {
        const scores = {
            critical: 100,
            high: 80,
            medium: 60,
            low: 40,
        };
        return scores[riskLevel as keyof typeof scores] || 50;
    }

    /**
     * Save generated test to file
     */
    async saveTest(test: GeneratedTest, outputDir: string): Promise<string> {
        const fileName = this.sanitizeFileName(test.testName);
        const filePath = path.join(outputDir, `${fileName}.cy.ts`);

        const fileContent = `// AI-Generated Test
// Generated: ${test.generatedAt.toISOString()}
// Description: ${test.description}
// Quality Score: ${test.qualityScore}
// Risk Alignment: ${test.riskAlignment}

${test.testCode}
`;

        await fs.promises.mkdir(outputDir, { recursive: true });
        await fs.promises.writeFile(filePath, fileContent, 'utf-8');

        return filePath;
    }

    /**
     * Sanitize file name
     */
    private sanitizeFileName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
