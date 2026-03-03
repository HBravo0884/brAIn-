import { X, CheckCircle, AlertTriangle, FileText, DollarSign, Award, BookMarked, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SECTION_ICONS = {
  grant:         { icon: Award,     color: 'text-primary-600', bg: 'bg-primary-50'  },
  budget:        { icon: DollarSign,color: 'text-green-600',   bg: 'bg-green-50'    },
  knowledge_doc: { icon: BookMarked,color: 'text-purple-600',  bg: 'bg-purple-50'   },
  document:      { icon: FileText,  color: 'text-orange-600',  bg: 'bg-orange-50'   },
  meeting:       { icon: FileText,  color: 'text-blue-600',    bg: 'bg-blue-50'     },
};

const SectionRow = ({ section, label }) => {
  const meta = SECTION_ICONS[section.type] || SECTION_ICONS.document;
  const Icon = meta.icon;
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${meta.bg}`}>
      <Icon size={13} className={`${meta.color} mt-0.5 flex-shrink-0`} />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
        <p className="text-xs text-gray-700 font-medium truncate" title={section.label}>{section.label}</p>
        <p className={`text-sm font-bold ${meta.color}`}>{section.displayValue}</p>
      </div>
    </div>
  );
};

const ConflictsPanel = ({ onClose }) => {
  const { conflicts, resolveConflict, clearResolvedConflicts } = useApp();

  const unresolved = conflicts.filter(c => !c.resolved);
  const resolved   = conflicts.filter(c => c.resolved);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="font-bold text-gray-900">Data Conflicts</h2>
          {unresolved.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{unresolved.length}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {unresolved.length === 0 && resolved.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle size={36} className="mx-auto text-green-400 mb-3" />
            <p className="font-semibold text-gray-700">All data is in sync</p>
            <p className="text-sm text-gray-400 mt-1">No conflicts detected across sections</p>
          </div>
        )}

        {/* Unresolved */}
        {unresolved.map(conflict => (
          <div key={conflict.id} className="border border-amber-200 rounded-xl overflow-hidden">
            {/* Conflict header */}
            <div className="px-3 py-2 bg-amber-50 flex items-center gap-2">
              <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-800">{conflict.fieldLabel}</span>
              <span className="ml-auto text-xs text-amber-600 capitalize">{conflict.source?.replace('_', ' ')}</span>
            </div>

            <div className="p-3 space-y-2">
              <SectionRow section={conflict.sectionA} label="A — Current Record" />
              <SectionRow section={conflict.sectionB} label="B — Detected In" />

              <p className="text-xs text-gray-500 px-1">Which value is correct?</p>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => resolveConflict(conflict.id, 'A')}
                  className="py-1.5 text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                >
                  Use A
                </button>
                <button
                  onClick={() => resolveConflict(conflict.id, 'B')}
                  className="py-1.5 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  Use B
                </button>
                <button
                  onClick={() => resolveConflict(conflict.id, 'dismissed')}
                  className="py-1.5 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Resolved (collapsed) */}
        {resolved.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resolved ({resolved.length})</p>
            <div className="space-y-1.5">
              {resolved.map(conflict => (
                <div key={conflict.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{conflict.fieldLabel}</p>
                    <p className="text-xs text-gray-400 truncate">{conflict.sectionA?.label}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium capitalize flex-shrink-0">
                    {conflict.resolvedWith === 'dismissed' ? 'dismissed' : `used ${conflict.resolvedWith}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {resolved.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={clearResolvedConflicts}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
            Clear Resolved Conflicts
          </button>
        </div>
      )}
    </div>
  );
};

export default ConflictsPanel;
