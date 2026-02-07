export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RiskClassification {
    featureName: string;
    riskLevel: RiskLevel;
    riskScore: number; // 0-100
    riskFactors: RiskFactor[];
    businessImpact: string;
    technicalComplexity: string;
    changeFrequency: string;
}

export interface RiskFactor {
    factor: string;
    weight: number;
    description: string;
}

export interface RiskConfig {
    features: FeatureRiskConfig[];
    defaultRiskLevel: RiskLevel;
}

export interface FeatureRiskConfig {
    name: string;
    pattern: string; // Regex pattern to match feature/file names
    riskLevel: RiskLevel;
    businessImpact: 'critical' | 'high' | 'medium' | 'low';
    technicalComplexity: 'high' | 'medium' | 'low';
    changeFrequency: 'high' | 'medium' | 'low';
}

export class RiskClassifier {
    private config: RiskConfig;

    constructor(config: RiskConfig) {
        this.config = config;
    }

    /**
     * Classify a feature's risk level
     */
    classifyFeature(featureName: string, context?: Partial<FeatureRiskConfig>): RiskClassification {
        // Find matching configuration
        const matchedConfig = this.findMatchingConfig(featureName);

        // Use provided context or matched config
        const businessImpact = context?.businessImpact || matchedConfig?.businessImpact || 'medium';
        const technicalComplexity =
            context?.technicalComplexity || matchedConfig?.technicalComplexity || 'medium';
        const changeFrequency =
            context?.changeFrequency || matchedConfig?.changeFrequency || 'medium';

        // Calculate risk factors
        const riskFactors = this.calculateRiskFactors(
            businessImpact,
            technicalComplexity,
            changeFrequency
        );

        // Calculate overall risk score
        const riskScore = this.calculateRiskScore(riskFactors);

        // Determine risk level
        const riskLevel =
            matchedConfig?.riskLevel || context?.riskLevel || this.determineRiskLevel(riskScore);

        return {
            featureName,
            riskLevel,
            riskScore,
            riskFactors,
            businessImpact,
            technicalComplexity,
            changeFrequency,
        };
    }

    /**
     * Find matching risk configuration for a feature
     */
    private findMatchingConfig(featureName: string): FeatureRiskConfig | undefined {
        return this.config.features.find((feature) => {
            const regex = new RegExp(feature.pattern, 'i');
            return regex.test(featureName);
        });
    }

    /**
     * Calculate risk factors with weights
     */
    private calculateRiskFactors(
        businessImpact: string,
        technicalComplexity: string,
        changeFrequency: string
    ): RiskFactor[] {
        const factors: RiskFactor[] = [];

        // Business Impact (40% weight)
        factors.push({
            factor: 'Business Impact',
            weight: 0.4,
            description: `${businessImpact} impact on business operations`,
        });

        // Technical Complexity (35% weight)
        factors.push({
            factor: 'Technical Complexity',
            weight: 0.35,
            description: `${technicalComplexity} technical complexity`,
        });

        // Change Frequency (25% weight)
        factors.push({
            factor: 'Change Frequency',
            weight: 0.25,
            description: `${changeFrequency} frequency of changes`,
        });

        return factors;
    }

    /**
     * Calculate overall risk score (0-100)
     */
    private calculateRiskScore(riskFactors: RiskFactor[]): number {
        const impactScore = this.getImpactScore(
            riskFactors.find((f) => f.factor === 'Business Impact')?.description || ''
        );
        const complexityScore = this.getComplexityScore(
            riskFactors.find((f) => f.factor === 'Technical Complexity')?.description || ''
        );
        const frequencyScore = this.getFrequencyScore(
            riskFactors.find((f) => f.factor === 'Change Frequency')?.description || ''
        );

        const totalScore =
            impactScore * 0.4 + complexityScore * 0.35 + frequencyScore * 0.25;

        return Math.round(totalScore);
    }

    /**
     * Get impact score from description
     */
    private getImpactScore(description: string): number {
        if (description.includes('critical')) return 100;
        if (description.includes('high')) return 75;
        if (description.includes('medium')) return 50;
        return 25;
    }

    /**
     * Get complexity score from description
     */
    private getComplexityScore(description: string): number {
        if (description.includes('high')) return 100;
        if (description.includes('medium')) return 60;
        return 30;
    }

    /**
     * Get frequency score from description
     */
    private getFrequencyScore(description: string): number {
        if (description.includes('high')) return 100;
        if (description.includes('medium')) return 60;
        return 30;
    }

    /**
     * Determine risk level from score
     */
    private determineRiskLevel(score: number): RiskLevel {
        if (score >= 85) return 'critical';
        if (score >= 65) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Classify multiple features
     */
    classifyFeatures(featureNames: string[]): RiskClassification[] {
        return featureNames.map((name) => this.classifyFeature(name));
    }

    /**
     * Get features by risk level
     */
    getFeaturesByRiskLevel(
        classifications: RiskClassification[],
        riskLevel: RiskLevel
    ): RiskClassification[] {
        return classifications.filter((c) => c.riskLevel === riskLevel);
    }

    /**
     * Generate risk matrix
     */
    generateRiskMatrix(classifications: RiskClassification[]): string {
        const critical = classifications.filter((c) => c.riskLevel === 'critical');
        const high = classifications.filter((c) => c.riskLevel === 'high');
        const medium = classifications.filter((c) => c.riskLevel === 'medium');
        const low = classifications.filter((c) => c.riskLevel === 'low');

        return `
Risk Matrix
===========

🔴 Critical (${critical.length}):
${critical.map((c) => `  - ${c.featureName} (Score: ${c.riskScore})`).join('\n') || '  None'}

🟠 High (${high.length}):
${high.map((c) => `  - ${c.featureName} (Score: ${c.riskScore})`).join('\n') || '  None'}

🟡 Medium (${medium.length}):
${medium.map((c) => `  - ${c.featureName} (Score: ${c.riskScore})`).join('\n') || '  None'}

🟢 Low (${low.length}):
${low.map((c) => `  - ${c.featureName} (Score: ${c.riskScore})`).join('\n') || '  None'}
`;
    }
}
