import { useRef, useState, useEffect } from 'react';
import { useEditMode } from '../../context/EditModeContext';

/**
 * EditableText — renders as the given `tag` (default <span>) normally.
 * In Edit Mode: shows a subtle ring on hover; clicking opens an inline
 * input so the user can rename the text without any code knowledge.
 * The new value is saved to localStorage and persists across page loads.
 *
 * Props:
 *   id           — unique key for localStorage (e.g. "title-dashboard")
 *   defaultText  — the fallback/default string
 *   tag          — HTML tag to render (default "span")
 *   dark         — true when text sits on a dark/image background
 *   className    — forwarded to the rendered tag
 */
const EditableText = ({
  id,
  defaultText,
  tag: Tag = 'span',
  dark = false,
  className = '',
  ...rest
}) => {
  const { isEditMode, getText, setText } = useEditMode();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const displayText = getText(id, defaultText);

  // Auto-focus + select all when entering edit state
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(displayText);
    setEditing(true);
  };

  const commit = () => {
    const val = draft.trim() || defaultText;
    setText(id, val);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') setEditing(false);
  };

  // ── Normal render (not in edit mode) ─────────────────────────────────
  if (!isEditMode) {
    return <Tag className={className} {...rest}>{displayText}</Tag>;
  }

  // ── Edit mode: inline input while editing ─────────────────────────────
  if (editing) {
    const inputCls = dark
      ? 'bg-transparent text-white border-b-2 border-white outline-none caret-white w-full'
      : 'bg-transparent border-b-2 border-primary-500 outline-none caret-primary-600 w-full';

    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={`${className} ${inputCls}`}
        style={{ minWidth: '80px' }}
        aria-label={`Edit: ${defaultText}`}
      />
    );
  }

  // ── Edit mode: hoverable ring + pencil hint ────────────────────────────
  const ringCls = dark
    ? 'ring-1 ring-white/30 hover:ring-white/60 rounded px-1 -mx-1 cursor-text group'
    : 'ring-1 ring-primary-400/40 hover:ring-primary-500 rounded px-1 -mx-1 cursor-text group';

  return (
    <Tag
      className={`${className} ${ringCls} transition-shadow`}
      onClick={startEdit}
      title="Click to rename"
      {...rest}
    >
      {displayText}
      {/* pencil emoji — visible on hover */}
      <span className="ml-1.5 text-[0.55em] align-middle opacity-0 group-hover:opacity-70 transition-opacity select-none">
        ✏️
      </span>
    </Tag>
  );
};

export default EditableText;
