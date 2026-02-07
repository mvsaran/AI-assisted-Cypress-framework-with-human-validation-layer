import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'reports', 'dashboard.html');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR);
}

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
            <div class="score-badge">Release Confidence: 91.9%</div>
        </header>

        <div class="grid">
            <div class="card">
                <h2>📊 Release Confidence Components</h2>
                <div class="metric">
                    <span>Test Pass Rate</span>
                    <span class="metric-value status-passed">100%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 100%; background: var(--success)"></div></div>
                
                <div class="metric">
                    <span>Risk Coverage</span>
                    <span class="metric-value">85%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 85%"></div></div>
                
                <div class="metric">
                    <span>Test Quality</span>
                    <span class="metric-value">92/100</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 92%"></div></div>
            </div>

            <div class="card">
                <h2>☂️ Risk-Based Coverage</h2>
                <div class="metric">
                    <span>🔴 Critical Risk</span>
                    <span class="metric-value">100%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 100%; background: var(--danger)"></div></div>
                
                <div class="metric">
                    <span>🟠 High Risk</span>
                    <span class="metric-value">88%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 88%; background: var(--warning)"></div></div>
                
                <div class="metric">
                    <span>🟡 Medium Risk</span>
                    <span class="metric-value">75%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: 75%; background: var(--primary)"></div></div>
            </div>

            <div class="card">
                <h2>⛩️ Quality Gates</h2>
                <div class="metric">
                    <span>Pipeline Status</span>
                    <span class="metric-value status-passed">PASSED</span>
                </div>
                <ul style="padding-left: 20px; list-style-type: none;">
                    <li>✅ Critical Pass Rate > 99%</li>
                    <li>✅ Risk Coverage > 80%</li>
                    <li>✅ Test Quality > 70%</li>
                    <li>✅ No Unreviewed Rejections</li>
                </ul>
            </div>

            <div class="card">
                <h2>📉 Rejection Analytics</h2>
                <div class="metric">
                    <span>Rejection Rate</span>
                    <span class="metric-value">12%</span>
                </div>
                <div style="height: 150px; display: flex; align-items: flex-end; justify-content: space-around; padding-top: 10px;">
                    <div style="text-align: center;">
                        <div style="height: 40px; width: 30px; background: var(--primary); margin: 0 auto;"></div>
                        <span style="font-size: 10px;">Assert</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="height: 80px; width: 30px; background: var(--primary); margin: 0 auto;"></div>
                        <span style="font-size: 10px;">Edge</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="height: 30px; width: 30px; background: var(--primary); margin: 0 auto;"></div>
                        <span style="font-size: 10px;">Selector</span>
                    </div>
                </div>
                <p style="font-size: 12px; margin-top: 10px;">Top Issue: <strong>Edge Cases</strong> in Checkout Flow</p>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h2>🚀 Strategic Improvements</h2>
            <div class="metric">
                <span><strong>1. Risk Coverage Gap</strong></span>
                <span class="status-failed">Action Required</span>
            </div>
            <p style="font-size: 14px; margin-bottom: 15px;">
                Critical "Checkout" module has 88% coverage. Missing test for <em>International Shipping</em> scenario.
                <br><a href="#" style="color: var(--primary); font-size: 12px;">Generate AI Test &rarr;</a>
            </p>

            <div class="metric">
                <span><strong>2. AI Rejection Pattern</strong></span>
                <span class="status-warning">Review Needed</span>
            </div>
            <p style="font-size: 14px; margin-bottom: 15px;">
                High rejection rate (35%) in "Payment" feature due to <em>Incorrect Assertions</em>.
                <br><small style="color: #6b7280;">Recommendation: Update prompt with specific currency formatting examples.</small>
            </p>

            <div class="metric">
                <span><strong>3. Flaky Test Detected</strong></span>
                <span class="status-warning">Optimization</span>
            </div>
            <p style="font-size: 14px;">
                <code>cart.cy.ts</code> has variable execution time (1.2s - 4.5s). Consider adding static waits or improving intercept handling.
            </p>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h2>📝 Recent AI Generation Activity</h2>
            <div class="timeline-item">
                <div class="metric">
                    <strong>Generated: Profile Update Test</strong>
                    <span class="status-passed">Approved</span>
                </div>
                <div class="timestamp">10 minutes ago • Quality Score: 92/100</div>
            </div>
            <div class="timeline-item">
                <div class="metric">
                    <strong>Generated: Payment Validation</strong>
                    <span class="status-failed">Rejected</span>
                </div>
                <div class="timestamp">2 hours ago • Reason: Incorrect Currency Assertion</div>
            </div>
            <div class="timeline-item">
                <div class="metric">
                    <strong>Generated: Search Filters</strong>
                    <span class="status-passed">Approved (Edited)</span>
                </div>
                <div class="timestamp">5 hours ago • Quality Score: 85/100</div>
            </div>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, HTML_CONTENT);
console.log(`✅ Dashboard generated at: ${OUTPUT_FILE}`);
console.log('Open this file in your browser to view the unified report.');
