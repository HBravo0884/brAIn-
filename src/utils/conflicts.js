/**
 * Cross-section conflict detection utilities.
 * Pure JS — no React imports.
 */

/**
 * Generates a deduplication key for a conflict.
 * Two conflicts are considered duplicates if they share the same
 * (sectionA.id, sectionA.type, sectionB.id, fieldLabel) combination.
 */
const conflictKey = (c) =>
  `${c.sectionA?.type}|${c.sectionA?.id}|${c.sectionB?.type}|${c.sectionB?.id}|${c.fieldLabel}`;

/**
 * Detect a grant amount vs. linked budget totalAmount mismatch.
 * Returns a conflict object or null.
 */
export function detectBudgetGrantMismatch(grant, budget) {
  if (!grant?.amount || !budget?.totalAmount) return null;
  const grantAmt  = parseFloat(grant.amount);
  const budgetAmt = parseFloat(budget.totalAmount);
  if (isNaN(grantAmt) || isNaN(budgetAmt)) return null;
  if (Math.abs(grantAmt - budgetAmt) < 1) return null; // within $1 — no conflict

  return {
    id: crypto.randomUUID(),
    type: 'amount_mismatch',
    fieldLabel: 'Grant Amount',
    sectionA: {
      type: 'grant',
      id: grant.id,
      label: grant.title || grant.worktag || 'Grant',
      displayValue: `$${grantAmt.toLocaleString()}`,
      rawValue: grantAmt,
      rawField: 'amount',
    },
    sectionB: {
      type: 'budget',
      id: budget.id,
      label: `Budget: ${grant.title || grant.worktag || 'Unknown'}`,
      displayValue: `$${budgetAmt.toLocaleString()}`,
      rawValue: budgetAmt,
      rawField: 'totalAmount',
    },
    source: 'auto_detect',
    resolved: false,
    resolvedWith: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
}

/**
 * Build conflict objects from AI-extracted document conflicts.
 * @param {Array<{fieldLabel, grantId, documentValue, grantValue, fieldType}>} extracted
 * @param {Object} doc - the knowledge doc object
 * @param {Array} grants - all grants
 */
export function buildDocumentConflicts(extracted, doc, grants) {
  return extracted.map(item => {
    const grant = grants.find(g => g.id === item.grantId);
    if (!grant) return null;

    const type = item.fieldLabel?.toLowerCase().includes('amount') ? 'amount_mismatch'
      : item.fieldLabel?.toLowerCase().includes('date')            ? 'date_mismatch'
      : item.fieldLabel?.toLowerCase().includes('name')            ? 'name_mismatch'
      : item.fieldLabel?.toLowerCase().includes('status')          ? 'status_mismatch'
      : 'custom';

    const rawField = item.fieldLabel?.toLowerCase().includes('end')    ? 'endDate'
      : item.fieldLabel?.toLowerCase().includes('start')              ? 'startDate'
      : item.fieldLabel?.toLowerCase().includes('amount')             ? 'amount'
      : item.fieldLabel?.toLowerCase().includes('status')             ? 'status'
      : null;

    // Try to parse raw value for amounts
    const rawValue = type === 'amount_mismatch'
      ? parseFloat(item.documentValue?.replace(/[$,]/g, '')) || null
      : item.documentValue;

    return {
      id: crypto.randomUUID(),
      type,
      fieldLabel: item.fieldLabel,
      sectionA: {
        type: 'grant',
        id: grant.id,
        label: grant.title || grant.worktag || 'Grant',
        displayValue: item.grantValue,
        rawValue: type === 'amount_mismatch' ? parseFloat(String(grant.amount)?.replace(/[$,]/g, '')) : grant[rawField],
        rawField,
      },
      sectionB: {
        type: 'knowledge_doc',
        id: doc.id,
        label: doc.title || 'Document',
        displayValue: item.documentValue,
        rawValue,
        rawField,
      },
      source: 'ai_extraction',
      resolved: false,
      resolvedWith: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
  }).filter(Boolean);
}

/**
 * Deduplicate: only add conflicts that don't already have an UNRESOLVED
 * entry with the same (sectionA.type, sectionA.id, sectionB.id, fieldLabel).
 */
export function dedupeConflicts(existing, newConflicts) {
  const unresolvedKeys = new Set(
    existing.filter(c => !c.resolved).map(conflictKey)
  );
  const fresh = newConflicts.filter(c => !unresolvedKeys.has(conflictKey(c)));
  return [...existing, ...fresh];
}
