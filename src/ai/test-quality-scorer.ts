import * as fs from 'fs';

export interface QualityMetrics {
    syntaxScore: number;
    coverageScore: number;
    assertionScore: number;
    maintainabilityScore: number;
    bestPracticesScore: number;
    overallScore: number;
    issues: QualityIssue[];
}

export interface QualityIssue {
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    line?: number;
}

export class TestQualityScorer {
    /**
     * Score the quality of a generated test
     */
    async scoreTest(testCode: string): Promise<QualityMetrics> {
        const issues: QualityIssue[] = [];

        // 1. Syntax Score (20%)
        const syntaxScore = this.checkSyntax(testCode, issues);

        // 2. Coverage Score (25%)
        const coverageScore = this.checkCoverage(testCode, issues);

        // 3. Assertion Score (25%)
        const assertionScore = this.checkAssertions(testCode, issues);

        // 4. Maintainability Score (15%)
        const maintainabilityScore = this.checkMaintainability(testCode, issues);

        // 5. Best Practices Score (15%)
        const bestPracticesScore = this.checkBestPractices(testCode, issues);

        // Calculate weighted overall score
        const overallScore = Math.round(
            syntaxScore * 0.20 +
            coverageScore * 0.25 +
            assertionScore * 0.25 +
            maintainabilityScore * 0.15 +
            bestPracticesScore * 0.15
        );

        return {
            syntaxScore,
            coverageScore,
            assertionScore,
            maintainabilityScore,
            bestPracticesScore,
            overallScore,
            issues,
        };
    }

    /**
     * Check syntax quality
     */
    private checkSyntax(testCode: string, issues: QualityIssue[]): number {
        let score = 100;

        // Check for basic TypeScript syntax
        if (!testCode.includes('describe(')) {
            issues.push({
                severity: 'error',
                category: 'syntax',
                message: 'Missing describe block',
            });
            score -= 30;
        }

        if (!testCode.includes('it(')) {
            issues.push({
                severity: 'error',
                category: 'syntax',
                message: 'Missing it/test block',
            });
            score -= 30;
        }

        // Check for proper string quotes
        const singleQuotes = (testCode.match(/'/g) || []).length;
        const doubleQuotes = (testCode.match(/"/g) || []).length;
        if (singleQuotes > 0 && doubleQuotes > 0) {
            issues.push({
                severity: 'warning',
                category: 'syntax',
                message: 'Inconsistent quote usage',
            });
            score -= 5;
        }

        // Check for semicolons
        const lines = testCode.split('\n');
        const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//'));
        const linesWithSemicolon = codeLines.filter(l => l.trim().endsWith(';') || l.trim().endsWith('{') || l.trim().endsWith('}'));
        if (linesWithSemicolon.length < codeLines.length * 0.5) {
            issues.push({
                severity: 'info',
                category: 'syntax',
                message: 'Missing semicolons in some statements',
            });
            score -= 5;
        }

        return Math.max(0, score);
    }

    /**
     * Check test coverage completeness
     */
    private checkCoverage(testCode: string, issues: QualityIssue[]): number {
        let score = 100;

        // Check for multiple test cases
        const itBlocks = (testCode.match(/it\(/g) || []).length;
        if (itBlocks < 2) {
            issues.push({
                severity: 'warning',
                category: 'coverage',
                message: 'Only one test case found. Consider adding more scenarios.',
            });
            score -= 20;
        }

        // Check for edge cases
        const hasEdgeCases = /edge|boundary|limit|empty|null|undefined|invalid/i.test(testCode);
        if (!hasEdgeCases) {
            issues.push({
                severity: 'warning',
                category: 'coverage',
                message: 'No edge case testing detected',
            });
            score -= 15;
        }

        // Check for error handling
        const hasErrorHandling = /error|fail|reject|catch|should\.not/i.test(testCode);
        if (!hasErrorHandling) {
            issues.push({
                severity: 'info',
                category: 'coverage',
                message: 'No error handling scenarios found',
            });
            score -= 10;
        }

        // Check for beforeEach/afterEach
        const hasSetup = /beforeEach|before\(/.test(testCode);
        if (!hasSetup) {
            issues.push({
                severity: 'info',
                category: 'coverage',
                message: 'No setup hooks (beforeEach) found',
            });
            score -= 5;
        }

        return Math.max(0, score);
    }

    /**
     * Check assertion quality
     */
    private checkAssertions(testCode: string, issues: QualityIssue[]): number {
        let score = 100;

        // Count assertions
        const assertions = (testCode.match(/\.should\(|\.expect\(/g) || []).length;
        const itBlocks = (testCode.match(/it\(/g) || []).length;

        if (assertions === 0) {
            issues.push({
                severity: 'error',
                category: 'assertions',
                message: 'No assertions found in test',
            });
            score -= 50;
        } else if (assertions < itBlocks) {
            issues.push({
                severity: 'warning',
                category: 'assertions',
                message: 'Some test cases may be missing assertions',
            });
            score -= 20;
        }

        // Check for weak assertions
        const hasWeakAssertions = /should\('exist'\)|should\('be\.visible'\)/.test(testCode);
        const hasStrongAssertions = /should\('equal'|should\('contain'|should\('have\.length'/.test(testCode);

        if (hasWeakAssertions && !hasStrongAssertions) {
            issues.push({
                severity: 'warning',
                category: 'assertions',
                message: 'Only weak assertions found. Consider adding more specific assertions.',
            });
            score -= 15;
        }

        // Check for multiple assertions per test
        const avgAssertionsPerTest = assertions / Math.max(itBlocks, 1);
        if (avgAssertionsPerTest < 2) {
            issues.push({
                severity: 'info',
                category: 'assertions',
                message: 'Consider adding more assertions per test case',
            });
            score -= 10;
        }

        return Math.max(0, score);
    }

    /**
     * Check maintainability
     */
    private checkMaintainability(testCode: string, issues: QualityIssue[]): number {
        let score = 100;

        // Check for comments
        const commentLines = (testCode.match(/\/\//g) || []).length;
        const totalLines = testCode.split('\n').length;
        const commentRatio = commentLines / totalLines;

        if (commentRatio < 0.1) {
            issues.push({
                severity: 'info',
                category: 'maintainability',
                message: 'Consider adding more comments for clarity',
            });
            score -= 10;
        }

        // Check for magic numbers/strings
        const hasMagicNumbers = /\d{3,}/.test(testCode.replace(/timeout|wait/gi, ''));
        if (hasMagicNumbers) {
            issues.push({
                severity: 'warning',
                category: 'maintainability',
                message: 'Magic numbers detected. Consider using constants.',
            });
            score -= 15;
        }

        // Check for hardcoded URLs
        const hasHardcodedUrls = /https?:\/\//.test(testCode);
        if (hasHardcodedUrls) {
            issues.push({
                severity: 'warning',
                category: 'maintainability',
                message: 'Hardcoded URLs found. Use baseUrl or environment variables.',
            });
            score -= 15;
        }

        // Check test description quality
        const descriptions = testCode.match(/it\(['"]([^'"]+)['"]/g) || [];
        const hasGoodDescriptions = descriptions.every(d => d.length > 20);
        if (!hasGoodDescriptions) {
            issues.push({
                severity: 'info',
                category: 'maintainability',
                message: 'Some test descriptions are too short',
            });
            score -= 5;
        }

        return Math.max(0, score);
    }

    /**
     * Check best practices
     */
    private checkBestPractices(testCode: string, issues: QualityIssue[]): number {
        let score = 100;

        // Check for data-testid selectors
        const hasDataTestId = /data-testid/.test(testCode);
        const hasFragileSelectors = /\.(class|id)\(|#|\.(?!should|and|then)/.test(testCode);

        if (!hasDataTestId && hasFragileSelectors) {
            issues.push({
                severity: 'warning',
                category: 'best-practices',
                message: 'Using fragile selectors. Prefer data-testid attributes.',
            });
            score -= 20;
        }

        // Check for proper waits
        const hasWait = /cy\.wait\(\d+\)/.test(testCode);
        if (hasWait) {
            issues.push({
                severity: 'warning',
                category: 'best-practices',
                message: 'Hard waits detected. Use implicit waits or assertions instead.',
            });
            score -= 15;
        }

        // Check for custom commands usage
        const hasCustomCommands = /cy\.(login|addToCart|logout)/.test(testCode);
        const hasRepetitiveCode = testCode.split('cy.get').length > 10;

        if (!hasCustomCommands && hasRepetitiveCode) {
            issues.push({
                severity: 'info',
                category: 'best-practices',
                message: 'Consider using custom commands for repetitive actions',
            });
            score -= 10;
        }

        // Check for proper test isolation
        const hasSharedState = /let |var /.test(testCode.split('describe')[0] || '');
        if (hasSharedState) {
            issues.push({
                severity: 'warning',
                category: 'best-practices',
                message: 'Shared state detected. Ensure proper test isolation.',
            });
            score -= 15;
        }

        return Math.max(0, score);
    }

    /**
     * Generate a quality report
     */
    generateReport(metrics: QualityMetrics): string {
        const { overallScore, issues } = metrics;

        let report = `Test Quality Report
===================
Overall Score: ${overallScore}/100

Detailed Scores:
- Syntax: ${metrics.syntaxScore}/100
- Coverage: ${metrics.coverageScore}/100
- Assertions: ${metrics.assertionScore}/100
- Maintainability: ${metrics.maintainabilityScore}/100
- Best Practices: ${metrics.bestPracticesScore}/100

`;

        if (issues.length > 0) {
            report += `\nIssues Found (${issues.length}):\n`;

            const errors = issues.filter(i => i.severity === 'error');
            const warnings = issues.filter(i => i.severity === 'warning');
            const infos = issues.filter(i => i.severity === 'info');

            if (errors.length > 0) {
                report += `\n❌ Errors:\n`;
                errors.forEach(e => report += `  - ${e.message}\n`);
            }

            if (warnings.length > 0) {
                report += `\n⚠️  Warnings:\n`;
                warnings.forEach(w => report += `  - ${w.message}\n`);
            }

            if (infos.length > 0) {
                report += `\nℹ️  Info:\n`;
                infos.forEach(i => report += `  - ${i.message}\n`);
            }
        } else {
            report += '\n✅ No issues found!\n';
        }

        return report;
    }
}
