import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Users, Plus, X, Edit2, Trash2, Download, FileText } from 'lucide-react';

const Meetings = () => {
  const { meetings, grants, addMeeting, updateMeeting, deleteMeeting } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState(false);
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
    setTimeout(resetForm, 300);
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

    handleCloseModal();
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
    return grant ? grant.name : 'No grant linked';
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

  const getAttendeesCount = (attendees) => {
    if (!attendees) return 0;
    return attendees.split(',').filter(a => a.trim()).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">Manage meetings with transcription support for NotebookLM analysis</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          New Meeting
        </button>
      </div>

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
                          {grant.name}
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
    </div>
  );
};

export default Meetings;
