
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'reports', 'dashboard.html');
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const APPROVED_FILE = path.join(REPORTS_DIR, 'approved-tests.json');
const PENDING_FILE = path.join(process.cwd(), 'cypress', 'e2e', 'ai-generated', 'pending-tests.json');
const REJECTION_FILE = path.join(process.cwd(), 'rejection-tracking.json');

if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR);
}


function safeReadJSON(filePath: string): any[] {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        return [];
    }
    return [];
}

const approvedTests = safeReadJSON(APPROVED_FILE);
const pendingTests = safeReadJSON(PENDING_FILE);
const rejections = safeReadJSON(REJECTION_FILE);

// Metrics calculation
const approvedCount = approvedTests.length;
const rejectionCount = rejections.length;
const skippedTests = pendingTests.length;
const validatedCount = approvedCount + rejectionCount;
const totalGenerated = validatedCount + skippedTests;

// Pass rate is the success rate of tests that have actually been validated
const passRate = validatedCount === 0 ? 0 : Math.round((approvedCount / validatedCount) * 100);
// Coverage rate is how many of the generated tests have been processed
const coverageRate = totalGenerated === 0 ? 0 : Math.round((validatedCount / totalGenerated) * 100);
const rejectionRate = totalGenerated === 0 ? 0 : Math.round((rejectionCount / totalGenerated) * 100);

// Quality score (average of approved)
const avgQuality = approvedCount
    ? Math.round(
        approvedTests
            .map(t => t.qualityScore || 0)
            .filter(q => q > 0).reduce((a, b) => a + b, 0) /
        (approvedTests.filter(t => t.qualityScore).length || 1)
    )
    : 0;

// Risk coverage (by riskLevel in pending/approved)
const riskLevels = ['critical', 'high', 'medium', 'low'];

type RiskStats = { [key: string]: number };
const riskStats: RiskStats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
for (const t of [...approvedTests, ...pendingTests]) {
    const risk = (t.riskLevel || '').toLowerCase();
    if (riskLevels.includes(risk)) {
        riskStats[risk]++;
        riskStats.total++;
    }
}
const riskCoverage: { [key: string]: number } = riskLevels.reduce((acc: { [key: string]: number }, level: string) => {
    acc[level] = riskStats.total ? Math.round((riskStats[level] / riskStats.total) * 100) : 0;
    return acc;
}, {});

// Rejection analytics (by reason/category)
const REASON_DISPLAY_MAP: Record<string, string> = {
    'incorrect-assertions': 'Incorrect assertions',
    'assertion': 'Incorrect assertions',
    'missing-edge-cases': 'Missing edge cases',
    'edge-case': 'Missing edge cases',
    'poor-selectors': 'Poor selectors',
    'selector': 'Poor selectors',
    'incomplete-coverage': 'Incomplete coverage',
    'coverage': 'Incomplete coverage',
    'syntax-errors': 'Syntax errors',
    'poor-maintainability': 'Poor maintainability',
    'not-aligned-with-requirements': 'Not aligned with requirements',
    'security-concerns': 'Security concerns',
    'performance-issues': 'Performance issues',
    'other': 'Other',
};

function getRejectionCategory(rej: any): string {
    const raw = ((rej.category && rej.category !== 'Other' ? rej.category : null)
        || rej.reason
        || 'Other').toLowerCase().trim();
    return REASON_DISPLAY_MAP[raw] ?? (rej.category || rej.reason || 'Other');
}

const rejectionCategories: { [key: string]: number } = {};
for (const rej of rejections) {
    const cat = getRejectionCategory(rej);
    rejectionCategories[cat] = (rejectionCategories[cat] || 0) + 1;
}
const topRejection: [string, number] = (Object.entries(rejectionCategories) as [string, number][])
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0] || ['None', 0];

const recentApproved: any[] = approvedTests.slice(-3).reverse();
const recentRejected: any[] = rejections.slice(-3).reverse();

const humanValidationRate = Math.round(
    (approvedCount / ((approvedCount + rejectionCount) || 1)) * 100
);

// Release confidence formula
// Now includes coverageRate so that un-validated tests penalize confidence correctly,
// but passRate only reflects successes of actually reviewed tests.
const hasRiskData = riskStats.total > 0;
const riskComponent = hasRiskData ? (riskCoverage['critical'] || 0) : passRate;

const releaseConfidence = Math.min(100, Math.round(
    0.3 * passRate +
    0.3 * coverageRate +
    0.2 * riskComponent +
    0.1 * avgQuality +
    0.1 * humanValidationRate
));

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Test Architecture Dashboard</title>
    <style>
        :root {
            --primary: #4f46e5;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg: #f3f4f6;
            --card: #ffffff;
            --text: #1f2937;
        }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        h1 { margin: 0; font-size: 24px; }
        .score-badge {
            background: var(--success);
            color: white;
            padding: 10px 20px;
            border-radius: 99px;
            font-weight: bold;
            font-size: 18px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background: var(--card);
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .card h2 {
            margin-top: 0;
            font-size: 18px;
            border-bottom: 2px solid var(--bg);
            padding-bottom: 10px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .metric-value { font-weight: bold; }
        .progress-bar {
            height: 8px;
            background: var(--bg);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        .progress-fill {
            height: 100%;
            background: var(--primary);
        }
        .status-passed { color: var(--success); }
        .status-failed { color: var(--danger); }
        .status-warning { color: var(--warning); }
        .timeline-item {
            padding: 10px 0;
            border-bottom: 1px solid var(--bg);
        }
        .timeline-item:last-child { border-bottom: none; }
        .timestamp { font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>🤖 AI-Assisted Test Architecture</h1>
                <p>Unified Quality Dashboard</p>
            </div>
            <div class="score-badge">Release Confidence: ${releaseConfidence}%</div>
        </header>

        <div class="grid">
            <!-- ── Validation Status ─────────────────────────────── -->
            <div class="card" style="grid-column: 1 / -1; border-left: 4px solid var(--primary);">
                <h2>🗂️ Validation Status <span style="font-size:13px;font-weight:normal;color:#6b7280;">All sessions combined</span></h2>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;text-align:center;">
                    <div style="padding:12px;background:var(--bg);border-radius:8px;">
                        <div style="font-size:28px;font-weight:bold;">${totalGenerated}</div>
                        <div style="font-size:12px;color:#6b7280;">Total Generated</div>
                    </div>
                    <div style="padding:12px;background:#d1fae5;border-radius:8px;">
                        <div style="font-size:28px;font-weight:bold;color:var(--success);">${approvedCount}</div>
                        <div style="font-size:12px;color:#065f46;">✅ Approved (${passRate}%)</div>
                    </div>
                    <div style="padding:12px;background:#fee2e2;border-radius:8px;">
                        <div style="font-size:28px;font-weight:bold;color:var(--danger);">${rejectionCount}</div>
                        <div style="font-size:12px;color:#991b1b;">❌ Rejected (${rejectionRate}%)</div>
                    </div>
                    <div style="padding:12px;background:#fef3c7;border-radius:8px;">
                        <div style="font-size:28px;font-weight:bold;color:var(--warning);">${skippedTests}</div>
                        <div style="font-size:12px;color:#92400e;">⏭️ Pending/Skipped (${totalGenerated === 0 ? 0 : Math.round((skippedTests / totalGenerated) * 100)}%)</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h2>⏭️ Skipped Tests</h2>
                <div class="metric">
                    <span>Skipped</span>
                    <span class="metric-value status-warning">${skippedTests}</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${totalGenerated === 0 ? 0 : Math.round((skippedTests / totalGenerated) * 100)}%; background: var(--warning)"></div></div>
                <p style="font-size: 12px;">Tests that were skipped or not yet validated.</p>
            </div>
            <div class="card">
                <h2>📊 Release Confidence Components</h2>
                <div class="metric">
                    <span>Validation Pass Rate</span>
                    <span class="metric-value status-passed">${passRate}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${passRate}%; background: var(--success)"></div></div>
                
                <div class="metric">
                    <span>Queue Coverage</span>
                    <span class="metric-value">${coverageRate}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${coverageRate}%; background: var(--primary)"></div></div>
                
                <div class="metric">
                    <span>Risk Coverage</span>
                    <span class="metric-value">${riskCoverage['critical']}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${riskCoverage['critical']}%"></div></div>
                
                <div class="metric">
                    <span>Test Quality</span>
                    <span class="metric-value">${avgQuality}/100</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${avgQuality}%"></div></div>
            </div>

            <div class="card">
                <h2>☂️ Risk-Based Coverage</h2>
                <div class="metric">
                    <span>🔴 Critical Risk</span>
                    <span class="metric-value">${riskCoverage['critical']}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${riskCoverage['critical']}%; background: var(--danger)"></div></div>
                
                <div class="metric">
                    <span>🟠 High Risk</span>
                    <span class="metric-value">${riskCoverage['high']}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${riskCoverage['high']}%; background: var(--warning)"></div></div>
                
                <div class="metric">
                    <span>🟡 Medium Risk</span>
                    <span class="metric-value">${riskCoverage['medium']}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${riskCoverage['medium']}%; background: var(--primary)"></div></div>
            </div>

            <div class="card">
                <h2>⛩️ Quality Gates</h2>
                <div class="metric">
                    <span>Pipeline Status</span>
                    <span class="metric-value status-passed">${releaseConfidence >= 75 ? 'PASSED' : 'FAILED'}</span>
                </div>
                <ul style="padding-left: 20px; list-style-type: none;">
                    <li>${passRate >= 80 ? '✅' : '❌'} Critical Pass Rate ≥ 80%</li>
                    <li>${riskCoverage['critical'] >= 80 ? '✅' : '❌'} Risk Coverage ≥ 80%</li>
                    <li>${avgQuality >= 70 ? '✅' : '❌'} Test Quality ≥ 70%</li>
                    <li>${rejectionRate < 20 ? '✅' : '❌'} Rejection Rate &lt; 20%</li>
                </ul>
            </div>

            <div class="card">
                <h2>📉 Rejection Analytics</h2>
                <div class="metric">
                    <span>Rejection Rate</span>
                    <span class="metric-value">${rejectionRate}%</span>
                </div>
                <div style="height: 150px; display: flex; align-items: flex-end; justify-content: space-around; padding-top: 10px;">
                    ${Object.entries(rejectionCategories).map(([cat, count]: [string, number]) => `
                    <div style="text-align: center;">
                        <div style="height: ${Number(count) * 20}px; width: 30px; background: var(--primary); margin: 0 auto;"></div>
                        <span style="font-size: 10px;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    </div>`).join('')}
                </div>
                <p style="font-size: 12px; margin-top: 10px;">Top Issue: <strong>${topRejection[0]}</strong> (${topRejection[1]} occurrences)</p>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h2>📝 Recent AI Generation Activity</h2>
            ${recentApproved.map((t: any) => `
            <div class="timeline-item">
                <div class="metric">
                    <strong>Approved: ${t.fileName || t.featureName || 'Test'}</strong>
                    <span class="status-passed">Approved</span>
                </div>
                <div class="timestamp">${t.timestamp ? new Date(t.timestamp).toLocaleString() : ''} ${t.qualityScore ? '• Quality Score: ' + t.qualityScore + '/100' : ''}</div>
            </div>`).join('')}
            ${recentRejected.map((t: any) => `
            <div class="timeline-item">
                <div class="metric">
                    <strong>Rejected: ${t.fileName || t.testName || t.featureName || 'Test'}</strong>
                    <span class="status-failed">Rejected</span>
                </div>
                <div class="timestamp">${t.timestamp ? new Date(t.timestamp).toLocaleString() : ''} ${t.category ? '• Reason: ' + t.category : ''}</div>
            </div>`).join('')}
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, HTML_CONTENT);
console.log(`✅ Dashboard generated at: ${OUTPUT_FILE}`);
console.log('Open this file in your browser to view the unified report.');
