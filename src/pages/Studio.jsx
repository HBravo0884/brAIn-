import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useStudio } from '../context/StudioContext';
import { parseRosterUpdate, generateLessonReport } from '../utils/ai';
import {
  Music2, Users, Calendar, CalendarCheck, Wand2, Loader2, Check, X, ChevronDown, ChevronUp,
  Edit3, Plus, Clock, MapPin, Star, Zap, Target, Brain, BookOpen, Swords,
  NotebookPen, AlertCircle, Flame,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced:     'bg-purple-100 text-purple-700',
};
const DAY_ORDER = { Monday: 0, Thursday: 1, Saturday: 2 };
const sortStudents = (list) =>
  [...list].sort((a, b) => {
    const dA = DAY_ORDER[a.day] ?? 9;
    const dB = DAY_ORDER[b.day] ?? 9;
    if (dA !== dB) return dA - dB;
    return (a.time || '').localeCompare(b.time || '');
  });

// ── StudentCard ───────────────────────────────────────────────────────────────
const StudentCard = ({ student, onClick }) => (
  <button
    onClick={() => onClick(student)}
    className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-violet-400 hover:shadow-md transition-all p-4 group"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate group-hover:text-violet-700">{student.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{student.day} {student.time}</span>
          <span className="text-gray-300">·</span>
          <MapPin className="w-3 h-3" />
          <span>{student.location}</span>
          {student.age && <><span className="text-gray-300">·</span><span>Age {student.age}</span></>}
        </div>
      </div>
      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[student.experienceLevel] || 'bg-gray-100 text-gray-500'}`}>
        {student.experienceLevel || '—'}
      </span>
    </div>
    {student.dragonMusic && (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2.5 py-1">
        <Swords className="w-3 h-3 shrink-0" />
        <span className="truncate">{student.dragonMusic}</span>
      </div>
    )}
    {student.acquiredSkills && (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-violet-600">
        <Star className="w-3 h-3 shrink-0" />
        <span className="truncate">{student.acquiredSkills.split(',')[0]}</span>
      </div>
    )}
  </button>
);

// ── StudentDetailPanel ────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'dragonMusic',           icon: Swords,      label: 'Dragon Music',        placeholder: 'Current piece to master' },
  { key: 'currentGoal',           icon: Target,      label: 'Sprint Goal',         placeholder: 'This week\'s target' },
  { key: 'currentFocus',          icon: Flame,       label: 'Current Focus',       placeholder: 'Technique or concept' },
  { key: 'thePrescription',       icon: BookOpen,    label: 'The Prescription',    placeholder: 'Teaching approach for this student' },
  { key: 'theTrigger',            icon: Zap,         label: 'The Trigger',         placeholder: 'What hooks them / motivates them' },
  { key: 'entryPoint',            icon: Brain,       label: 'Entry Point',         placeholder: 'Learning modality (Aural, Visual, Kinesthetic…)' },
  { key: 'acquiredSkills',        icon: Star,        label: 'Acquired Skills',     placeholder: 'Competencies logged' },
  { key: 'currentChallenges',     icon: AlertCircle, label: 'Current Challenges',  placeholder: 'What they\'re still working through' },
  { key: 'earTraining',           icon: Music2,      label: 'Ear Training',        placeholder: 'Current ear training material' },
  { key: 'practitionPrescription',icon: NotebookPen, label: 'Practice Rx',         placeholder: 'Specific practice instructions' },
];

const StudentDetailPanel = ({ student, onClose, onUpdate, onAddLog }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...student });
  const [lessonNotes, setLessonNotes] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const save = () => { onUpdate(student.id, draft); setEditing(false); };

  const handleGenerateReport = async () => {
    if (!lessonNotes.trim()) return;
    setGeneratingReport(true);
    try {
      const report = await generateLessonReport(student, lessonNotes);
      setReportResult(report);
      onAddLog(student.id, { date: new Date().toISOString().split('T')[0], notes: lessonNotes, aiReport: report });
      setLessonNotes('');
    } catch (e) {
      setReportResult('Error generating report. Check your API key in Settings.');
    }
    setGeneratingReport(false);
  };

  const logs = [...(student.lessonLogs || [])].reverse();

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-violet-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{student.name}</h2>
            <p className="text-violet-200 text-sm">{student.day} {student.time} · {student.location} · {student.sessions} min</p>
          </div>
          <div className="flex gap-2">
            {!editing
              ? <button onClick={() => setEditing(true)} className="p-2 hover:bg-violet-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
              : <>
                  <button onClick={save} className="flex items-center gap-1 px-3 py-1 bg-white text-violet-700 rounded-lg text-sm font-medium"><Check className="w-3.5 h-3.5" />Save</button>
                  <button onClick={() => { setDraft({ ...student }); setEditing(false); }} className="p-2 hover:bg-violet-600 rounded-lg"><X className="w-4 h-4" /></button>
                </>
            }
            <button onClick={onClose} className="p-2 hover:bg-violet-600 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick info row */}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <select value={draft.experienceLevel || ''} onChange={e => setDraft(p => ({ ...p, experienceLevel: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm">
                  <option value="">Level</option>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
                <input type="number" placeholder="Age" value={draft.age || ''} onChange={e => setDraft(p => ({ ...p, age: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm w-20" />
                <select value={draft.status || 'Active'} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm">
                  <option>Active</option><option>Discontinued</option><option>Trial</option>
                </select>
              </>
            ) : (
              <>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[student.experienceLevel] || 'bg-gray-100 text-gray-500'}`}>{student.experienceLevel || 'Level TBD'}</span>
                {student.age && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Age {student.age}</span>}
                {student.levelUpRank && <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">⭐ Level {student.levelUpRank}</span>}
                {student.entryPoint && <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">🧠 {student.entryPoint}</span>}
              </>
            )}
          </div>

          {/* Pedagogical fields */}
          <div className="space-y-3">
            {FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  <Icon className="w-3.5 h-3.5" />{label}
                </label>
                {editing
                  ? <textarea value={draft[key] || ''} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-violet-300 focus:border-transparent" />
                  : <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 min-h-[36px]">{student[key] || <span className="text-gray-400 italic">{placeholder}</span>}</p>
                }
              </div>
            ))}
          </div>

          {/* Lesson Log */}
          <div className="border-t pt-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><NotebookPen className="w-4 h-4 text-violet-600" />Lesson Log & Report Generator</h3>
            <textarea
              value={lessonNotes}
              onChange={e => setLessonNotes(e.target.value)}
              placeholder="Quick notes from today's lesson... (e.g. 'Worked on LH of Pirates. Nailed the rhythm pattern in bar 4. Still rushing the jump in bar 8. Assigned mm 1-16 HT slow.')"
              rows={4}
              className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
            />
            <button
              onClick={handleGenerateReport}
              disabled={!lessonNotes.trim() || generatingReport}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              {generatingReport ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Report…</> : <><Wand2 className="w-4 h-4" />Generate Lesson Report</>}
            </button>

            {reportResult && (
              <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Generated Report</p>
                  <button onClick={() => { navigator.clipboard.writeText(reportResult); }} className="text-xs text-violet-600 hover:underline">Copy</button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reportResult}</p>
              </div>
            )}
          </div>

          {/* Past logs */}
          {logs.length > 0 && (
            <div className="border-t pt-4">
              <button onClick={() => setShowLogs(p => !p)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-violet-700">
                {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Past Logs ({logs.length})
              </button>
              {showLogs && (
                <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                      <p className="font-semibold text-gray-500 mb-1">{log.date}</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{log.notes}</p>
                      {log.aiReport && <p className="mt-2 text-violet-700 border-t pt-2 whitespace-pre-wrap">{log.aiReport}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ChangePreview ─────────────────────────────────────────────────────────────
const actionLabel = (a) => ({ discontinue: 'Discontinue', add: 'Add new student', update: 'Update' }[a] || a);
const actionColor = (a) => ({ discontinue: 'text-red-600 bg-red-50', add: 'text-green-600 bg-green-50', update: 'text-blue-600 bg-blue-50' }[a] || 'text-gray-600 bg-gray-50');

const ChangePreview = ({ changes, onConfirm, onCancel }) => (
  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mt-3">
    <p className="text-sm font-semibold text-violet-800 mb-3">Proposed Changes — review and confirm:</p>
    <div className="space-y-2">
      {changes.map((c, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(c.action)}`}>{actionLabel(c.action)}</span>
          <div>
            <span className="font-medium text-gray-800">{c.studentName}</span>
            {c.fields && Object.keys(c.fields).length > 0 && (
              <span className="text-gray-500 text-xs ml-2">
                {Object.entries(c.fields).filter(([k]) => k !== 'name').map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-2 mt-4">
      <button onClick={onConfirm} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
        <Check className="w-3.5 h-3.5" />Apply Changes
      </button>
      <button onClick={onCancel} className="px-4 py-2 bg-white border text-gray-600 rounded-lg text-sm hover:bg-gray-50">
        Cancel
      </button>
    </div>
  </div>
);

// ── Main Studio Page ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'roster',   label: 'All Students', icon: Users },
  { id: 'monday',   label: 'Monday',       icon: Calendar },
  { id: 'thursday', label: 'Thursday',     icon: Calendar },
  { id: 'saturday', label: 'Saturday',     icon: Calendar },
];

export default function Studio() {
  const { addMeeting } = useApp();
  const { students, addStudent, updateStudent, addLessonLog } = useStudio();
  const [tab, setTab] = useState('roster');
  const [updateText, setUpdateText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [pendingChanges, setPendingChanges] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', day: 'Monday', time: '', location: 'Annandale', sessions: 30, experienceLevel: 'Beginner', status: 'Active' });
  const [importedCount, setImportedCount] = useState(0);

  const activeStudents = students.filter(s => s.status === 'Active');

  const filterByDay = (day) => sortStudents(activeStudents.filter(s => s.day === day));

  const displayed = tab === 'roster'   ? sortStudents(activeStudents)
                  : tab === 'monday'   ? filterByDay('Monday')
                  : tab === 'thursday' ? filterByDay('Thursday')
                  : filterByDay('Saturday');

  const stats = {
    total: activeStudents.length,
    annandale: activeStudents.filter(s => s.location === 'Annandale').length,
    fairfax: activeStudents.filter(s => s.location === 'Fairfax').length,
  };

  // AI roster update
  const handleParseUpdate = async () => {
    if (!updateText.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const changes = await parseRosterUpdate(updateText, students);
      if (!changes || changes.length === 0) {
        setParseError('No changes detected. Try rephrasing — e.g. "I lost Bruce, added Cristal on Thursday at 6:30"');
      } else {
        setPendingChanges(changes);
      }
    } catch (e) {
      setParseError(e.message || 'Parse error — check your API key in Settings.');
    }
    setParsing(false);
  };

  const applyChanges = () => {
    if (!pendingChanges) return;
    pendingChanges.forEach(change => {
      if (change.action === 'discontinue') {
        const match = students.find(s => s.name.toLowerCase().includes(change.studentName.toLowerCase()));
        if (match) updateStudent(match.id, { status: 'Discontinued' });
      } else if (change.action === 'update') {
        const match = students.find(s => s.name.toLowerCase().includes(change.studentName.toLowerCase()));
        if (match) updateStudent(match.id, change.fields || {});
      } else if (change.action === 'add') {
        const defaults = { status: 'Active', sessions: 30, experienceLevel: 'Beginner', dragonMusic: '', acquiredSkills: '', thePrescription: '', theTrigger: '', entryPoint: '', currentFocus: '', currentGoal: '', currentChallenges: '', earTraining: '', aceBalance: 0, levelUpRank: 1 };
        addStudent({ ...defaults, ...(change.fields || {}), name: change.studentName });
      }
    });
    setPendingChanges(null);
    setUpdateText('');
  };

  const handleImportToCalendar = () => {
    const DAY_NUM = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const parseTime12 = (t) => {
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return { h: 9, min: 0 };
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return { h, min };
    };
    const nextWeekday = (dayName, timeStr) => {
      const target = DAY_NUM[dayName];
      const { h, min } = parseTime12(timeStr);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let ahead = (target - now.getDay() + 7) % 7 || 7;
      const d = new Date(now.getTime() + ahead * 86400000);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    };
    const toImport = activeStudents.filter(s => s.day && s.time);
    if (!toImport.length) return;
    const now = new Date().toISOString();
    for (const s of toImport) {
      addMeeting({
        id: crypto.randomUUID(),
        title: `${s.name} — Piano Lesson`,
        date: nextWeekday(s.day, s.time),
        location: `${s.location} — Expressions Music Academy`,
        notes: `${s.sessions}-min lesson`,
        recurrence: { type: 'weekly' },
        createdAt: now,
        updatedAt: now,
      });
    }
    setImportedCount(toImport.length);
  };

  const handleAddManual = () => {
    if (!newStudent.name.trim()) return;
    addStudent({ ...newStudent, dragonMusic: '', acquiredSkills: '', thePrescription: '', theTrigger: '', entryPoint: '', currentFocus: '', currentGoal: '', currentChallenges: '', earTraining: '', aceBalance: 0, levelUpRank: 1 });
    setNewStudent({ name: '', day: 'Monday', time: '', location: 'Annandale', sessions: 30, experienceLevel: 'Beginner', status: 'Active' });
    setShowAddForm(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl"><Music2 className="w-6 h-6 text-violet-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Studio</h1>
              <p className="text-sm text-gray-500">Expressions Music Academy</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full font-medium">{stats.total} active</span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full">Annandale {stats.annandale}</span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full">Fairfax {stats.fairfax}</span>
          </div>
          <button
            onClick={handleImportToCalendar}
            disabled={importedCount > 0}
            title={importedCount > 0
              ? `${importedCount} lessons added to Calendar as weekly recurring meetings`
              : `Import all ${activeStudents.filter(s => s.day && s.time).length} active students as weekly recurring calendar meetings`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              importedCount > 0
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {importedCount > 0
              ? <><CalendarCheck className="w-4 h-4" />{importedCount} in Calendar</>
              : <><Calendar className="w-4 h-4" />→ Calendar</>}
          </button>
          <button onClick={() => setShowAddForm(p => !p)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
            <Plus className="w-4 h-4" />Add Student
          </button>
        </div>
      </div>

      {/* Add student form */}
      {showAddForm && (
        <div className="bg-white border rounded-xl p-4 mb-5 grid grid-cols-2 gap-3">
          <input className="col-span-2 border rounded-lg px-3 py-2 text-sm" placeholder="Student name *" value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={newStudent.day} onChange={e => setNewStudent(p => ({ ...p, day: e.target.value }))}>
            <option>Monday</option><option>Thursday</option><option>Saturday</option>
          </select>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Time (e.g. 5:00 PM)" value={newStudent.time} onChange={e => setNewStudent(p => ({ ...p, time: e.target.value }))} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={newStudent.location} onChange={e => setNewStudent(p => ({ ...p, location: e.target.value }))}>
            <option>Annandale</option><option>Fairfax</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={newStudent.experienceLevel} onChange={e => setNewStudent(p => ({ ...p, experienceLevel: e.target.value }))}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button onClick={handleAddManual} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Add</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* AI Roster Update Bar */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-semibold text-violet-800">AI Roster Update</p>
          <span className="text-xs text-violet-500">— describe any change in plain English</span>
        </div>
        <div className="flex gap-3">
          <textarea
            value={updateText}
            onChange={e => { setUpdateText(e.target.value); setParseError(''); }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParseUpdate(); }}
            placeholder={'e.g. "I lost Bruce. Added Cristal on Thursday at 6:30. Carlos Farraj is in Addison\'s old Thursday spot at 5pm."'}
            rows={2}
            className="flex-1 border-0 bg-white rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-violet-300 shadow-sm"
          />
          <button
            onClick={handleParseUpdate}
            disabled={!updateText.trim() || parsing}
            className="shrink-0 flex items-center gap-2 px-5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {parsing ? 'Parsing…' : 'Parse'}
          </button>
        </div>
        {parseError && <p className="mt-2 text-xs text-red-600">{parseError}</p>}
        {pendingChanges && (
          <ChangePreview changes={pendingChanges} onConfirm={applyChanges} onCancel={() => setPendingChanges(null)} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" />{label}
            {id !== 'roster' && <span className="text-xs ml-1 opacity-60">{filterByDay(id.charAt(0).toUpperCase() + id.slice(1)).length}</span>}
          </button>
        ))}
      </div>

      {/* Student grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Music2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No students in this view</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map(s => (
            <StudentCard key={s.id} student={s} onClick={setSelectedStudent} />
          ))}
        </div>
      )}

      {/* Student detail panel */}
      {selectedStudent && (
        <StudentDetailPanel
          student={students.find(s => s.id === selectedStudent.id) || selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdate={(id, updates) => { updateStudent(id, updates); setSelectedStudent(s => ({ ...s, ...updates })); }}
          onAddLog={addLessonLog}
        />
      )}
    </div>
  );
}
