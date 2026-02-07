
console.log('☂️  Risk-Based Coverage Report\n');

const COVERAGE = {
    critical: { total: 12, covered: 12, percentage: 100 },
    high: { total: 25, covered: 22, percentage: 88 },
    medium: { total: 40, covered: 30, percentage: 75 },
    low: { total: 15, covered: 5, percentage: 33 }
};

function getBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

console.log('Coverage by Risk Level:');
console.log(`🔴 Critical  ${getBar(COVERAGE.critical.percentage)} ${COVERAGE.critical.percentage}%`);
console.log(`🟠 High      ${getBar(COVERAGE.high.percentage)} ${COVERAGE.high.percentage}%`);
console.log(`🟡 Medium    ${getBar(COVERAGE.medium.percentage)} ${COVERAGE.medium.percentage}%`);
console.log(`🟢 Low       ${getBar(COVERAGE.low.percentage)} ${COVERAGE.low.percentage}%`);

console.log('\n----------------------------------------');
console.log('🔍 Coverage Gaps (High Risk):');
console.log('  - Checkout: International shipping calculation');
console.log('  - Account: Two-factor authentication flow');

console.log('\n💡 Recommendation: Prioritize "Account" tests for next sprint.');
