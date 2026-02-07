# API Key Integration Guide

## Getting Your Anthropic API Key

1. **Sign up/Login** to Anthropic Console: https://console.anthropic.com/
2. **Navigate to API Keys**: Go to Settings → API Keys
3. **Create New Key**: Click "Create Key" and give it a name (e.g., "AI Testing Framework")
4. **Copy the Key**: It will look like `sk-ant-api03-...` - **save it immediately** (you won't see it again!)

## Integrating the API Key

### Step 1: Create `.env` File

In your project root (`C:\Users\mvsar\Projects\AIASSISTEDFRAMEWORK`), create a `.env` file:

```bash
# Copy from .env.example
cp .env.example .env
```

Or create it manually with this content:

```env
# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE

# AI Configuration
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Quality Thresholds
MIN_TEST_QUALITY_SCORE=70
MIN_RISK_COVERAGE=80
MIN_RELEASE_CONFIDENCE=75

# CI/CD Configuration
ENABLE_AI_GENERATION=true
ENABLE_AUTO_VALIDATION=false
```

### Step 2: Replace the Placeholder

Edit `.env` and replace `sk-ant-api03-YOUR_ACTUAL_KEY_HERE` with your actual API key from Anthropic Console.

**Example**:
```env
ANTHROPIC_API_KEY=sk-ant-api03-R2D2C3P0abcdefghijklmnopqrstuvwxyz1234567890igAA
```

### Step 3: Verify Integration

Test that the API key works:

```bash
# This will attempt to generate a test using your API key
npm run ai:generate
```

If successful, you'll see the AI test generation interface.

## Security Best Practices

### ✅ DO:
- Keep `.env` file in `.gitignore` (already configured)
- Use different API keys for development and production
- Rotate keys periodically
- Set spending limits in Anthropic Console

### ❌ DON'T:
- Commit `.env` to Git
- Share your API key in screenshots or logs
- Use the same key across multiple projects
- Hardcode the key in source files

## For CI/CD (GitHub Actions)

Add the API key as a GitHub Secret:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your API key
6. Click "Add secret"

The GitHub Actions workflow (`.github/workflows/cypress-ai-tests.yml`) is already configured to use this secret.

## Troubleshooting

### Error: "ANTHROPIC_API_KEY environment variable is required"

**Solution**: Make sure `.env` file exists in the project root with the API key set.

### Error: "Authentication failed" or 401 Unauthorized

**Solution**: 
- Verify your API key is correct (no extra spaces)
- Check if the key is active in Anthropic Console
- Ensure you have sufficient credits

### Error: Rate limit exceeded

**Solution**: 
- Wait a few minutes and try again
- Upgrade your Anthropic plan for higher limits
- Implement rate limiting in the framework (future enhancement)

## Cost Management

The framework uses Claude 3.5 Sonnet by default. Approximate costs:

- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

**Typical test generation**: 500-1000 tokens per test = ~$0.01-0.02 per test

**Tips to reduce costs**:
1. Use caching for repeated prompts (future enhancement)
2. Generate tests in batches
3. Set `ENABLE_AI_GENERATION=false` when not needed
4. Use smaller models for simple tests (edit `AI_MODEL` in `.env`)

## Alternative: Using Local Models (Future)

For cost-free testing, you could integrate local models like:
- Ollama with CodeLlama
- LM Studio
- LocalAI

This would require modifying `src/ai/ai-test-generator.ts` to support multiple providers.

## Need Help?

- Anthropic Documentation: https://docs.anthropic.com/
- API Reference: https://docs.anthropic.com/en/api/
- Pricing: https://www.anthropic.com/pricing
