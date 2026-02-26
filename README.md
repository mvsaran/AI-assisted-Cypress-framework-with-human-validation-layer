# AI-Assisted Cypress Testing Framework

> **A flagship project demonstrating AI-assisted test generation with human validation, risk-based testing, and quality gates in CI/CD**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Overview

This framework showcases a production-ready approach to AI-assisted testing that combines:

- **AI Test Generation**: Supports **OpenAI (GPT-4o)**, **Google Gemini (1.5 Pro/Flash, 2.0 Flash)**, and **Anthropic Claude**.
- **Human Validation Layer**: Interactive review workflow with detailed rejection tracking.
- **Risk-Based Testing**: Prioritizes tests based on business impact and technical complexity.
- **Quality Gates**: Enforces standards in CI/CD with release confidence scoring.
- **Demo E-Commerce App**: Full-featured application to demonstrate the framework.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Test Generation                        │
│  ┌──────────────┐      ┌───────────────┐      ┌───────────┐  │
│  │   OpenAI /   │─────▶│  AI Provider  │─────▶│   Test    │  │
│  │   Gemini /   │      │   Interface   │      │ Scorer    │  │
│  │   Claude     │      │               │      │           │  │
│  └──────────────┘      └───────────────┘      └───────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Human Validation Layer                       │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │ Interactive  │─────▶│   Rejection   │                   │
│  │   Review     │      │    Tracker    │                   │
│  │   [A/R/T/S]  │      │               │                   │
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
- API Key for one of: **OpenAI**, **Google Gemini**, or **Anthropic**.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-assisted-Cypress-framework

# Install dependencies
npm install
```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Configure your preferred AI provider in `.env`:

   ```env
   # Choose: openai, gemini, or claude
   AI_PROVIDER=openai
   
   # Add your key
   OPENAI_API_KEY=sk-proj-...
   # OR
   GEMINI_API_KEY=AIzaSy...
   
   # Set the model
   AI_MODEL=gpt-4o
   # OR
   AI_MODEL=gemini-2.0-flash
   ```

### Running the Demo App

```bash
# Terminal 1: Start the demo e-commerce server
npm run demo:start

# Terminal 2: Run Cypress or AI Generation
npm run test:open  # Interactive UI
npm test           # Headless run
```

## 🎮 Demo Walkthrough

Experience the full AI-assisted workflow:

1. **🤖 Generate AI Tests**:
   ```bash
   npm run ai:generate
   ```
   *Analyzes the app structure and generates high-quality TypeScript tests.*

2. **🧠 Human Validation Loop**:
   ```bash
   npm run validate:tests
   ```
   *The core of our HITL (Human-in-the-Loop) system. Review code, see quality scores, and Approve/Reject/Test.*

3. **📊 View Analytics & Reports**:
   ```bash
   npm run report:rejection   # WHY is AI failing?
   npm run report:coverage    # Are we covering Critical features?
   npm run report:dashboard   # Unified HTML dashboard (reports/dashboard.html)
   ```

4. **Debugging Tools**:
   If you have issues with Gemini connectivity:
   ```bash
   node --env-file=.env -r ts-node/register debug-gemini-v2.ts
   ```

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
The `AITestGenerator` uses your configured AI provider (**OpenAI**, **Gemini**, or **Claude**) to create an initial test. It analyzes:
- The **feature description** and requirements.
- The **DOM structure** (via verified selectors).
- **Client-side logic** (e.g., distinguishing between API calls and client-side filtering).

### 2. Automated Scoring Phase
Before you see the code, the `TestQualityScorer` performs static analysis across five dimensions:
- **Syntax**: Valid TypeScript and Cypress commands.
- **Coverage**: Matching requirements to selectors.
- **Assertions**: Ensuring meaningful `should()` or `expect()` calls.
- **Maintainability**: Clean code and proper Page Object/Custom Command usage.
- **Best Practices**: Proper use of `cy.intercept`, `cy.request`, and `data-testid`.

### 3. Interactive Review Phase
The CLI tool (`npm run validate:tests`) manages the transition from "AI-Generated" to "Approved":
- **[A] Approve**: Moves the file to `cypress/e2e/ai-generated/` and logs it in `approved-tests.json`.
- **[R] Reject**: Logs the reason and category in `rejection-tracking.json` to refine future prompts.
- **[T] Test**: Executes the test headlessly using Cypress so you can see it pass/fail before approving.
- **[S] Skip**: Keeps the test in `pending-tests.json` for later review.

### 4. Continuous Improvement Phase
The **Release Confidence Score** is dynamically updated based on your approval/rejection rates. High rejection rates for a specific feature will lower the confidence score and trigger recommendations for manual test intervention or prompt engineering refinements.

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

Configure the AI provider and API keys:

```bash
# Provider Selection (openai, gemini, claude)
AI_PROVIDER=openai

# API Keys (Add yours)
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant...

# Model Selection
AI_MODEL=gpt-4o             # For OpenAI
AI_MODEL=gemini-2.0-flash   # For Gemini
AI_MODEL=claude-3-5-sonnet  # For Claude

# Generation Settings
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
```

## ⛩️ Troubleshooting

### Common API Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| **429** | Quota Exceeded | Check your billing/credits on OpenAI or Google AI Studio. |
| **404** | Model Not Found | Verify `AI_MODEL` name. Use `gemini-2.0-flash` or `gpt-4o`. |
| **401** | Invalid API Key | Double check your `.env` key and provider selection. |

### Diagnostic Scripts
If you encounter Gemini connectivity issues, use the provided debug tool:
```bash
node --env-file=.env -r ts-node/register debug-gemini-v2.ts
```

## 🛠️ Development & Extension

### Project Structure (Key Folders)

- `src/ai/`: Core AI provider logic and scoring.
- `src/validation/`: Human-in-the-loop validation CLI and tracking.
- `src/risk/`: Business-logic risk classification and prioritization.
- `cypress/e2e/ai-generated/`: Storage for both pending and approved AI tests.

### Adding a New Provider
1. Implement the `AIProvider` interface in `src/ai/ai-test-generator.ts`.
2. Update the `AITestGenerator` constructor.
3. Add the API key to `.env`.

## 📄 License

MIT

## 🙏 Acknowledgments

- **OpenAI / Google / Anthropic**: For leading AI models.
- **Cypress**: For the best-in-class E2E engine.
- **Express**: For the reliable demo application server.

---

**Built with ❤️ to demonstrate AI-assisted testing best practices**
