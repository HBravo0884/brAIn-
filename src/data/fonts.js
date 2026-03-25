/**
 * Available custom fonts loaded from the Font Collection folder.
 * Each entry maps a display name → the ttf filename in /fonts/.
 * Fonts are loaded on-demand (injected via @font-face when selected).
 */

export const FONTS = [
  // ── Sans-Serif ────────────────────────────────────────────────────────────
  { name: 'Inter',              file: 'Inter.ttf',              category: 'sans-serif' },
  { name: 'DM Sans',            file: 'DM_Sans.ttf',            category: 'sans-serif' },
  { name: 'Plus Jakarta Sans',  file: 'Plus_Jakarta_Sans.ttf',  category: 'sans-serif' },
  { name: 'Outfit',             file: 'Outfit.ttf',             category: 'sans-serif' },
  { name: 'Figtree',            file: 'Figtree.ttf',            category: 'sans-serif' },
  { name: 'Geist',              file: 'Geist.ttf',              category: 'sans-serif' },
  { name: 'Mona Sans',          file: 'Mona_Sans.ttf',          category: 'sans-serif' },
  { name: 'Hubot Sans',         file: 'Hubot_Sans.ttf',         category: 'sans-serif' },
  { name: 'Space Grotesk',      file: 'Space_Grotesk.ttf',      category: 'sans-serif' },
  { name: 'Urbanist',           file: 'Urbanist.ttf',           category: 'sans-serif' },
  { name: 'Syne',               file: 'Syne.ttf',               category: 'sans-serif' },
  { name: 'Jost',               file: 'Jost.ttf',               category: 'sans-serif' },
  { name: 'Karla',              file: 'Karla.ttf',              category: 'sans-serif' },
  { name: 'Lexend',             file: 'Lexend.ttf',             category: 'sans-serif' },
  { name: 'Mulish',             file: 'Mulish.ttf',             category: 'sans-serif' },
  { name: 'Nunito Sans',        file: 'Nunito_Sans.ttf',        category: 'sans-serif' },
  { name: 'Raleway',            file: 'Raleway.ttf',            category: 'sans-serif' },
  { name: 'Montserrat',         file: 'Montserrat.ttf',         category: 'sans-serif' },
  { name: 'Lato',               file: 'Lato.ttf',               category: 'sans-serif' },
  { name: 'Open Sans',          file: 'Open_Sans.ttf',          category: 'sans-serif' },
  { name: 'Source Sans 3',      file: 'Source_Sans_3.ttf',      category: 'sans-serif' },
  { name: 'Encode Sans',        file: 'Encode_Sans.ttf',        category: 'sans-serif' },
  { name: 'Josefin Sans',       file: 'Josefin_Sans.ttf',       category: 'sans-serif' },
  { name: 'Noto Sans',          file: 'Noto_Sans.ttf',          category: 'sans-serif' },
  { name: 'Atkinson Hyperleg.', file: 'Atkinson_Hyperlegible.ttf', category: 'sans-serif' },
  { name: 'Exo 2',              file: 'Exo_2.ttf',              category: 'sans-serif' },
  { name: 'Archivo Narrow',     file: 'Archivo_Narrow.ttf',     category: 'sans-serif' },
  { name: 'Barlow Condensed',   file: 'Barlow_Condensed.ttf',   category: 'sans-serif' },
  { name: 'Funnel Display',     file: 'Funnel_Display.ttf',     category: 'sans-serif' },
  { name: 'Recursive',          file: 'Recursive.ttf',          category: 'sans-serif' },

  // ── Serif ─────────────────────────────────────────────────────────────────
  { name: 'Playfair Display',   file: 'Playfair_Display.ttf',   category: 'serif' },
  { name: 'Lora',               file: 'Lora.ttf',               category: 'serif' },
  { name: 'Merriweather',       file: 'Merriweather.ttf',       category: 'serif' },
  { name: 'Cormorant',          file: 'Cormorant.ttf',          category: 'serif' },
  { name: 'Cormorant Garamond', file: 'Cormorant_Garamond.ttf', category: 'serif' },
  { name: 'EB Garamond',        file: 'EB_Garamond.ttf',        category: 'serif' },
  { name: 'Crimson Pro',        file: 'Crimson_Pro.ttf',        category: 'serif' },
  { name: 'Libre Baskerville',  file: 'Libre_Baskerville.ttf',  category: 'serif' },
  { name: 'Libre Caslon Text',  file: 'Libre_Caslon_Text.ttf',  category: 'serif' },
  { name: 'Fraunces',           file: 'Fraunces.ttf',           category: 'serif' },
  { name: 'Bodoni Moda',        file: 'Bodoni_Moda.ttf',        category: 'serif' },
  { name: 'Instrument Serif',   file: 'Instrument_Serif.ttf',   category: 'serif' },
  { name: 'Spectral',           file: 'Spectral.ttf',           category: 'serif' },
  { name: 'Source Serif 4',     file: 'Source_Serif_4.ttf',     category: 'serif' },
  { name: 'Noto Serif',         file: 'Noto_Serif.ttf',         category: 'serif' },
  { name: 'Alegreya',           file: 'Alegreya.ttf',           category: 'serif' },
  { name: 'Alegreya Sans',      file: 'Alegreya_Sans.ttf',      category: 'serif' },
  { name: 'Arvo',               file: 'Arvo.ttf',               category: 'serif' },
  { name: 'Bitter',             file: 'Bitter.ttf',             category: 'serif' },
  { name: 'Roboto Slab',        file: 'Roboto_Slab.ttf',        category: 'serif' },
  { name: 'Crete Round',        file: 'Crete_Round.ttf',        category: 'serif' },
  { name: 'Josefin Slab',       file: 'Josefin_Slab.ttf',       category: 'serif' },
  { name: 'Zilla Slab',         file: 'Zilla_Slab.ttf',         category: 'serif' },
  { name: 'STIX Two Text',      file: 'STIX_Two_Text.ttf',      category: 'serif' },
  { name: 'Gentium Book Plus',  file: 'Gentium_Book_Plus.ttf',  category: 'serif' },
  { name: 'Philosopher',        file: 'Philosopher.ttf',        category: 'serif' },
  { name: 'Yeseva One',         file: 'Yeseva_One.ttf',         category: 'serif' },
  { name: 'Neuton',             file: 'Neuton.ttf',             category: 'serif' },

  // ── Display / Decorative ─────────────────────────────────────────────────
  { name: 'Bricolage Grotesque',file: 'Bricolage_Grotesque.ttf',category: 'display' },
  { name: 'Playfair Display SC',file: 'Playfair_Display_SC.ttf',category: 'display' },
  { name: 'DM Serif Display',   file: 'DM_Serif_Display.ttf',   category: 'display' },
  { name: 'Cinzel',             file: 'Cinzel.ttf',             category: 'display' },
  { name: 'Cinzel Decorative',  file: 'Cinzel_Decorative.ttf',  category: 'display' },
  { name: 'Bebas Neue',         file: 'Bebas_Neue.ttf',         category: 'display' },
  { name: 'Anton',              file: 'Anton.ttf',              category: 'display' },
  { name: 'Oswald',             file: 'Oswald.ttf',             category: 'display' },
  { name: 'Abril Fatface',      file: 'Abril_Fatface.ttf',      category: 'display' },
  { name: 'Alfa Slab One',      file: 'Alfa_Slab_One.ttf',      category: 'display' },
  { name: 'Passion One',        file: 'Passion_One.ttf',        category: 'display' },
  { name: 'Russo One',          file: 'Russo_One.ttf',          category: 'display' },
  { name: 'Righteous',          file: 'Righteous.ttf',          category: 'display' },
  { name: 'Boogaloo',           file: 'Boogaloo.ttf',           category: 'display' },
  { name: 'Dancing Script',     file: 'Dancing_Script.ttf',     category: 'display' },
  { name: 'Fredericka Great',   file: 'Fredericka_the_Great.ttf',category: 'display' },
  { name: 'Big Shoulders',      file: 'Big_Shoulders.ttf',      category: 'display' },
  { name: 'Big Shoulders Inline',file:'Big_Shoulders_Inline.ttf',category: 'display' },
  { name: 'Special Gothic',     file: 'Special_Gothic.ttf',     category: 'display' },
  { name: 'Tenor Sans',         file: 'Tenor_Sans.ttf',         category: 'display' },

  // ── Monospace ─────────────────────────────────────────────────────────────
  { name: 'JetBrains Mono',     file: 'JetBrains_Mono.ttf',     category: 'mono' },
  { name: 'Roboto Mono',        file: 'Roboto_Mono.ttf',        category: 'mono' },
  { name: 'Source Code Pro',    file: 'Source_Code_Pro.ttf',    category: 'mono' },
  { name: 'Space Mono',         file: 'Space_Mono.ttf',         category: 'mono' },
  { name: 'Inconsolata',        file: 'Inconsolata.ttf',        category: 'mono' },
  { name: 'Azeret Mono',        file: 'Azeret_Mono.ttf',        category: 'mono' },
  { name: 'Courier Prime',      file: 'Courier_Prime.ttf',      category: 'mono' },
  { name: 'Nova Mono',          file: 'Nova_Mono.ttf',          category: 'mono' },
  { name: 'Share Tech Mono',    file: 'Share_Tech_Mono.ttf',    category: 'mono' },
];

const _loadedFonts = new Set();

/**
 * Lazily inject a @font-face rule for a font the first time it's needed.
 * @param {string} fontName  - display name (e.g. "Playfair Display")
 * @param {string} fontFile  - filename in /fonts/ (e.g. "Playfair_Display.ttf")
 */
export function loadFont(fontName, fontFile) {
  if (_loadedFonts.has(fontName)) return;
  _loadedFonts.add(fontName);

  let el = document.getElementById('brain-custom-fonts');
  if (!el) {
    el = document.createElement('style');
    el.id = 'brain-custom-fonts';
    document.head.appendChild(el);
  }
  el.textContent += `
@font-face {
  font-family: "${fontName}";
  src: url("/fonts/${fontFile}") format("truetype");
  font-display: swap;
}
`;
}

/** Given a font name, return the matching font object */
export function getFontByName(name) {
  return FONTS.find(f => f.name === name);
}

export const FONT_CATEGORIES = ['sans-serif', 'serif', 'display', 'mono'];
export const CATEGORY_LABELS = {
  'sans-serif': 'Sans-Serif',
  'serif': 'Serif',
  'display': 'Display',
  'mono': 'Monospace',
};
