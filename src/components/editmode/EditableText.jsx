import { useRef, useState, useCallback } from 'react';
import { useEditMode } from '../../context/EditModeContext';
import ElementStylePanel from './ElementStylePanel';

/**
 * EditableText — renders as the given `tag` normally.
 * In Edit Mode:
 *   • Hover  → subtle ring + pencil hint
 *   • Click  → opens floating ElementStylePanel (text / color / font tabs)
 * Persists text content + per-element styles to localStorage.
 *
 * Props:
 *   id           — unique key for localStorage (e.g. "title-dashboard")
 *   defaultText  — the fallback/default string
 *   tag          — HTML tag to render (default "span")
 *   dark         — true when element sits on a dark/image background
 *   className    — forwarded to the rendered tag
 */
const EditableText = ({
  id,
  defaultText,
  tag: Tag = 'span',
  dark = false,
  className = '',
  style: externalStyle = {},
  ...rest
}) => {
  const { isEditMode, getText, getElementStyle } = useEditMode();
  const [panelOpen, setPanelOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const elemRef = useRef(null);

  const displayText  = getText(id, defaultText);
  const elementStyle = getElementStyle(id);

  // Build inline style from stored overrides + external style prop
  const inlineStyle = {
    ...externalStyle,
    ...(elementStyle.color      && { color:      elementStyle.color }),
    ...(elementStyle.fontFamily && { fontFamily: `"${elementStyle.fontFamily}", sans-serif` }),
    ...(elementStyle.fontSize   && { fontSize:   elementStyle.fontSize }),
    ...(elementStyle.fontWeight && { fontWeight: elementStyle.fontWeight }),
  };

  const openPanel = useCallback((e) => {
    e.stopPropagation();
    if (elemRef.current) {
      setAnchorRect(elemRef.current.getBoundingClientRect());
    }
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setAnchorRect(null);
  }, []);

  // ── Normal render (not in edit mode) ─────────────────────────────────
  if (!isEditMode) {
    return (
      <Tag className={className} style={Object.keys(inlineStyle).length ? inlineStyle : undefined} {...rest}>
        {displayText}
      </Tag>
    );
  }

  // ── Edit mode: ring on hover + panel on click ──────────────────────
  const ringCls = dark
    ? 'ring-1 ring-white/30 hover:ring-white/70 rounded px-0.5 cursor-pointer group'
    : 'ring-1 ring-primary-400/40 hover:ring-primary-500 rounded px-0.5 cursor-pointer group';

  return (
    <>
      <Tag
        ref={elemRef}
        className={`${className} ${ringCls} transition-shadow relative`}
        style={Object.keys(inlineStyle).length ? inlineStyle : undefined}
        onClick={openPanel}
        title="Click to edit"
        {...rest}
      >
        {displayText}
        {/* pencil hint — visible on hover */}
        <span className="ml-1 text-[0.55em] align-middle opacity-0 group-hover:opacity-80 transition-opacity select-none pointer-events-none">
          ✏️
        </span>
      </Tag>

      {panelOpen && (
        <ElementStylePanel
          elementId={id}
          defaultText={defaultText}
          anchorRect={anchorRect}
          onClose={closePanel}
        />
      )}
    </>
  );
};

export default EditableText;
