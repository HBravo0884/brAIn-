import { useState, useEffect, useRef } from 'react';
import { X, CalendarPlus, CheckSquare } from 'lucide-react';

/**
 * CaptureBar — quick capture overlay triggered by pressing Space on any page.
 * Press Enter to save to Quick To-Do.
 * Press Escape or click backdrop to dismiss.
 */
const CaptureBar = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDate, setShowDate] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) { onClose(); return; }
    onSave({ text: trimmed, dueDate: dueDate || null });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Capture panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800">
          <CheckSquare size={16} className="text-primary-600 dark:text-primary-400 shrink-0" />
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">Quick Capture</span>
          <span className="ml-auto text-xs text-primary-500 dark:text-primary-400">Enter to save · Esc to dismiss</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-md transition-colors text-primary-500 dark:text-primary-400"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input */}
        <div className="p-4">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you need to do? (Enter to save, Esc to dismiss)"
            rows={2}
            className="w-full px-3 py-2 text-base bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none"
          />

          {/* Optional due date row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowDate(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <CalendarPlus size={14} />
              {showDate ? 'Remove due date' : 'Add due date'}
            </button>

            {showDate && (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-400"
              />
            )}

            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="ml-auto px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save to To-Do
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureBar;
