import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { extractExpensesFromDocument, budgetStructureToText } from '../../utils/ai';
import Button from '../common/Button';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader, RefreshCw,
  Sparkles, ChevronDown, ChevronRight, Users, User
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPT = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'text/plain', 'text/csv',
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.txt', '.csv'
].join(',');

const docTypeLabel = (t) => ({
  'sub-account-budget': 'Sub-Account Budget',
  'award-letter':       'Award Letter',
  'invoice':            'Invoice',
  'receipt':            'Receipt',
  'budget-report':      'Budget Report',
  'contract':           'Contract',
  'reimbursement':      'Reimbursement',
})[t] || 'Document';

// ─── Fuzzy name → ID matching ─────────────────────────────────────────────────
const fuzzyFindCategory = (categories = [], name = '') => {
  if (!name) return null;
  const n = name.toLowerCase();
  return (
    categories.find(c => c.name.toLowerCase() === n) ||
    categories.find(c => c.name.toLowerCase().includes(n.slice(0, 14))) ||
    categories.find(c => n.includes(c.name.toLowerCase().slice(0, 14))) ||
    null
  );
};
const fuzzyFindMiniPool = (pools = [], name = '') => {
  if (!name) return null;
  const n = name.toLowerCase();
  return (
    pools.find(p => p.description.toLowerCase() === n) ||
    pools.find(p => p.description.toLowerCase().includes(n.slice(0, 14))) ||
    pools.find(p => n.includes(p.description.toLowerCase().slice(0, 14))) ||
    null
  );
};

// ─── Destination Selector (shared by both modes) ──────────────────────────────
const DestinationSelector = ({
  budgets, grants,
  destBudgetId, setDestBudgetId,
  destCategoryId, setDestCategoryId,
  destMiniPoolId, setDestMiniPoolId,
  newMiniPoolName, setNewMiniPoolName,
  isGrouped,                              // grouped mode hides mini-pool picker
  aiSuggestedCategory, aiSuggestedMiniPool,
}) => {
  const destBudget   = budgets.find(b => b.id === destBudgetId);
  const destCategory = destBudget?.categories.find(c => c.id === destCategoryId);
  const miniPools    = destCategory?.miniPools || [];

  useEffect(() => {
    if (budgets.length === 1 && !destBudgetId) setDestBudgetId(budgets[0].id);
  }, [budgets.length]);

  useEffect(() => {
    if (destBudget?.categories.length === 1 && !destCategoryId)
      setDestCategoryId(destBudget.categories[0].id);
  }, [destBudgetId]);

  const applyAiSuggestion = () => {
    const budget = budgets.find(b => b.id === destBudgetId);
    if (!budget) return;
    const cat = fuzzyFindCategory(budget.categories, aiSuggestedCategory);
    if (cat) {
      setDestCategoryId(cat.id);
      if (!isGrouped) {
        const pool = fuzzyFindMiniPool(cat.miniPools, aiSuggestedMiniPool);
        setDestMiniPoolId(pool ? pool.id : aiSuggestedMiniPool ? 'new' : '');
        if (!pool && aiSuggestedMiniPool) setNewMiniPoolName(aiSuggestedMiniPool);
      }
    }
  };

  const sel = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-400 bg-white';

  return (
    <div className="space-y-2.5">
      {/* Budget */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Budget</label>
        <select value={destBudgetId}
          onChange={e => { setDestBudgetId(e.target.value); setDestCategoryId(''); setDestMiniPoolId(''); }}
          className={sel}>
          <option value="">— Select budget —</option>
          {budgets.map(b => {
            const g = grants.find(gr => gr.id === b.grantId);
            return <option key={b.id} value={b.id}>{g?.title || 'Budget'}</option>;
          })}
        </select>
      </div>

      {/* AI suggestion shortcut */}
      {destBudgetId && aiSuggestedCategory && (
        <button type="button" onClick={applyAiSuggestion}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium">
          <Sparkles size={12} />
          Apply AI suggestion: {[aiSuggestedCategory, !isGrouped && aiSuggestedMiniPool].filter(Boolean).join(' → ')}
        </button>
      )}

      {/* Category / Aim */}
      {destBudgetId && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category / Aim</label>
          <select value={destCategoryId}
            onChange={e => { setDestCategoryId(e.target.value); setDestMiniPoolId(''); }}
            className={sel}>
            <option value="">— Select category —</option>
            {(destBudget?.categories || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mini-pool (flat mode only) */}
      {!isGrouped && destCategoryId && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Sub-budget <span className="text-gray-400 font-normal">(e.g. Aim 5a)</span>
          </label>
          <select value={destMiniPoolId}
            onChange={e => { setDestMiniPoolId(e.target.value); setNewMiniPoolName(''); }}
            className={sel}>
            <option value="">— Select or create —</option>
            {miniPools.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
            <option value="new">＋ Create new sub-budget…</option>
          </select>
        </div>
      )}

      {!isGrouped && destMiniPoolId === 'new' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">New sub-budget name</label>
          <input type="text" value={newMiniPoolName}
            onChange={e => setNewMiniPoolName(e.target.value)}
            placeholder="e.g. Aim 5a — Dr. Azinge Award"
            className={sel} autoFocus />
        </div>
      )}

      {/* Grouped mode: show info banner instead of mini-pool picker */}
      {isGrouped && destCategoryId && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2 text-xs text-blue-700">
          <Users size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Each selected sub-grant will be created as its own <strong>sub-budget</strong> under{' '}
            <strong>{destCategory?.name}</strong>.
            Their expenses will be nested inside automatically.
          </span>
        </div>
      )}

      {/* Path preview */}
      {destBudgetId && destCategoryId && (isGrouped || destMiniPoolId) && (
        <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span className="font-medium text-gray-600">Destination: </span>
          {grants.find(g => g.id === destBudget?.grantId)?.title}
          {' → '}{destCategory?.name}
          {!isGrouped && ' → '}
          {!isGrouped && (
            <span className="font-semibold text-primary-600">
              {destMiniPoolId === 'new'
                ? (newMiniPoolName || '(new sub-budget)')
                : destCategory?.miniPools?.find(p => p.id === destMiniPoolId)?.description}
            </span>
          )}
          {isGrouped && <span className="font-semibold text-primary-600"> → [one sub-budget per group]</span>}
        </div>
      )}
    </div>
  );
};

// ─── Grouped Card (one per PI / sub-grantee) ──────────────────────────────────
const GroupCard = ({ group, groupIndex, onToggleGroup, onToggleItem, onChangeItem }) => {
  const [expanded, setExpanded] = useState(true);
  const checkedItems  = group.items.filter(i => i.checked);
  const allChecked    = group.items.length > 0 && group.items.every(i => i.checked);
  const someChecked   = group.items.some(i => i.checked);
  const selectedTotal = checkedItems.reduce((s, i) => s + i.amount, 0);

  const borderColor = group.checked
    ? 'border-primary-200 shadow-sm'
    : 'border-gray-100';

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${borderColor}`}>
      {/* Group header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors
          ${group.checked ? 'bg-primary-50' : 'bg-gray-50 opacity-70'}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Checkbox with indeterminate state */}
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
          onChange={() => onToggleGroup(groupIndex)}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 accent-primary-600 cursor-pointer flex-shrink-0"
        />

        {/* PI info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm leading-tight">{group.name}</p>
          {group.subtitle && (
            <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{group.subtitle}</p>
          )}
        </div>

        {/* Totals */}
        <div className="text-right flex-shrink-0 mr-1">
          <p className="font-bold text-gray-900 text-sm">${selectedTotal.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">
            {checkedItems.length}/{group.items.length} items
          </p>
        </div>

        {/* Expand chevron */}
        {expanded
          ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </div>

      {/* Expense rows */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {group.items.map((item, j) => (
            <div
              key={j}
              className={`flex items-center gap-3 pl-11 pr-4 py-2 transition-colors ${
                item.checked ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => onToggleItem(groupIndex, j)}
                className="h-3.5 w-3.5 accent-primary-600 cursor-pointer flex-shrink-0"
              />
              {/* Name editable */}
              <input
                type="text"
                value={item.name}
                onChange={e => onChangeItem(groupIndex, j, 'name', e.target.value)}
                disabled={!item.checked}
                className={`flex-1 text-sm bg-transparent border-0 outline-none rounded px-1 py-0.5
                  focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 min-w-0 transition-all
                  ${item.checked ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
              />
              {/* Amount editable */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-gray-400 text-xs">$</span>
                <input
                  type="number"
                  value={item.amount}
                  min="0"
                  onChange={e => onChangeItem(groupIndex, j, 'amount', parseFloat(e.target.value) || 0)}
                  disabled={!item.checked}
                  className={`w-20 text-sm font-semibold text-right border rounded px-1.5 py-0.5 outline-none transition-all
                    focus:border-primary-300 focus:ring-1 focus:ring-primary-100
                    ${item.checked ? 'text-gray-900 border-gray-200 bg-white' : 'text-gray-400 border-transparent bg-transparent cursor-not-allowed'}`}
                />
              </div>
              {/* Spent toggle */}
              <button
                type="button"
                disabled={!item.checked}
                onClick={() => onChangeItem(groupIndex, j, 'spent', !item.spent)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 transition-colors
                  ${!item.checked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  ${item.spent
                    ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
              >
                {item.spent ? 'SPENT' : 'PENDING'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Flat Item Row (single-recipient docs) ────────────────────────────────────
const FlatItemRow = ({ item, index, onToggle, onChange }) => (
  <div className={`transition-colors ${item.checked ? 'bg-white' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input type="checkbox" checked={item.checked} onChange={() => onToggle(index)}
        className="h-4 w-4 accent-primary-600 cursor-pointer flex-shrink-0 mt-px" />
      <input type="text" value={item.name} onChange={e => onChange(index, 'name', e.target.value)}
        disabled={!item.checked}
        className={`flex-1 text-sm min-w-0 bg-transparent border-0 outline-none rounded px-1 py-0.5
          focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 transition-all
          ${item.checked ? 'text-gray-800' : 'text-gray-400 cursor-not-allowed'}`} />
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <span className="text-gray-400 text-sm">$</span>
        <input type="number" value={item.amount} min="0"
          onChange={e => onChange(index, 'amount', parseFloat(e.target.value) || 0)}
          disabled={!item.checked}
          className={`w-24 text-sm font-semibold text-right border rounded px-2 py-0.5 outline-none transition-all
            focus:border-primary-400 focus:ring-1 focus:ring-primary-100
            ${item.checked ? 'text-gray-900 border-gray-200 bg-white' : 'text-gray-400 border-transparent bg-transparent cursor-not-allowed'}`} />
      </div>
      <button type="button" disabled={!item.checked}
        onClick={() => onChange(index, 'spent', !item.spent)}
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 transition-colors
          ${!item.checked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
          ${item.spent ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        {item.spent ? 'SPENT' : 'PENDING'}
      </button>
    </div>
    {/* AI suggestion badge */}
    {item.checked && (item.aiSuggestedCategory || item.aiSuggestedMiniPool) && (
      <div className="flex items-center gap-1.5 px-10 pb-2">
        <Sparkles size={9} className="text-purple-400 flex-shrink-0" />
        <span className="text-[10px] text-purple-600">
          {[item.aiSuggestedCategory, item.aiSuggestedMiniPool].filter(Boolean).join(' → ')}
        </span>
        {item.aiReason && (
          <span className="text-[10px] text-gray-400 truncate" title={item.aiReason}>
            — {item.aiReason}
          </span>
        )}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AwardLetterImport = ({ onClose }) => {
  const { grants, budgets, addGrant, addBudget, updateBudget } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus]         = useState('idle');
  const [error, setError]           = useState('');
  const [docType, setDocType]       = useState('');
  const fileInputRef                = useRef(null);

  // Data state — one of these is populated after extraction
  const [meta, setMeta]     = useState(null);
  const [isGrouped, setIsGrouped] = useState(false);
  const [groups, setGroups] = useState([]);   // grouped mode
  const [items, setItems]   = useState([]);   // flat mode
  const [aiSuggestedCategory, setAiSuggestedCategory]   = useState('');
  const [aiSuggestedMiniPool, setAiSuggestedMiniPool]   = useState('');
  const [groupingSuggestionReason, setGroupingSuggestionReason] = useState('');

  // Destination
  const [importMode, setImportMode]           = useState(budgets.length > 0 ? 'existing' : 'new');
  const [destBudgetId, setDestBudgetId]       = useState('');
  const [destCategoryId, setDestCategoryId]   = useState('');
  const [destMiniPoolId, setDestMiniPoolId]   = useState('');
  const [newMiniPoolName, setNewMiniPoolName] = useState('');

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedGroups = groups.filter(g => g.items.some(i => i.checked));
  const selectedItems  = items.filter(i => i.checked);
  const totalSelected  = isGrouped
    ? selectedGroups.reduce((s, g) => s + g.items.filter(i => i.checked).reduce((ss, i) => ss + i.amount, 0), 0)
    : selectedItems.reduce((s, i) => s + i.amount, 0);
  const selectionCount = isGrouped ? selectedGroups.length : selectedItems.length;
  const destBudget     = budgets.find(b => b.id === destBudgetId);
  const destCategory   = destBudget?.categories.find(c => c.id === destCategoryId);

  const canApply = () => {
    if (isGrouped ? selectedGroups.length === 0 : selectedItems.length === 0) return false;
    if (importMode === 'existing') {
      if (!destBudgetId || !destCategoryId) return false;
      if (!isGrouped) {
        if (!destMiniPoolId) return false;
        if (destMiniPoolId === 'new' && !newMiniPoolName.trim()) return false;
      }
    }
    return true;
  };

  // ── File Processing ───────────────────────────────────────────────────────
  const processFile = async (file) => {
    if (!file) return;
    setStatus('loading');
    setError('');
    try {
      const budgetCtx = budgetStructureToText(budgets, grants);
      const data = await extractExpensesFromDocument(file, budgetCtx);

      setDocType(data.documentType || '');
      const grouped = !!(data.isGrouped && data.groups && data.groups.length > 0);
      setIsGrouped(grouped);
      setAiSuggestedCategory(data.suggestedCategory || '');
      setAiSuggestedMiniPool('');
      setGroupingSuggestionReason(data.groupingSuggestionReason || '');

      if (grouped) {
        setMeta({
          grantTitle:  data.parentGrantTitle || '',
          totalAmount: data.totalAmount || 0,
          awardDate:   data.awardDate || null,
        });
        const initGroups = (data.groups || []).map(g => ({
          name:     g.name || '',
          subtitle: g.subtitle || '',
          totalAmount: g.totalAmount || 0,
          checked:  true,
          items:    (g.items || []).map(it => ({
            name:    it.name   || '',
            amount:  it.amount || 0,
            checked: true,
            spent:   false,
          })),
        }));
        setGroups(initGroups);
        setItems([]);

        // Auto-apply AI category suggestion to destination
        if (budgets.length === 1 && data.suggestedCategory) {
          const b = budgets[0];
          setDestBudgetId(b.id);
          const cat = fuzzyFindCategory(b.categories, data.suggestedCategory);
          if (cat) setDestCategoryId(cat.id);
        }
      } else {
        setMeta({
          grantTitle:    data.grantTitle    || '',
          recipient:     data.recipient     || '',
          fundingAgency: data.fundingAgency || '',
          totalAmount:   data.totalAmount   || 0,
          awardDate:     data.awardDate     || null,
        });
        const initItems = (data.items || []).map(it => ({
          name:                it.name   || '',
          amount:              it.amount || 0,
          checked:             (it.amount || 0) > 0,
          spent:               false,
          aiSuggestedCategory: it.suggestedCategory || '',
          aiSuggestedMiniPool: it.suggestedMiniPool || '',
          aiReason:            it.reason || '',
        }));
        setItems(initItems);
        setGroups([]);

        // Auto-suggest top category + mini-pool
        const topItem = initItems[0];
        if (topItem?.aiSuggestedCategory) setAiSuggestedCategory(topItem.aiSuggestedCategory);
        if (topItem?.aiSuggestedMiniPool) setAiSuggestedMiniPool(topItem.aiSuggestedMiniPool);

        if (budgets.length === 1 && topItem?.aiSuggestedCategory) {
          const b = budgets[0];
          setDestBudgetId(b.id);
          const cat = fuzzyFindCategory(b.categories, topItem.aiSuggestedCategory);
          if (cat) {
            setDestCategoryId(cat.id);
            const pool = fuzzyFindMiniPool(cat.miniPools, topItem.aiSuggestedMiniPool);
            setDestMiniPoolId(pool ? pool.id : topItem.aiSuggestedMiniPool ? 'new' : '');
            if (!pool && topItem.aiSuggestedMiniPool) setNewMiniPoolName(topItem.aiSuggestedMiniPool);
          }
        }
      }

      setStatus('success');
    } catch (err) {
      setError(
        err.message?.includes('API client')
          ? 'Claude API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file.'
          : err.message || 'Failed to extract data. Make sure the document is readable.'
      );
      setStatus('error');
    }
  };

  // ── Group editing ─────────────────────────────────────────────────────────
  const toggleGroup = (gi) => {
    setGroups(prev => prev.map((g, idx) => {
      if (idx !== gi) return g;
      const newChecked = !g.items.every(i => i.checked);
      return { ...g, items: g.items.map(it => ({ ...it, checked: newChecked })) };
    }));
  };
  const toggleGroupItem = (gi, ii) => {
    setGroups(prev => prev.map((g, gIdx) => gIdx !== gi ? g : {
      ...g,
      items: g.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, checked: !it.checked }),
    }));
  };
  const changeGroupItem = (gi, ii, field, val) => {
    setGroups(prev => prev.map((g, gIdx) => gIdx !== gi ? g : {
      ...g,
      items: g.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, [field]: val }),
    }));
  };
  const selectAllGroups = () => setGroups(p => p.map(g => ({ ...g, items: g.items.map(i => ({ ...i, checked: true })) })));
  const selectNoneGroups = () => setGroups(p => p.map(g => ({ ...g, items: g.items.map(i => ({ ...i, checked: false })) })));

  // ── Flat item editing ─────────────────────────────────────────────────────
  const toggleItem  = (i)         => setItems(p => p.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it));
  const changeItem  = (i, f, v)   => setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const selectAll   = ()          => setItems(p => p.map(it => ({ ...it, checked: true })));
  const selectNone  = ()          => setItems(p => p.map(it => ({ ...it, checked: false })));

  // ── Apply ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    if (importMode === 'new') {
      // Create new grant + budget
      const newGrantId = crypto.randomUUID();
      const allItems = isGrouped
        ? selectedGroups.flatMap(g => g.items.filter(i => i.checked).map(i => ({ ...i, _groupName: g.name })))
        : selectedItems;

      addGrant({
        id:            newGrantId,
        title:         meta?.grantTitle || 'Imported Grant',
        fundingAgency: meta?.fundingAgency || '',
        amount:        meta?.totalAmount || totalSelected,
        status:        'active',
        startDate:     meta?.awardDate || new Date().toISOString(),
        endDate:       new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        aims:          [],
      });
      addBudget({
        grantId:      newGrantId,
        totalBudget:  meta?.totalAmount || totalSelected,
        fiscalYear:   new Date().getFullYear(),
        categories:   isGrouped
          ? selectedGroups.map(g => ({
              id:        crypto.randomUUID(),
              name:      g.name,
              allocated: g.items.filter(i => i.checked).reduce((s, i) => s + i.amount, 0),
              miniPools: [],
              description: g.subtitle || '',
            }))
          : selectedItems.map(it => ({
              id:        crypto.randomUUID(),
              name:      it.name,
              allocated: it.amount,
              miniPools: [],
            })),
        importSource: 'document',
      });

    } else {
      // Add to existing budget
      const budget = budgets.find(b => b.id === destBudgetId);
      if (!budget) return;

      const importNote = `Imported from ${docTypeLabel(docType).toLowerCase()}${meta?.grantTitle ? ` — ${meta.grantTitle}` : ''}`;

      let updatedCategories;

      if (isGrouped) {
        // Each selected group → new mini-pool under destCategoryId
        const newPools = selectedGroups.map(g => ({
          id:          crypto.randomUUID(),
          description: g.name,
          allocated:   g.items.filter(i => i.checked).reduce((s, i) => s + i.amount, 0),
          notes:       `${g.subtitle || ''}${g.subtitle ? ' · ' : ''}${importNote}`,
          expenses:    g.items.filter(i => i.checked).map(it => ({
            id:            crypto.randomUUID(),
            description:   it.name,
            amount:        it.amount,
            spent:         it.spent,
            vendor:        '',
            date:          new Date().toISOString().split('T')[0],
            notes:         importNote,
            receiptDocIds: [],
            createdAt:     new Date().toISOString(),
          })),
        }));

        updatedCategories = budget.categories.map(cat =>
          cat.id !== destCategoryId ? cat : {
            ...cat,
            miniPools: [...(cat.miniPools || []), ...newPools],
          }
        );
      } else {
        // Flat: all items go into one mini-pool
        const expenses = selectedItems.map(it => ({
          id:            crypto.randomUUID(),
          description:   it.name,
          amount:        it.amount,
          spent:         it.spent,
          vendor:        '',
          date:          new Date().toISOString().split('T')[0],
          notes:         importNote,
          receiptDocIds: [],
          createdAt:     new Date().toISOString(),
        }));

        updatedCategories = budget.categories.map(cat => {
          if (cat.id !== destCategoryId) return cat;
          let updatedPools;
          if (destMiniPoolId === 'new') {
            updatedPools = [...(cat.miniPools || []), {
              id:          crypto.randomUUID(),
              description: newMiniPoolName.trim(),
              allocated:   totalSelected,
              notes:       importNote,
              expenses,
            }];
          } else {
            updatedPools = (cat.miniPools || []).map(p =>
              p.id === destMiniPoolId
                ? { ...p, expenses: [...(p.expenses || []), ...expenses] }
                : p
            );
          }
          return { ...cat, miniPools: updatedPools };
        });
      }

      updateBudget(destBudgetId, { categories: updatedCategories });
    }

    onClose();
    const label = isGrouped
      ? `${selectedGroups.length} sub-grant(s) imported as sub-budgets!`
      : `${selectedItems.length} item(s) imported successfully!`;
    setTimeout(() => alert(label), 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ══ IDLE ══════════════════════════════════════════════════════════════ */}
      {status === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all select-none ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <Upload size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-semibold">Drop any document here</p>
          <p className="text-gray-500 text-sm mt-1">
            Award letters · Sub-account budgets · Invoices · Receipts · PDFs · Images
          </p>
          <p className="text-gray-400 text-xs mt-3">
            AI detects line items, groups by PI/recipient, and recommends where they belong
          </p>
          <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden"
            onChange={e => processFile(e.target.files[0])} />
        </div>
      )}

      {/* ══ LOADING ══════════════════════════════════════════════════════════ */}
      {status === 'loading' && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Loader size={40} className="text-primary-500 animate-spin" />
          <p className="text-gray-700 font-semibold">Analyzing document with AI…</p>
          <p className="text-gray-400 text-sm">Detecting structure, grouping by PI, suggesting placement</p>
        </div>
      )}

      {/* ══ ERROR ════════════════════════════════════════════════════════════ */}
      {status === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-sm">Extraction failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full"
            onClick={() => { setStatus('idle'); setError(''); }}>
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* ══ SUCCESS ══════════════════════════════════════════════════════════ */}
      {status === 'success' && (
        <>
          {/* Document meta header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-700">
                  {isGrouped
                    ? `${groups.length} sub-grants detected · ${docTypeLabel(docType)}`
                    : `${items.length} items detected · ${docTypeLabel(docType)}`}
                </span>
              </div>
              {meta?.grantTitle && (
                <p className="text-xs text-gray-500 pl-5 font-medium">{meta.grantTitle}</p>
              )}
              {!isGrouped && meta?.recipient && (
                <p className="text-xs text-gray-500 pl-5">{meta.recipient}</p>
              )}
              {isGrouped && groupingSuggestionReason && (
                <p className="text-xs text-purple-600 pl-5 flex items-center gap-1 mt-0.5">
                  <Sparkles size={10} /> {groupingSuggestionReason}
                </p>
              )}
            </div>
            <div className="flex gap-3 text-xs flex-shrink-0">
              <button onClick={isGrouped ? selectAllGroups : selectAll}
                className="text-primary-600 hover:underline font-medium">All</button>
              <button onClick={isGrouped ? selectNoneGroups : selectNone}
                className="text-gray-500 hover:underline font-medium">None</button>
            </div>
          </div>

          {/* ── A: GROUPED view (multi-PI sub-account budget) ─────────────── */}
          {isGrouped && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {groups.map((group, gi) => (
                <GroupCard
                  key={gi}
                  group={group}
                  groupIndex={gi}
                  onToggleGroup={toggleGroup}
                  onToggleItem={toggleGroupItem}
                  onChangeItem={changeGroupItem}
                />
              ))}
            </div>
          )}

          {/* ── A: FLAT view (single-recipient doc) ───────────────────────── */}
          {!isGrouped && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                <span className="w-4 flex-shrink-0" />
                <span className="flex-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</span>
                <span className="w-28 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</span>
                <span className="w-16 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Status</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {items.map((item, i) => (
                  <FlatItemRow key={i} item={item} index={i} onToggle={toggleItem} onChange={changeItem} />
                ))}
              </div>
              <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-purple-400" />
                  AI suggestions shown on each item
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {selectedItems.length}/{items.length} · ${totalSelected.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Grouped total bar */}
          {isGrouped && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <span className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{selectedGroups.length}</span> of {groups.length} sub-grants selected
              </span>
              <span className="text-sm font-bold text-gray-800">${totalSelected.toLocaleString()} total</span>
            </div>
          )}

          {/* ── B: Destination ────────────────────────────────────────────── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Where to import</p>
              {budgets.length > 0 && (
                <div className="flex gap-0.5 p-0.5 bg-gray-200 rounded-lg text-[11px]">
                  {['existing', 'new'].map(mode => (
                    <button key={mode} onClick={() => setImportMode(mode)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        importMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      {mode === 'existing' ? 'Existing Budget' : 'New Budget'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4">
              {importMode === 'existing' ? (
                <DestinationSelector
                  budgets={budgets} grants={grants}
                  destBudgetId={destBudgetId}       setDestBudgetId={setDestBudgetId}
                  destCategoryId={destCategoryId}   setDestCategoryId={setDestCategoryId}
                  destMiniPoolId={destMiniPoolId}   setDestMiniPoolId={setDestMiniPoolId}
                  newMiniPoolName={newMiniPoolName} setNewMiniPoolName={setNewMiniPoolName}
                  isGrouped={isGrouped}
                  aiSuggestedCategory={aiSuggestedCategory}
                  aiSuggestedMiniPool={aiSuggestedMiniPool}
                />
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                  {isGrouped
                    ? <>Creates a new grant entry and budget where each selected PI becomes their own <strong>category</strong>.</>
                    : <>Creates a new grant entry and budget where each selected item becomes its own <strong>category</strong>.</>
                  }
                </div>
              )}
            </div>
          </div>

          {/* ── Apply bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {selectionCount > 0
                ? isGrouped
                  ? `${selectionCount} sub-grant(s) · $${totalSelected.toLocaleString()} will be imported`
                  : `${selectionCount} item(s) · $${totalSelected.toLocaleString()} will be imported`
                : 'Select at least one item to continue'}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleApply} disabled={!canApply()}>
                {isGrouped ? <Users size={16} className="mr-2" /> : <FileText size={16} className="mr-2" />}
                {isGrouped ? `Import ${selectionCount || ''} Sub-Grant${selectionCount !== 1 ? 's' : ''}` : 'Import Selected'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AwardLetterImport;
