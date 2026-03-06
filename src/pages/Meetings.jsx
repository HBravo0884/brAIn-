import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Users, Plus, X, Edit2, Trash2, Download, FileText, Search, CheckSquare, Mic, Loader2 } from 'lucide-react';
import { extractMeetingFromTranscript } from '../utils/ai';

const Meetings = () => {
  const { meetings, grants, knowledgeDocs, addMeeting, updateMeeting, deleteMeeting, addTask, addKnowledgeDoc, updateKnowledgeDoc } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [actionItemPrompt, setActionItemPrompt] = useState(null); // { lines: string[], grantId: string }
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [parsingTranscript, setParsingTranscript] = useState(false);
  const [parseError, setParseError] = useState('');
  const [profileUpdates, setProfileUpdates] = useState([]); // names updated/created in KB
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    grantId: '',
    attendees: '',
    agenda: '',
    notes: '',
    transcription: '',
    actionItems: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      grantId: '',
      attendees: '',
      agenda: '',
      notes: '',
      transcription: '',
      actionItems: '',
    });
    setSelectedMeeting(null);
    setViewMode(false);
  };

  const handleOpenModal = (meeting = null, isView = false) => {
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        date: meeting.date || '',
        grantId: meeting.grantId || '',
        attendees: meeting.attendees || '',
        agenda: meeting.agenda || '',
        notes: meeting.notes || '',
        transcription: meeting.transcription || '',
        actionItems: meeting.actionItems || '',
      });
      setSelectedMeeting(meeting);
      setViewMode(isView);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => { resetForm(); setProfileUpdates([]); }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }

    if (selectedMeeting) {
      updateMeeting(selectedMeeting.id, formData);
    } else {
      addMeeting(formData);
    }

    // Check for action items to convert to tasks
    const actionLines = (formData.actionItems || '')
      .split('\n')
      .map(l => l.replace(/^[-*•]\s*/, '').trim())
      .filter(l => l.length > 0);

    if (actionLines.length > 0) {
      setActionItemPrompt({ lines: actionLines, grantId: formData.grantId });
    }

    handleCloseModal();
  };

  const handleConvertActionItems = () => {
    if (!actionItemPrompt) return;
    actionItemPrompt.lines.forEach(line => {
      addTask({
        title: line,
        status: 'To Do',
        priority: 'Medium',
        grantId: actionItemPrompt.grantId || '',
        source: 'meeting',
        createdAt: new Date().toISOString(),
      });
    });
    setActionItemPrompt(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      deleteMeeting(id);
      handleCloseModal();
    }
  };

  const handleExportTranscription = (meeting) => {
    const content = `Meeting: ${meeting.title}
Date: ${meeting.date ? new Date(meeting.date).toLocaleString() : 'N/A'}
Attendees: ${meeting.attendees || 'N/A'}

TRANSCRIPTION:
${meeting.transcription || 'No transcription available'}

---
Action Items:
${meeting.actionItems || 'None'}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/\s+/g, '_')}_transcription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGrantName = (grantId) => {
    const grant = grants.find(g => g.id === grantId);
    return grant ? grant.title : 'No grant linked';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const [transcriptSearch, setTranscriptSearch] = useState('');

  const getAttendeesCount = (attendees) => {
    if (!attendees) return 0;
    return attendees.split(',').filter(a => a.trim()).length;
  };

  const handleParseTranscript = async () => {
    if (!transcriptText.trim()) return;
    setParsingTranscript(true);
    setParseError('');
    try {
      const extracted = await extractMeetingFromTranscript(transcriptText);

      // Pre-fill the meeting form
      setFormData({
        title: extracted.title || '',
        date: extracted.date || '',
        grantId: '',
        attendees: Array.isArray(extracted.attendees)
          ? extracted.attendees.join(', ')
          : (extracted.attendees || ''),
        agenda: extracted.agenda || '',
        notes: extracted.notes || '',
        transcription: transcriptText,
        actionItems: Array.isArray(extracted.actionItems)
          ? extracted.actionItems.join('\n')
          : (extracted.actionItems || ''),
      });

      // Auto-build/update stakeholder profiles in KB
      const updatedNames = [];
      const meetingLabel = extracted.title || 'Meeting';
      const meetingDate = extracted.date || new Date().toISOString().split('T')[0];

      for (const s of (extracted.stakeholders || [])) {
        if (!s.name?.trim()) continue;
        const sectionLines = [
          `### ${meetingLabel} — ${meetingDate}`,
        ];
        if (s.role) sectionLines.push(`Role: ${s.role}`);
        if (s.keyStatements) sectionLines.push(s.keyStatements);
        if (s.commitments) sectionLines.push(`Commitments: ${s.commitments}`);
        const section = sectionLines.join('\n');

        // Find existing KB doc for this person (case-insensitive name match)
        const existing = knowledgeDocs.find(
          d => d.title?.toLowerCase() === s.name.toLowerCase() &&
               (d.category === 'Stakeholder Profile' || d.tags?.includes('stakeholder'))
        );

        if (existing) {
          updateKnowledgeDoc(existing.id, {
            content: (existing.content || '') + '\n\n' + section,
          });
          updatedNames.push({ name: s.name, action: 'updated' });
        } else {
          addKnowledgeDoc({
            title: s.name,
            category: 'Stakeholder Profile',
            content: `# Stakeholder Profile: ${s.name}\n${s.role ? `Role: ${s.role}\n` : ''}\n${section}`,
            tags: 'stakeholder, auto-generated',
          });
          updatedNames.push({ name: s.name, action: 'created' });
        }
      }

      setProfileUpdates(updatedNames);
      setSelectedMeeting(null);
      setViewMode(false);
      setShowTranscriptModal(false);
      setTranscriptText('');
      setShowModal(true);
    } catch (err) {
      setParseError(err.message || 'Failed to parse transcript. Check your API key in Settings.');
    } finally {
      setParsingTranscript(false);
    }
  };

  // Transcript / notes search across all meetings
  const searchResults = useMemo(() => {
    const q = transcriptSearch.trim().toLowerCase();
    if (!q) return [];
    return meetings
      .filter(m =>
        m.transcription?.toLowerCase().includes(q) ||
        m.notes?.toLowerCase().includes(q) ||
        m.agenda?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q) ||
        m.attendees?.toLowerCase().includes(q)
      )
      .map(m => {
        // find snippet around the keyword
        const fields = [
          { label: 'Transcription', text: m.transcription },
          { label: 'Notes',         text: m.notes         },
          { label: 'Agenda',        text: m.agenda        },
        ];
        let snippet = null;
        for (const f of fields) {
          const idx = f.text?.toLowerCase().indexOf(q);
          if (idx !== -1) {
            const start = Math.max(0, idx - 60);
            const end   = Math.min(f.text.length, idx + q.length + 80);
            snippet = {
              field: f.label,
              text:  (start > 0 ? '…' : '') + f.text.slice(start, end) + (end < f.text.length ? '…' : ''),
              matchStart: idx - start + (start > 0 ? 1 : 0),
              matchLen: q.length,
            };
            break;
          }
        }
        return { meeting: m, snippet };
      });
  }, [transcriptSearch, meetings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">Manage meetings with transcription support for NotebookLM analysis</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTranscriptText(''); setParseError(''); setShowTranscriptModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            title="Paste a transcript and let AI extract meeting details automatically"
          >
            <Mic size={18} />
            Import Transcript
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            New Meeting
          </button>
        </div>
      </div>

      {/* Transcript / notes search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search across all meeting transcripts, notes, and agendas…"
          value={transcriptSearch}
          onChange={e => setTranscriptSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
          title="Search for a keyword across every meeting's transcript, notes, and agenda"
        />
        {transcriptSearch && (
          <button
            onClick={() => setTranscriptSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results */}
      {transcriptSearch && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {searchResults.length === 0
              ? 'No meetings mention that keyword'
              : `${searchResults.length} meeting${searchResults.length !== 1 ? 's' : ''} mention "${transcriptSearch}"`}
          </p>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(({ meeting, snippet }) => (
                <button
                  key={meeting.id}
                  onClick={() => handleOpenModal(meeting, true)}
                  className="w-full text-left bg-white border border-primary-200 rounded-lg p-3 hover:border-primary-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{meeting.title}</span>
                    <span className="text-xs text-gray-400">{formatDate(meeting.date)}</span>
                  </div>
                  {snippet && (
                    <p className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 leading-relaxed">
                      <span className="text-gray-400 mr-1">{snippet.field}:</span>
                      {snippet.text}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
          <hr className="mt-4 border-gray-200" />
        </div>
      )}

      {/* Meetings Grid */}
      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings yet</h3>
          <p className="text-gray-600 mb-4">Create your first meeting to get started</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            New Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() => handleOpenModal(meeting, true)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{meeting.title}</h3>
                <Calendar size={20} className="text-primary-600 flex-shrink-0 ml-2" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(meeting.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  <span>{getAttendeesCount(meeting.attendees)} attendee(s)</span>
                </div>

                {meeting.grantId && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText size={16} />
                    <span className="truncate">{getGrantName(meeting.grantId)}</span>
                  </div>
                )}

                {meeting.transcription && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      Has Transcription
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {viewMode ? 'Meeting Details' : selectedMeeting ? 'Edit Meeting' : 'New Meeting'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {viewMode ? (
                // View Mode
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedMeeting.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(selectedMeeting.date)}</span>
                      </div>
                      {selectedMeeting.grantId && (
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          <span>{getGrantName(selectedMeeting.grantId)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMeeting.attendees && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Users size={18} />
                        Attendees
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMeeting.attendees}</p>
                    </div>
                  )}

                  {selectedMeeting.agenda && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Agenda</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMeeting.agenda}</p>
                    </div>
                  )}

                  {selectedMeeting.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMeeting.notes}</p>
                    </div>
                  )}

                  {selectedMeeting.transcription && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Transcription</h4>
                        <button
                          onClick={() => handleExportTranscription(selectedMeeting)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                        >
                          <Download size={16} />
                          Export
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {selectedMeeting.transcription}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedMeeting.actionItems && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMeeting.actionItems}</p>
                    </div>
                  )}

                  {/* View Mode Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setViewMode(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Edit2 size={18} />
                      Edit Meeting
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMeeting.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete Meeting
                    </button>
                  </div>
                </div>
              ) : (
                // Edit/Create Mode
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Stakeholder profiles banner */}
                  {profileUpdates.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                      <Users size={15} className="text-violet-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-violet-800 mb-1">
                          {profileUpdates.length} stakeholder profile{profileUpdates.length !== 1 ? 's' : ''} saved to Knowledge Base
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {profileUpdates.map((p, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.action === 'created' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {p.name}
                              <span className="font-normal opacity-70">{p.action === 'created' ? '+ new' : 'updated'}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setProfileUpdates([])} className="text-violet-400 hover:text-violet-600 shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grant/Aim Link</label>
                    <select
                      value={formData.grantId}
                      onChange={(e) => setFormData({ ...formData, grantId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">No grant linked</option>
                      {grants.map((grant) => (
                        <option key={grant.id} value={grant.id}>
                          {grant.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendees
                      <span className="text-gray-500 text-xs ml-2">(comma-separated)</span>
                    </label>
                    <textarea
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="2"
                      placeholder="John Doe, Jane Smith, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                    <textarea
                      value={formData.agenda}
                      onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                      placeholder="Meeting agenda..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                      placeholder="Meeting notes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transcription
                      <span className="text-gray-500 text-xs ml-2">(for NotebookLM analysis)</span>
                    </label>
                    <textarea
                      value={formData.transcription}
                      onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                      rows="12"
                      placeholder="Paste meeting transcription here for analysis with NotebookLM..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Items</label>
                    <textarea
                      value={formData.actionItems}
                      onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                      placeholder="Action items and next steps..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {selectedMeeting ? 'Update Meeting' : 'Create Meeting'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript Import Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Mic size={18} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Import from Transcript</h2>
                  <p className="text-xs text-gray-500">AI will extract meeting details automatically</p>
                </div>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={transcriptText}
                onChange={e => setTranscriptText(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-rose-400 outline-none resize-none"
                rows={14}
                placeholder="Paste your meeting transcript here...

Example:
Meeting: RWJF Grant Review
Date: March 5, 2026, 2:00 PM

Attendees: Dr. Gondré-Lewis, Héctor Bravo-Rivera, Sam Gaisie

[00:00] Dr. Gondré-Lewis: Let's review the Q2 budget status...
[00:45] Héctor: The P-Card reconciliation is due by the 15th...

Action Items:
- Héctor: Submit PRF for catering by March 10
- Sam: Pull travel receipts for CBT reimbursement"
                autoFocus
              />

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <X size={14} className="shrink-0 mt-0.5" />
                  {parseError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleParseTranscript}
                  disabled={parsingTranscript || !transcriptText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {parsingTranscript ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Parsing transcript...
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      Parse & Pre-fill Form
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Uses Claude Haiku — fast and inexpensive. Extracts title, date, attendees, agenda, notes, and action items.
                You can review and edit everything before saving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Items → Tasks conversion prompt */}
      {actionItemPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActionItemPrompt(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckSquare size={20} className="text-primary-600 dark:text-primary-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Convert {actionItemPrompt.lines.length} action item{actionItemPrompt.lines.length !== 1 ? 's' : ''} to tasks?
              </h3>
            </div>
            <ul className="mb-5 space-y-1">
              {actionItemPrompt.lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={handleConvertActionItems}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Yes, create tasks
              </button>
              <button
                onClick={() => setActionItemPrompt(null)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
