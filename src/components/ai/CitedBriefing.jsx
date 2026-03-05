import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_COLORS = {
  grant:      'bg-blue-100 text-blue-800 border-blue-200',
  budget:     'bg-green-100 text-green-800 border-green-200',
  budget_cat: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  task:       'bg-orange-100 text-orange-800 border-orange-200',
  pr:         'bg-yellow-100 text-yellow-800 border-yellow-200',
  tr:         'bg-sky-100 text-sky-800 border-sky-200',
  meeting:    'bg-violet-100 text-violet-800 border-violet-200',
  person:     'bg-pink-100 text-pink-800 border-pink-200',
  kb:         'bg-purple-100 text-purple-800 border-purple-200',
};

// Inline citation badge with hover tooltip
const Citation = ({ num, reference }) => {
  const [open, setOpen] = useState(false);
  const colors = reference ? (TYPE_COLORS[reference.type] || 'bg-gray-100 text-gray-700 border-gray-200') : 'bg-gray-100 text-gray-500';

  return (
    <span className="relative inline-block align-super">
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border cursor-pointer transition-all hover:scale-110 ${colors}`}
        title={reference ? `${reference.label}: ${reference.detail}` : `[${num}]`}
      >
        {num}
      </button>
      {open && reference && (
        <>
          {/* Backdrop */}
          <span
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl border border-gray-700">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1.5 ${TYPE_COLORS[reference.type] || 'bg-gray-700 text-white'}`}>
              {reference.label}
            </span>
            <br />
            <span className="leading-relaxed text-gray-200">{reference.detail}</span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </span>
        </>
      )}
    </span>
  );
};

// Render a line of text with [N] citations replaced by Citation components
const renderWithCitations = (line, allRefs) => {
  const parts = line.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = parseInt(match[1]);
      const ref = allRefs[num - 1];
      return <Citation key={i} num={num} reference={ref} />;
    }
    return <span key={i}>{part}</span>;
  });
};

// Very simple markdown-to-JSX: bold, headers, bullets
const renderMarkdownLine = (line, allRefs, idx) => {
  if (line.startsWith('### ')) return <h3 key={idx} className="text-sm font-bold text-gray-800 mt-3 mb-1">{renderWithCitations(line.slice(4), allRefs)}</h3>;
  if (line.startsWith('## '))  return <h2 key={idx} className="text-sm font-extrabold text-gray-900 mt-4 mb-1 uppercase tracking-wide">{renderWithCitations(line.slice(3), allRefs)}</h2>;
  if (line.startsWith('# '))   return <h1 key={idx} className="text-base font-extrabold text-gray-900 mt-4 mb-2">{renderWithCitations(line.slice(2), allRefs)}</h1>;
  if (line.startsWith('- ') || line.startsWith('• ')) return <li key={idx} className="ml-4 text-xs text-gray-700 leading-relaxed list-disc">{renderWithCitations(line.slice(2), allRefs)}</li>;
  if (line.startsWith('**') && line.endsWith('**')) return <p key={idx} className="text-xs font-bold text-gray-800 mt-2">{renderWithCitations(line.slice(2, -2), allRefs)}</p>;
  if (line === '' || line === '---') return <div key={idx} className="h-2" />;
  return <p key={idx} className="text-xs text-gray-700 leading-relaxed">{renderWithCitations(line, allRefs)}</p>;
};

const CitedBriefing = ({ text, references = [], allRefs = [] }) => {
  const [showSources, setShowSources] = useState(false);

  // Split on raw data block separator so we only render the human-readable part
  const displayText = text.split('================================================================================')[0].trim();
  const lines = displayText.split('\n');

  return (
    <div className="space-y-1">
      {/* Rendered briefing */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-72 overflow-y-auto space-y-0.5">
        {lines.map((line, i) => renderMarkdownLine(line, allRefs, i))}
      </div>

      {/* Sources panel */}
      {references.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-600">
              {references.length} source{references.length !== 1 ? 's' : ''} cited
            </span>
            {showSources ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          {showSources && (
            <div className="divide-y divide-gray-100">
              {references.map((ref, i) => {
                const refNum = allRefs.indexOf(ref) + 1;
                const colors = TYPE_COLORS[ref.type] || 'bg-gray-100 text-gray-700 border-gray-200';
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 bg-white hover:bg-gray-50">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${colors}`}>
                      {refNum}
                    </span>
                    <div className="min-w-0">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mb-0.5 ${colors}`}>
                        {ref.label}
                      </span>
                      <p className="text-xs text-gray-600 leading-relaxed">{ref.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitedBriefing;
