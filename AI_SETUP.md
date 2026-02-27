# AI Integration Guide

## Overview

Your Program Manager Hub now includes AI capabilities powered by Claude (Anthropic) or ChatGPT (OpenAI). The AI assistant can help with:

- 📊 **Budget Analysis** - Get insights on spending patterns and recommendations
- 📝 **Grant Writing** - Draft sections of grant proposals
- 📈 **Forecasting** - Predict future spending trajectories
- 📄 **Report Generation** - Create professional progress reports
- 💬 **General Assistance** - Ask questions about your grants and budgets

---

## Setup Instructions

### Option 1: Claude API (Recommended)

**Step 1: Get Your API Key**

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy your API key

**Step 2: Configure Environment**

1. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your API key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

**Step 3: Restart Dev Server**

```bash
npm run dev
```

---

### Option 2: OpenAI GPT API

If you prefer to use ChatGPT instead:

**Step 1: Install OpenAI SDK**

```bash
npm install openai
```

**Step 2: Get API Key**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new key

**Step 3: Create OpenAI Utility (Alternative)**

Create `src/utils/openai.js`:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const askGPT = async (prompt, options = {}) => {
  const completion = await openai.chat.completions.create({
    model: options.model || "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    max_tokens: options.max_tokens || 4096
  });

  return completion.choices[0].message.content;
};

// Export other functions similar to ai.js but using askGPT
```

---

## Usage Examples

### 1. Using the AI Assistant Component

The AI Assistant is available as a floating button on the Budget page:

```jsx
import AIAssistant from '../components/ai/AIAssistant';

<AIAssistant
  budgetId={budgetId}
  grantId={grantId}
/>
```

### 2. Programmatic AI Calls

```javascript
import {
  analyzeBudget,
  generateProgressReport,
  categorizeExpense,
  chatWithClaude
} from '../utils/ai';

// Analyze budget
const analysis = await analyzeBudget(budget, grant);
console.log(analysis);

// Generate progress report
const report = await generateProgressReport(grant, budget);

// Auto-categorize an expense
const category = await categorizeExpense(
  "Lab supplies purchase",
  450,
  budget.categories
);

// General chat
const response = await chatWithClaude(
  "What are best practices for grant budget management?"
);
```

### 3. Custom AI Functions

Create custom AI helpers for your specific needs:

```javascript
// src/utils/ai.js

export const draftBudgetJustification = async (expense) => {
  const prompt = `Draft a budget justification for this expense:

  Item: ${expense.description}
  Amount: $${expense.amount}
  Category: ${expense.category}

  Write a professional 2-3 sentence justification explaining why this expense is necessary.`;

  return await askClaude(prompt);
};

export const generateMeetingAgenda = async (topics, duration) => {
  const prompt = `Create a meeting agenda for a ${duration}-minute meeting covering:
  ${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

  Format as a professional agenda with time allocations.`;

  return await askClaude(prompt);
};
```

---

## Available AI Functions

### Budget & Financial

- `analyzeBudget(budget, grant)` - Get comprehensive budget analysis
- `generateBudgetForecast(budget, remainingMonths)` - Predict spending
- `categorizeExpense(description, amount, categories)` - Auto-categorize expenses

### Grant Writing & Documentation

- `generateProgressReport(grant, budget, aims)` - Create progress reports
- `draftGrantSection(sectionType, context)` - Draft proposal sections
  - Types: `significance`, `innovation`, `approach`, `budget_justification`
- `summarizeMeetingNotes(notes)` - Summarize meeting notes

### General

- `chatWithClaude(message, conversationHistory)` - General Q&A
- `askClaude(prompt, options)` - Custom prompts

---

## Cost Considerations

### Claude Pricing (as of 2025)

- **Claude Sonnet 4.5**: ~$3 per million input tokens, ~$15 per million output tokens
- Typical budget analysis: ~$0.05-0.15 per request
- Progress report: ~$0.10-0.30 per request
- Chat messages: ~$0.01-0.05 per message

### Tips to Minimize Costs

1. **Use appropriate models**: Haiku for simple tasks, Sonnet for complex analysis
2. **Cache responses**: Store AI responses in localStorage to avoid re-requesting
3. **Batch requests**: Combine multiple questions into one prompt
4. **Set max_tokens limits**: Prevent overly long responses

---

## Security Best Practices

### ⚠️ IMPORTANT: API Key Security

**NEVER commit your `.env` file to Git!**

The current setup uses `dangerouslyAllowBrowser: true` which is **ONLY for development/demo purposes**.

### For Production

**Option A: Use a Backend Proxy (Recommended)**

Create a backend API that handles Claude/OpenAI calls:

```javascript
// Backend (Express.js example)
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY; // Server-side only

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: message }]
  });

  res.json({ response: response.content[0].text });
});
```

```javascript
// Frontend
export const askClaude = async (prompt) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt })
  });

  const data = await response.json();
  return data.response;
};
```

**Option B: Use Vercel/Netlify Serverless Functions**

Create serverless functions that proxy AI requests without exposing keys.

---

## Troubleshooting

### "API key not found" Error

1. Check that `.env` file exists in project root
2. Verify the key name is exactly `VITE_ANTHROPIC_API_KEY`
3. Restart the dev server (`npm run dev`)
4. Check that `.env` is not in `.gitignore` locally

### "Rate limit exceeded" Error

You've exceeded your API quota. Check your usage at:
- Claude: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/usage

### CORS Errors

If using browser-side calls and getting CORS errors:
- This is expected in production
- Implement a backend proxy (see Security section above)

---

## Advanced Features

### Streaming Responses

For real-time AI responses (like ChatGPT typing):

```javascript
export const streamClaude = async (prompt, onChunk) => {
  const client = getClaudeClient();

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      onChunk(chunk.delta.text);
    }
  }
};

// Usage
await streamClaude("Analyze this budget", (text) => {
  console.log(text); // Prints as it arrives
});
```

### Conversation Memory

Implement conversation history for context-aware chat:

```javascript
const [conversationHistory, setConversationHistory] = useState([]);

const sendMessage = async (userMessage) => {
  const newHistory = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await chatWithClaude(userMessage, conversationHistory);

  setConversationHistory([
    ...newHistory,
    { role: 'assistant', content: response }
  ]);
};
```

---

## Example Use Cases

### 1. Budget Alert System

```javascript
const checkBudgetHealth = async (budget) => {
  const analysis = await analyzeBudget(budget, grant);

  // If AI detects overspending, send alert
  if (analysis.includes('overspending') || analysis.includes('concern')) {
    alert('⚠️ AI detected potential budget issues:\n\n' + analysis);
  }
};
```

### 2. Smart Expense Entry

```javascript
const handleSmartExpenseAdd = async (description, amount) => {
  // Auto-suggest category
  const suggestedCategory = await categorizeExpense(
    description,
    amount,
    budget.categories
  );

  // Pre-fill form with AI suggestion
  setExpenseForm({
    description,
    amount,
    category: suggestedCategory
  });
};
```

### 3. Grant Deadline Reminders

```javascript
const generateReminderEmail = async (grant, daysUntilDeadline) => {
  const prompt = `Draft a reminder email for a grant deadline:

  Grant: ${grant.title}
  Deadline: ${new Date(grant.endDate).toLocaleDateString()}
  Days Remaining: ${daysUntilDeadline}

  Write a professional reminder email highlighting what needs to be done.`;

  return await askClaude(prompt);
};
```

---

## Support

For issues with:
- **Claude API**: https://docs.anthropic.com/
- **OpenAI API**: https://platform.openai.com/docs/
- **This integration**: Check console logs and verify API key setup

---

## What's Next?

Consider adding:
- 🔄 Auto-save AI responses to documents
- 📧 Email integration for AI-generated reports
- 🎯 Custom AI training on your specific grant requirements
- 📱 Mobile app with voice-to-AI integration
- 🔗 Integration with institutional grant management systems
