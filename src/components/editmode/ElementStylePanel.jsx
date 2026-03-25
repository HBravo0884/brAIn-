import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Check, Type, Palette, AlignLeft } from 'lucide-react';
import { FONTS, FONT_CATEGORIES, CATEGORY_LABELS, loadFont } from '../../data/fonts';
import { useEditMode } from '../../context/EditModeContext';

// ── Quick color swatches ────────────────────────────────────────────────────
const QUICK_COLORS = [
  { label: 'White',     value: '#ffffff' },
  { label: 'Near Black',value: '#111827' },
  { label: 'Gray 700',  value: '#374151' },
  { label: 'Gray 500',  value: '#6b7280' },
  { label: 'Primary',   value: 'var(--color-primary, #097c87)' },
  { label: 'Teal',      value: '#097c87' },
  { label: 'Cyan',      value: '#23CED9' },
  { label: 'Yellow',    value: '#F9D779' },
  { label: 'Sage',      value: '#A1CCA6' },
  { label: 'Salmon',    value: '#FCA47C' },
  { label: 'Red',       value: '#ef4444' },
  { label: 'Indigo',    value: '#4f46e5' },
];

const FONT_SIZES = [
  { label: 'XS', value: '0.75rem' },
  { label: 'S',  value: '0.875rem' },
  { label: 'M',  value: '1rem' },
  { label: 'L',  value: '1.125rem' },
  { label: 'XL', value: '1.25rem' },
  { label: '2XL',value: '1.5rem' },
  { label: '3XL',value: '1.875rem' },
  { label: '4XL',value: '2.25rem' },
];

const FONT_WEIGHTS = [
  { label: 'Light',      value: '300' },
  { label: 'Normal',     value: '400' },
  { label: 'Medium',     value: '500' },
  { label: 'SemiBold',   value: '600' },
  { label: 'Bold',       value: '700' },
  { label: 'ExtraBold',  value: '800' },
];

const TAB_ICONS = {
  text:  <AlignLeft size={13} />,
  color: <Palette size={13} />,
  font:  <Type size={13} />,
};

// ── Segmented control ───────────────────────────────────────────────────────
const Seg = ({ options, current, onChange }) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-wrap">
    {options.map(o => (
      <button
        key={o.value}
        title={o.label}
        onClick={() => onChange(o.value === current ? null : o.value)}
        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
          current === o.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/**
 * ElementStylePanel — floating inspector panel that appears near a clicked
 * editable element. Allows editing: text content, color, font family,
 * font size, and font weight.
 *
 * Props:
 *   elementId    — the element's unique id (for localStorage persistence)
 *   defaultText  — the original/default text
 *   anchorRect   — DOMRect of the target element (for positioning)
 *   onClose      — called when the panel is dismissed
 */
const ElementStylePanel = ({ elementId, defaultText, anchorRect, onClose }) => {
  const { getText, setText, getElementStyle, setElementStyle, resetElementStyle } = useEditMode();

  const [tab, setTab]         = useState('text');
  const [draft, setDraft]     = useState(getText(elementId, defaultText));
  const [fontSearch, setFontSearch] = useState('');
  const panelRef = useRef(null);

  const style   = getElementStyle(elementId);

  // ── Positioning ──────────────────────────────────────────────────────────
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect) return;
    const panelW = 320;
    const panelH = 340;
    const margin = 8;
    const vp = { w: window.innerWidth, h: window.innerHeight };

    let left = anchorRect.left;
    let top  = anchorRect.bottom + margin;

    if (left + panelW > vp.w - margin) left = vp.w - panelW - margin;
    if (left < margin) left = margin;
    if (top + panelH > vp.h - margin) top = anchorRect.top - panelH - margin;
    if (top < margin) top = margin;

    setPos({ top, left });
  }, [anchorRect]);

  // ── Click-outside to close ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Commit text before closing
        const val = draft.trim() || defaultText;
        if (val !== getText(elementId, defaultText)) setText(elementId, val);
        onClose();
      }
    };
    // Delay to avoid catching the same click that opened the panel
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 150);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [draft, defaultText, elementId, getText, setText, onClose]);

  // ── ESC to close ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const commitText = () => {
    const val = draft.trim() || defaultText;
    setText(elementId, val);
  };

  const applyColor = (color) => {
    setElementStyle(elementId, { color: color === style.color ? null : color });
  };

  const applyFont = (font) => {
    loadFont(font.name, font.file);
    setElementStyle(elementId, { fontFamily: font.name === style.fontFamily ? null : font.name });
  };

  const applySize = (v) => setElementStyle(elementId, { fontSize: v === style.fontSize ? null : v });
  const applyWeight = (v) => setElementStyle(elementId, { fontWeight: v === style.fontWeight ? null : v });

  const doReset = () => {
    resetElementStyle(elementId);
    setDraft(defaultText);
  };

  // ── Filtered fonts ────────────────────────────────────────────────────
  const filteredFonts = fontSearch.trim()
    ? FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
    : FONTS;

  // ── Render ────────────────────────────────────────────────────────────
  const panel = (
    <div
      ref={panelRef}
      className="fixed z-[200] bg-white border border-gray-200 rounded-2xl select-none overflow-hidden"
      style={{
        top: pos.top,
        left: pos.left,
        width: 320,
        boxShadow: '0 12px 48px rgb(0 0 0 / 0.18), 0 2px 8px rgb(0 0 0 / 0.08)',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1">
          {['text', 'color', 'font'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                tab === t ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {TAB_ICONS[t]}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={doReset}
            title="Reset this element to defaults"
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Tab: Text ── */}
      {tab === 'text' && (
        <div className="p-3 space-y-2">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Text Content</label>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); onClose(); } }}
            rows={3}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
            placeholder={defaultText}
            autoFocus
          />
          <div className="flex justify-end">
            <button
              onClick={() => { commitText(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Check size={11} />
              Apply
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Color ── */}
      {tab === 'color' && (
        <div className="p-3 space-y-3">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Text Color</label>

          {/* Quick swatches */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COLORS.map(c => {
              const isActive = style.color === c.value;
              return (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => applyColor(c.value)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 border border-gray-200 flex-shrink-0"
                  style={{
                    background: c.value,
                    outline: isActive ? `2.5px solid #097c87` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              );
            })}
          </div>

          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-7 h-7 rounded-full border border-gray-300"
                style={{ background: style.color || 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}
              />
              <input
                type="color"
                value={style.color?.startsWith('#') ? style.color : '#111827'}
                onChange={e => applyColor(e.target.value)}
                className="sr-only"
              />
              <span className="text-xs text-gray-500">Custom color…</span>
            </label>
          </div>

          {style.color && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono">{style.color}</span>
              <button onClick={() => applyColor(null)} className="text-red-400 hover:text-red-600 text-[10px]">
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Font ── */}
      {tab === 'font' && (
        <div className="p-3 space-y-3">
          {/* Size */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Size</label>
            <Seg options={FONT_SIZES} current={style.fontSize} onChange={applySize} />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Weight</label>
            <Seg options={FONT_WEIGHTS} current={style.fontWeight} onChange={applyWeight} />
          </div>

          {/* Font family */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Font Family {style.fontFamily && <span className="text-primary-600 normal-case font-normal">— {style.fontFamily}</span>}
            </label>
            <input
              type="text"
              placeholder="Search fonts…"
              value={fontSearch}
              onChange={e => setFontSearch(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mb-1.5 focus:outline-none focus:border-primary-400"
            />
            <div className="max-h-[140px] overflow-y-auto space-y-0.5 pr-1">
              {fontSearch.trim() === '' && (
                <button
                  onClick={() => setElementStyle(elementId, { fontFamily: null })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    !style.fontFamily ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Default (system font)
                </button>
              )}
              {FONT_CATEGORIES.map(cat => {
                const fonts = filteredFonts.filter(f => f.category === cat);
                if (!fonts.length) return null;
                return (
                  <div key={cat}>
                    {fontSearch.trim() === '' && (
                      <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-2.5 py-1 mt-1">
                        {CATEGORY_LABELS[cat]}
                      </div>
                    )}
                    {fonts.map(font => (
                      <button
                        key={font.name}
                        onClick={() => applyFont(font)}
                        onMouseEnter={() => loadFont(font.name, font.file)}
                        className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          style.fontFamily === font.name
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: `"${font.name}", sans-serif` }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(panel, document.body);
};

export default ElementStylePanel;
