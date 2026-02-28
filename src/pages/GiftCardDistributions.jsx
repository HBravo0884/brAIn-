import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Gift, Plus, X, Edit2, Trash2, Download, Search,
  AlertCircle, CheckCircle, DollarSign,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const CARD_TYPES = ['Amazon', 'Visa', 'Target', 'Walmart', 'Other'];
const STATUSES = ['Pending', 'Distributed', 'Returned', 'Cancelled'];
const PURPOSES = ['Aim 5 Participant Stipend', 'Study Incentive', 'Focus Group Incentive', 'Survey Incentive', 'Other'];

const STATUS_STYLES = {
  'Pending':     { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  'Distributed': { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  dot: 'bg-green-500'  },
  'Returned':    { bg: 'bg-gray-50',   border: 'border-gray-300',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  'Cancelled':   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    dot: 'bg-red-400'    },
};

const EMPTY_FORM = {
  recipientName: '',
  recipientId: '',
  grantId: '',
  aim: 'Aim 5',
  purpose: PURPOSES[0],
  cardType: CARD_TYPES[0],
  amount: '',
  quantity: '1',
  distributionDate: '',
  status: 'Pending',
  prfNumber: '',
  spendCategory: 'Participant Support Costs',
  notes: '',
  confirmedByRecipient: false,
};

// ── Export CSV ────────────────────────────────────────────────────────────────
const exportCSV = (records, grants) => {
  const headers = ['Recipient', 'Recipient ID', 'Grant', 'Aim', 'Purpose', 'Card Type', 'Amount', 'Qty', 'Total', 'Date', 'Status', 'PRF #', 'Spend Category', 'Confirmed', 'Notes'];
  const rows = records.map(r => {
    const grant = grants.find(g => g.id === r.grantId);
    const total = (parseFloat(r.amount || 0) * parseInt(r.quantity || 1)).toFixed(2);
    return [
      r.recipientName, r.recipientId, grant?.title || '', r.aim, r.purpose,
      r.cardType, r.amount, r.quantity, total, r.distributionDate, r.status,
      r.prfNumber, r.spendCategory, r.confirmedByRecipient ? 'Yes' : 'No', r.notes,
    ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gift_card_log_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Main component ────────────────────────────────────────────────────────────
const GiftCardDistributions = () => {
  const { giftCardDistributions, grants, addGiftCardDistribution, updateGiftCardDistribution, deleteGiftCardDistribution } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  const resetForm = () => { setFormData(EMPTY_FORM); setSelected(null); setViewMode(false); };

  const openModal = (rec = null, isView = false) => {
    if (rec) { setFormData({ ...EMPTY_FORM, ...rec }); setSelected(rec); setViewMode(isView); }
    else resetForm();
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setTimeout(resetForm, 300); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) return alert('Recipient name is required.');
    if (selected) updateGiftCardDistribution(selected.id, formData);
    else addGiftCardDistribution(formData);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this gift card record?')) { deleteGiftCardDistribution(id); closeModal(); }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  // Filtered + searched records
  const filtered = useMemo(() => {
    let list = giftCardDistributions;
    if (filterStatus !== 'All') list = list.filter(r => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.recipientName?.toLowerCase().includes(q) ||
        r.recipientId?.toLowerCase().includes(q) ||
        r.prfNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [giftCardDistributions, filterStatus, search]);

  // Summary stats
  const totalDistributed = giftCardDistributions
    .filter(r => r.status === 'Distributed')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0) * parseInt(r.quantity || 1), 0);
  const totalPending = giftCardDistributions
    .filter(r => r.status === 'Pending')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0) * parseInt(r.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Card Distributions</h1>
          <p className="text-gray-600 mt-1">Aim 5 participant support — log, track, and export for compliance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(giftCardDistributions, grants)}
            disabled={giftCardDistributions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} /> Add Record
          </button>
        </div>
      </div>

      {/* Compliance reminder */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <span className="font-bold">Compliance reminder:</span> Always use spend category <span className="font-mono bg-amber-100 px-1 rounded">"Participant Support Costs"</span> on the PRF.
          Using any other category removes the F&A tax exemption permanently.
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: giftCardDistributions.length, icon: Gift, color: 'text-primary-600 bg-primary-50' },
          { label: 'Total Distributed', value: `$${totalDistributed.toLocaleString()}`, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Distribution', value: `$${totalPending.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}><Icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipient, ID, PRF#…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...STATUSES].map(s => {
            const c = s !== 'All' ? STATUS_STYLES[s] : null;
            const count = s === 'All' ? giftCardDistributions.length : giftCardDistributions.filter(r => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === s
                    ? s === 'All' ? 'bg-primary-600 text-white' : `${c.bg} ${c.border} border ${c.text}`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-500 mb-4">Add a gift card distribution record to get started</p>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={18} /> Add Record
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Recipient', 'Aim / Purpose', 'Card', 'Amount', 'Date', 'Status', 'PRF #', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(rec => {
                const c = STATUS_STYLES[rec.status] || STATUS_STYLES['Pending'];
                const total = parseFloat(rec.amount || 0) * parseInt(rec.quantity || 1);
                return (
                  <tr key={rec.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal(rec, true)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{rec.recipientName}</div>
                      {rec.recipientId && <div className="text-xs text-gray-400">{rec.recipientId}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{rec.aim}</div>
                      <div className="text-xs text-gray-400">{rec.purpose}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rec.cardType}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${total.toLocaleString()}
                      {parseInt(rec.quantity || 1) > 1 && <span className="text-xs font-normal text-gray-400 ml-1">({rec.quantity}×${rec.amount})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rec.distributionDate || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {rec.status}
                      </span>
                      {rec.confirmedByRecipient && (
                        <CheckCircle size={14} className="text-green-500 inline ml-2" title="Recipient confirmed" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{rec.prfNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); openModal(rec, false); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {viewMode ? 'Gift Card Record' : selected ? 'Edit Record' : 'New Gift Card Record'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6">
              {viewMode ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{formData.recipientName}</h3>
                      {formData.recipientId && <p className="text-sm text-gray-400 font-mono">{formData.recipientId}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ['Grant / Aim', [grants.find(g=>g.id===formData.grantId)?.title, formData.aim].filter(Boolean).join(' — ') || '—'],
                      ['Purpose', formData.purpose],
                      ['Card Type', formData.cardType],
                      ['Amount × Qty', `$${formData.amount} × ${formData.quantity || 1} = $${(parseFloat(formData.amount||0)*parseInt(formData.quantity||1)).toLocaleString()}`],
                      ['Distribution Date', formData.distributionDate || '—'],
                      ['Status', formData.status],
                      ['PRF Number', formData.prfNumber || '—'],
                      ['Spend Category', formData.spendCategory],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-gray-800">{value}</div>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.confirmedByRecipient}
                      onChange={e => { set('confirmedByRecipient', e.target.checked); updateGiftCardDistribution(selected.id, { ...formData, confirmedByRecipient: e.target.checked }); }}
                      className="accent-primary-600 w-4 h-4"
                    />
                    <span className="font-medium text-gray-700">Recipient has confirmed receipt</span>
                    {formData.confirmedByRecipient && <CheckCircle size={16} className="text-green-500" />}
                  </label>

                  {formData.notes && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{formData.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name <span className="text-red-500">*</span></label>
                      <input value={formData.recipientName} onChange={e => set('recipientName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient ID / Student #</label>
                      <input value={formData.recipientId} onChange={e => set('recipientId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aim</label>
                      <input value={formData.aim} onChange={e => set('aim', e.target.value)} placeholder="e.g. Aim 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grant</label>
                      <select value={formData.grantId} onChange={e => set('grantId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        <option value="">— none —</option>
                        {grants.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                      <select value={formData.purpose} onChange={e => set('purpose', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {PURPOSES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                      <select value={formData.cardType} onChange={e => set('cardType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {CARD_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount per Card ($)</label>
                      <input type="number" min="0" step="0.01" value={formData.amount} onChange={e => set('amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input type="number" min="1" step="1" value={formData.quantity} onChange={e => set('quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    {formData.amount && formData.quantity && (
                      <div className="col-span-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        Total: <span className="font-bold text-gray-900">${(parseFloat(formData.amount||0)*parseInt(formData.quantity||1)).toLocaleString()}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Date</label>
                      <input type="date" value={formData.distributionDate} onChange={e => set('distributionDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={formData.status} onChange={e => set('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PRF Number</label>
                      <input value={formData.prfNumber} onChange={e => set('prfNumber', e.target.value)} placeholder="PRF-2025-XXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm font-mono" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
                      <input value={formData.spendCategory} onChange={e => set('spendCategory', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                      {formData.spendCategory !== 'Participant Support Costs' && (
                        <p className="text-xs text-amber-600 mt-1">Warning: must be "Participant Support Costs" for F&A exemption</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={formData.confirmedByRecipient} onChange={e => set('confirmedByRecipient', e.target.checked)}
                          className="accent-primary-600 w-4 h-4" />
                        <span className="font-medium text-gray-700">Recipient has confirmed receipt</span>
                      </label>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea value={formData.notes} onChange={e => set('notes', e.target.value)} rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="submit" className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                      {selected ? 'Update Record' : 'Add Record'}
                    </button>
                    <button type="button" onClick={closeModal} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCardDistributions;
