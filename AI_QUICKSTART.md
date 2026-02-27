# AI Quick Start Guide

## Get AI Working in 3 Steps

### Step 1: Get Your API Key (2 minutes)

1. Go to **https://console.anthropic.com/**
2. Sign up (you get $5 free credit!)
3. Click "API Keys" → "Create Key"
4. Copy your key (starts with `sk-ant-...`)

### Step 2: Add to .env File (1 minute)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

### Step 3: Restart Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

## You're Done! 🎉

Now open your Budget page and look for the **purple sparkle button** in the bottom-right corner!

---

## Try It Out

Click the AI Assistant button and try these:

**Quick Actions:**
- "Analyze Budget" - Get instant insights
- "Generate Report" - Create a progress report
- "Budget Forecast" - Predict future spending

**Chat Examples:**
- "What percentage of my budget have I spent?"
- "Give me recommendations to optimize my spending"
- "Draft a budget justification for lab equipment"
- "What are the risks in my current budget allocation?"

---

## Costs

- Budget analysis: ~$0.05 each
- Progress report: ~$0.15 each
- Chat message: ~$0.02 each

With $5 free credit, you can do:
- ~100 budget analyses
- ~30 progress reports
- ~250 chat messages

---

## What You Get

✅ **Budget Analysis** - AI reviews your spending and gives recommendations
✅ **Progress Reports** - Auto-generate professional grant reports
✅ **Budget Forecasting** - Predict if you'll under/overspend
✅ **Chat Assistant** - Ask questions anytime
✅ **Smart Categorization** - AI suggests expense categories
✅ **Meeting Summaries** - Turn notes into action items

---

## Need Help?

Check the full guide: `AI_SETUP.md`

**Common Issues:**
- "API key not found" → Restart dev server after adding .env
- "Rate limit" → You've used your free credits (add payment method)
- AI button not showing → Make sure you're on the Budget page with a budget open
