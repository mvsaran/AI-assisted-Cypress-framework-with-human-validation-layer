import { RiskLevel, RiskClassification } from './risk-classifier';

export interface TestPriority {
    testName: string;
    priority: number; // 1-100, higher is more important
    riskLevel: RiskLevel;
    executionOrder: number;
    reason: string;
    filePath: string; // Added property to store the route or file path
}

export interface PrioritizationStrategy {
    name: string;
    description: string;
    prioritize(tests: TestInfo[]): TestPriority[];
}

export interface TestInfo {
    name: string;
    filePath: string;
    riskClassification: RiskClassification;
    lastModified?: Date;
    executionTime?: number; // milliseconds
    failureRate?: number; // 0-1
}

export class TestPrioritizer {
    /**
     * Prioritize tests based on risk level
     */
    prioritizeByRisk(tests: TestInfo[]): TestPriority[] {
        const riskWeights: Record<RiskLevel, number> = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25,
        };

        return tests
            .map((test, index) => ({
                testName: test.name,
                priority: riskWeights[test.riskClassification.riskLevel],
                riskLevel: test.riskClassification.riskLevel,
                executionOrder: index + 1,
                reason: `Risk level: ${test.riskClassification.riskLevel}`,
                filePath: test.filePath,
            }))
            .sort((a, b) => b.priority - a.priority)
            .map((test, index) => ({ ...test, executionOrder: index + 1 }));
    }

    /**
     * Prioritize tests based on recent changes
     */
    prioritizeByChanges(tests: TestInfo[]): TestPriority[] {
        const now = Date.now();

        return tests
            .map((test, index) => {
                const daysSinceModified = test.lastModified
                    ? (now - test.lastModified.getTime()) / (1000 * 60 * 60 * 24)
                    : 999;

                // Higher priority for recently changed tests
                const changePriority = Math.max(0, 100 - daysSinceModified * 5);

                return {
                    testName: test.name,
                    priority: Math.round(changePriority),
                    riskLevel: test.riskClassification.riskLevel,
                    executionOrder: index + 1,
                    reason: `Modified ${Math.round(daysSinceModified)} days ago`,
                    filePath: test.filePath,
                };
            })
            .sort((a, b) => b.priority - a.priority)
            .map((test, index) => ({ ...test, executionOrder: index + 1 }));
    }

    /**
     * Prioritize tests based on failure rate
     */
    prioritizeByFailureRate(tests: TestInfo[]): TestPriority[] {
        return tests
            .map((test, index) => {
                const failureRate = test.failureRate || 0;
                const priority = Math.round(failureRate * 100);

                return {
                    testName: test.name,
                    priority,
                    riskLevel: test.riskClassification.riskLevel,
                    executionOrder: index + 1,
                    reason: `Failure rate: ${(failureRate * 100).toFixed(1)}%`,
                    filePath: test.filePath,
                };
            })
            .sort((a, b) => b.priority - a.priority)
            .map((test, index) => ({ ...test, executionOrder: index + 1 }));
    }

    /**
     * Smart prioritization combining multiple factors
     */
    smartPrioritize(tests: TestInfo[]): TestPriority[] {
        const now = Date.now();

        return tests
            .map((test, index) => {
                // Factor 1: Risk level (40% weight)
                const riskWeights: Record<RiskLevel, number> = {
                    critical: 100,
                    high: 75,
                    medium: 50,
                    low: 25,
                };
                const riskScore = riskWeights[test.riskClassification.riskLevel];

                // Factor 2: Recent changes (30% weight)
                const daysSinceModified = test.lastModified
                    ? (now - test.lastModified.getTime()) / (1000 * 60 * 60 * 24)
                    : 999;
                const changeScore = Math.max(0, 100 - daysSinceModified * 5);

                // Factor 3: Failure rate (20% weight)
                const failureScore = (test.failureRate || 0) * 100;

                // Factor 4: Execution time (10% weight) - prioritize faster tests
                const avgExecutionTime = 5000; // 5 seconds average
                const executionScore = test.executionTime
                    ? Math.max(0, 100 - (test.executionTime / avgExecutionTime) * 50)
                    : 50;

                // Calculate weighted priority
                const priority = Math.round(
                    riskScore * 0.4 + changeScore * 0.3 + failureScore * 0.2 + executionScore * 0.1
                );

                const reasons = [];
                if (riskScore >= 75) reasons.push(`${test.riskClassification.riskLevel} risk`);
                if (daysSinceModified < 7) reasons.push('recently modified');
                if ((test.failureRate || 0) > 0.1) reasons.push('high failure rate');

                return {
                    testName: test.name,
                    priority,
                    riskLevel: test.riskClassification.riskLevel,
                    executionOrder: index + 1,
                    reason: reasons.join(', ') || 'standard priority',
                    filePath: test.filePath,
                };
            })
            .sort((a, b) => {
                // First sort by priority
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                // Then by risk level
                const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            })
            .map((test, index) => ({ ...test, executionOrder: index + 1 }));
    }

    /**
     * Filter tests for CI/CD execution based on context
     */
    filterForCI(
        tests: TestInfo[],
        context: 'pr' | 'merge' | 'nightly' | 'release'
    ): TestInfo[] {
        switch (context) {
            case 'pr':
                // PR: Run critical and high-risk tests only
                return tests.filter((t) =>
                    ['critical', 'high'].includes(t.riskClassification.riskLevel)
                );

            case 'merge':
                // Merge: Run critical, high, and medium-risk tests
                return tests.filter((t) =>
                    ['critical', 'high', 'medium'].includes(t.riskClassification.riskLevel)
                );

            case 'nightly':
                // Nightly: Run all tests
                return tests;

            case 'release':
                // Release: Run all tests, prioritize critical
                return tests;

            default:
                return tests;
        }
    }

    /**
     * Generate execution plan
     */
    generateExecutionPlan(priorities: TestPriority[]): string {
        const critical = priorities.filter((p) => p.riskLevel === 'critical');
        const high = priorities.filter((p) => p.riskLevel === 'high');
        const medium = priorities.filter((p) => p.riskLevel === 'medium');
        const low = priorities.filter((p) => p.riskLevel === 'low');

        let plan = `Test Execution Plan
===================
Total Tests: ${priorities.length}

`;

        if (critical.length > 0) {
            plan += `🔴 Critical Priority (${critical.length} tests):\n`;
            critical.forEach((p) => {
                plan += `  ${p.executionOrder}. ${p.testName} - ${p.reason}\n`;
            });
            plan += '\n';
        }

        if (high.length > 0) {
            plan += `🟠 High Priority (${high.length} tests):\n`;
            high.slice(0, 5).forEach((p) => {
                plan += `  ${p.executionOrder}. ${p.testName} - ${p.reason}\n`;
            });
            if (high.length > 5) {
                plan += `  ... and ${high.length - 5} more\n`;
            }
            plan += '\n';
        }

        if (medium.length > 0) {
            plan += `🟡 Medium Priority (${medium.length} tests):\n`;
            medium.slice(0, 3).forEach((p) => {
                plan += `  ${p.executionOrder}. ${p.testName} - ${p.reason}\n`;
            });
            if (medium.length > 3) {
                plan += `  ... and ${medium.length - 3} more\n`;
            }
            plan += '\n';
        }

        if (low.length > 0) {
            plan += `🟢 Low Priority (${low.length} tests)\n\n`;
        }

        return plan;
    }

    /**
     * Export priorities to Cypress spec pattern
     */
    exportToCypressPattern(priorities: TestPriority[], topN?: number): string {
        const selected = topN ? priorities.slice(0, topN) : priorities;
        return selected.map((p) => p.testName).join(',');
    }
}
