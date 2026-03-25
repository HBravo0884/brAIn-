import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const EditModeContext = createContext(null);
const STORAGE_KEY = 'brain_visual_overrides';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const save = (o) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); } catch {}
};

/** Shift a hex color's brightness by `amount` (-255..255) */
function shiftHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v + amount));
  const r = clamp(n >> 16);
  const g = clamp((n >> 8) & 0xff);
  const b = clamp(n & 0xff);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Hex to rgba string */
function hexRgba(hex, alpha) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

/** Inject (or update) a <style> tag that overrides Tailwind primary-* classes */
function injectColorTheme(primary) {
  const d = shiftHex(primary, -20);   // primary-700
  const d2 = shiftHex(primary, -10);  // primary-600 hover approx
  const l = shiftHex(primary, 30);    // primary-500
  const vl = hexRgba(primary, 0.08);  // primary-50
  const ring = hexRgba(primary, 0.22);

  let el = document.getElementById('brain-color-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'brain-color-theme';
    document.head.appendChild(el);
  }
  el.textContent = `
    :root { --color-primary: ${primary}; }
    .bg-primary-600 { background-color: ${primary} !important; }
    .hover\\:bg-primary-600:hover { background-color: ${primary} !important; }
    .bg-primary-700 { background-color: ${d} !important; }
    .hover\\:bg-primary-700:hover { background-color: ${d} !important; }
    .bg-primary-500 { background-color: ${l} !important; }
    .bg-primary-50 { background-color: ${vl} !important; }
    .hover\\:bg-primary-50:hover { background-color: ${vl} !important; }
    .text-primary-600 { color: ${primary} !important; }
    .hover\\:text-primary-600:hover { color: ${primary} !important; }
    .text-primary-700 { color: ${d} !important; }
    .text-primary-500 { color: ${l} !important; }
    .text-primary-400 { color: ${l} !important; }
    .text-primary-300 { color: ${l} !important; }
    .border-primary-500 { border-color: ${l} !important; }
    .border-primary-600 { border-color: ${primary} !important; }
    .border-l-primary-600 { border-left-color: ${primary} !important; }
    .focus\\:border-primary-500:focus { border-color: ${primary} !important; }
    .focus\\:ring-primary-500\\/20 { --tw-ring-color: ${ring} !important; }
    .ring-primary-400\\/50 { --tw-ring-color: ${ring} !important; }
    .ring-primary-500 { --tw-ring-color: ${ring} !important; }
  `;
}

/** Apply font-base and page-padding CSS variables */
function applyRootVar(prop, value) {
  document.documentElement.style.setProperty(prop, value);
}

export const EditModeProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [overrides, setOverrides] = useState(load);

  // On mount: restore saved styles
  useEffect(() => {
    const styles = overrides.styles || {};
    if (styles['--color-primary']) injectColorTheme(styles['--color-primary']);
    if (styles['--font-base']) applyRootVar('--font-base', styles['--font-base']);
    if (styles['--page-padding']) applyRootVar('--page-padding', styles['--page-padding']);
  }, []); // eslint-disable-line

  const getText = useCallback(
    (id, def) => overrides.texts?.[id] ?? def,
    [overrides.texts],
  );

  const setText = useCallback((id, text) => {
    setOverrides(prev => {
      const next = { ...prev, texts: { ...(prev.texts || {}), [id]: text } };
      save(next);
      return next;
    });
  }, []);

  const setStyleVar = useCallback((prop, value) => {
    if (prop === '--color-primary') injectColorTheme(value);
    else applyRootVar(prop, value);

    setOverrides(prev => {
      const next = { ...prev, styles: { ...(prev.styles || {}), [prop]: value } };
      save(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Remove injected style tag
    document.getElementById('brain-color-theme')?.remove();
    document.documentElement.style.removeProperty('--font-base');
    document.documentElement.style.removeProperty('--page-padding');
    setOverrides({});
  }, []);

  return (
    <EditModeContext.Provider value={{
      isEditMode, setIsEditMode,
      getText, setText,
      setStyleVar, overrides,
      resetAll,
    }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode must be inside EditModeProvider');
  return ctx;
};
