import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { GeneratedTest } from '../ai/ai-test-generator';
import { QualityMetrics } from '../ai/test-quality-scorer';

export interface ValidationDecision {
    testName: string;
    approved: boolean;
    rejectionReason?: RejectionReason;
    reviewerComments?: string;
    reviewedAt: Date;
    reviewedBy: string;
}

export type RejectionReason =
    | 'incorrect-assertions'
    | 'missing-edge-cases'
    | 'poor-selectors'
    | 'syntax-errors'
    | 'incomplete-coverage'
    | 'poor-maintainability'
    | 'not-aligned-with-requirements'
    | 'security-concerns'
    | 'performance-issues'
    | 'other';

export interface ValidationWorkflowOptions {
    autoApproveThreshold?: number; // Auto-approve if quality score >= this
    interactive?: boolean; // Enable interactive CLI review
    reviewer?: string;
}

export class ValidationWorkflow {
    private rl: readline.Interface;
    private options: Required<ValidationWorkflowOptions>;

    constructor(options: ValidationWorkflowOptions = {}) {
        this.options = {
            autoApproveThreshold: options.autoApproveThreshold ?? 85,
            interactive: options.interactive ?? true,
            reviewer: options.reviewer ?? 'human-reviewer',
        };

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    /**
     * Validate a generated test with human review
     */
    async validateTest(
        test: GeneratedTest,
        qualityMetrics: QualityMetrics
    ): Promise<ValidationDecision> {
        // Auto-approve high-quality tests if configured
        if (
            !this.options.interactive &&
            qualityMetrics.overallScore >= this.options.autoApproveThreshold
        ) {
            return {
                testName: test.testName,
                approved: true,
                reviewedAt: new Date(),
                reviewedBy: 'auto-validator',
            };
        }

        // Interactive review
        if (this.options.interactive) {
            return await this.interactiveReview(test, qualityMetrics);
        }

        // Default: require manual review
        return {
            testName: test.testName,
            approved: false,
            rejectionReason: 'other',
            reviewerComments: 'Pending manual review',
            reviewedAt: new Date(),
            reviewedBy: this.options.reviewer,
        };
    }

    /**
     * Interactive CLI review process
     */
    private async interactiveReview(
        test: GeneratedTest,
        qualityMetrics: QualityMetrics
    ): Promise<ValidationDecision> {
        console.log('\n' + '='.repeat(80));
        console.log('🤖 AI-GENERATED TEST REVIEW');
        console.log('='.repeat(80));
        console.log(`\nTest Name: ${test.testName}`);
        console.log(`Description: ${test.description}`);
        console.log(`Generated: ${test.generatedAt.toISOString()}`);
        console.log(`\nQuality Score: ${qualityMetrics.overallScore}/100`);
        console.log(`  - Syntax: ${qualityMetrics.syntaxScore}/100`);
        console.log(`  - Coverage: ${qualityMetrics.coverageScore}/100`);
        console.log(`  - Assertions: ${qualityMetrics.assertionScore}/100`);
        console.log(`  - Maintainability: ${qualityMetrics.maintainabilityScore}/100`);
        console.log(`  - Best Practices: ${qualityMetrics.bestPracticesScore}/100`);

        if (qualityMetrics.issues.length > 0) {
            console.log(`\n⚠️  Issues Found (${qualityMetrics.issues.length}):`);
            qualityMetrics.issues.forEach((issue) => {
                const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`  ${icon} [${issue.category}] ${issue.message}`);
            });
        }

        console.log('\n--- Test Code ---');
        console.log(test.testCode);
        console.log('--- End of Test Code ---\n');

        const approved = await this.askQuestion('Approve this test? (y/n): ');

        if (approved.toLowerCase() === 'y') {
            const comments = await this.askQuestion('Optional comments: ');
            return {
                testName: test.testName,
                approved: true,
                reviewerComments: comments || undefined,
                reviewedAt: new Date(),
                reviewedBy: this.options.reviewer,
            };
        } else {
            const reason = await this.selectRejectionReason();
            const comments = await this.askQuestion('Rejection comments (required): ');

            return {
                testName: test.testName,
                approved: false,
                rejectionReason: reason,
                reviewerComments: comments,
                reviewedAt: new Date(),
                reviewedBy: this.options.reviewer,
            };
        }
    }

    /**
     * Ask user to select rejection reason
     */
    private async selectRejectionReason(): Promise<RejectionReason> {
        console.log('\nSelect rejection reason:');
        console.log('1. Incorrect assertions');
        console.log('2. Missing edge cases');
        console.log('3. Poor selectors');
        console.log('4. Syntax errors');
        console.log('5. Incomplete coverage');
        console.log('6. Poor maintainability');
        console.log('7. Not aligned with requirements');
        console.log('8. Security concerns');
        console.log('9. Performance issues');
        console.log('10. Other');

        const choice = await this.askQuestion('Enter number (1-10): ');

        const reasons: RejectionReason[] = [
            'incorrect-assertions',
            'missing-edge-cases',
            'poor-selectors',
            'syntax-errors',
            'incomplete-coverage',
            'poor-maintainability',
            'not-aligned-with-requirements',
            'security-concerns',
            'performance-issues',
            'other',
        ];

        const index = parseInt(choice) - 1;
        return reasons[index] || 'other';
    }

    /**
     * Ask a question and get user input
     */
    private askQuestion(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    /**
     * Close the readline interface
     */
    close(): void {
        this.rl.close();
    }

    /**
     * Batch validate multiple tests
     */
    async validateBatch(
        tests: Array<{ test: GeneratedTest; metrics: QualityMetrics }>
    ): Promise<ValidationDecision[]> {
        const decisions: ValidationDecision[] = [];

        for (const { test, metrics } of tests) {
            const decision = await this.validateTest(test, metrics);
            decisions.push(decision);
        }

        return decisions;
    }

    /**
     * Save validation decision to file
     */
    async saveDecision(decision: ValidationDecision, outputPath: string): Promise<void> {
        const data = JSON.stringify(decision, null, 2);
        await fs.promises.writeFile(outputPath, data, 'utf-8');
    }

    /**
     * Load validation decisions from directory
     */
    async loadDecisions(directoryPath: string): Promise<ValidationDecision[]> {
        const files = await fs.promises.readdir(directoryPath);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        const decisions: ValidationDecision[] = [];

        for (const file of jsonFiles) {
            const filePath = path.join(directoryPath, file);
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const decision = JSON.parse(content) as ValidationDecision;
            decisions.push(decision);
        }

        return decisions;
    }
}
