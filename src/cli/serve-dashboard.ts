/**
 * Live Dashboard Server
 *
 * Serves the unified dashboard at http://localhost:3001/dashboard
 * Reads all JSON data files fresh on every request — no need to re-run report:dashboard.
 *
 * Usage:  npm run report:serve
 */
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const PORT = 3001;
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const APPROVED_FILE = path.join(REPORTS_DIR, 'approved-tests.json');
const PENDING_FILE = path.join(process.cwd(), 'cypress', 'e2e', 'ai-generated', 'pending-tests.json');
const REJECTION_FILE = path.join(process.cwd(), 'rejection-tracking.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeReadJSON(filePath: string): any[] {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch { /* ignore */ }
    return [];
}

const REASON_DISPLAY_MAP: Record<string, string> = {
    'incorrect-assertions': 'Incorrect assertions', 'assertion': 'Incorrect assertions',
    'missing-edge-cases': 'Missing edge cases', 'edge-case': 'Missing edge cases',
    'poor-selectors': 'Poor selectors', 'selector': 'Poor selectors',
    'incomplete-coverage': 'Incomplete coverage', 'coverage': 'Incomplete coverage',
    'syntax-errors': 'Syntax errors',
    'poor-maintainability': 'Poor maintainability',
    'not-aligned-with-requirements': 'Not aligned with requirements',
    'security-concerns': 'Security concerns',
    'performance-issues': 'Performance issues',
    'other': 'Other',
};

function getRejectionCategory(rej: any): string {
    const raw = ((rej.category && rej.category !== 'Other' ? rej.category : null)
        || rej.reason || 'Other').toLowerCase().trim();
    return REASON_DISPLAY_MAP[raw] ?? (rej.category || rej.reason || 'Other');
}

// ─── Build HTML from current data ─────────────────────────────────────────────

function buildDashboard(): string {
    const approvedTests = safeReadJSON(APPROVED_FILE);
    const pendingTests = safeReadJSON(PENDING_FILE);
    const rejections = safeReadJSON(REJECTION_FILE);

    const skippedTests = pendingTests.length;
    const totalTests = approvedTests.length + skippedTests + rejections.length;
    const passRate = totalTests === 0 ? 0 : Math.round((approvedTests.length / totalTests) * 100);
    const rejectionRate = totalTests === 0 ? 0 : Math.round((rejections.length / totalTests) * 100);

    const avgQuality = approvedTests.length
        ? Math.round(
            approvedTests.map((t: any) => t.qualityScore || 0).filter((q: number) => q > 0)
                .reduce((a: number, b: number) => a + b, 0) /
            (approvedTests.filter((t: any) => t.qualityScore).length || 1)
        )
        : 0;

    const riskLevels = ['critical', 'high', 'medium', 'low'];
    type RiskStats = { [key: string]: number };
    const riskStats: RiskStats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    for (const t of [...approvedTests, ...pendingTests]) {
        const risk = (t.riskLevel || '').toLowerCase();
        if (riskLevels.includes(risk)) { riskStats[risk]++; riskStats.total++; }
    }
    const riskCoverage: { [key: string]: number } = riskLevels.reduce(
        (acc: { [key: string]: number }, level: string) => {
            acc[level] = riskStats.total ? Math.round((riskStats[level] / riskStats.total) * 100) : 0;
            return acc;
        }, {}
    );

    const rejectionCategories: { [key: string]: number } = {};
    for (const rej of rejections) {
        const cat = getRejectionCategory(rej);
        rejectionCategories[cat] = (rejectionCategories[cat] || 0) + 1;
    }
    const topRejection: [string, number] =
        (Object.entries(rejectionCategories) as [string, number][])
            .sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    const recentApproved: any[] = approvedTests.slice(-3).reverse();
    const recentRejected: any[] = rejections.slice(-3).reverse();

    const humanValidationRate = Math.round(
        (approvedTests.length / ((approvedTests.length + rejections.length) || 1)) * 100
    );
    const hasRiskData = riskStats.total > 0;
    const riskComponent = hasRiskData ? (riskCoverage['critical'] || 0) : passRate;
    const releaseConfidence = Math.min(100, Math.round(
        0.4 * passRate + 0.3 * riskComponent + 0.2 * avgQuality + 0.1 * humanValidationRate
    ));

    const confidenceColor = releaseConfidence >= 85 ? '#10b981' : releaseConfidence >= 70 ? '#f59e0b' : '#ef4444';
    const now = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Test Dashboard — Live</title>
    <style>
        :root {
            --primary: #4f46e5; --success: #10b981; --warning: #f59e0b;
            --danger: #ef4444;  --bg: #f3f4f6;      --card: #ffffff; --text: #1f2937;
        }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        h1 { margin: 0; font-size: 22px; }
        .header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .score-badge {
            background: ${confidenceColor}; color: white; padding: 10px 20px;
            border-radius: 99px; font-weight: bold; font-size: 18px;
        }
        .refresh-btn {
            background: var(--primary); color: white; border: none; padding: 10px 18px;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
        }
        .refresh-btn:hover { background: #4338ca; }
        .live-badge {
            display: flex; align-items: center; gap: 6px; font-size: 12px;
            color: var(--success); font-weight: 600;
        }
        .live-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .last-updated { font-size: 11px; color: #9ca3af; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: var(--card); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; font-size: 16px; border-bottom: 2px solid var(--bg); padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .metric-value { font-weight: bold; }
        .progress-bar { height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; margin-bottom: 15px; }
        .progress-fill { height: 100%; background: var(--primary); transition: width 0.4s ease; }
        .status-passed { color: var(--success); } .status-failed { color: var(--danger); } .status-warning { color: var(--warning); }
        .timeline-item { padding: 10px 0; border-bottom: 1px solid var(--bg); }
        .timeline-item:last-child { border-bottom: none; }
        .timestamp { font-size: 12px; color: #6b7280; }
        .tile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 16px; text-align: center; }
        .tile { padding: 14px; border-radius: 8px; }
        .tile .num { font-size: 32px; font-weight: bold; }
        .tile .label { font-size: 12px; margin-top: 4px; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div>
            <h1>🤖 AI-Assisted Test Architecture</h1>
            <div class="live-badge"><span class="live-dot"></span> LIVE — auto-refreshing every 30 s</div>
            <div class="last-updated">Last loaded: ${now}</div>
        </div>
        <div class="header-right">
            <div class="score-badge">Release Confidence: ${releaseConfidence}%</div>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Now</button>
        </div>
    </header>

    <div class="grid">
        <!-- Validation Status – full width -->
        <div class="card" style="grid-column: 1 / -1; border-left: 4px solid var(--primary);">
            <h2>🗂️ Validation Status <span style="font-size:13px;font-weight:normal;color:#6b7280;">All sessions combined</span></h2>
            <div class="tile-grid">
                <div class="tile" style="background:var(--bg);">
                    <div class="num">${totalTests}</div>
                    <div class="label" style="color:#6b7280;">Total Generated</div>
                </div>
                <div class="tile" style="background:#d1fae5;">
                    <div class="num" style="color:var(--success);">${approvedTests.length}</div>
                    <div class="label" style="color:#065f46;">✅ Approved (${passRate}%)</div>
                </div>
                <div class="tile" style="background:#fee2e2;">
                    <div class="num" style="color:var(--danger);">${rejections.length}</div>
                    <div class="label" style="color:#991b1b;">❌ Rejected (${rejectionRate}%)</div>
                </div>
                <div class="tile" style="background:#fef3c7;">
                    <div class="num" style="color:var(--warning);">${skippedTests}</div>
                    <div class="label" style="color:#92400e;">⏭️ Pending/Skipped (${totalTests === 0 ? 0 : Math.round((skippedTests / totalTests) * 100)}%)</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>📊 Release Confidence Components</h2>
            <div class="metric"><span>Test Pass Rate</span><span class="metric-value status-passed">${passRate}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${passRate}%;background:var(--success)"></div></div>
            <div class="metric"><span>Risk / Coverage</span><span class="metric-value">${riskComponent}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${riskComponent}%"></div></div>
            <div class="metric"><span>Avg Test Quality</span><span class="metric-value">${avgQuality}/100</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${avgQuality}%"></div></div>
            <div class="metric"><span>Human Validation Rate</span><span class="metric-value">${humanValidationRate}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${humanValidationRate}%;background:var(--warning)"></div></div>
        </div>

        <div class="card">
            <h2>☂️ Risk-Based Coverage</h2>
            <div class="metric"><span>🔴 Critical</span><span class="metric-value">${riskCoverage['critical']}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${riskCoverage['critical']}%;background:var(--danger)"></div></div>
            <div class="metric"><span>🟠 High</span><span class="metric-value">${riskCoverage['high']}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${riskCoverage['high']}%;background:var(--warning)"></div></div>
            <div class="metric"><span>🟡 Medium</span><span class="metric-value">${riskCoverage['medium']}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${riskCoverage['medium']}%;background:var(--primary)"></div></div>
            <div class="metric"><span>🟢 Low</span><span class="metric-value">${riskCoverage['low']}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${riskCoverage['low']}%;background:var(--success)"></div></div>
            ${!hasRiskData ? '<p style="font-size:12px;color:#6b7280;">ℹ️ No risk-level tags found in test files. Using pass rate as coverage proxy.</p>' : ''}
        </div>

        <div class="card">
            <h2>⛩️ Quality Gates</h2>
            <div class="metric"><span>Pipeline Status</span>
                <span class="metric-value ${releaseConfidence >= 75 ? 'status-passed' : 'status-failed'}">${releaseConfidence >= 75 ? 'PASSED' : 'FAILED'}</span>
            </div>
            <ul style="padding-left:20px;list-style-type:none;margin:0;">
                <li>${passRate >= 80 ? '✅' : '❌'} Critical Pass Rate ≥ 80%</li>
                <li>${riskComponent >= 80 ? '✅' : '❌'} Risk Coverage ≥ 80%</li>
                <li>${avgQuality >= 70 ? '✅' : '❌'} Test Quality ≥ 70%</li>
                <li>${rejectionRate < 20 ? '✅' : '❌'} Rejection Rate &lt; 20%</li>
            </ul>
        </div>

        <div class="card">
            <h2>📉 Rejection Analytics</h2>
            <div class="metric"><span>Rejection Rate</span><span class="metric-value">${rejectionRate}%</span></div>
            <div style="height:150px;display:flex;align-items:flex-end;justify-content:space-around;padding-top:10px;">
                ${Object.entries(rejectionCategories).map(([cat, count]: [string, any]) => `
                <div style="text-align:center;">
                    <div style="height:${Number(count) * 20}px;width:30px;background:var(--primary);margin:0 auto;border-radius:4px 4px 0 0;"></div>
                    <span style="font-size:10px;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <div style="font-size:11px;font-weight:bold;">${count}</div>
                </div>`).join('')}
            </div>
            <p style="font-size:12px;margin-top:10px;">Top Issue: <strong>${topRejection[0]}</strong> (${topRejection[1]} occurrences)</p>
        </div>

        <div class="card">
            <h2>⏭️ Pending Tests</h2>
            <div class="metric"><span>Awaiting Validation</span><span class="metric-value status-warning">${skippedTests}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${totalTests === 0 ? 0 : Math.round((skippedTests / totalTests) * 100)}%;background:var(--warning)"></div></div>
            <p style="font-size:12px;">Run <code>npm run validate:tests</code> to review pending tests.</p>
        </div>
    </div>

    <div class="card" style="margin-top:20px;">
        <h2>📝 Recent Activity</h2>
        ${recentApproved.map((t: any) => `
        <div class="timeline-item">
            <div class="metric">
                <strong>✅ ${t.fileName || t.featureName || 'Test'}</strong>
                <span class="status-passed">Approved</span>
            </div>
            <div class="timestamp">${t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}${t.qualityScore ? ' • Quality: ' + t.qualityScore + '/100' : ''}</div>
        </div>`).join('')}
        ${recentRejected.map((t: any) => `
        <div class="timeline-item">
            <div class="metric">
                <strong>❌ ${t.fileName || t.featureName || 'Test'}</strong>
                <span class="status-failed">Rejected</span>
            </div>
            <div class="timestamp">${t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}${t.category ? ' • Reason: ' + t.category : ''}</div>
        </div>`).join('')}
    </div>
</div>

<script>
    // Auto-refresh every 30 seconds
    let countdown = 30;
    const badge = document.querySelector('.live-badge');
    setInterval(() => {
        countdown--;
        if (badge) badge.innerHTML = '<span class="live-dot"></span> LIVE — refreshing in ' + countdown + ' s';
        if (countdown <= 0) location.reload();
    }, 1000);
</script>
</body>
</html>`;
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildDashboard());
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  📊  LIVE DASHBOARD SERVER                               ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  URL  : http://localhost:${PORT}/dashboard`.padEnd(59) + '║');
    console.log('║  Data : reads JSON files fresh on every page load        ║');
    console.log('║  Auto : browser auto-refreshes every 30 seconds          ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Press Ctrl+C to stop the server                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
});
