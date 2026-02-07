import * as fs from 'fs';
import * as path from 'path';

interface RejectionRecord {
    id: string;
    testName: string;
    feature: string;
    reason: string; // 'assertion' | 'edge-case' | 'selector' | 'coverage' | 'other'
    comment: string;
    timestamp: string;
}

const REJECTION_FILE = path.join(process.cwd(), 'rejection-tracking.json');

// Mock data for demo purposes if file doesn't exist
const DEMO_DATA: RejectionRecord[] = [
    {
        id: '1',
        testName: 'should validate email format',
        feature: 'Authentication',
        reason: 'edge-case',
        comment: 'Missed testing for emails without domains',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: '2',
        testName: 'should calculate total with discount',
        feature: 'Checkout',
        reason: 'assertion',
        comment: 'Used contain instead of exact match for currency',
        timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: '3',
        testName: 'should persist cart after reload',
        feature: 'Shopping Cart',
        reason: 'coverage',
        comment: 'Test only checked UI, not local storage',
        timestamp: new Date().toISOString()
    },
    {
        id: '4',
        testName: 'should filter products by price',
        feature: 'Product Catalog',
        reason: 'selector',
        comment: 'Used .product-card instead of data-testid',
        timestamp: new Date().toISOString()
    }
];

function loadRejections(): RejectionRecord[] {
    if (!fs.existsSync(REJECTION_FILE)) {
        // Create file with demo data if it doesn't exist
        fs.writeFileSync(REJECTION_FILE, JSON.stringify(DEMO_DATA, null, 2));
        return DEMO_DATA;
    }
    return JSON.parse(fs.readFileSync(REJECTION_FILE, 'utf-8'));
}

function generateReport() {
    console.log('📊 Generating AI Test Rejection Report...\n');
    console.log('----------------------------------------');

    const rejections = loadRejections();
    console.log(`Total Rejections Tracked: ${rejections.length}\n`);

    // Analysis by Reason
    const reasonCounts = rejections.reduce((acc, curr) => {
        acc[curr.reason] = (acc[curr.reason] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('📉 Rejections by Category:');
    Object.entries(reasonCounts).forEach(([reason, count]) => {
        const percentage = ((count / rejections.length) * 100).toFixed(1);
        console.log(`  - ${getIcon(reason)} ${capitalize(reason)}: ${count} (${percentage}%)`);
    });

    console.log('\n🔍 Recent Issues:');
    rejections.slice(-3).reverse().forEach(r => {
        console.log(`  [${new Date(r.timestamp).toLocaleDateString()}] ${r.testName}`);
        console.log(`    ❌ ${r.comment}`);
    });

    console.log('\n💡 AI Improvement Recommendations:');
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0][0];
    console.log(`  Based on your rejections, focusing on "${topReason}" issues:`);
    console.log(`  -> ${getRecommendation(topReason)}`);
    console.log('----------------------------------------\n');
}

function getIcon(reason: string): string {
    switch (reason) {
        case 'assertion': return '🎯';
        case 'edge-case': return '⚠️';
        case 'selector': return '🔍';
        case 'coverage': return '☂️';
        default: return '❓';
    }
}

function getRecommendation(reason: string): string {
    switch (reason) {
        case 'assertion': return 'Update system prompt to include more specific Chai assertion examples.';
        case 'edge-case': return 'Enhance feature context with explicit negative scenarios.';
        case 'selector': return 'Enforce strict use of data-testid attributes in generation rules.';
        case 'coverage': return 'Require generating multiple scenarios per feature in one go.';
        default: return 'Review general code quality guidelines.';
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

generateReport();
