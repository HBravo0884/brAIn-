import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude API caller.
 * If a key is saved in localStorage, calls Anthropic directly (no proxy, no timeout limit).
 * Otherwise routes through the Netlify proxy (ANTHROPIC_API_KEY server-side, 26s limit).
 */
const claudeFetch = async (payload) => {
  const localKey =
    localStorage.getItem('brain_anthropic_api_key') ||
    import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Direct SDK call — bypasses Netlify 26s timeout
  if (localKey) {
    const client = new Anthropic({ apiKey: localKey, dangerouslyAllowBrowser: true });
    return client.messages.create(payload);
  }

  // No local key — use Netlify proxy
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return res.json();
  const errText = await res.text();
  throw new Error(`Claude proxy error ${res.status}: ${errText}`);
};

/**
 * Call Claude AI with a prompt
 * @param {string} prompt - The prompt to send to Claude
 * @param {Object} options - Additional options (model, max_tokens, etc.)
 * @returns {Promise<string>} - Claude's response
 */
export const askClaude = async (prompt, options = {}) => {
  try {
    const message = await claudeFetch({
      model: options.model || 'claude-sonnet-4-6',
      max_tokens: options.max_tokens || 4096,
      messages: [{ role: 'user', content: prompt }],
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

  const message = await claudeFetch({
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
    const response = await claudeFetch({
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
  {
    name: 'create_meetings',
    description: 'Create one or more meetings on the calendar. Supports one-time and recurring meetings (weekly, biweekly, monthly). For recurring meetings, set recurrence.type and recurrence.endDate.',
    input_schema: {
      type: 'object',
      properties: {
        meetings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title:     { type: 'string',  description: 'Meeting title' },
              date:      { type: 'string',  description: 'First (or only) occurrence: ISO datetime YYYY-MM-DDTHH:mm' },
              endTime:   { type: 'string',  description: 'End time as readable string e.g. "12:30 PM"' },
              location:  { type: 'string' },
              attendees: { type: 'string',  description: 'Comma-separated attendee names or emails' },
              notes:     { type: 'string' },
              grantId:   { type: 'string',  description: 'Link to a grant if relevant' },
              recurrence: {
                type: 'object',
                description: 'Omit or set type to "none" for one-time meetings',
                properties: {
                  type:    { type: 'string', enum: ['none', 'weekly', 'biweekly', 'monthly'], description: '"weekly" = every 7 days, "biweekly" = every 14 days' },
                  endDate: { type: 'string', description: 'YYYY-MM-DD — last date of the series' },
                },
              },
            },
            required: ['title', 'date'],
          },
        },
      },
      required: ['meetings'],
    },
  },
  {
    name: 'update_meeting',
    description: 'Update fields of an existing meeting by its id.',
    input_schema: {
      type: 'object',
      properties: {
        meetingId: { type: 'string' },
        title:     { type: 'string' },
        date:      { type: 'string' },
        endTime:   { type: 'string' },
        location:  { type: 'string' },
        attendees: { type: 'string' },
        notes:     { type: 'string' },
        grantId:   { type: 'string' },
      },
      required: ['meetingId'],
    },
  },
  {
    name: 'delete_meeting',
    description: 'Delete a meeting by its id. ALWAYS confirm with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        meetingId: { type: 'string' },
      },
      required: ['meetingId'],
    },
  },
  {
    name: 'update_student',
    description: 'Update a piano student record in the Studio. Use studentId from the STUDIO STUDENTS section. Can update: name, status (Active/Discontinued), day, time, location, sessions, experienceLevel, dragonMusic, currentGoal, currentFocus, thePrescription, theTrigger, entryPoint, acquiredSkills, currentChallenges, earTraining, practitionPrescription.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'The student id from the system prompt' },
        updates: {
          type: 'object',
          description: 'Key/value pairs of fields to update',
          properties: {
            name:                   { type: 'string' },
            status:                 { type: 'string' },
            day:                    { type: 'string' },
            time:                   { type: 'string' },
            location:               { type: 'string' },
            sessions:               { type: 'number' },
            experienceLevel:        { type: 'string' },
            dragonMusic:            { type: 'string' },
            currentGoal:            { type: 'string' },
            currentFocus:           { type: 'string' },
            thePrescription:        { type: 'string' },
            theTrigger:             { type: 'string' },
            entryPoint:             { type: 'string' },
            acquiredSkills:         { type: 'string' },
            currentChallenges:      { type: 'string' },
            earTraining:            { type: 'string' },
            practitionPrescription: { type: 'string' },
          },
        },
      },
      required: ['studentId', 'updates'],
    },
  },
  {
    name: 'add_lesson_log',
    description: 'Add a lesson log entry for a piano student.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        date:      { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
        notes:     { type: 'string', description: 'Lesson notes' },
      },
      required: ['studentId', 'notes'],
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
  const response = await claudeFetch({
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
  const response = await claudeFetch({
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

  const response = await claudeFetch({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: blocks }],
  });
  return response.content[0].text.trim();
};

const buildGlobalSystemPrompt = (grants, budgets, tasks, knowledgeDocs = [], meetings = [], personnel = [], students = []) => {
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

  const meetingsText = meetings.length === 0
    ? '(No meetings)'
    : meetings.slice(-20).map(m => {
        const grantName = grants.find(g => g.id === m.grantId)?.title || '';
        return `  "${m.title}" | ${m.date ? m.date.split('T')[0] : 'no date'}${grantName ? ` | ${grantName}` : ''}` +
          (m.attendees ? ` | Attendees: ${m.attendees}` : '') +
          (m.actionItems ? `\n    Action items: ${m.actionItems.slice(0, 120)}` : '');
      }).join('\n');

  const personnelText = personnel.length === 0
    ? '(No personnel)'
    : personnel.map(p =>
        `  ${p.firstName} ${p.lastName} | ${p.role || ''} | ${p.department || ''} | ${p.email || ''}` +
        (p.type ? ` | Type: ${p.type}` : '')
      ).join('\n');

  const activeStudents = students.filter(s => s.status === 'Active');
  const studentsText = activeStudents.length === 0
    ? '(No active students)'
    : activeStudents.map(s =>
        `  [${s.id}] ${s.name} | ${s.day} ${s.time} | ${s.location} | ${s.sessions}min | ${s.experienceLevel}` +
        (s.dragonMusic ? ` | 🎵 ${s.dragonMusic}` : '') +
        (s.currentGoal ? ` | Goal: ${s.currentGoal}` : '')
      ).join('\n');

  // Knowledge Base context — strictly capped to avoid token overflow
  let kbBlock = '';
  if (knowledgeDocs && knowledgeDocs.length > 0) {
    const sorted = [...knowledgeDocs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    // Only include top 12 docs; email/gmail docs get no raw content (summaries only)
    const capped = sorted.slice(0, 12);

    const formatDoc = (doc) => {
      const catLabel = (doc.category || doc.type || 'doc').toUpperCase();
      const isEmail = catLabel === 'EMAIL' || catLabel === 'MEETING' || doc.emailMeta;
      let out = `[${catLabel}] "${doc.title}"`;
      if (doc.summary) out += `\nSummary: ${doc.summary.slice(0, 200)}`;
      if (doc.emailMeta) {
        if (doc.emailMeta.participants?.length) out += `\nParticipants: ${doc.emailMeta.participants.slice(0, 5).join(', ')}`;
        if (doc.emailMeta.dateRange) out += `\nDate: ${doc.emailMeta.dateRange}`;
        if (doc.emailMeta.keyDecisions?.length) out += `\nKey Decisions:\n${doc.emailMeta.keyDecisions.slice(0, 3).map(d => `  • ${d.slice(0, 120)}`).join('\n')}`;
        if (doc.emailMeta.actionItems?.length) out += `\nAction Items:\n${doc.emailMeta.actionItems.slice(0, 3).map(a => `  • ${a.slice(0, 120)}`).join('\n')}`;
      }
      // Non-email docs get a short content snippet
      if (!isEmail && doc.content) {
        out += `\nContent:\n${doc.content.slice(0, 400)}${doc.content.length > 400 ? '…' : ''}`;
      }
      return out;
    };

    const parts = capped.map(formatDoc);
    kbBlock = `\n\n=== KNOWLEDGE BASE (${knowledgeDocs.length} docs total, showing ${capped.length} most recent) ===\n\n${parts.join('\n\n---\n\n')}`;
  }

  return `You are the AI Assistant for RWJF Grant GRT000937 Program Manager Hub.
Today: ${today}

You can read and modify ALL app data. Tools available:
- create_tasks, update_tasks, delete_tasks — Kanban board
- update_grant — update grant record fields
- update_budget — update budget total
- update_category, delete_category — budget categories
- update_mini_pool, delete_mini_pool — sub-budgets inside categories
- create_meetings, update_meeting, delete_meeting — Calendar meetings (one-time and recurring: weekly, biweekly, monthly)
- update_student, add_lesson_log — Studio student records and lesson logs

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

MEETINGS (recent 20):
${meetingsText}

PERSONNEL DIRECTORY:
${personnelText}

STUDIO — PIANO STUDENTS (Expressions Music Academy, ${activeStudents.length} active):
Format: [id] Name | Day Time | Location | Duration | Level | Dragon Music piece | Current Goal
${studentsText}

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
 *           onUpdateCategory, onDeleteCategory, onUpdateMiniPool, onDeleteMiniPool,
 *           onCreateMeetings, onUpdateMeeting, onDeleteMeeting,
 *           onUpdateStudent, onAddLessonLog }} toolCallbacks
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

  const { grants = [], budgets = [], tasks = [], knowledgeDocs = [], meetings = [], personnel = [], students = [] } = context;
  const {
    onCreateTasks, onUpdateTasks, onDeleteTasks,
    onUpdateGrant, onUpdateBudget,
    onUpdateCategory, onDeleteCategory,
    onUpdateMiniPool, onDeleteMiniPool,
    onCreateMeetings, onUpdateMeeting, onDeleteMeeting,
    onUpdateStudent, onAddLessonLog,
  } = toolCallbacks;

  const systemPrompt = buildGlobalSystemPrompt(grants, budgets, tasks, knowledgeDocs, meetings, personnel, students);
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

  // Keep only the last 20 messages to prevent token overflow from long conversations
  const trimmedHistory = conversationHistory.slice(-20);

  let messages = [
    ...trimmedHistory,
    { role: 'user', content: userContent },
  ];

  // Agentic loop
  while (true) {
    const response = await claudeFetch({
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

        } else if (block.name === 'create_meetings') {
          const created = await onCreateMeetings(inp.meetings);
          result = { success: true, created: created.length };
          toolCalls.push({ type: 'create_meeting', count: created.length });

        } else if (block.name === 'update_meeting') {
          const { meetingId, ...updates } = inp;
          await onUpdateMeeting(meetingId, updates);
          result = { success: true };
          toolCalls.push({ type: 'update_meeting', count: 1 });

        } else if (block.name === 'delete_meeting') {
          await onDeleteMeeting(inp.meetingId);
          result = { success: true };
          toolCalls.push({ type: 'delete_meeting', count: 1 });

        } else if (block.name === 'update_student') {
          await onUpdateStudent(inp.studentId, inp.updates);
          result = { success: true };
          toolCalls.push({ type: 'update_student', count: 1 });

        } else if (block.name === 'add_lesson_log') {
          const today = new Date().toISOString().split('T')[0];
          await onAddLessonLog(inp.studentId, { date: inp.date || today, notes: inp.notes });
          result = { success: true };
          toolCalls.push({ type: 'add_lesson_log', count: 1 });
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
export const generateStatusBriefing = async (data, type = 'full', model = 'claude-opus-4-6') => {

  const {
    grants = [],
    budgets = [],
    tasks = [],
    paymentRequests = [],
    travelRequests = [],
    giftCardDistributions = [],
    knowledgeDocs = [],
    personnel = [],
    meetings = [],
    todos = [],
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

  const personnelStr = personnel.length > 0
    ? personnel.map(p => `  • ${p.name || 'Unknown'} | ${p.role || 'Staff'} | ${p.email || ''}${p.grantRole ? ' | Grant role: ' + p.grantRole : ''}`).join('\n')
    : '  No personnel records.';

  const upcomingMeetings = meetings
    .filter(m => m.date && new Date(m.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);
  const pastMeetings = meetings
    .filter(m => m.date && new Date(m.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const meetingsStr = meetings.length > 0
    ? [
        upcomingMeetings.length ? 'Upcoming:\n' + upcomingMeetings.map(m =>
          `  • ${m.date} | ${m.title || 'Meeting'}${m.attendees ? ' | Attendees: ' + (Array.isArray(m.attendees) ? m.attendees.join(', ') : m.attendees) : ''}${m.notes ? '\n    Notes: ' + m.notes.slice(0, 200) : ''}`
        ).join('\n') : '',
        pastMeetings.length ? 'Recent past:\n' + pastMeetings.map(m =>
          `  • ${m.date} | ${m.title || 'Meeting'}${m.actionItems?.length ? '\n    Action items: ' + m.actionItems.slice(0, 3).join('; ') : ''}`
        ).join('\n') : '',
      ].filter(Boolean).join('\n\n')
    : '  No meetings recorded.';

  const openTodos = todos.filter(t => !t.completed);
  const todosStr = openTodos.length > 0
    ? openTodos.map(t => `  • [${t.priority || 'normal'}] ${t.text}${t.dueDate ? ' (due ' + t.dueDate + ')' : ''}`).join('\n')
    : '  No open personal to-dos.';

  // Raw structured data block — always appended so NbLM can parse numbers directly
  const rawDataBlock = `
================================================================================
RAW STRUCTURED DATA (for NotebookLM reference — do not summarise this section)
================================================================================

GRANT COUNT: ${grants.length}
ACTIVE GRANTS: ${grants.filter(g => g.status === 'active' || g.status === 'Active').length}
TOTAL AWARD VALUE: $${grants.reduce((s, g) => s + (g.amount || 0), 0).toLocaleString()}

TASK TOTALS:
  Total tasks: ${tasks.length}
  To Do: ${tasks.filter(t => t.status === 'To Do').length}
  In Progress: ${tasks.filter(t => t.status === 'In Progress').length}
  Done: ${tasks.filter(t => t.status === 'Done').length}
  Overdue: ${overdueTasks.length}
  Due within 7 days: ${dueSoonTasks.length}
  High priority open: ${tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length}

FINANCIAL TOTALS:
  Payment requests: ${paymentRequests.length} (pending: ${paymentRequests.filter(p => p.status === 'pending' || p.status === 'draft').length})
  Travel requests: ${travelRequests.length}
  Gift card distributions: ${giftCardDistributions.length}
  Total gift card value: $${giftCardDistributions.reduce((s, g) => s + (g.amount || 0), 0).toLocaleString()}

PERSONNEL: ${personnel.length} people on record
MEETINGS: ${meetings.length} total (${upcomingMeetings.length} upcoming)
OPEN TO-DOS: ${openTodos.length}
KNOWLEDGE BASE: ${knowledgeDocs.length} documents

GRANT DETAIL RECORDS:
${grants.map(g => `  ID:${g.id} | ${g.title} | ${g.fundingAgency} | $${(g.amount||0).toLocaleString()} | ${g.status} | ${g.startDate||'?'} to ${g.endDate||'?'} | Worktag:${g.worktag||'N/A'}`).join('\n') || '  none'}

ALL OPEN TASKS (sorted by due date):
${tasks.filter(t => t.status !== 'Done').sort((a,b) => (a.dueDate||'9999') < (b.dueDate||'9999') ? -1 : 1).map(t =>
  `  ${t.dueDate||'no date'} | [${t.priority||'med'}] ${t.title} | ${t.status} | ${t.assignee||'unassigned'}`
).join('\n') || '  none'}

================================================================================
Document generated: ${today} by brAIn v1.0 | Grant GRT000937 | PI: Dr. Marjorie Gondré-Lewis | PD: Héctor Bravo-Rivera
================================================================================`;

  // --- Build numbered reference list for citations ---
  const refs = [];
  grants.forEach(g => refs.push({
    label: 'Grant',
    type: 'grant',
    id: g.id,
    detail: `${g.title} | ${g.fundingAgency || 'N/A'} | $${(g.amount||0).toLocaleString()} | ${g.status} | ${g.startDate||'?'} → ${g.endDate||'?'}`,
  }));
  budgets.forEach(b => {
    const gt = grants.find(g => g.id === b.grantId)?.title || 'Unknown Grant';
    refs.push({ label: 'Budget', type: 'budget', id: b.id, detail: `${gt} | Total $${(b.totalBudget||0).toLocaleString()}` });
    (b.categories || []).forEach(cat => {
      const catSpent = (cat.miniPools||[]).reduce((s,p)=>s+(p.expenses||[]).reduce((es,e)=>es+(Number(e.amount)||0),0),0);
      refs.push({ label: 'Budget Category', type: 'budget_cat', id: cat.id, detail: `${cat.name} (${gt}) | Allocated $${(cat.allocated||0).toLocaleString()} | Spent $${catSpent.toLocaleString()}` });
    });
  });
  tasks.filter(t => t.status !== 'Done').forEach(t => refs.push({
    label: 'Task',
    type: 'task',
    id: t.id,
    detail: `"${t.title}" | ${t.status} | Priority: ${t.priority||'medium'}${t.dueDate ? ' | Due: '+t.dueDate : ''}${t.assignee ? ' | '+t.assignee : ''}`,
  }));
  paymentRequests.forEach(pr => refs.push({
    label: 'Payment Request',
    type: 'pr',
    id: pr.id,
    detail: `${pr.vendor||pr.description||'Payment'} | $${(pr.amount||0).toLocaleString()} | ${pr.status||'Pending'}${pr.date ? ' | '+pr.date : ''}`,
  }));
  travelRequests.forEach(tr => refs.push({
    label: 'Travel Request',
    type: 'tr',
    id: tr.id,
    detail: `${tr.traveler||'Traveler'} → ${tr.destination||'?'} | ${tr.departureDate||'?'} | $${(tr.estimatedCost||0).toLocaleString()} | ${tr.status||'Pending'}`,
  }));
  meetings.slice(0, 20).forEach(m => refs.push({
    label: 'Meeting',
    type: 'meeting',
    id: m.id,
    detail: `"${m.title||'Meeting'}" | ${m.date||'?'}${m.attendees ? ' | '+(Array.isArray(m.attendees)?m.attendees.join(', '):m.attendees) : ''}${m.notes ? ' | Notes: '+m.notes.slice(0,120) : ''}`,
  }));
  personnel.forEach(p => refs.push({
    label: 'Personnel',
    type: 'person',
    id: p.id,
    detail: `${p.name} | ${p.role||'Staff'} | ${p.email||''}${p.grantRole ? ' | '+p.grantRole : ''}`,
  }));
  knowledgeDocs.forEach(d => refs.push({
    label: 'KB Doc',
    type: 'kb',
    id: d.id,
    detail: `"${d.title}" | ${d.category||'doc'}${d.summary ? ' | '+d.summary.slice(0,150) : ''}`,
  }));

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
PI: Dr. Marjorie Gondré-Lewis | Program Director: Héctor Bravo-Rivera

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

PERSONNEL:
${personnelStr}

MEETINGS:
${meetingsStr}

PERSONAL TO-DOS (open):
${todosStr}

---
Now generate the briefing. Use markdown formatting with clear sections. Start with a one-line status summary at the top.

CITATION INSTRUCTIONS:
When you state a specific fact (an amount, date, status, name, or decision), add a citation like [3] immediately after it, where the number refers to the REFERENCE LIST below.
Cite sparingly — only for specific verifiable facts, not general statements.
At the very end of your response, output a line: CITED:[comma-separated list of reference numbers you used, e.g. CITED:1,4,7,12]

REFERENCE LIST:
${refs.map((r, i) => `[${i + 1}] ${r.label}: ${r.detail}`).join('\n')}`;

  const response = await claudeFetch({
    model,
    max_tokens: type === 'executive' ? 1024 : 3500,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();

  // Extract which refs were actually cited
  const citedMatch = raw.match(/\nCITED:([\d,\s]+)$/);
  const citedNums = citedMatch
    ? citedMatch[1].split(',').map(n => parseInt(n.trim())).filter(Boolean)
    : [];
  const text = citedMatch ? raw.slice(0, citedMatch.index).trim() : raw;

  // Only return refs that were actually used
  const usedRefs = citedNums.map(n => refs[n - 1]).filter(Boolean);

  return { text: text + '\n' + rawDataBlock, references: usedRefs, allRefs: refs };
};

/**
 * Build a complete, untruncated plain-text snapshot of ALL app data for NotebookLM.
 * No AI call — pure serialization. Every record, every field.
 */
export const buildFullDataSnapshot = (data) => {
  const {
    grants = [],
    budgets = [],
    tasks = [],
    paymentRequests = [],
    travelRequests = [],
    giftCardDistributions = [],
    knowledgeDocs = [],
    personnel = [],
    meetings = [],
    todos = [],
    documents = [],
    workflows = [],
    templates = [],
    replyQueue = [],
  } = data;

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const hr = (label) => `\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}\n`;
  const sub = (label) => `\n${'─'.repeat(48)}\n${label}\n${'─'.repeat(48)}\n`;

  const fmt = (val) => val == null || val === '' ? '—' : String(val);
  const fmtMoney = (val) => `$${(Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // attendees can be a string or an array depending on how the meeting was saved
  const fmtAttendees = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.length ? val.join(', ') : null;
    return String(val) || null;
  };

  let out = '';

  // ── Header ──────────────────────────────────────────────────────────────
  const nowStr = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });
  const openTasks = tasks.filter(t => t.status !== 'Done').length;
  const overdueCt = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;
  out += `brAIn FULL DATA SNAPSHOT
================================================================================
LAST UPDATED: ${nowStr}
================================================================================
Program: RWJF Grant GRT000937
PI: Dr. Marjorie Gondré-Lewis | Program Director: Héctor Bravo-Rivera

RECORD COUNTS AT TIME OF EXPORT:
  Grants: ${grants.length} | Budgets: ${budgets.length} | Tasks: ${tasks.length} (${openTasks} open, ${overdueCt} overdue)
  Payment Requests: ${paymentRequests.length} | Travel Requests: ${travelRequests.length} | Gift Cards: ${giftCardDistributions.length}
  Personnel: ${personnel.length} | Meetings: ${meetings.length} | To-Dos: ${todos.length}
  Knowledge Docs: ${knowledgeDocs.length} | Documents: ${documents.length} | Workflows: ${workflows.length} | Templates: ${templates.length}
================================================================================

`;

  // ── GRANTS ───────────────────────────────────────────────────────────────
  out += hr(`GRANTS (${grants.length})`);
  if (grants.length === 0) {
    out += 'No grants on record.\n';
  } else {
    grants.forEach((g, i) => {
      out += `[${i + 1}] ${fmt(g.title)}\n`;
      out += `    Agency:      ${fmt(g.fundingAgency)}\n`;
      out += `    Amount:      ${fmtMoney(g.amount)}\n`;
      out += `    Status:      ${fmt(g.status)}\n`;
      out += `    Period:      ${fmt(g.startDate)} → ${fmt(g.endDate)}\n`;
      out += `    Worktag:     ${fmt(g.worktag)}\n`;
      out += `    Cost Center: ${fmt(g.costCenter)}\n`;
      out += `    PI:          ${fmt(g.principalInvestigator)}\n`;
      out += `    Description: ${fmt(g.description)}\n`;
      out += `    Grant #:     ${fmt(g.grantNumber)}\n`;
      out += `    F&A Rate:    ${fmt(g.faRate)}\n`;
      if (g.objectives?.length) out += `    Objectives:\n${g.objectives.map(o => `      • ${o}`).join('\n')}\n`;
      if (g.deliverables?.length) out += `    Deliverables:\n${g.deliverables.map(d => `      • ${fmt(d.title)} | Due: ${fmt(d.dueDate)} | ${fmt(d.status)}`).join('\n')}\n`;
      out += '\n';
    });
  }

  // ── BUDGETS ──────────────────────────────────────────────────────────────
  out += hr(`BUDGETS (${budgets.length})`);
  budgets.forEach((b, i) => {
    const grantTitle = grants.find(g => g.id === b.grantId)?.title || b.grantId || 'Unknown Grant';
    const totalSpent = (b.categories || []).reduce((s, cat) =>
      s + (cat.miniPools || []).reduce((ps, p) =>
        ps + (p.expenses || []).reduce((es, e) => es + (Number(e.amount) || 0), 0), 0), 0);
    out += sub(`Budget ${i + 1}: ${grantTitle}`);
    out += `Total Budget:  ${fmtMoney(b.totalBudget)}\n`;
    out += `Total Spent:   ${fmtMoney(totalSpent)}\n`;
    out += `Remaining:     ${fmtMoney((b.totalBudget || 0) - totalSpent)}\n\n`;
    (b.categories || []).forEach(cat => {
      const catSpent = (cat.miniPools || []).reduce((s, p) =>
        s + (p.expenses || []).reduce((es, e) => es + (Number(e.amount) || 0), 0), 0);
      out += `  CATEGORY: ${fmt(cat.name)}\n`;
      out += `    Allocated: ${fmtMoney(cat.allocated)} | Spent: ${fmtMoney(catSpent)} | Remaining: ${fmtMoney((cat.allocated || 0) - catSpent)}\n`;
      (cat.miniPools || []).forEach(pool => {
        const poolSpent = (pool.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        out += `    POOL: ${fmt(pool.description)} | Allocated: ${fmtMoney(pool.allocated)} | Spent: ${fmtMoney(poolSpent)}\n`;
        if (pool.notes) out += `      Notes: ${pool.notes}\n`;
        (pool.expenses || []).forEach(e => {
          out += `      EXPENSE: ${fmt(e.date)} | ${fmt(e.vendor)} | ${fmt(e.description)} | ${fmtMoney(e.amount)}${e.notes ? ' | ' + e.notes : ''}\n`;
        });
      });
      out += '\n';
    });
  });

  // ── TASKS ────────────────────────────────────────────────────────────────
  out += hr(`TASKS (${tasks.length} total)`);
  const taskGroups = {};
  tasks.forEach(t => {
    const s = t.status || 'Other';
    if (!taskGroups[s]) taskGroups[s] = [];
    taskGroups[s].push(t);
  });
  Object.entries(taskGroups).forEach(([status, arr]) => {
    out += sub(`${status} (${arr.length})`);
    arr.sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1).forEach(t => {
      const overdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done' ? ' [OVERDUE]' : '';
      out += `• ${fmt(t.title)}${overdue}\n`;
      out += `  Priority: ${fmt(t.priority)} | Due: ${fmt(t.dueDate)} | Assignee: ${fmt(t.assignee)}\n`;
      if (t.description) out += `  Description: ${t.description}\n`;
      if (t.tags?.length) out += `  Tags: ${t.tags.join(', ')}\n`;
      if (t.grantId) out += `  Grant: ${grants.find(g => g.id === t.grantId)?.title || t.grantId}\n`;
      out += '\n';
    });
  });

  // ── PAYMENT REQUESTS ─────────────────────────────────────────────────────
  out += hr(`PAYMENT REQUESTS (${paymentRequests.length})`);
  if (paymentRequests.length === 0) {
    out += 'None on record.\n';
  } else {
    paymentRequests.forEach((pr, i) => {
      out += `[${i + 1}] ${fmt(pr.description || pr.vendor)}\n`;
      out += `    Vendor: ${fmt(pr.vendor)} | Amount: ${fmtMoney(pr.amount)} | Status: ${fmt(pr.status)}\n`;
      out += `    Date: ${fmt(pr.date)} | Type: ${fmt(pr.type)} | Worktag: ${fmt(pr.worktag)}\n`;
      if (pr.notes) out += `    Notes: ${pr.notes}\n`;
      if (pr.approver) out += `    Approver: ${fmt(pr.approver)}\n`;
      out += '\n';
    });
  }

  // ── TRAVEL REQUESTS ───────────────────────────────────────────────────────
  out += hr(`TRAVEL REQUESTS (${travelRequests.length})`);
  if (travelRequests.length === 0) {
    out += 'None on record.\n';
  } else {
    travelRequests.forEach((tr, i) => {
      out += `[${i + 1}] ${fmt(tr.purpose || tr.destination)}\n`;
      out += `    Traveler: ${fmt(tr.traveler)} | Destination: ${fmt(tr.destination)}\n`;
      out += `    Depart: ${fmt(tr.departureDate)} | Return: ${fmt(tr.returnDate)}\n`;
      out += `    Est. Cost: ${fmtMoney(tr.estimatedCost)} | Status: ${fmt(tr.status)}\n`;
      if (tr.notes) out += `    Notes: ${tr.notes}\n`;
      out += '\n';
    });
  }

  // ── GIFT CARD DISTRIBUTIONS ───────────────────────────────────────────────
  out += hr(`GIFT CARD DISTRIBUTIONS (${giftCardDistributions.length})`);
  if (giftCardDistributions.length === 0) {
    out += 'None on record.\n';
  } else {
    giftCardDistributions.forEach((g, i) => {
      out += `[${i + 1}] ${fmt(g.recipientName)} | ${fmtMoney(g.amount)} | ${fmt(g.distributionDate)} | ${fmt(g.status)}\n`;
      if (g.purpose) out += `    Purpose: ${g.purpose}\n`;
      if (g.studyName) out += `    Study: ${g.studyName}\n`;
      out += '\n';
    });
  }

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  out += hr(`PERSONNEL (${personnel.length})`);
  if (personnel.length === 0) {
    out += 'No personnel on record.\n';
  } else {
    personnel.forEach((p, i) => {
      out += `[${i + 1}] ${fmt(p.name)}\n`;
      out += `    Role: ${fmt(p.role)} | Title: ${fmt(p.title)}\n`;
      out += `    Email: ${fmt(p.email)} | Phone: ${fmt(p.phone)}\n`;
      if (p.department) out += `    Department: ${fmt(p.department)}\n`;
      if (p.grantRole) out += `    Grant role: ${fmt(p.grantRole)}\n`;
      if (p.notes) out += `    Notes: ${p.notes}\n`;
      out += '\n';
    });
  }

  // ── MEETINGS ─────────────────────────────────────────────────────────────
  out += hr(`MEETINGS (${meetings.length} total)`);
  const upcomingMtgs = meetings.filter(m => m.date && new Date(m.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastMtgs = meetings.filter(m => !m.date || new Date(m.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (upcomingMtgs.length) {
    out += sub(`Upcoming (${upcomingMtgs.length})`);
    upcomingMtgs.forEach(m => {
      out += `• ${fmt(m.date)}${m.time ? ' ' + m.time : ''} — ${fmt(m.title)}\n`;
      if (m.location) out += `  Location: ${fmt(m.location)}\n`;
      const att = fmtAttendees(m.attendees); if (att) out += `  Attendees: ${att}\n`;
      if (m.agenda) out += `  Agenda: ${m.agenda}\n`;
      if (m.notes) out += `  Notes: ${m.notes}\n`;
      if (m.actionItems?.length) out += `  Action Items:\n${m.actionItems.map(a => `    • ${a}`).join('\n')}\n`;
      out += '\n';
    });
  }
  if (pastMtgs.length) {
    out += sub(`Past meetings (${pastMtgs.length})`);
    pastMtgs.forEach(m => {
      out += `• ${fmt(m.date)} — ${fmt(m.title)}\n`;
      const att = fmtAttendees(m.attendees); if (att) out += `  Attendees: ${att}\n`;
      if (m.notes) out += `  Notes: ${m.notes}\n`;
      if (m.actionItems?.length) out += `  Action Items:\n${m.actionItems.map(a => `    • ${a}`).join('\n')}\n`;
      out += '\n';
    });
  }
  if (meetings.length === 0) out += 'No meetings on record.\n';

  // ── PERSONAL TO-DOS ───────────────────────────────────────────────────────
  out += hr(`PERSONAL TO-DOS (${todos.length} total, ${todos.filter(t => !t.completed).length} open)`);
  const openTodos = todos.filter(t => !t.completed);
  const doneTodos = todos.filter(t => t.completed);
  if (openTodos.length) {
    out += 'OPEN:\n';
    openTodos.forEach(t => {
      const overdue = t.dueDate && new Date(t.dueDate) < now ? ' [OVERDUE]' : '';
      out += `• [${fmt(t.priority)}] ${fmt(t.text)}${overdue}${t.dueDate ? ' | Due: ' + t.dueDate : ''}\n`;
    });
  }
  if (doneTodos.length) {
    out += '\nCOMPLETED:\n';
    doneTodos.forEach(t => out += `• ${fmt(t.text)}\n`);
  }
  if (todos.length === 0) out += 'No to-dos on record.\n';

  // ── KNOWLEDGE BASE ────────────────────────────────────────────────────────
  out += hr(`KNOWLEDGE BASE (${knowledgeDocs.length} documents)`);
  if (knowledgeDocs.length === 0) {
    out += 'No documents in knowledge base.\n';
  } else {
    knowledgeDocs.forEach((d, i) => {
      out += sub(`KB Doc ${i + 1}: ${fmt(d.title)}`);
      out += `Category: ${fmt(d.category)} | Added: ${fmt(d.createdAt || d.date)}\n`;
      if (d.tags?.length) out += `Tags: ${d.tags.join(', ')}\n`;
      if (d.summary) out += `Summary: ${d.summary}\n`;
      if (d.content) out += `\nFULL CONTENT:\n${d.content}\n`;
      out += '\n';
    });
  }

  // ── DOCUMENTS ────────────────────────────────────────────────────────────
  out += hr(`DOCUMENTS (${documents.length})`);
  if (documents.length === 0) {
    out += 'No documents on record.\n';
  } else {
    documents.forEach((d, i) => {
      out += `[${i + 1}] ${fmt(d.title || d.name)}\n`;
      out += `    Type: ${fmt(d.type)} | Date: ${fmt(d.date || d.createdAt)}\n`;
      if (d.description) out += `    Description: ${d.description}\n`;
      if (d.content) out += `    Content:\n${d.content}\n`;
      out += '\n';
    });
  }

  // ── WORKFLOWS ────────────────────────────────────────────────────────────
  out += hr(`WORKFLOWS (${workflows.length})`);
  if (workflows.length === 0) {
    out += 'No workflows on record.\n';
  } else {
    workflows.forEach((w, i) => {
      out += sub(`Workflow ${i + 1}: ${fmt(w.title || w.name)}`);
      out += `Status: ${fmt(w.status)} | Category: ${fmt(w.category)}\n`;
      if (w.description) out += `Description: ${w.description}\n`;
      if (w.steps?.length) {
        out += 'Steps:\n';
        w.steps.forEach((s, si) => out += `  ${si + 1}. ${fmt(s.title || s.name || s)} — ${fmt(s.status || s.state || '')}\n`);
      }
      out += '\n';
    });
  }

  // ── TEMPLATES ────────────────────────────────────────────────────────────
  out += hr(`TEMPLATES (${templates.length})`);
  if (templates.length === 0) {
    out += 'No templates on record.\n';
  } else {
    templates.forEach((t, i) => {
      out += sub(`Template ${i + 1}: ${fmt(t.title || t.name)}`);
      out += `Category: ${fmt(t.category)} | Type: ${fmt(t.type)}\n`;
      if (t.description) out += `Description: ${t.description}\n`;
      if (t.content) out += `Content:\n${t.content}\n`;
      out += '\n';
    });
  }

  // ── REPLY QUEUE ───────────────────────────────────────────────────────────
  out += hr(`REPLY QUEUE (${replyQueue.length})`);
  if (replyQueue.length === 0) {
    out += 'No items in reply queue.\n';
  } else {
    replyQueue.forEach((r, i) => {
      out += `[${i + 1}] From: ${fmt(r.from || r.sender)} | Subject: ${fmt(r.subject)}\n`;
      out += `    Date: ${fmt(r.date)} | Priority: ${fmt(r.priority)} | Status: ${fmt(r.status)}\n`;
      if (r.body || r.originalEmail) out += `    Message: ${(r.body || r.originalEmail || '').slice(0, 500)}\n`;
      if (r.draft) out += `    Draft reply: ${r.draft}\n`;
      out += '\n';
    });
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  out += `\n${'='.repeat(72)}\nEND OF SNAPSHOT — Generated ${today} by brAIn v1.0\nGrant GRT000937 | PI: Dr. Marjorie Gondré-Lewis | PD: Héctor Bravo-Rivera\n${'='.repeat(72)}\n`;

  return out;
};

export const SNAPSHOT_TYPES = {
  full: {
    label: 'Full Data Snapshot',
    description: 'Everything — all sections, all records, zero truncation',
    filename: 'brAIn Full Data Snapshot — GRT000937.txt',
    color: 'indigo',
  },
  financial: {
    label: 'Financial',
    description: 'Budgets (all expenses), payment requests, travel, gift cards',
    filename: 'brAIn Financial Snapshot — GRT000937.txt',
    color: 'green',
  },
  tasks: {
    label: 'Tasks & Deadlines',
    description: 'Tasks by status, workflows, personal to-dos',
    filename: 'brAIn Tasks & Deadlines — GRT000937.txt',
    color: 'orange',
  },
  people: {
    label: 'People & Meetings',
    description: 'Full personnel directory + all meetings with notes and action items',
    filename: 'brAIn People & Meetings — GRT000937.txt',
    color: 'blue',
  },
  knowledge: {
    label: 'Knowledge Base',
    description: 'Full KB document content, documents, templates',
    filename: 'brAIn Knowledge Base — GRT000937.txt',
    color: 'purple',
  },
};

/**
 * Build a focused snapshot for a specific domain.
 * Each type is a subset of buildFullDataSnapshot.
 */
export const buildSnapshot = (data, type = 'full') => {
  if (type === 'full') return buildFullDataSnapshot(data);

  const {
    grants = [], budgets = [], tasks = [], paymentRequests = [],
    travelRequests = [], giftCardDistributions = [], knowledgeDocs = [],
    personnel = [], meetings = [], todos = [], documents = [],
    workflows = [], templates = [],
  } = data;

  const now = new Date();
  const nowStr = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });
  const info = SNAPSHOT_TYPES[type];
  const hr = (label) => `\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}\n`;
  const sub = (label) => `\n${'─'.repeat(48)}\n${label}\n${'─'.repeat(48)}\n`;
  const fmt = (val) => val == null || val === '' ? '—' : String(val);
  const fmtMoney = (val) => `$${(Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtAttendees = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.length ? val.join(', ') : null;
    return String(val) || null;
  };

  let out = `brAIn ${info.label.toUpperCase()} SNAPSHOT
================================================================================
LAST UPDATED: ${nowStr}
================================================================================
Program: RWJF Grant GRT000937
PI: Dr. Marjorie Gondré-Lewis | Program Director: Héctor Bravo-Rivera
================================================================================

`;

  if (type === 'financial') {
    // Budgets with all expenses
    out += hr(`BUDGETS (${budgets.length})`);
    budgets.forEach((b, i) => {
      const grantTitle = grants.find(g => g.id === b.grantId)?.title || 'Unknown Grant';
      const totalSpent = (b.categories || []).reduce((s, cat) =>
        s + (cat.miniPools || []).reduce((ps, p) =>
          ps + (p.expenses || []).reduce((es, e) => es + (Number(e.amount) || 0), 0), 0), 0);
      out += sub(`Budget ${i + 1}: ${grantTitle}`);
      out += `Total Budget: ${fmtMoney(b.totalBudget)} | Spent: ${fmtMoney(totalSpent)} | Remaining: ${fmtMoney((b.totalBudget || 0) - totalSpent)}\n\n`;
      (b.categories || []).forEach(cat => {
        const catSpent = (cat.miniPools || []).reduce((s, p) =>
          s + (p.expenses || []).reduce((es, e) => es + (Number(e.amount) || 0), 0), 0);
        out += `  CATEGORY: ${fmt(cat.name)} | Allocated: ${fmtMoney(cat.allocated)} | Spent: ${fmtMoney(catSpent)}\n`;
        (cat.miniPools || []).forEach(pool => {
          const poolSpent = (pool.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
          out += `    POOL: ${fmt(pool.description)} | Allocated: ${fmtMoney(pool.allocated)} | Spent: ${fmtMoney(poolSpent)}\n`;
          (pool.expenses || []).forEach(e => {
            out += `      EXPENSE: ${fmt(e.date)} | ${fmt(e.vendor)} | ${fmt(e.description)} | ${fmtMoney(e.amount)}${e.notes ? ' | ' + e.notes : ''}\n`;
          });
        });
        out += '\n';
      });
    });

    // Payment requests
    out += hr(`PAYMENT REQUESTS (${paymentRequests.length})`);
    if (paymentRequests.length === 0) { out += 'None.\n'; } else {
      paymentRequests.forEach((pr, i) => {
        out += `[${i+1}] ${fmt(pr.vendor)} | ${fmtMoney(pr.amount)} | ${fmt(pr.status)} | ${fmt(pr.date)}\n`;
        out += `    Description: ${fmt(pr.description)} | Type: ${fmt(pr.type)} | Worktag: ${fmt(pr.worktag)}\n`;
        if (pr.notes) out += `    Notes: ${pr.notes}\n`;
        out += '\n';
      });
    }

    // Travel requests
    out += hr(`TRAVEL REQUESTS (${travelRequests.length})`);
    if (travelRequests.length === 0) { out += 'None.\n'; } else {
      travelRequests.forEach((tr, i) => {
        out += `[${i+1}] ${fmt(tr.traveler)} → ${fmt(tr.destination)} | Depart: ${fmt(tr.departureDate)} | Return: ${fmt(tr.returnDate)}\n`;
        out += `    Est. Cost: ${fmtMoney(tr.estimatedCost)} | Status: ${fmt(tr.status)}\n`;
        if (tr.notes) out += `    Notes: ${tr.notes}\n`;
        out += '\n';
      });
    }

    // Gift cards
    out += hr(`GIFT CARD DISTRIBUTIONS (${giftCardDistributions.length})`);
    if (giftCardDistributions.length === 0) { out += 'None.\n'; } else {
      giftCardDistributions.forEach((g, i) => {
        out += `[${i+1}] ${fmt(g.recipientName)} | ${fmtMoney(g.amount)} | ${fmt(g.distributionDate)} | ${fmt(g.status)}\n`;
        if (g.purpose) out += `    Purpose: ${g.purpose}\n`;
        out += '\n';
      });
    }
  }

  if (type === 'tasks') {
    const taskGroups = {};
    tasks.forEach(t => { const s = t.status || 'Other'; if (!taskGroups[s]) taskGroups[s] = []; taskGroups[s].push(t); });
    out += hr(`TASKS (${tasks.length} total)`);
    Object.entries(taskGroups).forEach(([status, arr]) => {
      out += sub(`${status} (${arr.length})`);
      arr.sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1).forEach(t => {
        const overdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done' ? ' [OVERDUE]' : '';
        out += `• ${fmt(t.title)}${overdue}\n`;
        out += `  Priority: ${fmt(t.priority)} | Due: ${fmt(t.dueDate)} | Assignee: ${fmt(t.assignee)}\n`;
        if (t.description) out += `  Description: ${t.description}\n`;
        out += '\n';
      });
    });

    out += hr(`WORKFLOWS (${workflows.length})`);
    if (workflows.length === 0) { out += 'None.\n'; } else {
      workflows.forEach((w, i) => {
        out += sub(`Workflow ${i+1}: ${fmt(w.title || w.name)}`);
        out += `Status: ${fmt(w.status)}\n`;
        if (w.steps?.length) w.steps.forEach((s, si) => out += `  ${si+1}. ${fmt(s.title || s.name || s)}\n`);
        out += '\n';
      });
    }

    const openTodos = todos.filter(t => !t.completed);
    out += hr(`PERSONAL TO-DOS (${openTodos.length} open of ${todos.length})`);
    if (openTodos.length === 0) { out += 'None open.\n'; } else {
      openTodos.forEach(t => {
        const overdue = t.dueDate && new Date(t.dueDate) < now ? ' [OVERDUE]' : '';
        out += `• [${fmt(t.priority)}] ${fmt(t.text)}${overdue}${t.dueDate ? ' | Due: ' + t.dueDate : ''}\n`;
      });
    }
  }

  if (type === 'people') {
    out += hr(`PERSONNEL (${personnel.length})`);
    if (personnel.length === 0) { out += 'None.\n'; } else {
      personnel.forEach((p, i) => {
        out += `[${i+1}] ${fmt(p.name)} | ${fmt(p.role)} | ${fmt(p.title)}\n`;
        out += `    Email: ${fmt(p.email)} | Phone: ${fmt(p.phone)}\n`;
        if (p.department) out += `    Department: ${fmt(p.department)}\n`;
        if (p.grantRole) out += `    Grant role: ${fmt(p.grantRole)}\n`;
        if (p.notes) out += `    Notes: ${p.notes}\n`;
        out += '\n';
      });
    }

    const upcomingMtgs = meetings.filter(m => m.date && new Date(m.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    const pastMtgs = meetings.filter(m => !m.date || new Date(m.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (upcomingMtgs.length) {
      out += hr(`UPCOMING MEETINGS (${upcomingMtgs.length})`);
      upcomingMtgs.forEach(m => {
        out += `• ${fmt(m.date)}${m.time ? ' ' + m.time : ''} — ${fmt(m.title)}\n`;
        if (m.location) out += `  Location: ${fmt(m.location)}\n`;
        const att = fmtAttendees(m.attendees); if (att) out += `  Attendees: ${att}\n`;
        if (m.agenda) out += `  Agenda: ${m.agenda}\n`;
        if (m.notes) out += `  Notes: ${m.notes}\n`;
        if (m.actionItems?.length) out += `  Action Items:\n${m.actionItems.map(a => `    • ${a}`).join('\n')}\n`;
        out += '\n';
      });
    }

    if (pastMtgs.length) {
      out += hr(`PAST MEETINGS (${pastMtgs.length})`);
      pastMtgs.forEach(m => {
        out += `• ${fmt(m.date)} — ${fmt(m.title)}\n`;
        const att = fmtAttendees(m.attendees); if (att) out += `  Attendees: ${att}\n`;
        if (m.notes) out += `  Notes: ${m.notes}\n`;
        if (m.actionItems?.length) out += `  Action Items:\n${m.actionItems.map(a => `    • ${a}`).join('\n')}\n`;
        out += '\n';
      });
    }

    if (meetings.length === 0) out += hr('MEETINGS') + 'None.\n';
  }

  if (type === 'knowledge') {
    out += hr(`KNOWLEDGE BASE (${knowledgeDocs.length} documents)`);
    if (knowledgeDocs.length === 0) { out += 'None.\n'; } else {
      knowledgeDocs.forEach((d, i) => {
        out += sub(`KB Doc ${i+1}: ${fmt(d.title)}`);
        out += `Category: ${fmt(d.category)} | Added: ${fmt(d.createdAt || d.date)}\n`;
        if (d.tags?.length) out += `Tags: ${d.tags.join(', ')}\n`;
        if (d.summary) out += `Summary: ${d.summary}\n`;
        if (d.content) out += `\nFULL CONTENT:\n${d.content}\n`;
        out += '\n';
      });
    }

    out += hr(`DOCUMENTS (${documents.length})`);
    if (documents.length === 0) { out += 'None.\n'; } else {
      documents.forEach((d, i) => {
        out += `[${i+1}] ${fmt(d.title || d.name)} | ${fmt(d.type)} | ${fmt(d.date || d.createdAt)}\n`;
        if (d.content) out += `Content:\n${d.content}\n`;
        out += '\n';
      });
    }

    out += hr(`TEMPLATES (${templates.length})`);
    if (templates.length === 0) { out += 'None.\n'; } else {
      templates.forEach((t, i) => {
        out += sub(`Template ${i+1}: ${fmt(t.title || t.name)}`);
        out += `Category: ${fmt(t.category)}\n`;
        if (t.content) out += `Content:\n${t.content}\n`;
        out += '\n';
      });
    }
  }

  out += `\n${'='.repeat(72)}\nEND OF ${info.label.toUpperCase()} SNAPSHOT — ${nowStr}\n${'='.repeat(72)}\n`;
  return out;
};

/**
 * Parse NotebookLM output and propose structured updates to the app.
 * Returns: { summary, newTasks, taskUpdates, grantUpdates, newKnowledgeDocs, generalInsights,
 *            personnelUpdates, meetingUpdates, budgetCorrections, newTodos }
 */
export const parseNotebookLMOutput = async (notebookText, currentData) => {

  const { grants = [], tasks = [], knowledgeDocs = [], personnel = [], meetings = [] } = currentData;
  const today = new Date().toISOString().split('T')[0];

  const grantsCtx = grants.length === 0 ? '(none)' : grants.map(g =>
    `[${g.id}] "${g.title}" | ${g.status || 'Active'} | $${(g.amount || 0).toLocaleString()} | ${g.fundingAgency || ''}`
  ).join('\n');

  const tasksCtx = tasks.length === 0 ? '(none)' : tasks.map(t =>
    `[${t.id}] "${t.title}" | ${t.status} | ${t.priority || 'medium'}` +
    (t.dueDate ? ` | due ${t.dueDate}` : '') +
    (t.assignee ? ` | ${t.assignee}` : '')
  ).join('\n');

  const kbCtx = knowledgeDocs.length === 0 ? '(none)' : knowledgeDocs.map(d =>
    `"${d.title}" [${d.category || 'doc'}]${d.summary ? ': ' + d.summary.slice(0, 100) : ''}`
  ).join('\n');

  const personnelContext = personnel.map(p => `ID:${p.id} | ${p.name} | ${p.role} | ${p.email}`).join('\n') || 'none';
  const meetingsContext = meetings.slice(0, 20).map(m => `ID:${m.id} | ${m.date} | ${m.title}`).join('\n') || 'none';

  const prompt = `You are an AI assistant for the RWJF Grant GRT000937 Program Manager Hub.
Today: ${today}

The user pasted output from a NotebookLM session. Analyze it against the current app data and produce a structured import proposal.

=== CURRENT APP DATA ===

GRANTS:
${grantsCtx}

KANBAN TASKS:
${tasksCtx}

KNOWLEDGE BASE:
${kbCtx}

PERSONNEL:
${personnelContext}

MEETINGS (recent 20):
${meetingsContext}

=== NOTEBOOKLM OUTPUT ===
${notebookText.slice(0, 8000)}

=== INSTRUCTIONS ===
Identify:
1. NEW tasks mentioned that don't exist in the current task list
2. Updates needed to EXISTING tasks (status, due date, priority)
3. Updates needed to EXISTING grants
4. New knowledge docs worth saving (decisions, policy clarifications, meeting notes)
5. General insights that don't fit other categories
6. Corrections to EXISTING personnel records (role, title, email, phone, notes)
7. Corrections to EXISTING meeting notes or action items
8. Budget inconsistencies that need manual review (can't auto-apply, just flag)
9. Action items that should become personal to-dos

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "summary": "1-2 sentence description of what was found",
  "newTasks": [
    { "title": "...", "description": "...", "priority": "low|medium|high", "dueDate": "YYYY-MM-DD or null", "assignee": "..." }
  ],
  "taskUpdates": [
    { "taskId": "exact-id-from-data", "currentTitle": "...", "changes": { "status": "...", "priority": "...", "dueDate": "..." }, "reason": "..." }
  ],
  "grantUpdates": [
    { "grantId": "exact-id-from-data", "currentTitle": "...", "changes": { "status": "...", "description": "..." }, "reason": "..." }
  ],
  "newKnowledgeDocs": [
    { "title": "...", "category": "policy|sop|decision|meeting|reference|notes", "content": "...", "summary": "...", "tags": ["..."] }
  ],
  "generalInsights": ["insight 1", "insight 2"],
  "personnelUpdates": [
    { "personId": "exact-id-from-data", "currentName": "...", "changes": { "role": "...", "title": "...", "email": "...", "phone": "...", "notes": "..." }, "reason": "..." }
  ],
  "meetingUpdates": [
    { "meetingId": "exact-id-from-data", "currentTitle": "...", "changes": { "notes": "...", "actionItems": ["..."] }, "reason": "..." }
  ],
  "budgetCorrections": [
    { "description": "...", "reason": "...", "suggestedAction": "..." }
  ],
  "newTodos": [
    { "text": "...", "priority": "low|normal|high", "dueDate": "YYYY-MM-DD or null" }
  ]
}

Rules:
- Only use exact IDs from the data above — never invent IDs
- If nothing found for a category, return empty array
- Keep proposals minimal and accurate
- personnelUpdates and meetingUpdates: only include fields that actually need to change
- budgetCorrections are read-only flags — they cannot be auto-applied`;

  const response = await claudeFetch({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Could not parse AI response. Please try again.');
  }
};

/**
 * Scan knowledge doc content against existing grants for factual conflicts.
 * Runs as a background task (uses Sonnet for cost efficiency).
 * @param {string} content - full text content of the knowledge doc
 * @param {string} title - doc title for context
 * @param {Array} grants - array of grant objects
 * @returns {Promise<Array<{fieldLabel, grantId, documentValue, grantValue}>>}
 */
export const analyzeDocumentForConflicts = async (content, title, grants) => {
  if (!content || !grants?.length) return [];

  const grantSummary = grants.map(g => ({
    id: g.id,
    title: g.title,
    worktag: g.worktag,
    amount: g.amount ? `$${Number(g.amount).toLocaleString()}` : null,
    startDate: g.startDate,
    endDate: g.endDate,
    status: g.status,
    fundingAgency: g.fundingAgency,
  }));

  const prompt = `You are checking if a document contradicts grant records in a grant management system.

Document title: "${title}"
Document content (first 3000 chars):
${content.slice(0, 3000)}

Grant records:
${JSON.stringify(grantSummary, null, 2)}

Does this document mention any facts that CONTRADICT the grant records above?
Check ONLY: total award amount, project end date, project start date, PI/PD name, grant status.

Rules:
- Only flag a conflict if the document explicitly states a value that contradicts the stored value
- Minor formatting differences (e.g., "$485K" vs "$485,000") are NOT conflicts
- If the document matches or doesn't mention a field, do NOT include it
- If no conflicts, return []

Return ONLY a JSON array. No commentary. Format:
[{"fieldLabel": "Grant Amount", "grantId": "the-grant-uuid", "documentValue": "value from doc", "grantValue": "value in system"}]`;

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    let raw = response.content[0].text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // Silent fail — background task
  }
};

/**
 * Extract fillable fields from an uploaded form image or PDF.
 * Returns an array of field descriptors with suggested auto-fill keys.
 * @param {File} file - image (jpeg/png/webp/gif) or PDF
 * @returns {Promise<Array<{ label: string, fieldType: string, autoFillKey: string|null }>>}
 */
export const extractFormFields = async (file) => {

  const base64 = await fileToBase64(file);
  const isImage = file.type.startsWith('image/');
  const mediaType = isImage ? file.type : 'application/pdf';
  const contentBlock = isImage
    ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } };

  const prompt = `You are analyzing an administrative form. Your job is to identify every fillable field visible on this form.

For each field, return:
- "label": the exact text label next to the field (e.g. "Principal Investigator", "Grant Number", "Department")
- "fieldType": one of "text", "date", "signature", "checkbox", "number"
- "autoFillKey": one of the following keys if the field clearly matches, otherwise null:
  pi.name, pi.email, pd.name, pd.title, pd.department, pd.institution,
  grant.title, grant.worktag, grant.costCenter, grant.agency, date.today

Return ONLY a JSON array. No commentary, no markdown fences. Example:
[
  { "label": "Principal Investigator", "fieldType": "text", "autoFillKey": "pi.name" },
  { "label": "Grant Number", "fieldType": "text", "autoFillKey": "grant.worktag" },
  { "label": "Conference Title", "fieldType": "text", "autoFillKey": null }
]`;

  try {
    const response = await claudeFetch({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
    });

    let raw = response.content[0].text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('extractFormFields error:', error);
    throw error;
  }
};

/**
 * Chat with Claude (general purpose)
 */
export const chatWithClaude = async (userMessage, conversationHistory = []) => {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages,
    });
    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
};

/**
 * Analyze a pasted email/message/text and extract reply-queue metadata.
 * @param {string} text - Raw pasted content (email, Slack message, memo, etc.)
 * @param {Array}  grants - Array of grant objects for context matching
 * @returns {Promise<{
 *   subject: string,
 *   from: string,
 *   urgency: 'low'|'medium'|'high'|'urgent',
 *   daysUntilDue: number|null,
 *   infoNeeded: string[],
 *   summary: string,
 *   grantWorktag: string|null
 * }>}
 */
export const analyzeReplyItem = async (text, grants = [], options = {}) => {
  const { contextDocs = [], advisorProfile = '', advisorSummary = '' } = options;

  const grantList = grants.length
    ? grants.map(g => `- ${g.worktag || g.id}: ${g.title || 'Untitled'}`).join('\n')
    : '(none on file)';

  const today = new Date().toISOString().slice(0, 10);

  const contextSection = contextDocs.length
    ? `\nCONTEXT WALL (reference documents):\n${contextDocs.map(d => `[${d.title}]\n${d.content.slice(0, 800)}`).join('\n\n---\n\n')}\n`
    : '';

  // Use the summary for fast analysis if available, else fall back to the first 4,000 chars of the full model
  const advisorText = options.advisorSummary?.trim() || advisorProfile.slice(0, 4000);
  const advisorSection = advisorText
    ? `\nADVISOR PROFILE (boss/supervisor behavioral model — use to calibrate urgency and info needed):\n${advisorText}\n`
    : '';

  const prompt = `Today is ${today}. You are helping a grant program director manage their inbox.

Analyze the following message and extract structured reply-queue information.

GRANTS ON FILE:
${grantList}
${contextSection}${advisorSection}
MESSAGE:
---
${text.slice(0, 4000)}
---

Return ONLY a JSON object with these fields (no markdown, no commentary):
{
  "subject": "short imperative subject line, e.g. 'Reply to NIH re: budget revision'",
  "from": "sender name and/or email if identifiable, else empty string",
  "urgency": "low | medium | high | urgent",
  "daysUntilDue": <integer days until reply should be sent, or null if no deadline detected>,
  "infoNeeded": ["item 1", "item 2", ...],
  "summary": "one-sentence plain-English summary of what action is required",
  "grantWorktag": "matching grant worktag from the list above, or null"
}

Urgency guide:
- urgent: explicit today/ASAP deadline or very time-sensitive
- high: deadline within 3 days or clearly important
- medium: deadline within 1–2 weeks or moderately important
- low: no deadline or informational

infoNeeded: list specific pieces of information the user must gather or confirm BEFORE replying. Be concrete (e.g. "Updated Q3 budget numbers", "PI signature on revised scope", "IRB approval status"). Limit to 5 items max.`;

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = response.content[0].text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('analyzeReplyItem error:', error);
    throw error;
  }
};

/**
 * Condense a long advisor/boss profile into a dense operational summary (~2,000 chars)
 * optimized for AI advice calls. Run once after the user uploads a large model.
 * @param {string} fullProfile - The full boss behavioral model text
 * @returns {Promise<string>} - A condensed summary (~300-500 words)
 */
export const generateAdvisorSummary = async (fullProfile) => {

  const prompt = `You are condensing a boss/supervisor behavioral model for use as AI system context.

The goal: distill the most operationally useful information into a dense ~400-word summary that an AI assistant can use to:
- Calibrate urgency of incoming messages
- Advise on how to frame replies
- Warn about communication pitfalls
- Identify what the boss prioritizes

Focus on: communication preferences, hot-button issues, response expectations, decision-making style, what impresses vs. frustrates them, power dynamics, and any recurring patterns.

Be specific and concrete — cut vague generalizations. Preserve exact quotes or examples where they appear in the source.

Format as flowing prose organized into short labeled sections (no more than 5 sections).

FULL PROFILE:
---
${fullProfile}
---

Return ONLY the condensed summary. No intro, no meta-commentary.`;

  const response = await claudeFetch({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
};

/**
 * Generate advisor advice for a specific reply item using the stored boss profile.
 * @param {Object} replyItem  - The reply queue item (subject, summary, from, infoNeeded, etc.)
 * @param {Array}  contextDocs - Context wall documents
 * @param {string} advisorProfile - Boss behavioral model text
 * @returns {Promise<{
 *   expectation: string,
 *   approach: string,
 *   keyPoints: string[],
 *   watchOut: string[],
 *   suggestedTone: string,
 *   prioritySignal: string
 * }>}
 */
export const getAdvisorAdvice = async (replyItem, contextDocs = [], advisorProfile = '') => {

  const contextSection = contextDocs.length
    ? `\nCONTEXT WALL:\n${contextDocs.map(d => `[${d.title}]\n${d.content.slice(0, 600)}`).join('\n\n---\n\n')}\n`
    : '';

  // Use full model for deep advice — no artificial cap (200K context window handles it)
  const advisorSection = advisorProfile.trim()
    ? `\nBOSS / SUPERVISOR BEHAVIORAL MODEL:\n${advisorProfile}\n`
    : '(No advisor profile provided — give general best-practice advice)';

  const prompt = `You are a professional coach helping a grant program director navigate workplace communications.
${advisorSection}${contextSection}
SITUATION:
Subject: ${replyItem.subject || ''}
From: ${replyItem.from || 'unknown'}
Urgency: ${replyItem.urgency || 'unknown'}
Summary: ${replyItem.summary || ''}
Info needed before replying: ${(replyItem.infoNeeded || []).join('; ') || 'none listed'}

Based on the boss/supervisor behavioral model and context provided, give specific, practical advice on how to handle this situation.

Return ONLY a JSON object (no markdown, no commentary):
{
  "expectation": "What your boss most likely expects from you in this situation — be specific based on the model",
  "approach": "How to approach this reply: framing, level of detail, timing",
  "keyPoints": ["Key point to include in the reply", "Another key point"],
  "watchOut": ["Specific pitfall to avoid based on boss's style", "Another thing to watch"],
  "suggestedTone": "e.g. concise and data-driven | proactive and solution-focused | formal and deferential",
  "prioritySignal": "One sentence on whether this should jump up or down in your priority queue, and why"
}

keyPoints and watchOut: 2–4 items each. Be concrete, not generic. Reference the boss model directly if provided.`

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = response.content[0].text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('getAdvisorAdvice error:', error);
    throw error;
  }
};

// ── Studio: Roster update parser ─────────────────────────────────────────────
export const parseRosterUpdate = async (text, students) => {

  const rosterSummary = students
    .filter(s => s.status === 'Active')
    .map(s => `${s.name} | ${s.day} | ${s.time} | ${s.location} | Slot: ${s.slot}`)
    .join('\n');

  const prompt = `You manage a piano studio roster. Parse the teacher's natural-language update into structured changes.

CURRENT ACTIVE STUDENTS:
${rosterSummary}

TEACHER SAID: "${text}"

Return ONLY a valid JSON array of change objects. Each object must have:
- "action": one of "discontinue" | "add" | "update"
- "studentName": name to match against existing students (or new name for "add")
- "fields": object with fields to set (for "add" or "update")

For "add", include at least: name, location, day, slot, time, sessions (30 or 60), status ("Active"), experienceLevel ("Beginner"/"Intermediate"/"Advanced").
For "discontinue", only studentName is needed (sets status to Discontinued).
For "update", studentName + fields object with only the changed keys.

Match student names case-insensitively and by partial match if needed.

Example output:
[
  {"action":"discontinue","studentName":"Stella Munthida","fields":{}},
  {"action":"update","studentName":"Carlos","fields":{"slot":"Thursday 5","day":"Thursday","time":"5:00 PM","location":"Annandale"}},
  {"action":"add","studentName":"Cristal","fields":{"name":"Cristal","location":"Annandale","day":"Thursday","slot":"Thursday 7","time":"6:30 PM","sessions":30,"status":"Active","experienceLevel":"Beginner","dragonMusic":""}}
]

Return ONLY the JSON array, no commentary.`;

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    let raw = response.content[0].text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(raw);
  } catch (error) {
    console.error('parseRosterUpdate error:', error);
    throw error;
  }
};

// ── Studio: Lesson report generator ──────────────────────────────────────────
export const generateLessonReport = async (student, lessonNotes, contextDocs = []) => {

  const contextText = contextDocs.length > 0
    ? '\n\nPEDAGOGICAL REFERENCE:\n' + contextDocs.map(d => `## ${d.title}\n${d.content.slice(0, 600)}`).join('\n\n')
    : '';

  const prompt = `You are an expert piano teacher writing a warm, specific lesson summary for a student and their family.

STUDENT PROFILE:
Name: ${student.name}
Age: ${student.age || 'not specified'}
Level: ${student.experienceLevel || 'Beginner'}
Dragon Music (current piece): ${student.dragonMusic || 'TBD'}
Learning Style / Entry Point: ${student.entryPoint || 'not specified'}
The Trigger (what motivates them): ${student.theTrigger || 'not specified'}
Current Goal: ${student.currentGoal || 'not specified'}
The Prescription (teaching approach): ${student.thePrescription || 'standard approach'}
Current Challenges: ${student.currentChallenges || 'none noted'}
Acquired Skills: ${student.acquiredSkills || 'still building foundation'}
Ear Training: ${student.earTraining || 'not specified'}${contextText}

TODAY'S LESSON NOTES:
${lessonNotes}

Write a 3-paragraph lesson summary report:
1. What we accomplished today — be specific about pieces, techniques, and moments of breakthrough
2. The Practice Prescription — exact, actionable steps for this week (what to practice, how, for how long per day)
3. What's coming next + a warm motivational note addressed to the student by name

Keep it encouraging, specific, and written in your voice as their teacher. Avoid generic phrases.`;

  try {
    const response = await claudeFetch({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].text;
  } catch (error) {
    console.error('generateLessonReport error:', error);
    throw error;
  }
};

/**
 * Generate daily priorities panel using Haiku (cheap, fast).
 * Result is cached in localStorage keyed by today's date string so it only
 * runs once per day even across page reloads.
 *
 * @param {Array} grants  - active grants
 * @param {Array} tasks   - non-done tasks
 * @param {Array} meetings - upcoming meetings
 * @param {Array} todos   - active todos
 * @param {string} todayStr - ISO date string e.g. '2026-03-03'
 * @returns {Promise<{urgent: string[], thisWeek: string[], todaysMeetings: string[]}>}
 */
export const generateDailyPriorities = async (grants, tasks, meetings, todos, todayStr) => {
  const CACHE_KEY = `brain_daily_priorities_${todayStr}`;

  // Return cached result if available for today
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) { /* ignore */ }

  const today = new Date(todayStr);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const urgentTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due <= today && t.status !== 'Done';
  });

  const thisWeekTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due > today && due <= weekEnd && t.status !== 'Done';
  });

  const todayMeetings = meetings.filter(m => {
    if (!m.date) return false;
    return m.date.slice(0, 10) === todayStr;
  });

  const prompt = `You are a program manager assistant. Based on the data below, produce a concise daily priorities summary.

Today: ${todayStr}
Active Grants: ${grants.map(g => g.title).join(', ') || 'none'}

OVERDUE / DUE TODAY tasks (${urgentTasks.length}):
${urgentTasks.slice(0, 10).map(t => `- [${t.grantId ? 'Grant' : 'General'}] ${t.title}${t.dueDate ? ` (due ${t.dueDate.slice(0, 10)})` : ''}`).join('\n') || 'none'}

DUE THIS WEEK tasks (${thisWeekTasks.length}):
${thisWeekTasks.slice(0, 8).map(t => `- ${t.title} (due ${t.dueDate.slice(0, 10)})`).join('\n') || 'none'}

TODAY'S MEETINGS (${todayMeetings.length}):
${todayMeetings.map(m => `- ${m.title}${m.date ? ` at ${new Date(m.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}`).join('\n') || 'none'}

OPEN TO-DOs (${todos.length}):
${todos.slice(0, 5).map(t => `- ${t.text}`).join('\n') || 'none'}

Reply with ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "urgent": ["concise action phrase 1", "concise action phrase 2"],
  "thisWeek": ["concise action phrase 1", "concise action phrase 2"],
  "todaysMeetings": ["meeting label 1", "meeting label 2"]
}

Keep each item under 60 characters. Max 5 items per array. If an array would be empty, use [].`;

  try {
    const response = await claudeFetch({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].text.trim();
    // Strip markdown fences if present
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const result = JSON.parse(json);

    // Cache for the day
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch (_) { /* ignore */ }

    // Clean up yesterday's cache key
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('brain_daily_priorities_') && k !== CACHE_KEY);
      keys.forEach(k => localStorage.removeItem(k));
    } catch (_) { /* ignore */ }

    return result;
  } catch (error) {
    console.error('generateDailyPriorities error:', error);
    return { urgent: [], thisWeek: [], todaysMeetings: [] };
  }
};
