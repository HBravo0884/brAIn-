import Anthropic from '@anthropic-ai/sdk';

// IMPORTANT: For production, move API key to backend/environment variables
// Never expose API keys in frontend code
const getClaudeClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('Anthropic API key not found. Set VITE_ANTHROPIC_API_KEY in .env file');
    return null;
  }

  return new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Only for development/demo
  });
};

/**
 * Call Claude AI with a prompt
 * @param {string} prompt - The prompt to send to Claude
 * @param {Object} options - Additional options (model, max_tokens, etc.)
 * @returns {Promise<string>} - Claude's response
 */
export const askClaude = async (prompt, options = {}) => {
  const client = getClaudeClient();

  if (!client) {
    throw new Error('Claude API client not initialized. Check your API key.');
  }

  try {
    const message = await client.messages.create({
      model: options.model || 'claude-sonnet-4-5-20250929',
      max_tokens: options.max_tokens || 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
};

/**
 * Analyze budget and provide recommendations
 */
export const analyzeBudget = async (budget, grant) => {
  const prompt = `As a financial analyst for academic grants, analyze this budget and provide recommendations:

Grant: ${grant?.title || 'Unknown'}
Total Budget: $${budget.totalBudget.toLocaleString()}

Categories:
${budget.categories.map(cat => {
  const spent = (cat.miniPools || []).reduce((sum, mini) => {
    return sum + (mini.expenses || []).reduce((s, exp) => s + (exp.spent !== false ? exp.amount : 0), 0);
  }, 0);
  const allocated = cat.allocated || 0;
  const percent = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : 0;
  return `- ${cat.name}: $${spent.toLocaleString()} / $${allocated.toLocaleString()} (${percent}% used)`;
}).join('\n')}

Provide:
1. Budget health assessment
2. Areas of concern (overspending or underutilization)
3. Specific recommendations for optimization
4. Timeline considerations

Keep your response concise and actionable.`;

  return await askClaude(prompt);
};

/**
 * Generate grant progress report
 */
export const generateProgressReport = async (grant, budget, aims) => {
  const prompt = `Generate a professional progress report for this grant:

Grant Title: ${grant.title}
Funding Agency: ${grant.fundingAgency}
Amount: $${grant.amount.toLocaleString()}
Period: ${new Date(grant.startDate).toLocaleDateString()} - ${new Date(grant.endDate).toLocaleDateString()}

Aims/Objectives:
${(grant.aims || []).map((aim, i) => `
${i + 1}. ${aim.description}
   Progress: ${aim.completionPercentage}%
   Target Date: ${new Date(aim.targetDate).toLocaleDateString()}
`).join('\n')}

Budget Status:
- Total: $${budget.totalBudget.toLocaleString()}
- Spent: $${budget.categories.reduce((sum, cat) => {
  return sum + (cat.miniPools || []).reduce((s, mini) => {
    return s + (mini.expenses || []).reduce((exp, e) => exp + (e.spent !== false ? e.amount : 0), 0);
  }, 0);
}, 0).toLocaleString()}

Generate a professional progress report in markdown format with:
1. Executive Summary
2. Progress on Specific Aims
3. Budget Expenditure Summary
4. Challenges and Solutions
5. Next Steps
6. Timeline for Remaining Work`;

  return await askClaude(prompt, { max_tokens: 8192 });
};

/**
 * Categorize an expense automatically
 */
export const categorizeExpense = async (description, amount, categories) => {
  const prompt = `Given this expense, suggest the most appropriate budget category:

Expense: "${description}"
Amount: $${amount}

Available Categories:
${categories.map((cat, i) => `${i + 1}. ${cat.name}${cat.miniPools ? `\n   Sub-categories: ${cat.miniPools.map(m => m.description).join(', ')}` : ''}`).join('\n')}

Respond with ONLY the category number and optionally the sub-category name. Format: "Category X - [Sub-category name]" or just "Category X"`;

  return await askClaude(prompt, { max_tokens: 100 });
};

/**
 * Draft a grant proposal section
 */
export const draftGrantSection = async (sectionType, context) => {
  const prompts = {
    significance: `Draft a "Significance" section for a grant proposal with this context:\n${context}\n\nWrite a compelling 2-3 paragraph section explaining the significance and impact of this work.`,

    innovation: `Draft an "Innovation" section for a grant proposal with this context:\n${context}\n\nWrite a 2-3 paragraph section highlighting what is innovative about this approach.`,

    approach: `Draft an "Approach" section for a grant proposal with this context:\n${context}\n\nWrite a detailed methodology section explaining the research approach.`,

    budget_justification: `Draft a budget justification with this context:\n${context}\n\nWrite a clear justification for the requested budget.`
  };

  const prompt = prompts[sectionType] || context;
  return await askClaude(prompt, { max_tokens: 4096 });
};

/**
 * Summarize meeting notes
 */
export const summarizeMeetingNotes = async (notes) => {
  const prompt = `Summarize these meeting notes into a concise format with action items:

${notes}

Provide:
1. Key Discussion Points (bullet points)
2. Decisions Made
3. Action Items (with responsible parties if mentioned)
4. Next Steps`;

  return await askClaude(prompt, { max_tokens: 2048 });
};

/**
 * Generate budget forecast
 */
export const generateBudgetForecast = async (budget, remainingMonths) => {
  const totalSpent = budget.categories.reduce((sum, cat) => {
    return sum + (cat.miniPools || []).reduce((s, mini) => {
      return s + (mini.expenses || []).reduce((exp, e) => exp + (e.spent !== false ? e.amount : 0), 0);
    }, 0);
  }, 0);

  const prompt = `As a financial forecaster, analyze this budget and provide a spending forecast:

Total Budget: $${budget.totalBudget.toLocaleString()}
Spent to Date: $${totalSpent.toLocaleString()}
Remaining: $${(budget.totalBudget - totalSpent).toLocaleString()}
Months Remaining: ${remainingMonths}

Category Spending:
${budget.categories.map(cat => {
  const spent = (cat.miniPools || []).reduce((sum, mini) => {
    return sum + (mini.expenses || []).reduce((s, exp) => s + (exp.spent !== false ? exp.amount : 0), 0);
  }, 0);
  return `- ${cat.name}: $${spent.toLocaleString()} / $${(cat.allocated || 0).toLocaleString()}`;
}).join('\n')}

Provide:
1. Burn rate analysis
2. Projected spending by end of grant
3. Risk assessment (underspending or overspending)
4. Recommendations for remaining budget allocation`;

  return await askClaude(prompt, { max_tokens: 3048 });
};

/**
 * Read a file as a base64 string (strips the data-URL prefix)
 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Convert the current budget/grant structure into a plain-text outline
 * so Claude can make placement suggestions.
 */
export const budgetStructureToText = (budgets, grants) => {
  if (!budgets || !budgets.length) return '(No budgets exist yet)';
  return budgets.map(budget => {
    const grant = (grants || []).find(g => g.id === budget.grantId);
    const cats  = (budget.categories || []).map(cat => {
      const pools = (cat.miniPools || [])
        .map(p => `        • ${p.description}  [$${(p.allocated || 0).toLocaleString()} allocated]`)
        .join('\n');
      return `    Category: "${cat.name}"  [$${(cat.allocated || 0).toLocaleString()} allocated]`
           + (pools ? '\n' + pools : '\n        (no sub-budgets yet)');
    }).join('\n');
    return `  Grant/Budget: "${grant?.title || 'Budget'}"\n${cats}`;
  }).join('\n\n');
};

/**
 * Extract expense/budget line items from ANY document (PDF, image, text).
 * Also suggests where each item should be placed within the existing budget structure.
 *
 * @param {File}   file             - Any file: PDF, image (jpg/png/webp), or text
 * @param {string} budgetContext    - Plain-text outline of existing budgets (from budgetStructureToText)
 * @returns {Promise<{documentType, grantTitle, recipient, fundingAgency, totalAmount, awardDate, items[]}>}
 *   items: { name, amount, suggestedCategory, suggestedMiniPool, reason }
 */
export const extractExpensesFromDocument = async (file, budgetContext = '') => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized. Check your API key.');

  // ── Build the document content block ──────────────────────────────────────
  const contentBlocks = [];

  if (file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    contentBlocks.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    });
  } else if (file.type.startsWith('image/')) {
    const base64    = await fileToBase64(file);
    const mediaType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
      ? file.type : 'image/jpeg';
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    });
  } else {
    // Plain text / CSV / unknown — read as text
    const text = await file.text();
    contentBlocks.push({ type: 'text', text: `Document content:\n\`\`\`\n${text}\n\`\`\`` });
  }

  // ── Prompt ────────────────────────────────────────────────────────────────
  const contextSection = budgetContext
    ? `\n\nEXISTING BUDGET STRUCTURE (use this to make placement suggestions):\n${budgetContext}\n`
    : '';

  contentBlocks.push({
    type: 'text',
    text: `Extract every expense or budget line item from this document.${contextSection}

KEY DECISION — Grouped vs Flat:
- Set "isGrouped": true when expenses are organized by PERSON (PI, faculty, sub-grantee, awardee) or by SUB-ENTITY (department, division, child cost center). Each person/entity = one group.
- Set "isGrouped": false for single-recipient documents (invoices, single award letters, receipts).

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "documentType": "sub-account-budget|award-letter|invoice|receipt|budget-report|contract|reimbursement|other",
  "parentGrantTitle": "parent grant or program name, or null",
  "totalAmount": 102000,
  "awardDate": "YYYY-MM-DD or null",
  "isGrouped": true,

  /* Use groups[] when isGrouped=true (one entry per person/entity) */
  "suggestedCategory": "Best category from existing structure where ALL groups should be placed, or null",
  "groupingSuggestionReason": "One sentence explaining the category suggestion",
  "groups": [
    {
      "name": "Dr. Jane Smith",
      "subtitle": "Department or role",
      "totalAmount": 26000,
      "items": [
        { "name": "Research Coordinator", "amount": 12000 },
        { "name": "Biostatistician", "amount": 8000 }
      ]
    }
  ],

  /* Use items[] when isGrouped=false (flat list for single-recipient docs) */
  "grantTitle": "grant name for single-recipient docs, or null",
  "recipient": "recipient name, or null",
  "fundingAgency": "funding organization, or null",
  "items": [
    {
      "name": "Line item description",
      "amount": 18000,
      "suggestedCategory": "Best matching category from existing budget, or logical new name",
      "suggestedMiniPool": "Best matching sub-budget, or good new name",
      "reason": "One sentence explaining the placement"
    }
  ]
}

Rules:
- Include EVERY line item with a dollar amount (even $0)
- For grouped docs: populate groups[] and leave items[] empty
- For flat docs: populate items[] and leave groups[] empty
- Match suggestions to names in the existing budget structure when possible
- totalAmount = total for the whole document`,
  });

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(raw);
};

/**
 * @deprecated Use extractExpensesFromDocument instead.
 * Kept for backward compatibility.
 */
export const extractBudgetFromPDF = async (pdfFile) =>
  extractExpensesFromDocument(pdfFile);

// ── Workflow AI (tool-use loop) ───────────────────────────────────────────────

const WORKFLOW_TOOLS = [
  {
    name: 'create_tasks',
    description: 'Create one or more tasks on the Kanban board. Use this whenever the user asks to generate, add, or create tasks — including full SOP checklists.',
    input_schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'Array of tasks to create',
          items: {
            type: 'object',
            properties: {
              title:       { type: 'string',  description: 'Short, action-oriented task title' },
              description: { type: 'string',  description: 'Detailed description or context' },
              status:      { type: 'string',  enum: ['To Do', 'In Progress', 'Review', 'Done'] },
              priority:    { type: 'string',  enum: ['low', 'medium', 'high'] },
              dueDate:     { type: 'string',  description: 'ISO date YYYY-MM-DD, or omit if not known' },
              assignee:    { type: 'string',  description: 'Person responsible, e.g. "Héctor"' },
              grantId:     { type: 'string',  description: 'grantId to link, or omit' },
            },
            required: ['title', 'priority', 'status'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'update_tasks',
    description: 'Update one or more existing tasks — change status (move columns), priority, due date, assignee, title, or description.',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'The id of the task to update' },
              title:       { type: 'string' },
              description: { type: 'string' },
              status:      { type: 'string', enum: ['To Do', 'In Progress', 'Review', 'Done'] },
              priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
              dueDate:     { type: 'string' },
              assignee:    { type: 'string' },
            },
            required: ['taskId'],
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_tasks',
    description: 'Delete one or more tasks from the board by their ids.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task ids to delete',
        },
      },
      required: ['taskIds'],
    },
  },
];

/**
 * Build the system prompt for the workflow AI, including current board state.
 */
const buildWorkflowSystemPrompt = (tasks, grants) => {
  const today = new Date().toISOString().split('T')[0];

  const tasksText = tasks.length === 0
    ? '(No tasks yet)'
    : tasks.map(t =>
        `  - [${t.id}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority}` +
        (t.dueDate ? ` | Due: ${t.dueDate}` : '') +
        (t.assignee ? ` | Assignee: ${t.assignee}` : '')
      ).join('\n');

  const grantsText = grants.length === 0
    ? '(No grants)'
    : grants.map(g => `  - [${g.id}] "${g.title}" (${g.fundingAgency})`).join('\n');

  return `You are the Workflow AI for RWJF Grant GRT000937 at Howard University College of Medicine.
Today: ${today}

You have tools to CREATE, UPDATE, and DELETE tasks on the Kanban board.
Kanban columns (statuses): "To Do" | "In Progress" | "Review" | "Done"
Priority levels: "low" | "medium" | "high"

CURRENT BOARD TASKS:
${tasksText}

AVAILABLE GRANTS:
${grantsText}

=== GRT000937 SOP REFERENCE ===

WORKFLOW A — P-Card (under $2,500):
  Setup: Transfer of Funds Form (Nichelle signs) → Anjanette Antonio. 7–10 days to issue.
  Purchases: Verify allowable, <$2,500, Tax Exemption Cert, Howard address only, save receipt.
  Allowable: Books, computer peripherals, food (Aim 4 pantry), conference registrations, office supplies.
  Restricted: Gift cards, airline/hotel, consultants, furniture, personal items.
  DEADLINE: Reconcile in JP Morgan PaymentNet by 15th of every month. Missing = credit drops to $1.
  Assignee default: Héctor

WORKFLOW B — Workday Requisition (over $3,000):
  Steps: Create Workday req (Worktag GRT000937, CC1500) → Nichelle reviews → Anjanette approves.
  "Create Receipt" immediately on delivery — every day of delay = vendor delinquency risk.
  ≥$10K: collect 3 vendor quotes first (attach to req).

WORKFLOW C — Travel (4-Phase SOP):
  Phase 1 (T−60 days): Collect HUCM Application packet (student abstract, invitation, flight/hotel screenshots). Dr. Stubbs + MGL signatures.
  Phase 2 (T−30 days): Create Workday Spend Authorization (SA). Approval chain: MGL → Sam Gaisie → Nichelle Brooks.
  Phase 3 (after SA approval): Book via CBT (Christopherson Business Travel). Provide SA number. CBT purchases directly — student never pays out of pocket.
  Phase 4 (post-travel): Employee → Workday Expense Report linked to SA. Non-employee → Revised PRF (2025, MGL-signed) to apgrants@howard.edu.
  RULE: No SA = no booking. Students must NEVER pay flights/hotels out of pocket.

WORKFLOW D — Aim 5 Direct Payments (stipends/gift cards):
  Steps: Revised PRF (Spend Category: "Participant Support Costs") + Budget Justification Memo → MGL → Nichelle Brooks → Kisha Riddick → track with Sam Gaisie.
  "Participant Support Costs" keeps payments F&A tax exempt — wrong category loses this permanently.

KEY PERSONNEL:
  - Dr. Gondré-Lewis (MGL) — PI, mandatory FIRST signature
  - Héctor Bravo-Rivera — Program Director (the user, central coordinator)
  - Sam Gaisie — Assoc. Dean Finance / Cost Center Manager
  - Nichelle Brooks — Post-Award Grant Manager
  - Anjanette Antonio — Procurement
  - Kisha Riddick — Aim 5 Sub-Accounts
  - Dr. John Stubbs — Dir. Medical Student Research (co-signs student travel)
  - CBT (Christopherson Business Travel) — only authorized travel agency

DOLLAR THRESHOLDS:
  $0–$2,500: P-Card OK
  $2,500–$10K: Workday Req
  $10K+: Workday Req + 3 quotes required
  $25K: Check with Nichelle Brooks
  $50K+: Controller approval

COGNITIVE ANCHOR (use in email subjects): [Category] – [GRT000937] – [Aim #]

=== INSTRUCTIONS ===
Always call the appropriate tools to actually make changes. When generating a workflow checklist, create ALL the tasks in one create_tasks call with correct priorities and due dates.
When the user asks what's overdue, identify tasks whose dueDate < today (${today}) and are not "Done".
Be concise in your final text reply — the tool actions speak for themselves.`;
};

/**
 * Run Claude with workflow tools and an agentic loop.
 * @param {string} userMessage
 * @param {Array} conversationHistory  - prior messages [{role,content}]
 * @param {{ tasks, grants }} context
 * @param {{ onCreateTasks, onUpdateTasks, onDeleteTasks }} toolCallbacks
 * @returns {Promise<{ reply: string, toolCalls: Array, newHistory: Array }>}
 */
export const askClaudeWithWorkflowTools = async (
  userMessage,
  conversationHistory,
  context,
  toolCallbacks
) => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized. Check your API key.');

  const { tasks = [], grants = [] } = context;
  const { onCreateTasks, onUpdateTasks, onDeleteTasks } = toolCallbacks;

  const systemPrompt = buildWorkflowSystemPrompt(tasks, grants);
  const toolCalls = []; // track all tool invocations for the UI

  let messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  // Agentic loop
  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: WORKFLOW_TOOLS,
      messages,
    });

    // Append assistant response to history
    messages = [...messages, { role: 'assistant', content: response.content }];

    if (response.stop_reason !== 'tool_use') {
      // Done — extract final text
      const textBlock = response.content.find(b => b.type === 'text');
      const reply = textBlock?.text || '';
      // Strip assistant turns from returned history (keep only user messages for next call)
      const newHistory = messages;
      return { reply, toolCalls, newHistory };
    }

    // Execute tool calls
    const toolResultBlocks = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;

      let result = { success: false, error: 'Unknown tool' };

      try {
        if (block.name === 'create_tasks') {
          const created = await onCreateTasks(block.input.tasks);
          result = { success: true, created: created.length, ids: created.map(t => t.id) };
          toolCalls.push({ type: 'create', count: created.length, tasks: created });

        } else if (block.name === 'update_tasks') {
          await onUpdateTasks(block.input.updates);
          result = { success: true, updated: block.input.updates.length };
          toolCalls.push({ type: 'update', count: block.input.updates.length, updates: block.input.updates });

        } else if (block.name === 'delete_tasks') {
          await onDeleteTasks(block.input.taskIds);
          result = { success: true, deleted: block.input.taskIds.length };
          toolCalls.push({ type: 'delete', count: block.input.taskIds.length, ids: block.input.taskIds });
        }
      } catch (err) {
        result = { success: false, error: err.message };
      }

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    // Feed results back to Claude
    messages = [...messages, { role: 'user', content: toolResultBlocks }];
  }
};

// ── Global Editor AI (tool-use loop for editing any app data) ────────────────

const GLOBAL_TOOLS = [
  {
    name: 'create_tasks',
    description: 'Create tasks/action items on the Kanban board. Use this whenever extracting to-dos, reminders, or action items from any content (emails, documents, images, text).',
    input_schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title:       { type: 'string',  description: 'Short, action-oriented title' },
              description: { type: 'string',  description: 'Details or context' },
              status:      { type: 'string',  enum: ['To Do', 'In Progress', 'Review', 'Done'] },
              priority:    { type: 'string',  enum: ['low', 'medium', 'high'] },
              dueDate:     { type: 'string',  description: 'ISO date YYYY-MM-DD' },
              assignee:    { type: 'string' },
              grantId:     { type: 'string' },
            },
            required: ['title', 'priority', 'status'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'update_tasks',
    description: 'Update existing Kanban tasks (status, priority, due date, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId:      { type: 'string' },
              title:       { type: 'string' },
              description: { type: 'string' },
              status:      { type: 'string', enum: ['To Do', 'In Progress', 'Review', 'Done'] },
              priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
              dueDate:     { type: 'string' },
              assignee:    { type: 'string' },
            },
            required: ['taskId'],
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_tasks',
    description: 'Delete Kanban tasks by ID.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['taskIds'],
    },
  },
  {
    name: 'update_grant',
    description: 'Update fields on a grant record (title, status, amount, fundingAgency, description, startDate, endDate).',
    input_schema: {
      type: 'object',
      properties: {
        grantId:       { type: 'string', description: 'ID of the grant to update' },
        title:         { type: 'string' },
        status:        { type: 'string' },
        amount:        { type: 'number' },
        fundingAgency: { type: 'string' },
        description:   { type: 'string' },
        startDate:     { type: 'string' },
        endDate:       { type: 'string' },
      },
      required: ['grantId'],
    },
  },
  {
    name: 'update_budget',
    description: 'Update a budget total amount.',
    input_schema: {
      type: 'object',
      properties: {
        budgetId:    { type: 'string' },
        totalBudget: { type: 'number' },
      },
      required: ['budgetId', 'totalBudget'],
    },
  },
  {
    name: 'update_category',
    description: 'Rename a budget category or change its allocated amount.',
    input_schema: {
      type: 'object',
      properties: {
        budgetId:   { type: 'string' },
        categoryId: { type: 'string' },
        name:       { type: 'string' },
        allocated:  { type: 'number' },
      },
      required: ['budgetId', 'categoryId'],
    },
  },
  {
    name: 'delete_category',
    description: 'Delete a category from a budget. ALWAYS confirm with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        budgetId:   { type: 'string' },
        categoryId: { type: 'string' },
      },
      required: ['budgetId', 'categoryId'],
    },
  },
  {
    name: 'update_mini_pool',
    description: 'Update a sub-budget (mini pool) description or allocated amount.',
    input_schema: {
      type: 'object',
      properties: {
        budgetId:    { type: 'string' },
        categoryId:  { type: 'string' },
        miniPoolId:  { type: 'string' },
        description: { type: 'string' },
        allocated:   { type: 'number' },
      },
      required: ['budgetId', 'categoryId', 'miniPoolId'],
    },
  },
  {
    name: 'delete_mini_pool',
    description: 'Delete a sub-budget from a category. ALWAYS confirm with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        budgetId:   { type: 'string' },
        categoryId: { type: 'string' },
        miniPoolId: { type: 'string' },
      },
      required: ['budgetId', 'categoryId', 'miniPoolId'],
    },
  },
];

/**
 * Pure JS keyword search over knowledge docs. No API calls needed.
 * Returns docs sorted by relevance score (highest first).
 */
export const searchKnowledge = (query, docs, maxResults = 5) => {
  if (!query || !docs || docs.length === 0) return [];
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (words.length === 0) return docs.slice(0, maxResults);

  return docs
    .map(doc => {
      const haystack = [
        doc.title || '',
        doc.summary || '',
        (doc.tags || []).join(' '),
        (doc.content || '').slice(0, 600),
        (doc.emailMeta?.keyDecisions || []).join(' '),
        (doc.emailMeta?.participants || []).join(' '),
      ].join(' ').toLowerCase();
      const score = words.reduce((s, w) => s + (haystack.includes(w) ? 1 : 0), 0);
      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ doc }) => doc);
};

/**
 * Generate a 2–3 sentence AI summary of a document.
 */
export const generateDocSummary = async (content, title = '') => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized.');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a concise 2–3 sentence summary of the following document${title ? ` titled "${title}"` : ''}. Focus on the key policies, decisions, or information that would help someone quickly understand what this document covers.\n\nDocument:\n${content.slice(0, 4000)}`,
    }],
  });
  return response.content[0].text.trim();
};

/**
 * Parse a raw copy-pasted email thread into structured data.
 * Returns: { subject, participants, dateRange, keyDecisions, actionItems, content }
 */
export const parseEmailThread = async (rawText) => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized.');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Parse this email thread and return ONLY valid JSON (no markdown, no explanation):

{
  "subject": "email subject or best title",
  "participants": ["Name <email>", "..."],
  "dateRange": "e.g. Nov 12–15, 2024",
  "summary": "2–3 sentence summary of what this thread is about",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": ["Action 1 (Owner)", "Action 2 (Owner)"],
  "content": "Full cleaned thread text preserving sender/date headers"
}

Email thread:
${rawText.slice(0, 6000)}`,
    }],
  });

  const raw = response.content[0].text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(raw);
};

/**
 * Extract plain text from a file (PDF, image, or text) for use as knowledge doc content.
 * Uses Claude vision/doc capabilities for PDF and image files.
 */
export const extractTextFromFile = async (file) => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized.');

  const blocks = [];
  if (file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
  } else if (file.type.startsWith('image/')) {
    const base64 = await fileToBase64(file);
    const mt = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
    blocks.push({ type: 'image', source: { type: 'base64', media_type: mt, data: base64 } });
  } else {
    return await file.text();
  }
  blocks.push({ type: 'text', text: 'Extract and return all the text content from this document. Preserve structure (headings, lists, numbered items). Do not summarize — return all text verbatim.' });

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: blocks }],
  });
  return response.content[0].text.trim();
};

const buildGlobalSystemPrompt = (grants, budgets, tasks, knowledgeDocs = []) => {
  const today = new Date().toISOString().split('T')[0];

  const grantsText = grants.length === 0
    ? '(No grants)'
    : grants.map(g =>
        `  [${g.id}] "${g.title}" | ${g.status || 'Active'} | ${g.fundingAgency || ''} | $${(g.amount || 0).toLocaleString()}`
      ).join('\n');

  const budgetsText = budgets.length === 0
    ? '(No budgets)'
    : budgets.map(b => {
        const grant = grants.find(g => g.id === b.grantId);
        const catsText = (b.categories || []).map(cat => {
          const poolsText = (cat.miniPools || [])
            .map(p => `        • [${p.id}] "${p.description}" | $${(p.allocated || 0).toLocaleString()}`)
            .join('\n');
          return `      [${cat.id}] "${cat.name}" | $${(cat.allocated || 0).toLocaleString()}` +
            (poolsText ? '\n' + poolsText : '');
        }).join('\n');
        return `  [${b.id}] Budget for "${grant?.title || 'Unknown'}" | Total: $${(b.totalBudget || 0).toLocaleString()}\n` +
          (catsText || '    (no categories)');
      }).join('\n\n');

  const tasksText = tasks.length === 0
    ? '(No tasks)'
    : tasks.map(t =>
        `  [${t.id}] "${t.title}" | ${t.status} | ${t.priority}` +
        (t.dueDate ? ` | Due: ${t.dueDate}` : '') +
        (t.assignee ? ` | ${t.assignee}` : '')
      ).join('\n');

  // Knowledge Base context
  let kbBlock = '';
  if (knowledgeDocs && knowledgeDocs.length > 0) {
    // Sort: most recently updated first; give full content to top 5, summaries to rest
    const sorted = [...knowledgeDocs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const fullDocs = sorted.slice(0, 5);
    const summaryDocs = sorted.slice(5);

    const formatDoc = (doc, full) => {
      const catLabel = (doc.category || doc.type || 'doc').toUpperCase();
      let out = `[${catLabel}] "${doc.title}"`;
      if (doc.summary) out += `\nSummary: ${doc.summary}`;
      if (doc.emailMeta) {
        if (doc.emailMeta.participants?.length) out += `\nParticipants: ${doc.emailMeta.participants.join(', ')}`;
        if (doc.emailMeta.dateRange) out += `\nDate: ${doc.emailMeta.dateRange}`;
        if (doc.emailMeta.keyDecisions?.length) out += `\nKey Decisions:\n${doc.emailMeta.keyDecisions.map(d => `  • ${d}`).join('\n')}`;
        if (doc.emailMeta.actionItems?.length) out += `\nAction Items:\n${doc.emailMeta.actionItems.map(a => `  • ${a}`).join('\n')}`;
      }
      if (full && doc.content) {
        out += `\nContent:\n${doc.content.slice(0, 800)}${doc.content.length > 800 ? '…' : ''}`;
      }
      return out;
    };

    const parts = [
      ...fullDocs.map(d => formatDoc(d, true)),
      ...summaryDocs.map(d => formatDoc(d, false)),
    ];
    kbBlock = `\n\n=== KNOWLEDGE BASE (${knowledgeDocs.length} docs) ===\nReference these documents when answering questions about policies, decisions, or prior communications.\n\n${parts.join('\n\n---\n\n')}`;
  }

  return `You are the AI Assistant for RWJF Grant GRT000937 Program Manager Hub.
Today: ${today}

You can read and modify ALL app data. Tools available:
- create_tasks, update_tasks, delete_tasks — Kanban board
- update_grant — update grant record fields
- update_budget — update budget total
- update_category, delete_category — budget categories
- update_mini_pool, delete_mini_pool — sub-budgets inside categories

IMPORTANT RULES:
1. For DELETE operations (categories, mini pools), ALWAYS tell the user what will be deleted and explicitly ask for confirmation BEFORE calling the delete tool. Do not call delete tools in the same turn as your warning.
2. For update operations, make the change immediately and confirm briefly.
3. When content (emails, text, images, documents) is provided, extract ALL action items and create tasks for each one. Set priority based on urgency: within 3 days = high, within a week = medium, else = low.
4. Be concise — tool badges communicate the actions.
5. When answering policy or historical questions, cite the specific Knowledge Base document by title.

=== CURRENT APP DATA ===

GRANTS:
${grantsText}

BUDGETS:
${budgetsText}

KANBAN TASKS:
${tasksText}

=== GRT000937 KEY REMINDERS ===
- P-Card: reconcile in PaymentNet by the 15th of every month
- Travel: Spend Authorization must be created 30+ days before departure
- Aim 5 stipends: always use "Participant Support Costs" spend category
- $10K+: 3 vendor quotes required before purchase${kbBlock}`;
};

/**
 * Global AI Editor tool-use loop.
 * Handles text messages and optional file attachments (images, PDFs, text files).
 *
 * @param {string} userMessage
 * @param {Array}  conversationHistory
 * @param {{ grants, budgets, tasks }} context
 * @param {{ onCreateTasks, onUpdateTasks, onDeleteTasks, onUpdateGrant, onUpdateBudget,
 *           onUpdateCategory, onDeleteCategory, onUpdateMiniPool, onDeleteMiniPool }} toolCallbacks
 * @param {File[]} attachedFiles  - optional array of File objects to attach
 * @returns {Promise<{ reply, toolCalls, newHistory }>}
 */
export const askClaudeWithGlobalTools = async (
  userMessage,
  conversationHistory,
  context,
  toolCallbacks,
  attachedFiles = []
) => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized. Check your API key.');

  const { grants = [], budgets = [], tasks = [], knowledgeDocs = [] } = context;
  const {
    onCreateTasks, onUpdateTasks, onDeleteTasks,
    onUpdateGrant, onUpdateBudget,
    onUpdateCategory, onDeleteCategory,
    onUpdateMiniPool, onDeleteMiniPool,
  } = toolCallbacks;

  const systemPrompt = buildGlobalSystemPrompt(grants, budgets, tasks, knowledgeDocs);
  const toolCalls = [];

  // Build user content — may include file attachment blocks
  let userContent = userMessage;
  if (attachedFiles && attachedFiles.length > 0) {
    const blocks = [];
    for (const file of attachedFiles) {
      if (file.type === 'application/pdf') {
        const base64 = await fileToBase64(file);
        blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        const mt = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
        blocks.push({ type: 'image', source: { type: 'base64', media_type: mt, data: base64 } });
      } else {
        const text = await file.text();
        blocks.push({ type: 'text', text: `[Attached: ${file.name}]\n${text}` });
      }
    }
    blocks.push({ type: 'text', text: userMessage });
    userContent = blocks;
  }

  let messages = [
    ...conversationHistory,
    { role: 'user', content: userContent },
  ];

  // Agentic loop
  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: GLOBAL_TOOLS,
      messages,
    });

    messages = [...messages, { role: 'assistant', content: response.content }];

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find(b => b.type === 'text');
      return { reply: textBlock?.text || '', toolCalls, newHistory: messages };
    }

    const toolResultBlocks = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let result = { success: false, error: 'Unknown tool' };

      try {
        const inp = block.input;

        if (block.name === 'create_tasks') {
          const created = await onCreateTasks(inp.tasks);
          result = { success: true, created: created.length, ids: created.map(t => t.id) };
          toolCalls.push({ type: 'create', count: created.length, tasks: created });

        } else if (block.name === 'update_tasks') {
          await onUpdateTasks(inp.updates);
          result = { success: true, updated: inp.updates.length };
          toolCalls.push({ type: 'update', count: inp.updates.length });

        } else if (block.name === 'delete_tasks') {
          await onDeleteTasks(inp.taskIds);
          result = { success: true, deleted: inp.taskIds.length };
          toolCalls.push({ type: 'delete_task', count: inp.taskIds.length });

        } else if (block.name === 'update_grant') {
          const { grantId, ...updates } = inp;
          await onUpdateGrant(grantId, updates);
          result = { success: true };
          toolCalls.push({ type: 'update_grant', count: 1 });

        } else if (block.name === 'update_budget') {
          await onUpdateBudget(inp.budgetId, { totalBudget: inp.totalBudget });
          result = { success: true };
          toolCalls.push({ type: 'update_budget', count: 1 });

        } else if (block.name === 'update_category') {
          const { budgetId, categoryId, ...updates } = inp;
          await onUpdateCategory(budgetId, categoryId, updates);
          result = { success: true };
          toolCalls.push({ type: 'update_category', count: 1 });

        } else if (block.name === 'delete_category') {
          await onDeleteCategory(inp.budgetId, inp.categoryId);
          result = { success: true };
          toolCalls.push({ type: 'delete_category', count: 1 });

        } else if (block.name === 'update_mini_pool') {
          const { budgetId, categoryId, miniPoolId, ...updates } = inp;
          await onUpdateMiniPool(budgetId, categoryId, miniPoolId, updates);
          result = { success: true };
          toolCalls.push({ type: 'update_mini_pool', count: 1 });

        } else if (block.name === 'delete_mini_pool') {
          await onDeleteMiniPool(inp.budgetId, inp.categoryId, inp.miniPoolId);
          result = { success: true };
          toolCalls.push({ type: 'delete_mini_pool', count: 1 });
        }
      } catch (err) {
        result = { success: false, error: err.message };
      }

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages = [...messages, { role: 'user', content: toolResultBlocks }];
  }
};

/**
 * Generate a structured status briefing of all app data.
 * Optimised for NotebookLM ingestion.
 *
 * @param {{ grants, budgets, tasks, paymentRequests, travelRequests, giftCardDistributions, knowledgeDocs }} data
 * @param {'full'|'tasks'|'budget'|'executive'} type
 * @returns {Promise<string>} Formatted briefing markdown
 */
export const generateStatusBriefing = async (data, type = 'full') => {
  const client = getClaudeClient();
  if (!client) throw new Error('Claude API client not initialized. Check your API key.');

  const {
    grants = [],
    budgets = [],
    tasks = [],
    paymentRequests = [],
    travelRequests = [],
    giftCardDistributions = [],
    knowledgeDocs = [],
  } = data;

  const today = new Date().toISOString().split('T')[0];

  // --- Serialize app state ---
  const grantsStr = grants.map(g =>
    `Grant: ${g.title} | Status: ${g.status || 'Active'} | Agency: ${g.fundingAgency || 'N/A'} | Amount: $${(g.amount || 0).toLocaleString()} | Period: ${g.startDate || '?'} → ${g.endDate || '?'}`
  ).join('\n') || 'No grants.';

  const budgetsStr = budgets.map(b => {
    const grant = grants.find(g => g.id === b.grantId);
    const cats = (b.categories || []).map(cat => {
      const spent = (cat.miniPools || []).reduce((s, p) =>
        s + (p.expenses || []).reduce((es, e) => es + (e.amount || 0), 0), 0);
      const pools = (cat.miniPools || []).map(p =>
        `    • ${p.description}: $${(p.allocated || 0).toLocaleString()} allocated`
      ).join('\n');
      return `  Category: ${cat.name} | Allocated: $${(cat.allocated || 0).toLocaleString()}\n${pools}`;
    }).join('\n');
    return `Budget for "${grant?.title || 'Unknown'}" | Total: $${(b.totalBudget || 0).toLocaleString()}\n${cats || '  (no categories)'}`;
  }).join('\n\n') || 'No budgets.';

  const now = new Date();
  const tasksByStatus = { 'To Do': [], 'In Progress': [], 'Review': [], 'Done': [] };
  tasks.forEach(t => (tasksByStatus[t.status] = tasksByStatus[t.status] || []).push(t));
  const tasksStr = Object.entries(tasksByStatus)
    .filter(([, arr]) => arr.length > 0)
    .map(([status, arr]) => {
      const items = arr.map(t => {
        const overdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done' ? ' ⚠ OVERDUE' : '';
        return `  • [${t.priority?.toUpperCase() || 'MEDIUM'}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}${overdue}${t.assignee ? ` — ${t.assignee}` : ''}`;
      }).join('\n');
      return `${status} (${arr.length}):\n${items}`;
    }).join('\n\n') || 'No tasks.';

  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done');
  const dueSoonTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    const diff = (new Date(t.dueDate) - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const prStr = paymentRequests.length > 0
    ? paymentRequests.map(pr => `  • ${pr.description || pr.vendor || 'Payment'} | $${(pr.amount || 0).toLocaleString()} | ${pr.status || 'Pending'}`).join('\n')
    : '  None pending.';

  const trStr = travelRequests.length > 0
    ? travelRequests.map(tr => `  • ${tr.traveler || tr.purpose || 'Travel'} | ${tr.departureDate || '?'} | $${(tr.estimatedCost || 0).toLocaleString()} | ${tr.status || 'Pending'}`).join('\n')
    : '  None pending.';

  const gcdStr = giftCardDistributions.length > 0
    ? giftCardDistributions.map(g => `  • ${g.recipientName || 'Recipient'} | $${(g.amount || 0).toLocaleString()} | ${g.distributionDate || '?'} | ${g.status || 'Pending'}`).join('\n')
    : '  None recorded.';

  const kbStr = knowledgeDocs.length > 0
    ? knowledgeDocs.map(d => `  • [${(d.category || 'doc').toUpperCase()}] ${d.title}${d.summary ? ': ' + d.summary : ''}`).join('\n')
    : '  No knowledge base documents.';

  // --- Build type-specific prompt ---
  const typeInstructions = {
    full: `Generate a COMPREHENSIVE STATUS BRIEFING covering ALL sections below. Use clear markdown headers. Include specific numbers, dates, and names. Flag any overdue items or urgent deadlines prominently. This briefing will be ingested into NotebookLM as a source document, so be thorough and precise.`,
    tasks: `Generate a TASK-FOCUSED BRIEFING. Focus entirely on the Kanban board status. Highlight overdue tasks (${overdueTasks.length} overdue), tasks due in the next 7 days (${dueSoonTasks.length} items), and blocked or high-priority work. Organise by urgency. This briefing will be ingested into NotebookLM.`,
    budget: `Generate a BUDGET FOCUS BRIEFING. Analyse spending, allocations, and any budget concerns. Summarise how funds are distributed across categories and mini-pools. Flag any categories nearing their allocation limits. This briefing will be ingested into NotebookLM.`,
    executive: `Generate an EXECUTIVE BRIEFING of approximately 250 words maximum. High-level only. Cover: overall grant health, critical deadlines, any blockers or risks, and 3–5 key action items. No detailed tables. Clear, decision-ready language for a senior stakeholder. This briefing will be ingested into NotebookLM.`,
  };

  const prompt = `${typeInstructions[type] || typeInstructions.full}

Today's Date: ${today}
Grant Program: RWJF Grant GRT000937

=== RAW APP DATA ===

GRANTS:
${grantsStr}

BUDGETS:
${budgetsStr}

KANBAN TASKS:
${tasksStr}

PAYMENT REQUESTS:
${prStr}

TRAVEL REQUESTS:
${trStr}

GIFT CARD DISTRIBUTIONS:
${gcdStr}

KNOWLEDGE BASE DOCUMENTS:
${kbStr}

---
Now generate the briefing. Use markdown formatting with clear sections. Start with a one-line status summary at the top.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: type === 'executive' ? 1024 : 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
};

/**
 * Chat with Claude (general purpose)
 */
export const chatWithClaude = async (userMessage, conversationHistory = []) => {
  const client = getClaudeClient();

  if (!client) {
    throw new Error('Claude API client not initialized. Check your API key.');
  }

  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: messages
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
};
