import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, X, Edit2, Trash2, Mail, Phone, Building2, Briefcase, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── helpers ───────────────────────────────────────────────────────────────────
const TYPES = [
  { value: 'internal',     label: 'Internal Team',           color: '#097c87', bg: '#d0ecef' },
  { value: 'external',     label: 'External Collaborator',   color: '#5a9d62', bg: '#dff0e2' },
  { value: 'funder',       label: 'Funder / Program Officer', color: '#b88800', bg: '#fef9e0' },
  { value: 'other',        label: 'Other',                   color: '#9e9178', bg: '#f5f0dc' },
];

const typeInfo = (val) => TYPES.find(t => t.value === val) ?? TYPES[3];

const initials = (p) =>
  `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '?';

const avatarColor = (name) => {
  const colors = ['#097c87','#23ced9','#fca47c','#a1cca6','#b88800','#5a9d62'];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
};

const EMPTY_FORM = {
  firstName: '', lastName: '', role: '', department: '',
  organization: '', email: '', phone: '',
  type: 'internal', grantIds: [], notes: '',
};

// ── component ─────────────────────────────────────────────────────────────────
const Personnel = () => {
  const { personnel, addPerson, updatePerson, deletePerson, grants, meetings } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);   // person object while editing
  const [viewing, setViewing]       = useState(null);   // person object for detail panel
  const [form, setForm]             = useState(EMPTY_FORM);

  // ── filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personnel.filter(p => {
      const matchQ = !q || [p.firstName, p.lastName, p.role, p.department, p.organization, p.email]
        .some(f => f?.toLowerCase().includes(q));
      const matchT = typeFilter === 'all' || p.type === typeFilter;
      return matchQ && matchT;
    }).sort((a, b) => a.lastName?.localeCompare(b.lastName ?? '') ?? 0);
  }, [personnel, search, typeFilter]);

  // ── meetings attended by a person ─────────────────────────────────────────
  const meetingsFor = (person) => {
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
    return meetings.filter(m =>
      m.attendees?.toLowerCase().includes(fullName) ||
      m.attendees?.toLowerCase().includes(person.firstName?.toLowerCase()) &&
      m.attendees?.toLowerCase().includes(person.lastName?.toLowerCase())
    );
  };

  // ── modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (person) => {
    setViewing(null);
    setEditing(person);
    setForm({
      firstName:    person.firstName    ?? '',
      lastName:     person.lastName     ?? '',
      role:         person.role         ?? '',
      department:   person.department   ?? '',
      organization: person.organization ?? '',
      email:        person.email        ?? '',
      phone:        person.phone        ?? '',
      type:         person.type         ?? 'internal',
      grantIds:     person.grantIds     ?? [],
      notes:        person.notes        ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim()) return;
    if (editing) {
      updatePerson(editing.id, form);
      // refresh viewing panel
      setViewing(prev => prev ? { ...prev, ...form } : null);
    } else {
      addPerson(form);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this person from the directory?')) return;
    deletePerson(id);
    setViewing(null);
  };

  const toggleGrantId = (gid) => {
    setForm(f => ({
      ...f,
      grantIds: f.grantIds.includes(gid)
        ? f.grantIds.filter(x => x !== gid)
        : [...f.grantIds, gid],
    }));
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Personnel</h1>
          <p className="text-gray-600">Organizational directory — click any person to see their full profile</p>
        </div>
        <button
          onClick={openAdd}
          title="Add a new person to the directory"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <Plus size={18} /> Add Person
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, role, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...TYPES].map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              style={typeFilter === t.value && t.value !== 'all'
                ? { background: t.bg, border: `2px solid ${t.color}`, color: t.color }
                : {}
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                typeFilter === t.value
                  ? t.value === 'all' ? 'bg-primary-600 text-white border-primary-600' : ''
                  : 'border-gray-200 text-gray-600 hover:border-primary-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {personnel.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700 text-lg mb-1">No personnel yet</p>
          <p className="text-gray-500 text-sm mb-5">Add your team members, collaborators, and program officers</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={18} /> Add Person
          </button>
        </div>
      )}

      {/* Card grid + detail panel layout */}
      <div className={viewing ? 'flex gap-6' : ''}>
        {/* Card grid */}
        {filtered.length > 0 && (
          <div className={`grid gap-4 ${viewing ? 'flex-1 grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filtered.map(person => {
              const ti   = typeInfo(person.type);
              const bg   = avatarColor(`${person.firstName}${person.lastName}`);
              const isViewing = viewing?.id === person.id;
              return (
                <div
                  key={person.id}
                  onClick={() => setViewing(isViewing ? null : person)}
                  title="Click to view full profile"
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    isViewing ? 'border-primary-500 shadow-md' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: bg }}
                    >
                      {initials(person)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 leading-tight truncate">
                        {person.firstName} {person.lastName}
                      </p>
                      {person.role && <p className="text-xs text-gray-500 truncate">{person.role}</p>}
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: ti.bg, color: ti.color }}
                    >
                      {ti.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    {person.department && (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="flex-shrink-0" />
                        <span className="truncate">{person.department}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="flex-shrink-0" />
                        <a
                          href={`mailto:${person.email}`}
                          onClick={e => e.stopPropagation()}
                          className="truncate text-primary-600 hover:underline"
                        >
                          {person.email}
                        </a>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="flex-shrink-0" />
                        <a
                          href={`tel:${person.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="truncate hover:underline"
                        >
                          {person.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {person.grantIds?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {person.grantIds.slice(0, 2).map(gid => {
                        const g = grants.find(x => x.id === gid);
                        return g ? (
                          <span key={gid} className="text-xs px-2 py-0.5 bg-surface-100 text-gray-600 rounded-full truncate max-w-[120px]">
                            {g.title.length > 18 ? g.title.slice(0, 18) + '…' : g.title}
                          </span>
                        ) : null;
                      })}
                      {person.grantIds.length > 2 && (
                        <span className="text-xs px-2 py-0.5 bg-surface-100 text-gray-500 rounded-full">
                          +{person.grantIds.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {personnel.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 flex-1">
            <Search size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No people match your search.</p>
          </div>
        )}

        {/* Detail panel (right side) */}
        {viewing && (
          <DetailPanel
            person={viewing}
            grants={grants}
            meetings={meetingsFor(viewing)}
            onEdit={() => openEdit(viewing)}
            onDelete={() => handleDelete(viewing.id)}
            onClose={() => setViewing(null)}
            navigate={navigate}
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Person' : 'Add Person'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>

              {/* Role + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role / Title</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="e.g. Principal Investigator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none bg-white"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Department + Organization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. College of Medicine"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    placeholder="e.g. University of Miami"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              {/* Linked Grants */}
              {grants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Linked Grants</label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {grants.map(g => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                        <input
                          type="checkbox"
                          checked={form.grantIds.includes(g.id)}
                          onChange={() => toggleGrantId(g.id)}
                          className="accent-primary-600"
                        />
                        <span className="text-sm text-gray-700 truncate">{g.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes…"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  {editing ? 'Save Changes' : 'Add to Directory'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ person, grants, meetings, onEdit, onDelete, onClose, navigate }) => {
  const ti  = typeInfo(person.type);
  const bg  = avatarColor(`${person.firstName}${person.lastName}`);
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="w-80 flex-shrink-0 bg-white rounded-xl border-2 border-primary-300 shadow-lg overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
            style={{ background: bg }}
          >
            {initials(person)}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{person.firstName} {person.lastName}</h2>
        {person.role && <p className="text-sm text-gray-600">{person.role}</p>}
        <span
          className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: ti.bg, color: ti.color }}
        >
          {ti.label}
        </span>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
        {/* Contact info */}
        <div className="space-y-2">
          {person.department && (
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 size={14} className="text-gray-400 flex-shrink-0" />
              <span>{person.department}</span>
            </div>
          )}
          {person.organization && (
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
              <span>{person.organization}</span>
            </div>
          )}
          {person.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`mailto:${person.email}`} className="text-primary-600 hover:underline truncate">
                {person.email}
              </a>
            </div>
          )}
          {person.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`tel:${person.phone}`} className="hover:underline">{person.phone}</a>
            </div>
          )}
        </div>

        {/* Linked grants */}
        {person.grantIds?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Linked Grants</p>
            <div className="space-y-1">
              {person.grantIds.map(gid => {
                const g = grants.find(x => x.id === gid);
                return g ? (
                  <button
                    key={gid}
                    onClick={() => navigate('/grants')}
                    title="Open in Grants"
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors text-xs text-gray-700"
                  >
                    <ExternalLink size={11} className="text-primary-500 flex-shrink-0" />
                    <span className="truncate">{g.title}</span>
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Meetings attended */}
        {meetings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Meetings ({meetings.length})
            </p>
            <div className="space-y-1">
              {meetings.slice(0, 6).map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate('/meetings')}
                  title="Open in Meetings"
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors text-xs text-gray-700"
                >
                  <ExternalLink size={11} className="text-primary-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{m.title}</span>
                  {m.date && (
                    <span className="text-gray-400 flex-shrink-0">
                      {fmt(m.date.split('T')[0])}
                    </span>
                  )}
                </button>
              ))}
              {meetings.length > 6 && (
                <p className="text-xs text-gray-400 pl-2">+{meetings.length - 6} more</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {person.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{person.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <p className="text-xs text-gray-400">
          Added {fmt(person.createdAt)}
          {person.updatedAt !== person.createdAt && ` · Updated ${fmt(person.updatedAt)}`}
        </p>
      </div>

      {/* Panel footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Edit2 size={14} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          title="Delete person"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Personnel;
