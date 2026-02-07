import * as fs from 'fs';
import * as path from 'path';
import { ValidationDecision, RejectionReason } from './validation-workflow';

export interface RejectionStats {
    totalRejections: number;
    rejectionsByReason: Record<RejectionReason, number>;
    rejectionRate: number;
    commonPatterns: RejectionPattern[];
    trendData: TrendDataPoint[];
}

export interface RejectionPattern {
    reason: RejectionReason;
    count: number;
    percentage: number;
    examples: string[];
}

export interface TrendDataPoint {
    date: string;
    rejectionCount: number;
    approvalCount: number;
    rejectionRate: number;
}

export interface RejectionRecord {
    testName: string;
    reason: RejectionReason;
    comments: string;
    timestamp: Date;
    reviewer: string;
}

export class RejectionTracker {
    private recordsPath: string;

    constructor(recordsPath: string = './reports/rejections') {
        this.recordsPath = recordsPath;
        this.ensureDirectoryExists();
    }

    /**
     * Track a rejection decision
     */
    async trackRejection(decision: ValidationDecision): Promise<void> {
        if (decision.approved) {
            return; // Only track rejections
        }

        const record: RejectionRecord = {
            testName: decision.testName,
            reason: decision.rejectionReason || 'other',
            comments: decision.reviewerComments || '',
            timestamp: decision.reviewedAt,
            reviewer: decision.reviewedBy,
        };

        const fileName = `rejection-${Date.now()}.json`;
        const filePath = path.join(this.recordsPath, fileName);

        await fs.promises.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');
    }

    /**
     * Get all rejection records
     */
    async getAllRejections(): Promise<RejectionRecord[]> {
        const files = await fs.promises.readdir(this.recordsPath);
        const jsonFiles = files.filter((f) => f.startsWith('rejection-') && f.endsWith('.json'));

        const records: RejectionRecord[] = [];

        for (const file of jsonFiles) {
            const filePath = path.join(this.recordsPath, file);
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const record = JSON.parse(content) as RejectionRecord;
            record.timestamp = new Date(record.timestamp); // Convert string to Date
            records.push(record);
        }

        return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Calculate rejection statistics
     */
    async calculateStats(
        decisions: ValidationDecision[],
        historicalRecords?: RejectionRecord[]
    ): Promise<RejectionStats> {
        const records = historicalRecords || (await this.getAllRejections());

        const totalDecisions = decisions.length;
        const rejectedDecisions = decisions.filter((d) => !d.approved);
        const totalRejections = rejectedDecisions.length;
        const rejectionRate = totalDecisions > 0 ? (totalRejections / totalDecisions) * 100 : 0;

        // Count rejections by reason
        const rejectionsByReason: Record<RejectionReason, number> = {
            'incorrect-assertions': 0,
            'missing-edge-cases': 0,
            'poor-selectors': 0,
            'syntax-errors': 0,
            'incomplete-coverage': 0,
            'poor-maintainability': 0,
            'not-aligned-with-requirements': 0,
            'security-concerns': 0,
            'performance-issues': 0,
            other: 0,
        };

        records.forEach((record) => {
            rejectionsByReason[record.reason]++;
        });

        // Identify common patterns
        const commonPatterns: RejectionPattern[] = Object.entries(rejectionsByReason)
            .map(([reason, count]) => ({
                reason: reason as RejectionReason,
                count,
                percentage: totalRejections > 0 ? (count / totalRejections) * 100 : 0,
                examples: records
                    .filter((r) => r.reason === reason)
                    .slice(0, 3)
                    .map((r) => r.comments),
            }))
            .filter((p) => p.count > 0)
            .sort((a, b) => b.count - a.count);

        // Calculate trend data (last 30 days)
        const trendData = this.calculateTrendData(decisions, records);

        return {
            totalRejections,
            rejectionsByReason,
            rejectionRate,
            commonPatterns,
            trendData,
        };
    }

    /**
     * Calculate trend data for the last 30 days
     */
    private calculateTrendData(
        decisions: ValidationDecision[],
        records: RejectionRecord[]
    ): TrendDataPoint[] {
        const days = 30;
        const trendData: TrendDataPoint[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayDecisions = decisions.filter((d) => {
                const decisionDate = new Date(d.reviewedAt).toISOString().split('T')[0];
                return decisionDate === dateStr;
            });

            const rejectionCount = dayDecisions.filter((d) => !d.approved).length;
            const approvalCount = dayDecisions.filter((d) => d.approved).length;
            const total = dayDecisions.length;
            const rejectionRate = total > 0 ? (rejectionCount / total) * 100 : 0;

            trendData.push({
                date: dateStr,
                rejectionCount,
                approvalCount,
                rejectionRate,
            });
        }

        return trendData;
    }

    /**
     * Generate a detailed rejection report
     */
    async generateReport(decisions: ValidationDecision[]): Promise<string> {
        const stats = await this.calculateStats(decisions);

        let report = `# AI Test Rejection Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Rejections**: ${stats.totalRejections}
- **Rejection Rate**: ${stats.rejectionRate.toFixed(2)}%

## Rejections by Reason

`;

        stats.commonPatterns.forEach((pattern) => {
            report += `### ${this.formatReasonName(pattern.reason)} (${pattern.count} rejections, ${pattern.percentage.toFixed(1)}%)

`;
            if (pattern.examples.length > 0) {
                report += `**Example Comments:**\n`;
                pattern.examples.forEach((example, idx) => {
                    if (example) {
                        report += `${idx + 1}. "${example}"\n`;
                    }
                });
                report += '\n';
            }
        });

        report += `## Trend Analysis (Last 30 Days)

| Date | Rejections | Approvals | Rejection Rate |
|------|------------|-----------|----------------|
`;

        stats.trendData.slice(-7).forEach((point) => {
            report += `| ${point.date} | ${point.rejectionCount} | ${point.approvalCount} | ${point.rejectionRate.toFixed(1)}% |\n`;
        });

        report += `
## Recommendations

`;

        // Generate recommendations based on patterns
        if (stats.commonPatterns.length > 0) {
            const topReason = stats.commonPatterns[0];
            report += `1. **Focus on ${this.formatReasonName(topReason.reason)}**: This is the most common rejection reason (${topReason.percentage.toFixed(1)}%). Consider improving AI prompts to address this issue.\n\n`;
        }

        if (stats.rejectionRate > 50) {
            report += `2. **High Rejection Rate**: The current rejection rate is ${stats.rejectionRate.toFixed(1)}%. Consider:\n`;
            report += `   - Refining AI prompts with more specific requirements\n`;
            report += `   - Adding more context to test generation requests\n`;
            report += `   - Reviewing and updating quality thresholds\n\n`;
        }

        const recentTrend = stats.trendData.slice(-7);
        const avgRecentRejectionRate =
            recentTrend.reduce((sum, p) => sum + p.rejectionRate, 0) / recentTrend.length;

        if (avgRecentRejectionRate < stats.rejectionRate) {
            report += `3. **Improving Trend**: Recent rejection rate (${avgRecentRejectionRate.toFixed(1)}%) is lower than overall average. The AI is learning!\n\n`;
        }

        return report;
    }

    /**
     * Format rejection reason name for display
     */
    private formatReasonName(reason: RejectionReason): string {
        return reason
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Ensure the records directory exists
     */
    private ensureDirectoryExists(): void {
        if (!fs.existsSync(this.recordsPath)) {
            fs.mkdirSync(this.recordsPath, { recursive: true });
        }
    }

    /**
     * Export rejection data to JSON
     */
    async exportToJSON(outputPath: string): Promise<void> {
        const records = await this.getAllRejections();
        const data = {
            exportedAt: new Date().toISOString(),
            totalRecords: records.length,
            records,
        };

        await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Get rejection insights for AI improvement
     */
    async getAIImprovementInsights(): Promise<string[]> {
        const records = await this.getAllRejections();
        const insights: string[] = [];

        // Analyze patterns
        const reasonCounts: Record<string, number> = {};
        records.forEach((r) => {
            reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
        });

        // Generate insights
        Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([reason, count]) => {
                const examples = records.filter((r) => r.reason === reason).slice(0, 2);

                insights.push(
                    `Focus on reducing "${this.formatReasonName(reason as RejectionReason)}" rejections (${count} occurrences). Examples: ${examples.map((e) => e.comments).join('; ')}`
                );
            });

        return insights;
    }
}
