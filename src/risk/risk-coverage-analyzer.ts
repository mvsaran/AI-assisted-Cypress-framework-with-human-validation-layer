import { RiskClassification, RiskLevel } from './risk-classifier';

export interface CoverageMetrics {
    totalFeatures: number;
    testedFeatures: number;
    coverageByRisk: Record<RiskLevel, RiskCoverage>;
    overallCoverage: number;
    riskWeightedCoverage: number;
    gaps: CoverageGap[];
}

export interface RiskCoverage {
    totalFeatures: number;
    testedFeatures: number;
    coveragePercentage: number;
    untestedFeatures: string[];
}

export interface CoverageGap {
    featureName: string;
    riskLevel: RiskLevel;
    riskScore: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    recommendation: string;
}

export interface FeatureTestMapping {
    featureName: string;
    riskClassification: RiskClassification;
    testFiles: string[];
    isTested: boolean;
}

export class RiskCoverageAnalyzer {
    /**
     * Analyze risk coverage across features
     */
    analyzeCoverage(mappings: FeatureTestMapping[]): CoverageMetrics {
        const totalFeatures = mappings.length;
        const testedFeatures = mappings.filter((m) => m.isTested).length;
        const overallCoverage = totalFeatures > 0 ? (testedFeatures / totalFeatures) * 100 : 0;

        // Calculate coverage by risk level
        const coverageByRisk: Record<RiskLevel, RiskCoverage> = {
            critical: this.calculateRiskLevelCoverage(mappings, 'critical'),
            high: this.calculateRiskLevelCoverage(mappings, 'high'),
            medium: this.calculateRiskLevelCoverage(mappings, 'medium'),
            low: this.calculateRiskLevelCoverage(mappings, 'low'),
        };

        // Calculate risk-weighted coverage
        const riskWeightedCoverage = this.calculateRiskWeightedCoverage(coverageByRisk);

        // Identify coverage gaps
        const gaps = this.identifyCoverageGaps(mappings);

        return {
            totalFeatures,
            testedFeatures,
            coverageByRisk,
            overallCoverage,
            riskWeightedCoverage,
            gaps,
        };
    }

    /**
     * Calculate coverage for a specific risk level
     */
    private calculateRiskLevelCoverage(
        mappings: FeatureTestMapping[],
        riskLevel: RiskLevel
    ): RiskCoverage {
        const featuresAtRisk = mappings.filter(
            (m) => m.riskClassification.riskLevel === riskLevel
        );
        const testedAtRisk = featuresAtRisk.filter((m) => m.isTested);
        const untestedFeatures = featuresAtRisk
            .filter((m) => !m.isTested)
            .map((m) => m.featureName);

        return {
            totalFeatures: featuresAtRisk.length,
            testedFeatures: testedAtRisk.length,
            coveragePercentage:
                featuresAtRisk.length > 0 ? (testedAtRisk.length / featuresAtRisk.length) * 100 : 0,
            untestedFeatures,
        };
    }

    /**
     * Calculate risk-weighted coverage score
     */
    private calculateRiskWeightedCoverage(
        coverageByRisk: Record<RiskLevel, RiskCoverage>
    ): number {
        const weights = {
            critical: 0.4,
            high: 0.3,
            medium: 0.2,
            low: 0.1,
        };

        const weightedScore =
            coverageByRisk.critical.coveragePercentage * weights.critical +
            coverageByRisk.high.coveragePercentage * weights.high +
            coverageByRisk.medium.coveragePercentage * weights.medium +
            coverageByRisk.low.coveragePercentage * weights.low;

        return Math.round(weightedScore);
    }

    /**
     * Identify coverage gaps
     */
    private identifyCoverageGaps(mappings: FeatureTestMapping[]): CoverageGap[] {
        const untestedFeatures = mappings.filter((m) => !m.isTested);

        return untestedFeatures
            .map((feature) => {
                const priority = this.determinePriority(
                    feature.riskClassification.riskLevel,
                    feature.riskClassification.riskScore
                );

                return {
                    featureName: feature.featureName,
                    riskLevel: feature.riskClassification.riskLevel,
                    riskScore: feature.riskClassification.riskScore,
                    priority,
                    recommendation: this.generateRecommendation(feature),
                };
            })
            .sort((a, b) => {
                // Sort by priority
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }

    /**
     * Determine gap priority
     */
    private determinePriority(
        riskLevel: RiskLevel,
        riskScore: number
    ): 'urgent' | 'high' | 'medium' | 'low' {
        if (riskLevel === 'critical' || riskScore >= 90) return 'urgent';
        if (riskLevel === 'high' || riskScore >= 70) return 'high';
        if (riskLevel === 'medium' || riskScore >= 50) return 'medium';
        return 'low';
    }

    /**
     * Generate recommendation for untested feature
     */
    private generateRecommendation(feature: FeatureTestMapping): string {
        const riskLevel = feature.riskClassification.riskLevel;

        const recommendations = {
            critical:
                'URGENT: Create comprehensive test suite immediately. This feature is mission-critical.',
            high: 'HIGH PRIORITY: Add test coverage as soon as possible. Important for system stability.',
            medium: 'MEDIUM PRIORITY: Add test coverage in the next sprint.',
            low: 'LOW PRIORITY: Consider adding basic test coverage when time permits.',
        };

        return recommendations[riskLevel];
    }

    /**
     * Generate coverage report
     */
    generateReport(metrics: CoverageMetrics): string {
        let report = `# Risk Coverage Analysis Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Features**: ${metrics.totalFeatures}
- **Tested Features**: ${metrics.testedFeatures}
- **Overall Coverage**: ${metrics.overallCoverage.toFixed(1)}%
- **Risk-Weighted Coverage**: ${metrics.riskWeightedCoverage}/100

## Coverage by Risk Level

`;

        // Critical
        report += `### 🔴 Critical Risk
- Coverage: ${metrics.coverageByRisk.critical.coveragePercentage.toFixed(1)}%
- Tested: ${metrics.coverageByRisk.critical.testedFeatures}/${metrics.coverageByRisk.critical.totalFeatures}
`;
        if (metrics.coverageByRisk.critical.untestedFeatures.length > 0) {
            report += `- **Untested**: ${metrics.coverageByRisk.critical.untestedFeatures.join(', ')}\n`;
        }
        report += '\n';

        // High
        report += `### 🟠 High Risk
- Coverage: ${metrics.coverageByRisk.high.coveragePercentage.toFixed(1)}%
- Tested: ${metrics.coverageByRisk.high.testedFeatures}/${metrics.coverageByRisk.high.totalFeatures}
`;
        if (metrics.coverageByRisk.high.untestedFeatures.length > 0) {
            report += `- **Untested**: ${metrics.coverageByRisk.high.untestedFeatures.join(', ')}\n`;
        }
        report += '\n';

        // Medium
        report += `### 🟡 Medium Risk
- Coverage: ${metrics.coverageByRisk.medium.coveragePercentage.toFixed(1)}%
- Tested: ${metrics.coverageByRisk.medium.testedFeatures}/${metrics.coverageByRisk.medium.totalFeatures}
\n`;

        // Low
        report += `### 🟢 Low Risk
- Coverage: ${metrics.coverageByRisk.low.coveragePercentage.toFixed(1)}%
- Tested: ${metrics.coverageByRisk.low.testedFeatures}/${metrics.coverageByRisk.low.totalFeatures}
\n`;

        // Coverage Gaps
        if (metrics.gaps.length > 0) {
            report += `## Coverage Gaps (${metrics.gaps.length})

`;
            const urgentGaps = metrics.gaps.filter((g) => g.priority === 'urgent');
            const highGaps = metrics.gaps.filter((g) => g.priority === 'high');

            if (urgentGaps.length > 0) {
                report += `### 🚨 Urgent Gaps\n`;
                urgentGaps.forEach((gap) => {
                    report += `- **${gap.featureName}** (${gap.riskLevel}, score: ${gap.riskScore})\n`;
                    report += `  ${gap.recommendation}\n\n`;
                });
            }

            if (highGaps.length > 0) {
                report += `### ⚠️ High Priority Gaps\n`;
                highGaps.forEach((gap) => {
                    report += `- **${gap.featureName}** (${gap.riskLevel}, score: ${gap.riskScore})\n`;
                    report += `  ${gap.recommendation}\n\n`;
                });
            }
        } else {
            report += `## ✅ No Coverage Gaps\nAll features have test coverage!\n\n`;
        }

        // Recommendations
        report += `## Recommendations\n\n`;

        if (metrics.riskWeightedCoverage < 80) {
            report += `1. **Improve Risk-Weighted Coverage**: Current score is ${metrics.riskWeightedCoverage}/100. Focus on critical and high-risk features.\n`;
        }

        if (metrics.coverageByRisk.critical.coveragePercentage < 100) {
            report += `2. **Critical Risk Coverage**: Only ${metrics.coverageByRisk.critical.coveragePercentage.toFixed(1)}% of critical features are tested. This should be 100%.\n`;
        }

        if (metrics.gaps.filter((g) => g.priority === 'urgent').length > 0) {
            report += `3. **Address Urgent Gaps**: ${metrics.gaps.filter((g) => g.priority === 'urgent').length} urgent coverage gaps require immediate attention.\n`;
        }

        return report;
    }

    /**
     * Generate heatmap data for visualization
     */
    generateHeatmapData(mappings: FeatureTestMapping[]): HeatmapData {
        const data: HeatmapCell[] = [];

        mappings.forEach((mapping) => {
            data.push({
                feature: mapping.featureName,
                riskLevel: mapping.riskClassification.riskLevel,
                riskScore: mapping.riskClassification.riskScore,
                isTested: mapping.isTested,
                testCount: mapping.testFiles.length,
            });
        });

        return {
            cells: data,
            dimensions: {
                width: Math.ceil(Math.sqrt(data.length)),
                height: Math.ceil(data.length / Math.ceil(Math.sqrt(data.length))),
            },
        };
    }
}

export interface HeatmapData {
    cells: HeatmapCell[];
    dimensions: {
        width: number;
        height: number;
    };
}

export interface HeatmapCell {
    feature: string;
    riskLevel: RiskLevel;
    riskScore: number;
    isTested: boolean;
    testCount: number;
}
