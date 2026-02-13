/**
 * analyze-docx.mjs
 *
 * Analyzes a .docx file to extract design/formatting information:
 * - Font styles (family, sizes, colors)
 * - Heading styles
 * - Page margins
 * - Headers/footers presence
 * - Color scheme
 * - Overall layout structure
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

// ── Configuration ──────────────────────────────────────────────────────────
const DOCX_PATH = String.raw`C:\Users\lp3cglaus\bbw.ch\Kollaboration BBW - Dokumente (1)\Entwicklungsteam\Richtlinien\251126_Nutzungsrichtlinie_IKT_BBW.docx`;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert EMU (English Metric Units) to centimeters */
function emuToCm(emu) {
  return (parseInt(emu, 10) / 914400 * 2.54).toFixed(2);
}

/** Convert twips to centimeters */
function twipsToCm(twips) {
  return (parseInt(twips, 10) / 1440 * 2.54).toFixed(2);
}

/** Convert half-points to points */
function halfPtToPt(halfPt) {
  return (parseInt(halfPt, 10) / 2).toFixed(1);
}

/** Convert hex color from Word's format */
function normalizeColor(color) {
  if (!color || color === 'auto' || color === 'none') return null;
  return `#${color.toUpperCase()}`;
}

/** Convert theme color name to readable form */
function themeColorName(tc) {
  if (!tc) return null;
  const map = {
    dark1: 'Dark 1 (Text)',
    dark2: 'Dark 2',
    light1: 'Light 1 (Background)',
    light2: 'Light 2',
    accent1: 'Accent 1',
    accent2: 'Accent 2',
    accent3: 'Accent 3',
    accent4: 'Accent 4',
    accent5: 'Accent 5',
    accent6: 'Accent 6',
    hyperlink: 'Hyperlink',
    followedHyperlink: 'Followed Hyperlink',
  };
  return map[tc] || tc;
}

// ── Main Analysis ──────────────────────────────────────────────────────────

async function analyzeDocx() {
  console.log('='.repeat(80));
  console.log('  DOCX DESIGN ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nFile: ${DOCX_PATH}\n`);

  const data = fs.readFileSync(DOCX_PATH);
  const zip = await JSZip.loadAsync(data);

  // List all files in the zip for structure analysis
  const allFiles = Object.keys(zip.files);

  // ── 1. Parse core XML files ──────────────────────────────────────────
  const xmlFiles = {};
  const filesToParse = [
    'word/document.xml',
    'word/styles.xml',
    'word/settings.xml',
    'word/theme/theme1.xml',
    'word/header1.xml',
    'word/header2.xml',
    'word/header3.xml',
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footer3.xml',
    'word/numbering.xml',
    'word/_rels/document.xml.rels',
    '[Content_Types].xml',
    'docProps/core.xml',
    'docProps/app.xml',
  ];

  for (const f of filesToParse) {
    if (zip.files[f]) {
      try {
        const xml = await zip.files[f].async('string');
        xmlFiles[f] = await parseStringPromise(xml, {
          explicitArray: false,
          ignoreAttrs: false,
          tagNameProcessors: [],
        });
      } catch (e) {
        // skip files that fail to parse
      }
    }
  }

  // ── 2. PAGE LAYOUT & MARGINS ─────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  1. PAGE LAYOUT & MARGINS');
  console.log('─'.repeat(80));

  const doc = xmlFiles['word/document.xml'];
  if (doc) {
    const body = doc?.['w:document']?.['w:body'];
    const sectPr = body?.['w:sectPr'];

    if (sectPr) {
      // Page size
      const pgSz = sectPr['w:pgSz']?.$;
      if (pgSz) {
        const w = twipsToCm(pgSz['w:w']);
        const h = twipsToCm(pgSz['w:h']);
        const orient = pgSz['w:orient'] || 'portrait';
        console.log(`\n  Page Size: ${w} cm x ${h} cm (${orient})`);

        // Common paper sizes
        const wMm = (parseFloat(w) * 10).toFixed(0);
        const hMm = (parseFloat(h) * 10).toFixed(0);
        if ((wMm >= 209 && wMm <= 211) && (hMm >= 296 && hMm <= 298)) {
          console.log('  Paper Format: A4');
        } else if ((wMm >= 215 && wMm <= 217) && (hMm >= 278 && hMm <= 280)) {
          console.log('  Paper Format: US Letter');
        }
      }

      // Margins
      const pgMar = sectPr['w:pgMar']?.$;
      if (pgMar) {
        console.log('\n  Margins:');
        console.log(`    Top:    ${twipsToCm(pgMar['w:top'])} cm`);
        console.log(`    Bottom: ${twipsToCm(pgMar['w:bottom'])} cm`);
        console.log(`    Left:   ${twipsToCm(pgMar['w:left'])} cm`);
        console.log(`    Right:  ${twipsToCm(pgMar['w:right'])} cm`);
        if (pgMar['w:header']) console.log(`    Header: ${twipsToCm(pgMar['w:header'])} cm`);
        if (pgMar['w:footer']) console.log(`    Footer: ${twipsToCm(pgMar['w:footer'])} cm`);
        if (pgMar['w:gutter']) console.log(`    Gutter: ${twipsToCm(pgMar['w:gutter'])} cm`);
      }

      // Columns
      const cols = sectPr['w:cols']?.$;
      if (cols) {
        console.log(`\n  Columns: ${cols['w:num'] || 1}`);
        if (cols['w:space']) console.log(`  Column Spacing: ${twipsToCm(cols['w:space'])} cm`);
      }

      // Page borders
      const pgBorders = sectPr['w:pgBorders'];
      if (pgBorders) {
        console.log('\n  Page Borders: Yes');
      }
    }
  }

  // ── 3. THEME & COLOR SCHEME ──────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  2. THEME & COLOR SCHEME');
  console.log('─'.repeat(80));

  const theme = xmlFiles['word/theme/theme1.xml'];
  if (theme) {
    const themeEl = theme?.['a:theme'];
    const themeName = themeEl?.$?.['name'];
    if (themeName) console.log(`\n  Theme Name: ${themeName}`);

    // Color scheme
    const clrScheme = themeEl?.['a:themeElements']?.['a:clrScheme'];
    if (clrScheme) {
      const schemeName = clrScheme.$?.name;
      console.log(`  Color Scheme Name: ${schemeName || 'N/A'}`);
      console.log('\n  Theme Colors:');

      const colorSlots = [
        'a:dk1', 'a:dk2', 'a:lt1', 'a:lt2',
        'a:accent1', 'a:accent2', 'a:accent3', 'a:accent4', 'a:accent5', 'a:accent6',
        'a:hlink', 'a:folHlink'
      ];
      const slotNames = [
        'Dark 1 (Text)', 'Dark 2', 'Light 1 (Background)', 'Light 2',
        'Accent 1', 'Accent 2', 'Accent 3', 'Accent 4', 'Accent 5', 'Accent 6',
        'Hyperlink', 'Followed Hyperlink'
      ];

      for (let i = 0; i < colorSlots.length; i++) {
        const slot = clrScheme[colorSlots[i]];
        if (slot) {
          let color = 'N/A';
          if (slot['a:srgbClr']?.$?.val) {
            color = `#${slot['a:srgbClr'].$.val}`;
          } else if (slot['a:sysClr']?.$) {
            color = `System: ${slot['a:sysClr'].$.lastClr ? '#' + slot['a:sysClr'].$.lastClr : slot['a:sysClr'].$.val}`;
          }
          console.log(`    ${slotNames[i].padEnd(25)} ${color}`);
        }
      }
    }

    // Font scheme
    const fontScheme = themeEl?.['a:themeElements']?.['a:fontScheme'];
    if (fontScheme) {
      const fSchemeName = fontScheme.$?.name;
      console.log(`\n  Font Scheme Name: ${fSchemeName || 'N/A'}`);

      const majorFont = fontScheme['a:majorFont']?.['a:latin']?.$?.typeface;
      const minorFont = fontScheme['a:minorFont']?.['a:latin']?.$?.typeface;
      console.log(`  Major Font (Headings): ${majorFont || 'N/A'}`);
      console.log(`  Minor Font (Body):     ${minorFont || 'N/A'}`);

      // East Asian fonts
      const majorEA = fontScheme['a:majorFont']?.['a:ea']?.$?.typeface;
      const minorEA = fontScheme['a:minorFont']?.['a:ea']?.$?.typeface;
      if (majorEA) console.log(`  Major Font (East Asian): ${majorEA}`);
      if (minorEA) console.log(`  Minor Font (East Asian): ${minorEA}`);
    }
  } else {
    console.log('\n  No theme file found.');
  }

  // ── 4. STYLES ANALYSIS ───────────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  3. DOCUMENT STYLES (from styles.xml)');
  console.log('─'.repeat(80));

  const styles = xmlFiles['word/styles.xml'];
  if (styles) {
    const root = styles['w:styles'];

    // Default paragraph and run properties
    const docDefaults = root?.['w:docDefaults'];
    if (docDefaults) {
      console.log('\n  Document Defaults:');

      const rPrDefault = docDefaults['w:rPrDefault']?.['w:rPr'];
      if (rPrDefault) {
        const defFont = rPrDefault['w:rFonts']?.$;
        if (defFont) {
          console.log(`    Default Font (ASCII):     ${defFont['w:ascii'] || defFont['w:asciiTheme'] || 'N/A'}`);
          console.log(`    Default Font (hAnsi):     ${defFont['w:hAnsi'] || defFont['w:hAnsiTheme'] || 'N/A'}`);
          console.log(`    Default Font (EastAsia):  ${defFont['w:eastAsia'] || defFont['w:eastAsiaTheme'] || 'N/A'}`);
          console.log(`    Default Font (CS):        ${defFont['w:cs'] || defFont['w:cstheme'] || 'N/A'}`);
        }
        const defSz = rPrDefault['w:sz']?.$?.['w:val'];
        if (defSz) console.log(`    Default Font Size:        ${halfPtToPt(defSz)} pt`);
        const defSzCs = rPrDefault['w:szCs']?.$?.['w:val'];
        if (defSzCs) console.log(`    Default Font Size (CS):   ${halfPtToPt(defSzCs)} pt`);
        const defLang = rPrDefault['w:lang']?.$;
        if (defLang) {
          console.log(`    Default Language:          ${defLang['w:val'] || 'N/A'}`);
        }
      }

      const pPrDefault = docDefaults['w:pPrDefault']?.['w:pPr'];
      if (pPrDefault) {
        const spacing = pPrDefault['w:spacing']?.$;
        if (spacing) {
          console.log(`    Default Line Spacing:     ${spacing['w:line'] ? (parseInt(spacing['w:line']) / 240).toFixed(2) + 'x' : 'N/A'}`);
          console.log(`    Default Space After:      ${spacing['w:after'] ? twipsToCm(spacing['w:after']) + ' cm' : 'N/A'}`);
          console.log(`    Default Space Before:     ${spacing['w:before'] ? twipsToCm(spacing['w:before']) + ' cm' : 'N/A'}`);
        }
      }
    }

    // Named styles
    let styleList = root?.['w:style'];
    if (styleList && !Array.isArray(styleList)) styleList = [styleList];

    if (styleList) {
      // Heading styles
      console.log('\n  Heading Styles:');
      console.log('  ' + '-'.repeat(76));

      const headingStyles = styleList.filter(s => {
        const id = s.$?.['w:styleId'] || '';
        const name = s['w:name']?.$?.['w:val'] || '';
        return /^(heading|berschrift|Heading)\s?\d/i.test(name) || /^Heading\d/i.test(id);
      });

      for (const hs of headingStyles) {
        const id = hs.$?.['w:styleId'] || '';
        const name = hs['w:name']?.$?.['w:val'] || '';
        const basedOn = hs['w:basedOn']?.$?.['w:val'] || '';

        console.log(`\n    Style: "${name}" (ID: ${id})`);
        if (basedOn) console.log(`      Based On: ${basedOn}`);

        const rPr = hs['w:rPr'];
        if (rPr) {
          const fonts = rPr['w:rFonts']?.$;
          if (fonts) {
            const fontName = fonts['w:ascii'] || fonts['w:asciiTheme'] || fonts['w:hAnsi'] || 'theme default';
            console.log(`      Font: ${fontName}`);
          }
          const sz = rPr['w:sz']?.$?.['w:val'];
          if (sz) console.log(`      Size: ${halfPtToPt(sz)} pt`);

          const bold = rPr['w:b'];
          if (bold !== undefined) console.log(`      Bold: ${bold?.$?.['w:val'] === '0' ? 'No' : 'Yes'}`);

          const italic = rPr['w:i'];
          if (italic !== undefined) console.log(`      Italic: ${italic?.$?.['w:val'] === '0' ? 'No' : 'Yes'}`);

          const color = rPr['w:color']?.$;
          if (color) {
            const hex = normalizeColor(color['w:val']);
            const tc = themeColorName(color['w:themeColor']);
            console.log(`      Color: ${hex || 'auto'}${tc ? ` (${tc})` : ''}`);
          }

          const caps = rPr['w:caps'];
          if (caps !== undefined) console.log(`      All Caps: ${caps?.$?.['w:val'] === '0' ? 'No' : 'Yes'}`);

          const spacing = rPr['w:spacing']?.$?.['w:val'];
          if (spacing) console.log(`      Letter Spacing: ${spacing} (twentieth of a point)`);
        }

        const pPr = hs['w:pPr'];
        if (pPr) {
          const spacing = pPr['w:spacing']?.$;
          if (spacing) {
            if (spacing['w:before']) console.log(`      Space Before: ${twipsToCm(spacing['w:before'])} cm`);
            if (spacing['w:after']) console.log(`      Space After: ${twipsToCm(spacing['w:after'])} cm`);
            if (spacing['w:line']) console.log(`      Line Spacing: ${(parseInt(spacing['w:line']) / 240).toFixed(2)}x`);
          }
          const jc = pPr['w:jc']?.$?.['w:val'];
          if (jc) console.log(`      Alignment: ${jc}`);

          const outlineLvl = pPr['w:outlineLvl']?.$?.['w:val'];
          if (outlineLvl !== undefined) console.log(`      Outline Level: ${parseInt(outlineLvl) + 1}`);
        }
      }

      // Other notable styles
      console.log('\n\n  Other Notable Styles:');
      console.log('  ' + '-'.repeat(76));

      const notableStyles = styleList.filter(s => {
        const id = s.$?.['w:styleId'] || '';
        const name = s['w:name']?.$?.['w:val'] || '';
        const type = s.$?.['w:type'] || '';
        // Skip headings (already shown) and internal styles
        if (/^(heading|berschrift|Heading)\s?\d/i.test(name) || /^Heading\d/i.test(id)) return false;
        // Show paragraph and character styles that are not hidden
        return (type === 'paragraph' || type === 'character') && !s['w:semiHidden'];
      });

      for (const ns of notableStyles) {
        const id = ns.$?.['w:styleId'] || '';
        const name = ns['w:name']?.$?.['w:val'] || '';
        const type = ns.$?.['w:type'] || '';
        const isDefault = ns.$?.['w:default'] === '1';

        let details = [];
        const rPr = ns['w:rPr'];
        if (rPr) {
          const fonts = rPr['w:rFonts']?.$;
          if (fonts) {
            const fontName = fonts['w:ascii'] || fonts['w:asciiTheme'] || fonts['w:hAnsi'] || '';
            if (fontName) details.push(`Font: ${fontName}`);
          }
          const sz = rPr['w:sz']?.$?.['w:val'];
          if (sz) details.push(`Size: ${halfPtToPt(sz)}pt`);
          const color = rPr['w:color']?.$?.['w:val'];
          if (color && color !== 'auto') details.push(`Color: #${color}`);
          if (rPr['w:b'] !== undefined) details.push('Bold');
          if (rPr['w:i'] !== undefined) details.push('Italic');
          if (rPr['w:u'] !== undefined) details.push('Underline');
        }

        const detailStr = details.length > 0 ? ` | ${details.join(', ')}` : '';
        const defaultStr = isDefault ? ' [DEFAULT]' : '';
        console.log(`    ${type.padEnd(12)} "${name}" (${id})${defaultStr}${detailStr}`);
      }
    }
  }

  // ── 5. HEADERS & FOOTERS ─────────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  4. HEADERS & FOOTERS');
  console.log('─'.repeat(80));

  const headerFooterFiles = allFiles.filter(f =>
    f.match(/^word\/(header|footer)\d+\.xml$/)
  );

  if (headerFooterFiles.length === 0) {
    console.log('\n  No headers or footers found.');
  } else {
    console.log(`\n  Found ${headerFooterFiles.length} header/footer file(s):`);

    for (const hf of headerFooterFiles) {
      const isHeader = hf.includes('header');
      const type = isHeader ? 'Header' : 'Footer';
      const num = hf.match(/\d+/)?.[0];

      try {
        const xml = await zip.files[hf].async('string');
        const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });

        // Extract text content
        const rootKey = isHeader ? 'w:hdr' : 'w:ftr';
        const root = parsed[rootKey];

        let textContent = [];
        const extractText = (obj) => {
          if (!obj) return;
          if (typeof obj === 'string') { textContent.push(obj); return; }
          if (obj['w:t']) {
            const t = obj['w:t'];
            if (typeof t === 'string') textContent.push(t);
            else if (t._) textContent.push(t._);
            else if (typeof t === 'object' && !Array.isArray(t)) textContent.push(t._ || '');
          }
          // Check for page number fields
          if (obj['w:fldChar'] || obj['w:fldSimple']) {
            textContent.push('[FIELD]');
          }
          if (obj['w:instrText']) {
            const instr = typeof obj['w:instrText'] === 'string' ? obj['w:instrText'] : obj['w:instrText']._ || '';
            if (instr.includes('PAGE')) textContent.push('[PAGE NUMBER]');
            if (instr.includes('NUMPAGES')) textContent.push('[TOTAL PAGES]');
            if (instr.includes('DATE')) textContent.push('[DATE]');
          }
          for (const key of Object.keys(obj)) {
            if (key === '$') continue;
            const val = obj[key];
            if (Array.isArray(val)) val.forEach(extractText);
            else if (typeof val === 'object') extractText(val);
          }
        };
        extractText(root);

        // Check for images
        const hasImages = xml.includes('w:drawing') || xml.includes('w:pict') || xml.includes('v:imagedata');

        const text = textContent.filter(t => t.trim()).join(' ').trim();
        console.log(`\n    ${type} ${num}:`);
        if (text) console.log(`      Content: "${text.substring(0, 120)}${text.length > 120 ? '...' : ''}"`);
        if (hasImages) console.log(`      Contains: Image(s)/Logo(s)`);
        if (!text && !hasImages) console.log(`      (Empty)`);
      } catch (e) {
        console.log(`    ${type} ${num}: (could not parse)`);
      }
    }
  }

  // Check section properties for header/footer references
  if (doc) {
    const body = doc?.['w:document']?.['w:body'];
    const sectPr = body?.['w:sectPr'];
    if (sectPr) {
      const refs = [];
      const checkRef = (key, label) => {
        let items = sectPr[key];
        if (!items) return;
        if (!Array.isArray(items)) items = [items];
        for (const item of items) {
          const type = item.$?.['w:type'] || 'default';
          refs.push(`${label} (${type})`);
        }
      };
      checkRef('w:headerReference', 'Header');
      checkRef('w:footerReference', 'Footer');
      if (refs.length > 0) {
        console.log(`\n    Section references: ${refs.join(', ')}`);
      }

      // Different first page?
      const titlePg = sectPr['w:titlePg'];
      if (titlePg) {
        console.log('    Different first page header/footer: Yes');
      }
    }
  }

  // ── 6. FONT USAGE IN DOCUMENT BODY ───────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  5. FONT USAGE IN DOCUMENT BODY');
  console.log('─'.repeat(80));

  if (doc) {
    const fontUsage = {};
    const fontSizes = new Set();
    const fontColors = new Set();
    const textFormats = { bold: 0, italic: 0, underline: 0, strikethrough: 0, allCaps: 0, smallCaps: 0 };
    let paragraphCount = 0;
    let paragraphStyles = {};

    const analyzeRPr = (rPr) => {
      if (!rPr) return;

      const fonts = rPr['w:rFonts']?.$;
      if (fonts) {
        for (const key of ['w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs']) {
          if (fonts[key]) {
            fontUsage[fonts[key]] = (fontUsage[fonts[key]] || 0) + 1;
          }
        }
        for (const key of ['w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme']) {
          if (fonts[key]) {
            fontUsage[`[theme:${fonts[key]}]`] = (fontUsage[`[theme:${fonts[key]}]`] || 0) + 1;
          }
        }
      }

      const sz = rPr['w:sz']?.$?.['w:val'];
      if (sz) fontSizes.add(halfPtToPt(sz) + ' pt');

      const color = rPr['w:color']?.$?.['w:val'];
      if (color && color !== 'auto') fontColors.add(`#${color.toUpperCase()}`);

      const themeColor = rPr['w:color']?.$?.['w:themeColor'];
      if (themeColor) fontColors.add(`theme:${themeColor}`);

      if (rPr['w:b'] !== undefined && rPr['w:b']?.$?.['w:val'] !== '0') textFormats.bold++;
      if (rPr['w:i'] !== undefined && rPr['w:i']?.$?.['w:val'] !== '0') textFormats.italic++;
      if (rPr['w:u'] !== undefined) textFormats.underline++;
      if (rPr['w:strike'] !== undefined) textFormats.strikethrough++;
      if (rPr['w:caps'] !== undefined) textFormats.allCaps++;
      if (rPr['w:smallCaps'] !== undefined) textFormats.smallCaps++;
    };

    const walkBody = (obj) => {
      if (!obj) return;
      if (Array.isArray(obj)) { obj.forEach(walkBody); return; }
      if (typeof obj !== 'object') return;

      // Paragraph
      if (obj['w:pPr']) {
        paragraphCount++;
        const pStyle = obj['w:pPr']['w:pStyle']?.$?.['w:val'];
        if (pStyle) {
          paragraphStyles[pStyle] = (paragraphStyles[pStyle] || 0) + 1;
        }
        analyzeRPr(obj['w:pPr']['w:rPr']);
      }

      // Run
      if (obj['w:rPr']) {
        analyzeRPr(obj['w:rPr']);
      }

      for (const key of Object.keys(obj)) {
        if (key === '$') continue;
        walkBody(obj[key]);
      }
    };

    walkBody(doc['w:document']?.['w:body']);

    // Sort fonts by usage
    const sortedFonts = Object.entries(fontUsage).sort((a, b) => b[1] - a[1]);

    console.log('\n  Fonts Used (by frequency):');
    for (const [font, count] of sortedFonts) {
      console.log(`    ${font.padEnd(35)} (${count} occurrences)`);
    }

    console.log('\n  Font Sizes Used:');
    const sortedSizes = [...fontSizes].sort((a, b) => parseFloat(a) - parseFloat(b));
    console.log(`    ${sortedSizes.join(', ')}`);

    console.log('\n  Text Colors Used:');
    for (const color of [...fontColors].sort()) {
      console.log(`    ${color}`);
    }

    console.log('\n  Text Formatting Occurrences:');
    for (const [fmt, count] of Object.entries(textFormats)) {
      if (count > 0) console.log(`    ${fmt.padEnd(20)} ${count} runs`);
    }

    console.log(`\n  Total Paragraphs: ${paragraphCount}`);

    console.log('\n  Paragraph Styles Used:');
    const sortedPStyles = Object.entries(paragraphStyles).sort((a, b) => b[1] - a[1]);
    for (const [style, count] of sortedPStyles) {
      console.log(`    ${style.padEnd(35)} ${count} paragraphs`);
    }
  }

  // ── 7. IMAGES & MEDIA ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  6. IMAGES & MEDIA');
  console.log('─'.repeat(80));

  const mediaFiles = allFiles.filter(f => f.startsWith('word/media/'));
  if (mediaFiles.length === 0) {
    console.log('\n  No embedded images/media found.');
  } else {
    console.log(`\n  ${mediaFiles.length} embedded media file(s):`);
    for (const mf of mediaFiles) {
      const fileData = await zip.files[mf].async('nodebuffer');
      const sizeMB = (fileData.length / 1024).toFixed(1);
      const ext = path.extname(mf).toLowerCase();
      console.log(`    ${path.basename(mf).padEnd(30)} ${ext.padEnd(8)} ${sizeMB} KB`);
    }
  }

  // ── 8. TABLES ────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  7. TABLES');
  console.log('─'.repeat(80));

  if (doc) {
    const body = doc?.['w:document']?.['w:body'];
    let tables = [];

    const findTables = (obj, depth = 0) => {
      if (!obj) return;
      if (Array.isArray(obj)) { obj.forEach(o => findTables(o, depth)); return; }
      if (typeof obj !== 'object') return;

      if (obj['w:tbl'] !== undefined) {
        let tbl = obj['w:tbl'];
        if (!Array.isArray(tbl)) tbl = [tbl];
        for (const t of tbl) {
          let rows = t['w:tr'];
          if (!rows) rows = [];
          if (!Array.isArray(rows)) rows = [rows];

          const tblPr = t['w:tblPr'];
          const style = tblPr?.['w:tblStyle']?.$?.['w:val'] || 'none';
          const width = tblPr?.['w:tblW']?.$;

          // Count columns from first row
          let colCount = 0;
          if (rows[0]) {
            let cells = rows[0]['w:tc'];
            if (cells && !Array.isArray(cells)) cells = [cells];
            colCount = cells?.length || 0;
          }

          // Check for borders
          const borders = tblPr?.['w:tblBorders'];
          let borderInfo = 'default';
          if (borders) {
            const topBorder = borders['w:top']?.$;
            if (topBorder?.['w:val'] === 'none' || topBorder?.['w:val'] === 'nil') {
              borderInfo = 'no borders';
            } else if (topBorder) {
              borderInfo = `${topBorder['w:val'] || 'single'}, color: ${topBorder['w:color'] || 'auto'}`;
            }
          }

          tables.push({
            rows: rows.length,
            cols: colCount,
            style,
            width: width ? `${width['w:w']} (type: ${width['w:type']})` : 'auto',
            borders: borderInfo,
          });
        }
      }

      for (const key of Object.keys(obj)) {
        if (key === '$') continue;
        findTables(obj[key], depth + 1);
      }
    };

    findTables(body);

    if (tables.length === 0) {
      console.log('\n  No tables found.');
    } else {
      console.log(`\n  ${tables.length} table(s) found:`);
      for (let i = 0; i < tables.length; i++) {
        const t = tables[i];
        console.log(`\n    Table ${i + 1}:`);
        console.log(`      Rows: ${t.rows}, Columns: ${t.cols}`);
        console.log(`      Style: ${t.style}`);
        console.log(`      Width: ${t.width}`);
        console.log(`      Borders: ${t.borders}`);
      }
    }
  }

  // ── 9. DOCUMENT STRUCTURE OVERVIEW ───────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  8. DOCUMENT STRUCTURE OVERVIEW');
  console.log('─'.repeat(80));

  console.log('\n  ZIP contents:');
  const dirStructure = {};
  for (const f of allFiles) {
    const dir = path.dirname(f).replace(/\\/g, '/');
    if (!dirStructure[dir]) dirStructure[dir] = [];
    dirStructure[dir].push(path.basename(f));
  }
  for (const [dir, files] of Object.entries(dirStructure).sort()) {
    console.log(`    ${dir}/`);
    for (const f of files) {
      console.log(`      ${f}`);
    }
  }

  // Document properties
  const appProps = xmlFiles['docProps/app.xml'];
  const coreProps = xmlFiles['docProps/core.xml'];

  console.log('\n  Document Properties:');
  if (appProps) {
    const props = appProps['Properties'];
    if (props) {
      if (props['Template']) console.log(`    Template: ${props['Template']}`);
      if (props['TotalTime']) console.log(`    Total Editing Time: ${props['TotalTime']} minutes`);
      if (props['Pages']) console.log(`    Pages: ${props['Pages']}`);
      if (props['Words']) console.log(`    Words: ${props['Words']}`);
      if (props['Characters']) console.log(`    Characters: ${props['Characters']}`);
      if (props['Application']) console.log(`    Application: ${props['Application']}`);
      if (props['AppVersion']) console.log(`    App Version: ${props['AppVersion']}`);
      if (props['Company']) console.log(`    Company: ${props['Company']}`);
    }
  }
  if (coreProps) {
    const cp = coreProps['cp:coreProperties'];
    if (cp) {
      if (cp['dc:title']) console.log(`    Title: ${cp['dc:title']}`);
      if (cp['dc:creator']) console.log(`    Creator: ${cp['dc:creator']}`);
      if (cp['cp:lastModifiedBy']) console.log(`    Last Modified By: ${cp['cp:lastModifiedBy']}`);
      if (cp['dcterms:created']?._) console.log(`    Created: ${cp['dcterms:created']._}`);
      if (cp['dcterms:modified']?._) console.log(`    Modified: ${cp['dcterms:modified']._}`);
    }
  }

  // ── 10. NUMBERING / LISTS ────────────────────────────────────────────
  console.log('\n' + '─'.repeat(80));
  console.log('  9. NUMBERING / LIST STYLES');
  console.log('─'.repeat(80));

  const numbering = xmlFiles['word/numbering.xml'];
  if (numbering) {
    let abstractNums = numbering['w:numbering']?.['w:abstractNum'];
    if (abstractNums && !Array.isArray(abstractNums)) abstractNums = [abstractNums];

    if (abstractNums) {
      console.log(`\n  ${abstractNums.length} abstract numbering definition(s):`);
      for (const an of abstractNums) {
        const id = an.$?.['w:abstractNumId'];
        const name = an['w:nsid']?.$?.['w:val'] || '';
        let levels = an['w:lvl'];
        if (levels && !Array.isArray(levels)) levels = [levels];

        console.log(`\n    Abstract Num ${id}:`);
        if (levels) {
          for (const lvl of levels.slice(0, 3)) { // Show first 3 levels
            const lvlId = lvl.$?.['w:ilvl'];
            const numFmt = lvl['w:numFmt']?.$?.['w:val'] || 'N/A';
            const lvlText = lvl['w:lvlText']?.$?.['w:val'] || '';
            const start = lvl['w:start']?.$?.['w:val'] || '1';
            console.log(`      Level ${lvlId}: format=${numFmt}, text="${lvlText}", start=${start}`);
          }
          if (levels.length > 3) console.log(`      ... and ${levels.length - 3} more levels`);
        }
      }
    }
  } else {
    console.log('\n  No numbering definitions found.');
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(80));
  console.log('  DESIGN SUMMARY');
  console.log('='.repeat(80));

  // Gather summary info
  const sectPr = doc?.['w:document']?.['w:body']?.['w:sectPr'];
  const pgSz = sectPr?.['w:pgSz']?.$;
  const pgMar = sectPr?.['w:pgMar']?.$;

  const themeEl = theme?.['a:theme'];
  const fontScheme = themeEl?.['a:themeElements']?.['a:fontScheme'];
  const majorFont = fontScheme?.['a:majorFont']?.['a:latin']?.$?.typeface;
  const minorFont = fontScheme?.['a:minorFont']?.['a:latin']?.$?.typeface;

  console.log(`
  Page:     ${pgSz ? twipsToCm(pgSz['w:w']) + ' x ' + twipsToCm(pgSz['w:h']) + ' cm' : 'N/A'} (${pgSz?.['w:orient'] || 'portrait'})
  Margins:  T=${pgMar ? twipsToCm(pgMar['w:top']) : '?'} B=${pgMar ? twipsToCm(pgMar['w:bottom']) : '?'} L=${pgMar ? twipsToCm(pgMar['w:left']) : '?'} R=${pgMar ? twipsToCm(pgMar['w:right']) : '?'} cm
  Theme:    ${themeEl?.$?.name || 'N/A'}
  Fonts:    Headings = ${majorFont || 'N/A'}, Body = ${minorFont || 'N/A'}
  Headers:  ${headerFooterFiles.filter(f => f.includes('header')).length} file(s)
  Footers:  ${headerFooterFiles.filter(f => f.includes('footer')).length} file(s)
  Tables:   ${doc ? 'see above' : 'N/A'}
  Images:   ${mediaFiles.length} embedded file(s)
`);

  console.log('='.repeat(80));
  console.log('  Analysis complete.');
  console.log('='.repeat(80));
}

// ── Run ────────────────────────────────────────────────────────────────────
analyzeDocx().catch(err => {
  console.error('Error analyzing DOCX:', err);
  process.exit(1);
});
