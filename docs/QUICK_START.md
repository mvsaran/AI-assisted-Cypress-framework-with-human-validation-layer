# Quick Start Guide

## Prerequisites

- Node.js 18 or higher
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure API Key

Create a `.env` file in the project root:

```bash
# Copy from template
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

> **Get your API key**: https://console.anthropic.com/ → Settings → API Keys → Create Key

## 3. Start the Demo App

```bash
npm run demo:start
```

The demo e-commerce app will be available at: http://localhost:3000

**Test Credentials**:
- User: `user@shop.com` / `user123`
- Admin: `admin@shop.com` / `admin123`

## 4. Run Tests

In a new terminal:

```bash
# Run all tests
npm test

# Or open Cypress UI
npm run test:open
```

## 5. Try AI Test Generation

Generate a test using AI:

```bash
npm run ai:generate
```

Follow the interactive prompts to:
1. Enter feature name (e.g., "Shopping Cart")
2. Describe the feature
3. Select risk level
4. Review generated test
5. Approve or reject

## 6. View Reports

```bash
# Rejection analytics
npm run report:rejection

# Risk coverage
npm run report:coverage

# Release confidence
npm run confidence:calculate
```

## Next Steps

- Read the [full README](../README.md) for detailed documentation
- Check [API Key Setup Guide](./API_KEY_SETUP.md) for security best practices
- Explore the [walkthrough](../../../.gemini/antigravity/brain/64014db0-4adc-4ca8-b866-0178b7fab4ab/walkthrough.md) for architecture details

## Troubleshooting

**API Key Error?**
- Ensure `.env` file exists in project root
- Verify no extra spaces in the API key
- Check key is active in Anthropic Console

**Demo App Not Starting?**
- Make sure port 3000 is available
- Check if dependencies are installed: `npm install`

**Tests Failing?**
- Ensure demo app is running first
- Wait for app to fully start (check http://localhost:3000)
