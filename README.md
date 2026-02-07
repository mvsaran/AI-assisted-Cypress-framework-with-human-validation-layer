# AI-Assisted Cypress Testing Framework

> **A flagship project demonstrating AI-assisted test generation with human validation, risk-based testing, and quality gates in CI/CD**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Overview

This framework showcases a production-ready approach to AI-assisted testing that combines:

- **AI Test Generation**: Uses Anthropic Claude to intelligently generate Cypress tests
- **Human Validation Layer**: Interactive review workflow with detailed rejection tracking
- **Risk-Based Testing**: Prioritizes tests based on business impact and technical complexity
- **Quality Gates**: Enforces standards in CI/CD with release confidence scoring
- **Demo E-Commerce App**: Full-featured application to demonstrate the framework

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Test Generation                        │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │  Anthropic   │─────▶│ Test Quality  │                   │
│  │   Claude     │      │    Scorer     │                   │
│  └──────────────┘      └───────────────┘                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Human Validation Layer                       │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │ Interactive  │─────▶│   Rejection   │                   │
│  │   Review     │      │    Tracker    │                   │
│  └──────────────┘      └───────────────┘                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Risk-Based Testing Framework                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Risk     │  │     Test     │  │   Coverage   │     │
│  │  Classifier  │  │ Prioritizer  │  │   Analyzer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Quality Gates                             │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │   Release    │─────▶│  PR Validation│                   │
│  │  Confidence  │      │     Gate      │                   │
│  └──────────────┘      └───────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API Key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AIASSISTEDFRAMEWORK

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Running the Demo App

```bash
# Start the demo e-commerce server
npm run demo:start

# In another terminal, open Cypress
npm run test:open
npm run test:open
```

## 🎮 Demo Walkthrough

Experience the full AI-assisted workflow with these commands:

1. **🤖 Generate AI Tests**:
   ```bash
   npm run ai:generate
   ```
   *Simulates analyzing code and generating a new Cypress test.*

2. **🧠 Human Validation**:
   ```bash
   npm run validate:tests
   ```
   *Interactive CLI to approve/reject generated tests.*

3. **📊 View Reports**:
   ```bash
   npm run report:rejection   # View rejection analytics
   npm run report:coverage    # Check risk-based coverage
   npm run report:dashboard   # Generate unified HTML dashboard
   ```

4. **⛩️ Validate Gates**:
   ```bash
   npm run gates:validate
   ```
   *Check if the project meets release standards.*

## 📋 Key Features

### 1. AI Test Generation

Generate Cypress tests using Anthropic Claude with risk-aware prompts:

```bash
npm run ai:generate
```

**Example**: Generate a test for the checkout process:

```typescript
const generator = new AITestGenerator();
const test = await generator.generateTest({
  featureName: 'Checkout Process',
  featureDescription: 'User completes purchase with payment',
  riskLevel: 'critical',
  existingSelectors: ['[data-testid="checkout-button"]'],
});
```

### 2. Human Validation Workflow

Review AI-generated tests interactively:

```bash
npm run validate:tests
```

**Interactive CLI** shows:
- Test code with syntax highlighting
- Quality scores (syntax, coverage, assertions, maintainability, best practices)
- Detected issues
- Approve/reject with categorized reasons

### 3. Rejection Tracking & Analytics

Track why AI-generated tests are rejected:

```bash
npm run report:rejection
```

**Rejection Report** includes:
- Rejection reasons with percentages
- Trend analysis (last 30 days)
- Example comments for each category
- AI improvement recommendations

**Common Rejection Reasons**:
- Incorrect assertions
- Missing edge cases
- Poor selectors
- Syntax errors
- Incomplete coverage
- Poor maintainability
- Not aligned with requirements
- Security concerns
- Performance issues

### 4. Risk-Based Testing

Classify features by risk and prioritize tests:

```typescript
const classifier = new RiskClassifier(riskConfig);
const classification = classifier.classifyFeature('Payment Processing');
// Result: { riskLevel: 'critical', riskScore: 95, ... }

const prioritizer = new TestPrioritizer();
const priorities = prioritizer.smartPrioritize(tests);
// Tests ordered by: risk (40%), recent changes (30%), failure rate (20%), execution time (10%)
```

**Risk Levels**:
- 🔴 **Critical**: Payment, authentication (always run)
- 🟠 **High**: Cart, orders (run in PR)
- 🟡 **Medium**: Product catalog, search (run in merge)
- 🟢 **Low**: UI components, static pages (run nightly)

### 5. Release Confidence Scoring

Calculate release readiness:

```bash
npm run confidence:calculate
```

**Formula** (0-100 score):
- Test Pass Rate: 40%
- Risk Coverage: 30%
- Test Quality: 20%
- Human Validation Rate: 10%

**Recommendations**:
- **85-100**: ✅ Ready to Release
- **70-84**: ⚠️ Proceed with Caution
- **60-69**: ❌ Not Recommended
- **<60**: 🚫 Blocked

### 6. Quality Gates in CI/CD

Enforce quality standards in GitHub Actions:

```bash
npm run gates:validate
```

**Gates**:
1. Test Pass Rate ≥ 80% (critical)
2. Risk Coverage ≥ 80% (critical)
3. Test Quality ≥ 70% (high)
4. Release Confidence ≥ 75% (high)

Failed gates block PR merges and post detailed comments.

## 🧠 How the AI-Assisted Validation Workflow Works

This project implements a unique **Human-in-the-Loop (HITL)** approach to ensure that AI-generated tests are reliable, maintainable, and aligned with your business logic.

### 1. Generation Phase
The `AITestGenerator` uses Anthropic Claude to create an initial test based on your feature description and the page's HTML structure. It focuses on using robust selectors like `data-testid` and following best practices.

### 2. Automated Scoring Phase
Before you even see the code, the `TestQualityScorer` statically analyzes it for:
- **Best Practices**: Are you using `cy.intercept`? Is `data-testid` present?
- **Completeness**: Are there sufficient assertions?
- **Maintainability**: Is the code clean and well-structured?

If the score is below the configured threshold (default: 70), the test is automatically flagged for review.

### 3. Interactive Review Phase
The CLI tool (`npm run validate:tests`) presents the generated test for your review. You have three choices:
- ✅ **Approve**: The test is saved to `cypress/e2e/ai-generated/` and added to your suite.
- ❌ **Reject**: You provide a reason (e.g., "Missing edge case"). This feedback is stored in `rejection-tracking.json` to help you refine your AI prompts in future runs.
- ✏️ **Edit**: You modify the code directly within the CLI to fix minor issues before approving.

### 4. Continuous Improvement Phase
The **Release Confidence Score** improves as you validate more AI-generated tests, ensuring that introducing AI does *not* lower your overall quality standards. The more you use the validation workflow, the smarter your testing strategy becomes.

## 📊 Reports & Dashboards

### Risk Coverage Report

```bash
npm run report:coverage
```

Shows:
- Coverage by risk level (Critical/High/Medium/Low)
- Risk-weighted coverage score
- Untested features with priority
- Recommendations for improvement

### Unified Reporting Dashboard

**New in v1.0**: Generate a comprehensive visual report combining all metrics (Rejection, Coverage, Confidence, Gates) into a single HTML dashboard.

```bash
npm run report:dashboard
```

- **Output**: `reports/dashboard.html`
- **Features**:
  - Visual release confidence gauge
  - Risk coverage bars
  - Quality gate status
  - Recent AI generation timeline
  - Rejection analytics charts
  - **🚀 Strategic Improvements**: Auto-generated recommendations based on coverage gaps and failure patterns.

### How We Identify Improvement Areas

The framework automatically flags areas needing attention:

1.  **Risk Coverage Gaps**: If a "Critical" or "High" risk feature has low test coverage, it's flagged as *Action Required*.
2.  **Rejection Patterns**: If multiple AI tests for a feature are rejected for the same reason (e.g., "Incorrect Assertion"), the system suggests specific prompt updates.
3.  **Flaky Test Detection**: Tests with high variance in execution time are flagged for optimization.

### Rejection Analytics

View trends in AI test rejections:
- Daily rejection rates
- Most common failure patterns
- Improvement over time
- Insights for prompt engineering

## 🎓 Demo E-Commerce Application

The included demo app features:

- **Authentication**: Login, register, logout
- **Product Catalog**: Browse, search, filter
- **Shopping Cart**: Add, remove, update quantities
- **Checkout**: Payment method selection, order placement
- **Order History**: View past orders
- **Admin Panel**: Manage orders (future)

**Test Credentials**:
- User: `user@shop.com` / `user123`
- Admin: `admin@shop.com` / `admin123`

## 🔧 Configuration

### Risk Configuration (`config/risk-config.json`)

Define risk levels for features:

```json
{
  "features": [
    {
      "name": "Payment Processing",
      "pattern": "payment|checkout|billing",
      "riskLevel": "critical",
      "businessImpact": "critical",
      "technicalComplexity": "high",
      "changeFrequency": "low"
    }
  ]
}
```

### Environment Variables (`.env`)

```bash
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL=claude-3-5-sonnet-20241022
MIN_TEST_QUALITY_SCORE=70
MIN_RISK_COVERAGE=80
MIN_RELEASE_CONFIDENCE=75
```

## 📚 Documentation

### Why AI-Generated Tests Are Rejected

Based on our rejection tracking, the most common reasons are:

1. **Incorrect Assertions (35%)**: AI generates weak or wrong assertions
   - *Example*: Using `should('exist')` instead of `should('have.text', 'Expected')`
   - *Fix*: Improve prompts with specific assertion examples

2. **Missing Edge Cases (25%)**: Tests only cover happy paths
   - *Example*: Not testing empty cart, invalid payment methods
   - *Fix*: Add edge case requirements to prompts

3. **Poor Selectors (20%)**: Using fragile CSS selectors instead of data-testid
   - *Example*: `.btn-primary` instead of `[data-testid="checkout-button"]`
   - *Fix*: Enforce data-testid in prompts

4. **Incomplete Coverage (15%)**: Missing important scenarios
   - *Example*: Testing add to cart but not remove from cart
   - *Fix*: Provide comprehensive feature descriptions

5. **Other (5%)**: Syntax errors, maintainability issues, etc.

### How Release Confidence Is Measured

Release confidence is a weighted score combining four metrics:

**1. Test Pass Rate (40% weight)**
- Measures: Percentage of tests passing
- Threshold: ≥80%
- Why it matters: Failing tests indicate bugs or instability

**2. Risk Coverage (30% weight)**
- Measures: Test coverage weighted by feature risk
- Threshold: ≥80%
- Why it matters: Critical features must be tested

**3. Test Quality (20% weight)**
- Measures: Average quality score of all tests
- Threshold: ≥70%
- Why it matters: High-quality tests catch more bugs

**4. Human Validation Rate (10% weight)**
- Measures: Percentage of AI tests approved by humans
- Threshold: ≥70%
- Why it matters: Validates AI-generated test quality

**Example Calculation**:
```
Test Pass Rate: 95% → 95 * 0.4 = 38.0
Risk Coverage: 85/100 → 85 * 0.3 = 25.5
Test Quality: 78/100 → 78 * 0.2 = 15.6
Human Validation: 80% → 80 * 0.1 = 8.0
─────────────────────────────────────
Release Confidence: 87.1/100 ✅ Ready to Release
```

## 🛠️ Development

### Project Structure

```
AIASSISTEDFRAMEWORK/
├── src/
│   ├── ai/                    # AI test generation
│   │   ├── ai-test-generator.ts
│   │   └── test-quality-scorer.ts
│   ├── validation/            # Human validation
│   │   ├── validation-workflow.ts
│   │   └── rejection-tracker.ts
│   ├── risk/                  # Risk-based testing
│   │   ├── risk-classifier.ts
│   │   ├── test-prioritizer.ts
│   │   └── risk-coverage-analyzer.ts
│   └── quality-gates/         # CI/CD gates
│       ├── release-confidence-scorer.ts
│       └── pr-validation-gate.ts
├── cypress/
│   ├── e2e/                   # Test files
│   │   ├── auth.cy.ts
│   │   ├── cart.cy.ts
│   │   └── ai-generated/      # AI-generated tests
│   └── support/               # Custom commands
├── demo-app/                  # Demo application
│   ├── server.js
│   └── public/
├── config/                    # Configuration
│   └── risk-config.json
└── reports/                   # Generated reports
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx cypress run --spec cypress/e2e/auth.cy.ts

# Open Cypress UI
npm run test:open
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

This is a demonstration project. For production use, consider:

1. Adding more sophisticated AI prompts
2. Implementing test result caching
3. Adding visual regression testing
4. Integrating with test management tools
5. Supporting multiple AI providers

## 📄 License

MIT

## 🙏 Acknowledgments

- **Anthropic Claude**: AI test generation
- **Cypress**: E2E testing framework
- **Express**: Demo app backend

---

**Built with ❤️ to demonstrate AI-assisted testing best practices**
