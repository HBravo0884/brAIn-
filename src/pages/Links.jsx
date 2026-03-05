import { useState, useEffect } from 'react';
import { ExternalLink, Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';

const STORAGE_KEY = 'brain_quick_links';

// ── Default link definitions ──────────────────────────────────────────────────
const DEFAULT_LINKS = [
  // HU Systems
  { id: 'd-workday',      category: 'HU Systems',           label: 'Workday',                url: 'https://wd5.myworkday.com/howard',             description: 'Requisitions, expense reports, budget queries' },
  { id: 'd-bisonhub',     category: 'HU Systems',           label: 'BisonHub',               url: 'https://bisonhub.howard.edu',                  description: 'HU portal — HR, directory, announcements' },
  { id: 'd-paymentnet',   category: 'HU Systems',           label: 'PaymentNet',             url: 'https://www.paymentnet.com',                   description: 'P-Card reconciliation — due 15th of month' },
  { id: 'd-ofr',          category: 'HU Systems',           label: 'Office of Research',     url: 'https://research.howard.edu',                  description: 'IRB, compliance, grant submissions' },
  { id: 'd-hugmail',      category: 'HU Systems',           label: 'HU Gmail',               url: 'https://mail.google.com',                      description: 'Howard University official email' },
  { id: 'd-hudirectory',  category: 'HU Systems',           label: 'HU People Finder',       url: 'https://directory.howard.edu',                 description: 'Fast lookup for approvers and contacts' },

  // Funder & Grant
  { id: 'd-rwjf',         category: 'Funder & Grant',       label: 'RWJF Grantee Portal',    url: 'https://grantee.rwjf.org',                     description: 'Progress reports, amendments, funder communications' },
  { id: 'd-grantsgov',    category: 'Funder & Grant',       label: 'Grants.gov',             url: 'https://www.grants.gov',                       description: 'Federal grant tracking and submissions' },
  { id: 'd-nihreporter',  category: 'Funder & Grant',       label: 'NIH Reporter',           url: 'https://reporter.nih.gov',                     description: 'Research funding database — benchmarks for Aims' },

  // Research & Lab
  { id: 'd-biorender',    category: 'Research & Lab',       label: 'BioRender',              url: 'https://biorender.com',                        description: "P-Rats manuscript figures" },
  { id: 'd-allofus',      category: 'Research & Lab',       label: 'All of Us Workbench',    url: 'https://workbench.researchallofus.org',        description: 'HIV/SUD comorbidity cohort data access' },
  { id: 'd-pubmed',       category: 'Research & Lab',       label: 'PubMed',                 url: 'https://pubmed.ncbi.nlm.nih.gov',              description: 'Literature search for manuscripts and Aims' },
  { id: 'd-ncbi',         category: 'Research & Lab',       label: 'NCBI',                   url: 'https://www.ncbi.nlm.nih.gov',                 description: 'Sequence data, gene databases, variant queries' },

  // AI Tools
  { id: 'd-claude',       category: 'AI Tools',             label: 'Claude',                 url: 'https://claude.ai',                            description: 'Primary AI assistant — brAIn Project lives here' },
  { id: 'd-chatgpt',      category: 'AI Tools',             label: 'ChatGPT',                url: 'https://chatgpt.com',                          description: 'GPT-4 — backup and comparison' },
  { id: 'd-notebooklm',   category: 'AI Tools',             label: 'NotebookLM',             url: 'https://notebooklm.google.com',                description: 'Upload briefings for deep grant analysis' },
  { id: 'd-perplexity',   category: 'AI Tools',             label: 'Perplexity',             url: 'https://www.perplexity.ai',                    description: 'Fast cited research and fact-checking' },
  { id: 'd-gemini',       category: 'AI Tools',             label: 'Gemini',                 url: 'https://gemini.google.com',                    description: 'Google AI — integrates with Drive and Docs' },

  // Productivity
  { id: 'd-gdrive',       category: 'Productivity',         label: 'Google Drive',           url: 'https://drive.google.com',                     description: 'Root of your brAIn folder structure' },
  { id: 'd-gdocs',        category: 'Productivity',         label: 'Google Docs',            url: 'https://docs.google.com',                      description: 'Document creation and collaboration' },
  { id: 'd-constantc',    category: 'Productivity',         label: 'Constant Contact',       url: 'https://app.constantcontact.com',              description: 'Faculty Focus Newsletter drafts and sends' },
  { id: 'd-pollev',       category: 'Productivity',         label: 'Poll Everywhere',        url: 'https://pollev.com',                           description: 'Workshop and presentation polling' },
  { id: 'd-zoom',         category: 'Productivity',         label: 'Zoom',                   url: 'https://zoom.us',                              description: 'Video meetings and recordings' },
  { id: 'd-calendly',     category: 'Productivity',         label: 'Calendly',               url: 'https://calendly.com',                         description: 'Scheduling links for meetings' },
  { id: 'd-canva',        category: 'Productivity',         label: 'Canva',                  url: 'https://www.canva.com',                        description: 'Quick graphics for newsletter and outreach' },
];

const CATEGORIES = ['HU Systems', 'Funder & Grant', 'Research & Lab', 'AI Tools', 'Productivity', 'Custom'];

const CATEGORY_COLORS = {
  'HU Systems':     'border-l-blue-500   bg-blue-50   dark:bg-blue-950/20   text-blue-700   dark:text-blue-400',
  'Funder & Grant': 'border-l-green-500  bg-green-50  dark:bg-green-950/20  text-green-700  dark:text-green-400',
  'Research & Lab': 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400',
  'AI Tools':       'border-l-violet-500 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400',
  'Productivity':   'border-l-teal-500   bg-teal-50   dark:bg-teal-950/20   text-teal-700   dark:text-teal-400',
  'Custom':         'border-l-gray-400   bg-gray-50   dark:bg-gray-800/50   text-gray-700   dark:text-gray-300',
};

const CATEGORY_HEADER_COLORS = {
  'HU Systems':     'text-blue-700   dark:text-blue-400   border-blue-200   dark:border-blue-800',
  'Funder & Grant': 'text-green-700  dark:text-green-400  border-green-200  dark:border-green-800',
  'Research & Lab': 'text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'AI Tools':       'text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  'Productivity':   'text-teal-700   dark:text-teal-400   border-teal-200   dark:border-teal-800',
  'Custom':         'text-gray-600   dark:text-gray-400   border-gray-200   dark:border-gray-700',
};

// ── Load / save helpers ───────────────────────────────────────────────────────
const loadLinks = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored) return DEFAULT_LINKS.map(l => ({ ...l, hidden: false }));
    // Merge: add any new defaults that aren't already stored
    const storedIds = new Set(stored.map(l => l.id));
    const newDefaults = DEFAULT_LINKS
      .filter(l => !storedIds.has(l.id))
      .map(l => ({ ...l, hidden: false }));
    return [...stored, ...newDefaults];
  } catch {
    return DEFAULT_LINKS.map(l => ({ ...l, hidden: false }));
  }
};

const saveLinks = (links) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch {}
};

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function LinkModal({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const [label, setLabel]           = useState(initial?.label || '');
  const [url, setUrl]               = useState(initial?.url || '');
  const [category, setCategory]     = useState(initial?.category || 'Custom');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError]           = useState('');

  const handleSave = () => {
    if (!label.trim()) { setError('Name is required.'); return; }
    if (!url.trim())   { setError('URL is required.'); return; }
    const normalized = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    onSave({ label: label.trim(), url: normalized, category, description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Link' : 'Add Link'}
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. HU Parking Portal"
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL *</label>
            <input
              type="text"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              type="text"
              placeholder="What do you use this for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check size={14} />
            {isEdit ? 'Save changes' : 'Add link'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Link Card ─────────────────────────────────────────────────────────────────
function LinkCard({ link, editMode, onEdit, onToggleHide, onDelete }) {
  const colors = CATEGORY_COLORS[link.category] || CATEGORY_COLORS['Custom'];

  if (link.hidden && !editMode) return null;

  return (
    <div className={`relative rounded-xl border-l-4 border border-gray-200 dark:border-gray-700 ${colors} flex flex-col gap-1.5 p-4 transition-all ${link.hidden ? 'opacity-40' : ''}`}>
      {/* Edit mode controls */}
      {editMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => onEdit(link)}
            className="p-1 hover:bg-white/60 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onToggleHide(link.id)}
            className="p-1 hover:bg-white/60 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title={link.hidden ? 'Show' : 'Hide'}
          >
            <X size={12} />
          </button>
          {!link.id.startsWith('d-') && (
            <button
              onClick={() => onDelete(link.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Link content */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start justify-between gap-2"
        onClick={e => link.hidden && e.preventDefault()}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:underline truncate pr-6">
            {link.label}
          </p>
          {link.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
              {link.description}
            </p>
          )}
        </div>
        <ExternalLink size={13} className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Links() {
  const [links, setLinks]       = useState(loadLinks);
  const [editMode, setEditMode] = useState(false);
  const [modal, setModal]       = useState(null); // null | 'add' | { link } for edit

  useEffect(() => { saveLinks(links); }, [links]);

  const visibleCategories = CATEGORIES.filter(cat => {
    if (editMode) return links.some(l => l.category === cat);
    return links.some(l => l.category === cat && !l.hidden);
  });

  const handleAdd = (data) => {
    setLinks(prev => [...prev, {
      id: `c-${crypto.randomUUID()}`,
      hidden: false,
      ...data,
    }]);
    setModal(null);
  };

  const handleEdit = (data) => {
    setLinks(prev => prev.map(l => l.id === modal.link.id ? { ...l, ...data } : l));
    setModal(null);
  };

  const handleToggleHide = (id) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, hidden: !l.hidden } : l));
  };

  const handleDelete = (id) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Reset all links to defaults? Your custom links will be removed.')) {
      const reset = DEFAULT_LINKS.map(l => ({ ...l, hidden: false }));
      setLinks(reset);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Links</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {links.filter(l => !l.hidden).length} active links across {visibleCategories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Reset to defaults
            </button>
          )}
          <button
            onClick={() => setEditMode(v => !v)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              editMode
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {editMode ? 'Done editing' : 'Edit'}
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add link
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          Edit mode — click <Pencil size={12} className="inline" /> to edit a link, <X size={12} className="inline" /> to hide it, or <Trash2 size={12} className="inline" /> to delete custom links. Grayed-out cards are hidden.
        </div>
      )}

      {/* Categories */}
      {visibleCategories.map(category => {
        const catLinks = links.filter(l => l.category === category && (editMode || !l.hidden));
        if (!catLinks.length) return null;
        const headerColors = CATEGORY_HEADER_COLORS[category] || CATEGORY_HEADER_COLORS['Custom'];

        return (
          <section key={category}>
            <h2 className={`text-xs font-bold uppercase tracking-widest pb-3 mb-4 border-b ${headerColors}`}>
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catLinks.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  editMode={editMode}
                  onEdit={(l) => setModal({ link: l })}
                  onToggleHide={handleToggleHide}
                  onDelete={handleDelete}
                />
              ))}
              {/* Add to this category shortcut in edit mode */}
              {editMode && (
                <button
                  onClick={() => setModal({ prefillCategory: category })}
                  className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-500 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 p-4 text-sm min-h-[80px]"
                >
                  <Plus size={14} />
                  Add to {category}
                </button>
              )}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {visibleCategories.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-sm">All links are hidden. Click Edit to restore them.</p>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal === 'add' && (
        <LinkModal onSave={handleAdd} onCancel={() => setModal(null)} />
      )}
      {modal?.link && (
        <LinkModal initial={modal.link} onSave={handleEdit} onCancel={() => setModal(null)} />
      )}
      {modal?.prefillCategory && (
        <LinkModal
          initial={{ category: modal.prefillCategory }}
          onSave={handleAdd}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
