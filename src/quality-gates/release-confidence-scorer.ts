import { QualityMetrics } from '../ai/test-quality-scorer';
import { CoverageMetrics } from '../risk/risk-coverage-analyzer';

export interface ReleaseConfidenceScore {
    overallScore: number; // 0-100
    components: ConfidenceComponents;
    recommendation: ReleaseRecommendation;
    details: string;
    calculatedAt: Date;
}

export interface ConfidenceComponents {
    testPassRate: ComponentScore;
    riskCoverage: ComponentScore;
    testQuality: ComponentScore;
    humanValidationRate: ComponentScore;
}

export interface ComponentScore {
    score: number; // 0-100
    weight: number; // 0-1
    weightedScore: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}

export type ReleaseRecommendation =
    | 'ready-to-release'
    | 'proceed-with-caution'
    | 'not-recommended'
    | 'blocked';

export interface ReleaseConfidenceInput {
    testResults: TestResults;
    coverageMetrics: CoverageMetrics;
    qualityMetrics: QualityMetrics[];
    validationStats: ValidationStats;
}

export interface TestResults {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
}

export interface ValidationStats {
    totalValidations: number;
    approvedTests: number;
    rejectedTests: number;
    autoApprovedTests: number;
}

export class ReleaseConfidenceScorer {
    private readonly weights = {
        testPassRate: 0.4,
        riskCoverage: 0.3,
        testQuality: 0.2,
        humanValidationRate: 0.1,
    };

    private readonly thresholds = {
        excellent: 90,
        good: 75,
        fair: 60,
        poor: 0,
    };

    /**
     * Calculate release confidence score
     */
    calculateConfidence(input: ReleaseConfidenceInput): ReleaseConfidenceScore {
        // Calculate component scores
        const testPassRate = this.calculateTestPassRate(input.testResults);
        const riskCoverage = this.calculateRiskCoverage(input.coverageMetrics);
        const testQuality = this.calculateTestQuality(input.qualityMetrics);
        const humanValidationRate = this.calculateHumanValidationRate(input.validationStats);

        // Calculate weighted overall score
        const overallScore = Math.round(
            testPassRate.weightedScore +
            riskCoverage.weightedScore +
            testQuality.weightedScore +
            humanValidationRate.weightedScore
        );

        // Determine recommendation
        const recommendation = this.determineRecommendation(overallScore, {
            testPassRate,
            riskCoverage,
            testQuality,
            humanValidationRate,
        });

        // Generate details
        const details = this.generateDetails({
            testPassRate,
            riskCoverage,
            testQuality,
            humanValidationRate,
        });

        return {
            overallScore,
            components: {
                testPassRate,
                riskCoverage,
                testQuality,
                humanValidationRate,
            },
            recommendation,
            details,
            calculatedAt: new Date(),
        };
    }

    /**
     * Calculate test pass rate score
     */
    private calculateTestPassRate(results: TestResults): ComponentScore {
        const passRate =
            results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0;

        const score = Math.round(passRate);
        const weightedScore = score * this.weights.testPassRate;
        const status = this.getStatus(score);

        return {
            score,
            weight: this.weights.testPassRate,
            weightedScore,
            status,
        };
    }

    /**
     * Calculate risk coverage score
     */
    private calculateRiskCoverage(metrics: CoverageMetrics): ComponentScore {
        const score = metrics.riskWeightedCoverage;
        const weightedScore = score * this.weights.riskCoverage;
        const status = this.getStatus(score);

        return {
            score,
            weight: this.weights.riskCoverage,
            weightedScore,
            status,
        };
    }

    /**
     * Calculate test quality score
     */
    private calculateTestQuality(qualityMetrics: QualityMetrics[]): ComponentScore {
        if (qualityMetrics.length === 0) {
            return {
                score: 0,
                weight: this.weights.testQuality,
                weightedScore: 0,
                status: 'poor',
            };
        }

        const avgQuality =
            qualityMetrics.reduce((sum, m) => sum + m.overallScore, 0) / qualityMetrics.length;

        const score = Math.round(avgQuality);
        const weightedScore = score * this.weights.testQuality;
        const status = this.getStatus(score);

        return {
            score,
            weight: this.weights.testQuality,
            weightedScore,
            status,
        };
    }

    /**
     * Calculate human validation rate score
     */
    private calculateHumanValidationRate(stats: ValidationStats): ComponentScore {
        if (stats.totalValidations === 0) {
            return {
                score: 100, // No AI-generated tests = no validation needed
                weight: this.weights.humanValidationRate,
                weightedScore: 100 * this.weights.humanValidationRate,
                status: 'excellent',
            };
        }

        const validationRate = (stats.approvedTests / stats.totalValidations) * 100;
        const score = Math.round(validationRate);
        const weightedScore = score * this.weights.humanValidationRate;
        const status = this.getStatus(score);

        return {
            score,
            weight: this.weights.humanValidationRate,
            weightedScore,
            status,
        };
    }

    /**
     * Get status from score
     */
    private getStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (score >= this.thresholds.excellent) return 'excellent';
        if (score >= this.thresholds.good) return 'good';
        if (score >= this.thresholds.fair) return 'fair';
        return 'poor';
    }

    /**
     * Determine release recommendation
     */
    private determineRecommendation(
        overallScore: number,
        components: ConfidenceComponents
    ): ReleaseRecommendation {
        // Block if test pass rate is too low
        if (components.testPassRate.score < 80) {
            return 'blocked';
        }

        // Block if critical risk coverage is too low
        if (components.riskCoverage.score < 70) {
            return 'blocked';
        }

        // Recommend based on overall score
        if (overallScore >= 85) {
            return 'ready-to-release';
        } else if (overallScore >= 70) {
            return 'proceed-with-caution';
        } else if (overallScore >= 60) {
            return 'not-recommended';
        } else {
            return 'blocked';
        }
    }

    /**
     * Generate detailed explanation
     */
    private generateDetails(components: ConfidenceComponents): string {
        const details: string[] = [];

        // Test Pass Rate
        details.push(
            `Test Pass Rate: ${components.testPassRate.score}% (${components.testPassRate.status})`
        );

        // Risk Coverage
        details.push(
            `Risk Coverage: ${components.riskCoverage.score}/100 (${components.riskCoverage.status})`
        );

        // Test Quality
        details.push(
            `Test Quality: ${components.testQuality.score}/100 (${components.testQuality.status})`
        );

        // Human Validation
        details.push(
            `Human Validation: ${components.humanValidationRate.score}% (${components.humanValidationRate.status})`
        );

        return details.join('\n');
    }

    /**
     * Generate release confidence report
     */
    generateReport(confidence: ReleaseConfidenceScore): string {
        const icon = this.getRecommendationIcon(confidence.recommendation);
        const color = this.getRecommendationColor(confidence.recommendation);

        let report = `# Release Confidence Report
Generated: ${confidence.calculatedAt.toISOString()}

## ${icon} Overall Confidence: ${confidence.overallScore}/100

**Recommendation**: ${color} ${this.formatRecommendation(confidence.recommendation)}

## Component Breakdown

`;

        // Test Pass Rate
        report += `### ✅ Test Pass Rate (${(confidence.components.testPassRate.weight * 100).toFixed(0)}% weight)
- Score: ${confidence.components.testPassRate.score}/100
- Status: ${this.formatStatus(confidence.components.testPassRate.status)}
- Contribution: ${confidence.components.testPassRate.weightedScore.toFixed(1)} points

`;

        // Risk Coverage
        report += `### 🎯 Risk Coverage (${(confidence.components.riskCoverage.weight * 100).toFixed(0)}% weight)
- Score: ${confidence.components.riskCoverage.score}/100
- Status: ${this.formatStatus(confidence.components.riskCoverage.status)}
- Contribution: ${confidence.components.riskCoverage.weightedScore.toFixed(1)} points

`;

        // Test Quality
        report += `### ⭐ Test Quality (${(confidence.components.testQuality.weight * 100).toFixed(0)}% weight)
- Score: ${confidence.components.testQuality.score}/100
- Status: ${this.formatStatus(confidence.components.testQuality.status)}
- Contribution: ${confidence.components.testQuality.weightedScore.toFixed(1)} points

`;

        // Human Validation
        report += `### 👤 Human Validation (${(confidence.components.humanValidationRate.weight * 100).toFixed(0)}% weight)
- Score: ${confidence.components.humanValidationRate.score}/100
- Status: ${this.formatStatus(confidence.components.humanValidationRate.status)}
- Contribution: ${confidence.components.humanValidationRate.weightedScore.toFixed(1)} points

`;

        // Recommendations
        report += `## Recommendations\n\n`;

        if (confidence.recommendation === 'ready-to-release') {
            report += `✅ **Ready to Release**: All quality gates passed. Confidence is high.\n`;
        } else if (confidence.recommendation === 'proceed-with-caution') {
            report += `⚠️ **Proceed with Caution**: Quality gates passed but some areas need attention.\n\n`;
            report += this.generateImprovementSuggestions(confidence.components);
        } else if (confidence.recommendation === 'not-recommended') {
            report += `❌ **Not Recommended**: Quality concerns detected. Address issues before release.\n\n`;
            report += this.generateImprovementSuggestions(confidence.components);
        } else {
            report += `🚫 **BLOCKED**: Critical quality gates failed. Release is blocked.\n\n`;
            report += this.generateImprovementSuggestions(confidence.components);
        }

        return report;
    }

    /**
     * Generate improvement suggestions
     */
    private generateImprovementSuggestions(components: ConfidenceComponents): string {
        const suggestions: string[] = [];

        if (components.testPassRate.status === 'poor' || components.testPassRate.status === 'fair') {
            suggestions.push(
                `- **Fix Failing Tests**: Test pass rate is ${components.testPassRate.score}%. Investigate and fix failing tests.`
            );
        }

        if (components.riskCoverage.status === 'poor' || components.riskCoverage.status === 'fair') {
            suggestions.push(
                `- **Improve Risk Coverage**: Risk coverage is ${components.riskCoverage.score}/100. Add tests for high-risk areas.`
            );
        }

        if (components.testQuality.status === 'poor' || components.testQuality.status === 'fair') {
            suggestions.push(
                `- **Enhance Test Quality**: Test quality score is ${components.testQuality.score}/100. Review and improve test assertions and coverage.`
            );
        }

        if (
            components.humanValidationRate.status === 'poor' ||
            components.humanValidationRate.status === 'fair'
        ) {
            suggestions.push(
                `- **Review AI-Generated Tests**: Human validation rate is ${components.humanValidationRate.score}%. Review rejected tests and improve AI prompts.`
            );
        }

        return suggestions.join('\n');
    }

    /**
     * Format recommendation for display
     */
    private formatRecommendation(recommendation: ReleaseRecommendation): string {
        const formatted = {
            'ready-to-release': 'READY TO RELEASE',
            'proceed-with-caution': 'PROCEED WITH CAUTION',
            'not-recommended': 'NOT RECOMMENDED',
            blocked: 'BLOCKED',
        };
        return formatted[recommendation];
    }

    /**
     * Get recommendation icon
     */
    private getRecommendationIcon(recommendation: ReleaseRecommendation): string {
        const icons = {
            'ready-to-release': '✅',
            'proceed-with-caution': '⚠️',
            'not-recommended': '❌',
            blocked: '🚫',
        };
        return icons[recommendation];
    }

    /**
     * Get recommendation color
     */
    private getRecommendationColor(recommendation: ReleaseRecommendation): string {
        const colors = {
            'ready-to-release': '🟢',
            'proceed-with-caution': '🟡',
            'not-recommended': '🟠',
            blocked: '🔴',
        };
        return colors[recommendation];
    }

    /**
     * Format status for display
     */
    private formatStatus(status: string): string {
        const formatted = {
            excellent: '🟢 Excellent',
            good: '🟢 Good',
            fair: '🟡 Fair',
            poor: '🔴 Poor',
        };
        return formatted[status as keyof typeof formatted] || status;
    }
}
