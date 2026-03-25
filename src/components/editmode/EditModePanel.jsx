import { Palette, Type, LayoutIcon, RotateCcw, X, PenLine } from 'lucide-react';
import { useEditMode } from '../../context/EditModeContext';

const PRESET_COLORS = [
  { label: 'Teal (default)', value: '#097c87' },
  { label: 'Indigo',         value: '#4f46e5' },
  { label: 'Violet',         value: '#7c3aed' },
  { label: 'Rose',           value: '#e11d48' },
  { label: 'Amber',          value: '#d97706' },
  { label: 'Emerald',        value: '#059669' },
  { label: 'Blue',           value: '#2563eb' },
  { label: 'Slate',          value: '#475569' },
];

const FONT_SCALES = [
  { label: 'S',  value: '13px', title: 'Small'       },
  { label: 'M',  value: '15px', title: 'Normal'      },
  { label: 'L',  value: '17px', title: 'Large'       },
  { label: 'XL', value: '19px', title: 'Extra Large' },
];

const DENSITIES = [
  { label: 'Compact',      value: '16px' },
  { label: 'Normal',       value: '24px' },
  { label: 'Comfortable',  value: '36px' },
];

const SegmentedControl = ({ options, current, onChange, valueKey = 'value', labelKey = 'label' }) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
    {options.map(opt => (
      <button
        key={opt[valueKey]}
        title={opt.title || opt[labelKey]}
        onClick={() => onChange(opt[valueKey])}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          current === opt[valueKey]
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {opt[labelKey]}
      </button>
    ))}
  </div>
);

const Divider = () => <div className="w-px h-5 bg-gray-200 flex-shrink-0" />;

/**
 * EditModePanel — floating toolbar that appears at the bottom of the screen
 * when Edit Mode is active.  Lets non-technical users change:
 *   • Accent color (8 presets + custom color picker)
 *   • Font size (S / M / L / XL)
 *   • Page density (Compact / Normal / Comfortable)
 * All changes are saved to localStorage and applied immediately.
 */
const EditModePanel = () => {
  const { isEditMode, setIsEditMode, setStyleVar, overrides, resetAll } = useEditMode();

  if (!isEditMode) return null;

  const currentColor   = overrides.styles?.['--color-primary'] || '#097c87';
  const currentFont    = overrides.styles?.['--font-base']     || '15px';
  const currentPadding = overrides.styles?.['--page-padding']  || '24px';

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 select-none"
      style={{ boxShadow: '0 8px 40px rgb(0 0 0 / 0.18), 0 2px 8px rgb(0 0 0 / 0.08)' }}
    >
      {/* ── Label ── */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200">
        <PenLine size={13} className="text-primary-600" />
        <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider whitespace-nowrap">
          Edit Mode
        </span>
      </div>

      {/* ── Accent Color ── */}
      <div className="flex items-center gap-1.5">
        <Palette size={12} className="text-gray-400 flex-shrink-0" />
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map(c => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setStyleVar('--color-primary', c.value)}
              className="w-4 h-4 rounded-full transition-transform hover:scale-125 flex-shrink-0"
              style={{
                backgroundColor: c.value,
                outline: currentColor === c.value ? `2px solid ${c.value}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
          {/* Custom color picker */}
          <label className="w-5 h-5 rounded-full overflow-hidden cursor-pointer border border-gray-300 flex-shrink-0" title="Custom color">
            <input
              type="color"
              value={currentColor}
              onChange={e => setStyleVar('--color-primary', e.target.value)}
              className="opacity-0 w-0 h-0"
            />
            <span
              className="block w-full h-full rounded-full"
              style={{
                background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
              }}
            />
          </label>
        </div>
      </div>

      <Divider />

      {/* ── Font Size ── */}
      <div className="flex items-center gap-1.5">
        <Type size={12} className="text-gray-400 flex-shrink-0" />
        <SegmentedControl
          options={FONT_SCALES}
          current={currentFont}
          onChange={v => setStyleVar('--font-base', v)}
        />
      </div>

      <Divider />

      {/* ── Page Density ── */}
      <div className="flex items-center gap-1.5">
        <LayoutIcon size={12} className="text-gray-400 flex-shrink-0" />
        <SegmentedControl
          options={DENSITIES}
          current={currentPadding}
          onChange={v => setStyleVar('--page-padding', v)}
        />
      </div>

      <Divider />

      {/* ── Reset ── */}
      <button
        onClick={resetAll}
        title="Reset all customizations to defaults"
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
      >
        <RotateCcw size={11} />
        Reset
      </button>

      {/* ── Close / Exit ── */}
      <button
        onClick={() => setIsEditMode(false)}
        title="Exit Edit Mode"
        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default EditModePanel;
