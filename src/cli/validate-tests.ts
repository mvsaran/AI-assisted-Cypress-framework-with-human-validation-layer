/**
 * Human Validation CLI
 *
 * Reads pending AI-generated tests from pending-tests.json and presents each one
 * for an interactive approve / reject / skip flow.
 *
 * Options per test:
 *   [A] Approve  – save to cypress/e2e/ai-generated/ and add to approved-tests.json
 *   [R] Reject   – record rejection reason to reports/rejections/ and rejection-tracking.json
 *   [S] Skip     – leave in pending for a later session
 */
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingTest {
    fileName: string;
    featureName?: string;
    riskLevel?: string;
    code: string;
    qualityScore?: number;
    scores?: {
        syntax?: number;
        coverage?: number;
        assertions?: number;
        maintainability?: number;
        bestPractices?: number;
    };
    issues?: string;
    generatedAt?: string;
}

interface ApprovedTest {
    fileName: string;
    featureName?: string;
    riskLevel?: string;
    qualityScore?: number;
    timestamp: string;
}

interface RejectionEntry {
    fileName: string;
    featureName?: string;
    reason: string;
    category: string;
    timestamp: string;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const pendingPath = path.join('cypress', 'e2e', 'ai-generated', 'pending-tests.json');
const approvedDir = path.join('cypress', 'e2e', 'ai-generated');
const rejectedDir = path.join('reports', 'rejections');
const approvedTestsPath = path.join('reports', 'approved-tests.json');
const rejectionTrackingPath = 'rejection-tracking.json';

// ─── Readline ────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
}

// ─── Rejection categories ────────────────────────────────────────────────────

const REJECTION_CATEGORIES = [
    'Incorrect assertions',
    'Missing edge cases',
    'Poor selectors',
    'Incomplete coverage',
    'Syntax errors',
    'Poor maintainability',
    'Not aligned with requirements',
    'Security concerns',
    'Performance issues',
    'Other',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function updateApprovedTests(test: PendingTest): ApprovedTest[] {
    let approved: ApprovedTest[] = [];
    try {
        if (fs.existsSync(approvedTestsPath)) {
            approved = JSON.parse(fs.readFileSync(approvedTestsPath, 'utf-8'));
        }
    } catch { /* ignore */ }
    approved.push({
        fileName: test.fileName,
        featureName: test.featureName,
        riskLevel: test.riskLevel,
        qualityScore: test.qualityScore,
        timestamp: new Date().toISOString(),
    });
    fs.mkdirSync(path.dirname(approvedTestsPath), { recursive: true });
    fs.writeFileSync(approvedTestsPath, JSON.stringify(approved, null, 2), 'utf-8');
    return approved;
}

function updateRejectionTracking(test: PendingTest, reason: string, category: string): void {
    let tracking: RejectionEntry[] = [];
    try {
        if (fs.existsSync(rejectionTrackingPath)) {
            tracking = JSON.parse(fs.readFileSync(rejectionTrackingPath, 'utf-8'));
        }
    } catch { /* ignore */ }
    tracking.push({
        fileName: test.fileName,
        featureName: test.featureName,
        reason,
        category,
        timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(rejectionTrackingPath, JSON.stringify(tracking, null, 2), 'utf-8');
}

function printTestHeader(test: PendingTest, globalNum: number, originalTotal: number): void {
    const riskIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[test.riskLevel || ''] || '⚪';
    const scoreBar = (n?: number) => {
        if (n === undefined) return '—';
        const filled = Math.round(n / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${n}/100`;
    };

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log(`║  TEST ${globalNum} of ${originalTotal}`.padEnd(59) + '║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  ${riskIcon}  ${(test.featureName || test.fileName).substring(0, 51).padEnd(53)}║`);
    console.log(`║  File: ${test.fileName.substring(0, 52).padEnd(52)}║`);
    if (test.generatedAt) {
        console.log(`║  Generated: ${test.generatedAt.substring(0, 47).padEnd(47)}║`);
    }
    console.log('╠══════════════════════════════════════════════════════════╣');

    if (test.qualityScore !== undefined) {
        const q = test.qualityScore;
        const qEmoji = q >= 80 ? '✅' : q >= 70 ? '⚠️ ' : '❌';
        console.log(`║  ${qEmoji} Overall Quality : ${scoreBar(q).padEnd(37)}║`);
    }
    if (test.scores) {
        const s = test.scores;
        if (s.syntax !== undefined) console.log(`║     Syntax         : ${scoreBar(s.syntax).padEnd(35)}  ║`);
        if (s.coverage !== undefined) console.log(`║     Coverage       : ${scoreBar(s.coverage).padEnd(35)}  ║`);
        if (s.assertions !== undefined) console.log(`║     Assertions     : ${scoreBar(s.assertions).padEnd(35)}  ║`);
        if (s.maintainability !== undefined) console.log(`║     Maintainability: ${scoreBar(s.maintainability).padEnd(35)}  ║`);
        if (s.bestPractices !== undefined) console.log(`║     Best Practices : ${scoreBar(s.bestPractices).padEnd(35)}  ║`);
    }
    if (test.issues && test.issues !== 'None detected') {
        console.log(`║  ⚠️  Issues: ${test.issues.substring(0, 46).padEnd(46)}║`);
    }

    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  📄 GENERATED TEST CODE:                                 ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('');
    console.log(test.code.trim());
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  💡 WHAT WOULD YOU LIKE TO DO WITH THIS TEST?            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  [A] Approve  — save to cypress/e2e/ as accepted test    ║');
    console.log('║  [R] Reject   — log rejection reason & category          ║');
    console.log('║  [S] Skip     — leave pending for a later session        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
}

function printSessionStatus(
    globalNum: number,
    originalTotal: number,
    approved: number,
    rejected: number,
    skipped: number
): void {
    const reviewed = approved + rejected + skipped;
    const remaining = originalTotal - reviewed;
    console.log('\n  ┌─────────────────────────────────────────────────────┐');
    console.log(`  │  📋 SESSION PROGRESS  (${reviewed} of ${originalTotal} reviewed)`.padEnd(56) + '│');
    console.log('  ├─────────────────────────────────────────────────────┤');
    console.log(`  │  ✅ Approved : ${String(approved).padEnd(4)}  ❌ Rejected : ${String(rejected).padEnd(4)}  ⏭️  Skipped: ${String(skipped).padEnd(3)}│`);
    console.log(`  │  ⏳ Remaining: ${String(remaining).padEnd(37)}│`);
    console.log('  └─────────────────────────────────────────────────────┘\n');
}


// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║      🧠  HUMAN VALIDATION — AI-Generated Tests            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Load pending tests
    let pendingTests: PendingTest[] = [];
    try {
        const raw = await fs.promises.readFile(pendingPath, 'utf-8');
        pendingTests = JSON.parse(raw);
        pendingTests = pendingTests.filter((t) => t.code && !t.code.includes('// TODO: Implement'));
    } catch {
        console.log('  No pending tests found. Run "npm run ai:generate" first.');
        rl.close();
        return;
    }

    if (pendingTests.length === 0) {
        console.log('  No pending tests to validate. Run "npm run ai:generate" to generate some.');
        rl.close();
        return;
    }

    const originalTotal = pendingTests.length;
    console.log(`  Found ${originalTotal} pending test(s) awaiting validation.\n`);
    console.log('  Keys: [A] Approve  [R] Reject  [S] Skip\n');

    // Session-level counters — never reset, even as the array shrinks
    const session = { approved: 0, rejected: 0, skipped: 0 };
    let globalNum = 0; // 1-based test number in the original queue
    let i = 0;

    while (i < pendingTests.length) {
        const test = pendingTests[i];
        globalNum++;
        printTestHeader(test, globalNum, originalTotal);

        let resolved = false;
        while (!resolved) {
            const answer = await ask('  Action [A]pprove / [R]eject / [S]kip ? ');
            const action = answer.trim().toLowerCase();

            if (action === 'a') {
                // ── Approve ───────────────────────────────────────────────
                const fileName = test.fileName || `approved-test-${Date.now()}.cy.ts`;
                const outputPath = path.join(approvedDir, fileName);
                try {
                    await fs.promises.mkdir(approvedDir, { recursive: true });
                    const header = [
                        `// AI-Generated Test — Approved by human validator`,
                        `// Feature     : ${test.featureName || 'Unknown'}`,
                        `// Risk Level  : ${test.riskLevel || 'unknown'}`,
                        `// Quality Score: ${test.qualityScore !== undefined ? test.qualityScore + '/100' : 'N/A'}`,
                        `// Approved At : ${new Date().toISOString()}`,
                        '',
                    ].join('\n');
                    await fs.promises.writeFile(outputPath, header + test.code.trim() + '\n', 'utf-8');
                    const allApproved = updateApprovedTests(test);
                    session.approved++;
                    console.log(`\n  ✅ Test #${globalNum} Approved! Saved to: ${outputPath}`);
                    console.log(`  📊 Total approved tests (all sessions): ${allApproved.length}`);
                    pendingTests.splice(i, 1);
                    resolved = true;
                } catch (err) {
                    console.error('  ❌ Failed to save test:', err);
                    resolved = true;
                }

            } else if (action === 'r') {
                // ── Reject ────────────────────────────────────────────────
                console.log('\n  Rejection categories:');
                REJECTION_CATEGORIES.forEach((cat, idx) => {
                    console.log(`    ${idx + 1}. ${cat}`);
                });
                const catAnswer = await ask(`  Pick category (1-${REJECTION_CATEGORIES.length}) or press Enter for "Other": `);
                const catIdx = parseInt(catAnswer.trim()) - 1;
                const category = REJECTION_CATEGORIES[catIdx] ?? 'Other';
                const reason = await ask('  Describe the issue (free text): ');

                fs.mkdirSync(rejectedDir, { recursive: true });
                const rejectionPath = path.join(rejectedDir, `${test.fileName}.json`);
                fs.writeFileSync(rejectionPath, JSON.stringify({ reason, category, timestamp: new Date().toISOString() }, null, 2), 'utf-8');
                updateRejectionTracking(test, reason, category);
                session.rejected++;

                console.log(`\n  ❌ Test #${globalNum} Rejected (${category}).`);
                console.log(`  📝 Rejection logged to ${rejectionPath} and ${rejectionTrackingPath}`);
                pendingTests.splice(i, 1);
                resolved = true;

            } else if (action === 's') {
                // ── Skip ──────────────────────────────────────────────────
                console.log(`\n  ⏭️  Test #${globalNum} Skipped — stays in pending for next session.`);
                session.skipped++;
                i++;
                resolved = true;

            } else {
                console.log('  ❓ Invalid choice. Please enter A, R, or S.\n');
            }

            // Print live status after every decision (not after T)
            if (resolved) {
                printSessionStatus(globalNum, originalTotal, session.approved, session.rejected, session.skipped);
            }
        }
    }

    // Update pending-tests.json with only the remaining (skipped) tests
    fs.writeFileSync(pendingPath, JSON.stringify(pendingTests, null, 2), 'utf-8');

    rl.close();
    console.log('══════════════════════════════════════════════════════════');
    console.log('  ✅ Validation session complete.');
    console.log(`  ✅ Approved : ${session.approved}`);
    console.log(`  ❌ Rejected : ${session.rejected}`);
    console.log(`  ⏭️  Skipped  : ${session.skipped}`);
    if (pendingTests.length > 0) {
        console.log(`  📁 ${pendingTests.length} test(s) skipped — still in ${pendingPath}.`);
    }
    console.log('\n  Next steps:');
    console.log('    npm run report:rejection   — view rejection analytics');
    console.log('    npm run report:dashboard   — full HTML dashboard');
    console.log('    npx cypress run            — run approved tests');
    console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
    console.error('\n💥 Fatal error:', err);
    rl.close();
    process.exit(1);
});
