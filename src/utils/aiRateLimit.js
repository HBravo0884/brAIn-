import { storage } from './storage';

// Per-function rate limiting (prevents double-clicks / rapid re-calls)
const lastCallMap = new Map(); // fnKey → timestamp

export const withRateLimit = (fn, key, minMs = 2000) => {
  return async (...args) => {
    const now = Date.now();
    const last = lastCallMap.get(key) || 0;
    if (now - last < minMs) {
      throw new Error(`Rate limited: please wait ${((minMs - (now - last)) / 1000).toFixed(1)}s before calling ${key} again.`);
    }
    lastCallMap.set(key, now);
    return fn(...args);
  };
};

// Model pricing (per 1M tokens, in dollars) — approximate as of 2025
const PRICING = {
  'claude-opus-4-6':    { input: 15.0,  output: 75.0  },
  'claude-sonnet-4-6':  { input: 3.0,   output: 15.0  },
  'claude-haiku-4-5':   { input: 0.8,   output: 4.0   },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
};

export const trackCost = (model, inputTokens, outputTokens) => {
  const pricing = PRICING[model] || PRICING['claude-sonnet-4-6'];
  const cost = (inputTokens / 1_000_000) * pricing.input
             + (outputTokens / 1_000_000) * pricing.output;

  const log = storage.getAiCostLog();
  const entry = {
    ts: Date.now(),
    model,
    inputTokens,
    outputTokens,
    cost,
  };
  // Keep last 500 entries
  const trimmed = [...log, entry].slice(-500);
  storage.setAiCostLog(trimmed);
};

export const getCostSummary = () => {
  const log = storage.getAiCostLog();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const sum = (entries) => entries.reduce((acc, e) => acc + (e.cost || 0), 0);

  return {
    today: sum(log.filter(e => e.ts >= todayStart.getTime())),
    thisMonth: sum(log.filter(e => e.ts >= monthStart.getTime())),
    allTime: sum(log),
    entries: log.length,
  };
};
