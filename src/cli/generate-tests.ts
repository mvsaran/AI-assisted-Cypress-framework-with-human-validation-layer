/**
 * AI Test Generator CLI
 *
 * Workflow:
 *   1. Walk the live app at http://localhost:3000 to discover real selectors & API routes
 *   2. Display a rich walkthrough summary so the developer knows what was found
 *   3. For each discovered SPA page/feature → call Anthropic Claude to generate a real Cypress test
 *   4. Auto-score each test with TestQualityScorer
 *   5. Write results to pending-tests.json for the human validation loop (npm run validate:tests)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { AppWalker } from '../ai/app-walker';
import { AITestGenerator } from '../ai/ai-test-generator';
import { TestQualityScorer } from '../ai/test-quality-scorer';

// ─── Paths ────────────────────────────────────────────────────────────────────
const pendingPath = path.join('cypress', 'e2e', 'ai-generated', 'pending-tests.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writePending(tests: unknown[]): void {
    fs.mkdirSync(path.dirname(pendingPath), { recursive: true });
    fs.writeFileSync(pendingPath, JSON.stringify(tests, null, 2), 'utf-8');
}

function readPending(): unknown[] {
    try {
        if (fs.existsSync(pendingPath)) {
            return JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
        }
    } catch { /* ignore */ }
    return [];
}

/**
 * Attempt to start the demo server if it is not already running.
 * Returns the child process if spawned, or null if the server was already up.
 */
async function ensureServerRunning(walker: AppWalker): Promise<child_process.ChildProcess | null> {
    const running = await walker.isServerRunning();
    if (running) {
        console.log('  ✅ Demo server is already running on http://localhost:3000');
        return null;
    }

    console.log('  ⚡ Demo server not detected — starting it automatically...');
    const serverProcess = child_process.spawn('node', ['demo-app/server.js'], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Give it a moment to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const nowRunning = await walker.isServerRunning();
    if (!nowRunning) {
        serverProcess.kill();
        throw new Error(
            '❌ Failed to start the demo server.\n' +
            '   Please run "npm run demo:start" in a separate terminal, then re-run ai:generate.'
        );
    }

    console.log('  ✅ Demo server started successfully.');
    return serverProcess;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║      🤖  AI-ASSISTED CYPRESS TEST GENERATOR              ║');
    console.log('║         Walkthrough → Generate → Validate                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // ── Step 1: Server check ──────────────────────────────────────────────────
    console.log('STEP 1 ▶  Checking demo application...');
    const walker = new AppWalker('http://localhost:3000');
    const serverProcess = await ensureServerRunning(walker);

    // ── Step 2: Walk the app ──────────────────────────────────────────────────
    console.log('\nSTEP 2 ▶  Walking the application to discover UI elements...');
    const walkResult = await walker.walk();
    console.log(AppWalker.formatWalkSummary(walkResult));

    if (walkResult.pages.length === 0) {
        console.error('❌ No pages were discovered. Check that the app HTML has data-testid attributes.');
        process.exit(1);
    }

    // ── Step 3: Generate tests for each page ──────────────────────────────────
    console.log('\nSTEP 3 ▶  Generating Cypress tests using Anthropic Claude...\n');

    let generator: AITestGenerator;
    try {
        generator = new AITestGenerator();
    } catch (err) {
        console.error('\n❌ Cannot initialise AI generator:', (err as Error).message);
        const provider = (process.env.AI_PROVIDER || 'claude').toUpperCase();
        console.error(`   Make sure ${provider}_API_KEY is set in your .env file.`);
        process.exit(1);
    }

    const scorer = new TestQualityScorer();
    const existingPending = readPending() as unknown[];
    const newTests: unknown[] = [];

    for (let i = 0; i < walkResult.pages.length; i++) {
        const page = walkResult.pages[i];
        const riskIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[page.riskLevel];

        console.log(`  [${i + 1}/${walkResult.pages.length}] ${riskIcon}  Generating: ${page.name}`);
        console.log(`         Selectors: ${page.selectors.join(', ')}`);

        try {
            const generatedTest = await generator.generateTest({
                featureName: page.name,
                featureDescription: page.description,
                riskLevel: page.riskLevel,
                existingSelectors: page.selectors,
                apiEndpoints: page.apiEndpoints,
                pageHtml: walkResult.htmlSnapshot,
                credentials: walkResult.credentials,
                baseUrl: walkResult.baseUrl,
            });

            // Auto-score the generated test (async method)
            const scored = await scorer.scoreTest(generatedTest.testCode);
            const overallScore = scored.overallScore;

            const issues = scored.issues && scored.issues.length > 0
                ? scored.issues.map((iss) => iss.message).join('; ')
                : 'None detected';

            const fileName = `ai-${page.id}-${Date.now()}.cy.ts`;

            const testEntry = {
                fileName,
                featureName: page.name,
                riskLevel: page.riskLevel,
                code: generatedTest.testCode,
                qualityScore: overallScore,
                scores: {
                    syntax: scored.syntaxScore,
                    coverage: scored.coverageScore,
                    assertions: scored.assertionScore,
                    maintainability: scored.maintainabilityScore,
                    bestPractices: scored.bestPracticesScore,
                },
                issues,
                generatedAt: new Date().toISOString(),
            };

            newTests.push(testEntry);

            const scoreEmoji = overallScore >= 80 ? '✅' : overallScore >= 70 ? '⚠️ ' : '❌';
            console.log(`         ${scoreEmoji} Quality score: ${overallScore}/100  |  Issues: ${issues}`);
        } catch (err) {
            const msg = (err as Error).message;
            console.error(`         ❌ Generation failed: ${msg}`);
            // Continue with other pages
        }

        // Small delay to be polite to the API
        if (i < walkResult.pages.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    // ── Step 4: Write pending tests ───────────────────────────────────────────
    const allPending = [...existingPending, ...newTests];
    writePending(allPending);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' STEP 4 ▶  GENERATION COMPLETE');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Generated : ${newTests.length} new test(s)`);
    console.log(`  Pending   : ${allPending.length} total tests awaiting validation`);
    console.log(`  Saved to  : ${pendingPath}`);
    console.log('');
    console.log('  👉  Next step — run the human validation loop:');
    console.log('       npm run validate:tests');
    console.log('══════════════════════════════════════════════════════════\n');

    // Clean up spawned server process if we started it
    if (serverProcess) {
        serverProcess.kill();
    }
}

main().catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
