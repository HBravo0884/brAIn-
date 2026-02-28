import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plane, Plus, X, Edit2, Trash2, Download, FileText,
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const PHASES = [
  { key: 'phase1', label: 'Phase 1 — Application', description: 'T−60 days: collect packet, get Dr. Stubbs + MGL signatures' },
  { key: 'phase2', label: 'Phase 2 — Spend Authorization', description: 'T−30 days: create Workday SA, approval chain: MGL → Sam Gaisie → Nichelle Brooks' },
  { key: 'phase3', label: 'Phase 3 — Booking', description: 'After SA approval: book via CBT with SA number. Student never pays out of pocket.' },
  { key: 'phase4', label: 'Phase 4 — Post-Travel', description: 'Employee: Workday Expense Report linked to SA. Non-employee: Revised PRF → apgrants@howard.edu' },
];

const STATUS_COLORS = {
  'Phase 1 - Application':        { bg: 'bg-yellow-50',  border: 'border-yellow-300', text: 'text-yellow-700',  dot: 'bg-yellow-400'  },
  'Phase 2 - Spend Authorization': { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-700',    dot: 'bg-blue-400'    },
  'Phase 3 - Booking':             { bg: 'bg-indigo-50',  border: 'border-indigo-300', text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  'Phase 4 - Post-Travel':         { bg: 'bg-purple-50',  border: 'border-purple-300', text: 'text-purple-700',  dot: 'bg-purple-400'  },
  'Completed':                     { bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-700',   dot: 'bg-green-400'   },
  'Cancelled':                     { bg: 'bg-gray-50',    border: 'border-gray-300',   text: 'text-gray-500',    dot: 'bg-gray-400'    },
};

const STATUSES = Object.keys(STATUS_COLORS);

const TRAVELER_TYPES = ['Employee', 'Non-Employee (Student)', 'Non-Employee (Other)'];
const TRAVEL_PURPOSES = ['Conference', 'Training', 'Site Visit', 'Collaboration', 'Other'];

const EMPTY_FORM = {
  travelerName: '',
  travelerType: 'Non-Employee (Student)',
  grantId: '',
  aim: '',
  purpose: TRAVEL_PURPOSES[0],
  destination: '',
  departureDate: '',
  returnDate: '',
  estimatedCost: '',
  saNumber: '',
  phase1Complete: false,
  phase2Complete: false,
  phase3Complete: false,
  phase4Complete: false,
  status: 'Phase 1 - Application',
  notes: '',
  abstractTitle: '',
};

// ── Export helpers ────────────────────────────────────────────────────────────
const exportTravel = (tr, grants) => {
  const grant = grants.find(g => g.id === tr.grantId);
  const lines = [
    'TRAVEL AUTHORIZATION RECORD',
    '=============================',
    `Traveler: ${tr.travelerName}`,
    `Type: ${tr.travelerType}`,
    `Grant: ${grant?.title || 'N/A'}  |  Aim: ${tr.aim || 'N/A'}`,
    `Purpose: ${tr.purpose}`,
    `Destination: ${tr.destination}`,
    `Travel Dates: ${tr.departureDate} → ${tr.returnDate}`,
    `Estimated Cost: $${tr.estimatedCost || 'TBD'}`,
    `SA Number: ${tr.saNumber || 'Not yet issued'}`,
    `Status: ${tr.status}`,
    '',
    'CHECKLIST:',
    `[${tr.phase1Complete ? 'X' : ' '}] Phase 1 — Application packet signed (Dr. Stubbs + MGL)`,
    `[${tr.phase2Complete ? 'X' : ' '}] Phase 2 — Spend Authorization created & approved`,
    `[${tr.phase3Complete ? 'X' : ' '}] Phase 3 — Booked via CBT using SA number`,
    `[${tr.phase4Complete ? 'X' : ' '}] Phase 4 — Post-travel expense report / PRF submitted`,
    '',
    tr.abstractTitle ? `Abstract Title: ${tr.abstractTitle}` : '',
    tr.notes ? `Notes:\n${tr.notes}` : '',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `travel_${(tr.travelerName || 'request').replace(/\s+/g, '_')}_${tr.departureDate || 'TBD'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Phase checklist row ───────────────────────────────────────────────────────
const PhaseRow = ({ phase, done, onChange, disabled }) => (
  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
    done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-primary-300'
  } ${disabled ? 'cursor-default opacity-60' : ''}`}>
    <input
      type="checkbox"
      checked={done}
      onChange={e => !disabled && onChange(e.target.checked)}
      className="mt-0.5 accent-primary-600"
      disabled={disabled}
    />
    <div>
      <div className={`font-medium text-sm ${done ? 'text-green-700 line-through' : 'text-gray-800'}`}>
        {phase.label}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>
    </div>
    {done && <CheckCircle size={16} className="text-green-500 mt-0.5 ml-auto flex-shrink-0" />}
  </label>
);

// ── Main component ────────────────────────────────────────────────────────────
const TravelRequests = () => {
  const { travelRequests, grants, addTravelRequest, updateTravelRequest, deleteTravelRequest } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedSOP, setExpandedSOP] = useState(false);

  const resetForm = () => { setFormData(EMPTY_FORM); setSelected(null); setViewMode(false); };

  const openModal = (tr = null, isView = false) => {
    if (tr) {
      setFormData({ ...EMPTY_FORM, ...tr });
      setSelected(tr);
      setViewMode(isView);
    } else {
      resetForm();
    }
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setTimeout(resetForm, 300); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.travelerName.trim()) return alert('Traveler name is required.');
    if (selected) {
      updateTravelRequest(selected.id, formData);
    } else {
      addTravelRequest(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this travel request?')) { deleteTravelRequest(id); closeModal(); }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const phaseDone = (tr) => [tr.phase1Complete, tr.phase2Complete, tr.phase3Complete, tr.phase4Complete].filter(Boolean).length;

  const filtered = filterStatus === 'All'
    ? travelRequests
    : travelRequests.filter(tr => tr.status === filterStatus);

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = travelRequests.filter(tr => tr.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Requests</h1>
          <p className="text-gray-600 mt-1">4-phase SOP tracker for student and staff travel authorization</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          New Travel Request
        </button>
      </div>

      {/* SOP Reference (collapsible) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedSOP(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">SOP Reminder — Workflow C (Travel)</span>
          </div>
          {expandedSOP ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
        </button>
        {expandedSOP && (
          <div className="px-4 pb-4 space-y-2 text-xs text-amber-800">
            {PHASES.map(p => (
              <div key={p.key} className="flex gap-2">
                <span className="font-bold whitespace-nowrap">{p.label}:</span>
                <span>{p.description}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-amber-200 font-semibold text-red-700">
              RULE: No SA = no booking. Students must NEVER pay flights/hotels out of pocket.
            </div>
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('All')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterStatus === 'All' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({travelRequests.length})
        </button>
        {STATUSES.filter(s => statusCounts[s] > 0).map(s => {
          const c = STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                filterStatus === s ? `${c.bg} ${c.border} ${c.text}` : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
              }`}
            >
              {s} ({statusCounts[s]})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Plane size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No travel requests</h3>
          <p className="text-gray-500 mb-4">Create one to start the 4-phase SOP workflow</p>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={18} /> New Travel Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tr => {
            const c = STATUS_COLORS[tr.status] || STATUS_COLORS['Phase 1 - Application'];
            const done = phaseDone(tr);
            const grant = grants.find(g => g.id === tr.grantId);
            return (
              <div
                key={tr.id}
                onClick={() => openModal(tr, true)}
                className={`bg-white rounded-xl border-2 ${c.border} p-5 cursor-pointer hover:shadow-md transition-all`}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${c.bg} ${c.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {tr.status}
                  </span>
                  {/* Phase progress */}
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i < done ? 'bg-primary-500' : 'bg-gray-200'}`} title={`Phase ${i+1}`} />
                    ))}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{tr.travelerName}</h3>
                <p className="text-sm text-gray-500 mb-3">{tr.travelerType}</p>

                <div className="space-y-1 text-sm text-gray-600">
                  {tr.destination && (
                    <div className="flex items-center gap-2">
                      <Plane size={14} className="text-gray-400" />
                      <span>{tr.destination}</span>
                    </div>
                  )}
                  {tr.departureDate && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span>{tr.departureDate} → {tr.returnDate || '?'}</span>
                    </div>
                  )}
                  {grant && (
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="truncate">{grant.title}{tr.aim ? ` — ${tr.aim}` : ''}</span>
                    </div>
                  )}
                  {tr.estimatedCost && (
                    <div className="text-right font-semibold text-gray-800">
                      ${parseFloat(tr.estimatedCost || 0).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {viewMode ? 'Travel Request' : selected ? 'Edit Travel Request' : 'New Travel Request'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {viewMode ? (
                // View mode
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{formData.travelerName}</h3>
                      <p className="text-gray-500 text-sm">{formData.travelerType}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => exportTravel(formData, grants)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        <Download size={15} /> Export
                      </button>
                      <button onClick={() => setViewMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                        <Edit2 size={15} /> Edit
                      </button>
                      <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ['Destination', formData.destination],
                      ['Purpose', formData.purpose],
                      ['Departure', formData.departureDate],
                      ['Return', formData.returnDate],
                      ['Estimated Cost', formData.estimatedCost ? `$${parseFloat(formData.estimatedCost).toLocaleString()}` : '—'],
                      ['SA Number', formData.saNumber || 'Not yet issued'],
                      ['Grant / Aim', [grants.find(g=>g.id===formData.grantId)?.title, formData.aim].filter(Boolean).join(' — ') || '—'],
                      ['Status', formData.status],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-gray-800">{value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {formData.abstractTitle && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Abstract Title</div>
                      <div className="text-gray-800 text-sm">{formData.abstractTitle}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">SOP Checklist ({phaseDone(formData)}/4 phases complete)</div>
                    <div className="space-y-2">
                      {PHASES.map((phase, i) => {
                        const key = `phase${i+1}Complete`;
                        return (
                          <PhaseRow
                            key={phase.key}
                            phase={phase}
                            done={formData[key]}
                            onChange={val => { set(key, val); updateTravelRequest(selected.id, { ...formData, [key]: val }); }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {formData.notes && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{formData.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Edit / Create form
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traveler Name <span className="text-red-500">*</span></label>
                      <input value={formData.travelerName} onChange={e => set('travelerName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traveler Type</label>
                      <select value={formData.travelerType} onChange={e => set('travelerType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {TRAVELER_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                      <select value={formData.purpose} onChange={e => set('purpose', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {TRAVEL_PURPOSES.map(p => <option key={p}>{p}</option>)}
                      </select>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aim</label>
                      <input value={formData.aim} onChange={e => set('aim', e.target.value)} placeholder="e.g. Aim 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <input value={formData.destination} onChange={e => set('destination', e.target.value)} placeholder="City, State / Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                      <input type="date" value={formData.departureDate} onChange={e => set('departureDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                      <input type="date" value={formData.returnDate} onChange={e => set('returnDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                      <input type="number" min="0" step="0.01" value={formData.estimatedCost} onChange={e => set('estimatedCost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SA Number</label>
                      <input value={formData.saNumber} onChange={e => set('saNumber', e.target.value)} placeholder="Workday SA#"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={formData.status} onChange={e => set('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Abstract Title (if conference)</label>
                      <input value={formData.abstractTitle} onChange={e => set('abstractTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">SOP Checklist</label>
                      <div className="space-y-2">
                        {PHASES.map((phase, i) => {
                          const key = `phase${i+1}Complete`;
                          return (
                            <PhaseRow key={phase.key} phase={phase} done={formData[key]} onChange={val => set(key, val)} />
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea value={formData.notes} onChange={e => set('notes', e.target.value)} rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="submit" className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                      {selected ? 'Update' : 'Create Travel Request'}
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

export default TravelRequests;
