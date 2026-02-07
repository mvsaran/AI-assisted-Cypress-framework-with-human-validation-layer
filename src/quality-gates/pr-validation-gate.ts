import { ReleaseConfidenceScore } from './release-confidence-scorer';

export interface QualityGateResult {
    gateName: string;
    passed: boolean;
    score: number;
    threshold: number;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PRValidationResult {
    overallPassed: boolean;
    gates: QualityGateResult[];
    confidence: ReleaseConfidenceScore;
    blockers: string[];
    warnings: string[];
    summary: string;
}

export class PRValidationGate {
    private readonly minTestPassRate = 80;
    private readonly minRiskCoverage = 80;
    private readonly minTestQuality = 70;
    private readonly minConfidenceScore = 75;

    /**
     * Validate a pull request against quality gates
     */
    validate(confidence: ReleaseConfidenceScore): PRValidationResult {
        const gates: QualityGateResult[] = [];

        // Gate 1: Test Pass Rate
        gates.push(
            this.validateTestPassRate(
                confidence.components.testPassRate.score,
                this.minTestPassRate
            )
        );

        // Gate 2: Risk Coverage
        gates.push(
            this.validateRiskCoverage(confidence.components.riskCoverage.score, this.minRiskCoverage)
        );

        // Gate 3: Test Quality
        gates.push(
            this.validateTestQuality(confidence.components.testQuality.score, this.minTestQuality)
        );

        // Gate 4: Overall Confidence
        gates.push(this.validateOverallConfidence(confidence.overallScore, this.minConfidenceScore));

        // Determine if all gates passed
        const criticalGates = gates.filter((g) => g.severity === 'critical');
        const failedCriticalGates = criticalGates.filter((g) => !g.passed);
        const overallPassed = failedCriticalGates.length === 0;

        // Collect blockers and warnings
        const blockers = gates.filter((g) => !g.passed && g.severity === 'critical').map((g) => g.message);
        const warnings = gates
            .filter((g) => !g.passed && g.severity !== 'critical')
            .map((g) => g.message);

        // Generate summary
        const summary = this.generateSummary(gates, overallPassed);

        return {
            overallPassed,
            gates,
            confidence,
            blockers,
            warnings,
            summary,
        };
    }

    /**
     * Validate test pass rate
     */
    private validateTestPassRate(score: number, threshold: number): QualityGateResult {
        const passed = score >= threshold;
        return {
            gateName: 'Test Pass Rate',
            passed,
            score,
            threshold,
            message: passed
                ? `✅ Test pass rate (${score}%) meets threshold (${threshold}%)`
                : `❌ Test pass rate (${score}%) below threshold (${threshold}%)`,
            severity: 'critical',
        };
    }

    /**
     * Validate risk coverage
     */
    private validateRiskCoverage(score: number, threshold: number): QualityGateResult {
        const passed = score >= threshold;
        return {
            gateName: 'Risk Coverage',
            passed,
            score,
            threshold,
            message: passed
                ? `✅ Risk coverage (${score}/100) meets threshold (${threshold}/100)`
                : `❌ Risk coverage (${score}/100) below threshold (${threshold}/100)`,
            severity: 'critical',
        };
    }

    /**
     * Validate test quality
     */
    private validateTestQuality(score: number, threshold: number): QualityGateResult {
        const passed = score >= threshold;
        return {
            gateName: 'Test Quality',
            passed,
            score,
            threshold,
            message: passed
                ? `✅ Test quality (${score}/100) meets threshold (${threshold}/100)`
                : `⚠️ Test quality (${score}/100) below threshold (${threshold}/100)`,
            severity: 'high',
        };
    }

    /**
     * Validate overall confidence
     */
    private validateOverallConfidence(score: number, threshold: number): QualityGateResult {
        const passed = score >= threshold;
        return {
            gateName: 'Overall Confidence',
            passed,
            score,
            threshold,
            message: passed
                ? `✅ Release confidence (${score}/100) meets threshold (${threshold}/100)`
                : `⚠️ Release confidence (${score}/100) below threshold (${threshold}/100)`,
            severity: 'high',
        };
    }

    /**
     * Generate summary
     */
    private generateSummary(gates: QualityGateResult[], overallPassed: boolean): string {
        const passedCount = gates.filter((g) => g.passed).length;
        const totalCount = gates.length;

        if (overallPassed) {
            return `✅ All quality gates passed (${passedCount}/${totalCount})`;
        } else {
            const failedCount = totalCount - passedCount;
            return `❌ ${failedCount} quality gate(s) failed (${passedCount}/${totalCount} passed)`;
        }
    }

    /**
     * Generate PR comment
     */
    generatePRComment(result: PRValidationResult): string {
        let comment = `## 🤖 AI-Assisted Test Framework - Quality Gate Report\n\n`;

        // Overall status
        if (result.overallPassed) {
            comment += `### ✅ Quality Gates: PASSED\n\n`;
        } else {
            comment += `### ❌ Quality Gates: FAILED\n\n`;
        }

        // Release confidence
        comment += `**Release Confidence**: ${result.confidence.overallScore}/100 (${result.confidence.recommendation})\n\n`;

        // Gate results
        comment += `### Gate Results\n\n`;
        comment += `| Gate | Status | Score | Threshold |\n`;
        comment += `|------|--------|-------|----------|\n`;

        result.gates.forEach((gate) => {
            const status = gate.passed ? '✅ Pass' : '❌ Fail';
            comment += `| ${gate.gateName} | ${status} | ${gate.score} | ${gate.threshold} |\n`;
        });

        comment += `\n`;

        // Blockers
        if (result.blockers.length > 0) {
            comment += `### 🚫 Blockers\n\n`;
            result.blockers.forEach((blocker) => {
                comment += `- ${blocker}\n`;
            });
            comment += `\n`;
        }

        // Warnings
        if (result.warnings.length > 0) {
            comment += `### ⚠️ Warnings\n\n`;
            result.warnings.forEach((warning) => {
                comment += `- ${warning}\n`;
            });
            comment += `\n`;
        }

        // Component breakdown
        comment += `### Component Breakdown\n\n`;
        comment += `- **Test Pass Rate**: ${result.confidence.components.testPassRate.score}% (${result.confidence.components.testPassRate.status})\n`;
        comment += `- **Risk Coverage**: ${result.confidence.components.riskCoverage.score}/100 (${result.confidence.components.riskCoverage.status})\n`;
        comment += `- **Test Quality**: ${result.confidence.components.testQuality.score}/100 (${result.confidence.components.testQuality.status})\n`;
        comment += `- **Human Validation**: ${result.confidence.components.humanValidationRate.score}% (${result.confidence.components.humanValidationRate.status})\n`;

        return comment;
    }
}
