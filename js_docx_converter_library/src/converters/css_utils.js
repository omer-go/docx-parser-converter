/**
 * @file css_utils.js
 * @description Utilities for converting DOCX properties to CSS styles.
 */

import { convertTwipsToPoints } from '../parsers/xml_utils.js'; // For unit conversion if needed later

const TWIPS_PER_POINT = 20;

/**
 * Formats a value as points.
 * @param {number} value - The value in points.
 * @returns {string} The value formatted as "X.0pt" to match Python format.
 */
export function formatPoints(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return null;
  }
  return `${value.toFixed(1)}pt`;
}

/**
 * Converts paragraph properties to a CSS style string.
 * @param {object} properties - The ParagraphPropertiesSchema object.
 * @returns {string} A CSS style string.
 */
export function convertParagraphPropertiesToCss(properties) {
  if (!properties) return '';
  const styles = [];

  // Text alignment
  if (properties.jc) {
    const textAlignMap = {
      left: 'left',
      center: 'center',
      right: 'right',
      both: 'justify', // 'both' usually means justify
      start: 'left', // Assuming LTR context
      end: 'right',  // Assuming LTR context
      distribute: 'justify', // Often similar to justify
    };
    if (textAlignMap[properties.jc]) {
      styles.push(`text-align:${textAlignMap[properties.jc]};`);
    }
  }

  // Indentation (assuming values in properties.ind are in twips)
  if (properties.ind) {
    if (properties.ind.left?.val) { // w:left or w:start
        styles.push(`margin-left:${formatPoints(properties.ind.left.val / TWIPS_PER_POINT)};`);
    }
    if (properties.ind.right?.val) { // w:right or w:end
        styles.push(`margin-right:${formatPoints(properties.ind.right.val / TWIPS_PER_POINT)};`);
    }
    if (properties.ind.firstLine?.val) {
        styles.push(`text-indent:${formatPoints(properties.ind.firstLine.val / TWIPS_PER_POINT)};`);
    } else if (properties.ind.hanging?.val) {
        // Negative text-indent for hanging indent if no firstLine is specified
        styles.push(`text-indent:-${formatPoints(properties.ind.hanging.val / TWIPS_PER_POINT)};`);
        // Hanging indent also implies the margin-left should accommodate the hang
        // This might require more complex logic if left indentation is also present.
        // For now, assuming simple hanging or left. If both, text-indent works relative to margin-left.
    }
  }

  // Spacing (assuming values in properties.spacing are in twips)
  if (properties.spacing) {
    if (properties.spacing.before?.val) {
      styles.push(`margin-top:${formatPoints(properties.spacing.before.val / TWIPS_PER_POINT)};`);
    }
    if (properties.spacing.after?.val) {
      styles.push(`margin-bottom:${formatPoints(properties.spacing.after.val / TWIPS_PER_POINT)};`);
    }
    if (properties.spacing.line?.val) {
      // lineRule: 'auto' (default, typically 1.0 to 1.2), 'exact' (value is exact), 'atLeast' (minimum)
      // OOXML line spacing in twentieths of a line (e.g. 240 = single, 360 = 1.5 lines, 480 = double)
      // Or an absolute value in twips.
      // If lineRule is 'auto', 'exact', or 'atLeast' and value is small (e.g. < 1000), it's likely scaled line height.
      // Otherwise, it's an absolute value in twips.
      const lineValue = properties.spacing.line.val;
      if (properties.spacing.lineRule && ['exact', 'atLeast'].includes(properties.spacing.lineRule)) {
         // Value is in twips, convert to points for absolute line height
        styles.push(`line-height:${formatPoints(lineValue / TWIPS_PER_POINT)};`);
      } else { // 'auto' or no lineRule, or large value likely representing 240 units per line
        // Assuming standard line height units (e.g., 240 = single spacing)
        // Convert to a relative line-height value. 240 is standard single.
        styles.push(`line-height:${ (lineValue / 240).toFixed(2) };`);
      }
    }
  }

  // Borders (simplified: if any border, add a simple black border)
  if (properties.pBdr && Object.keys(properties.pBdr).length > 0) {
    // This is a very basic representation. Full pBdr parsing is complex.
    // Example: check for a 'top' border, then get its 'val', 'sz', 'color'.
    // For now, just a generic border if pBdr is present and not empty.
    if (properties.pBdr.top || properties.pBdr.bottom || properties.pBdr.left || properties.pBdr.right) {
        styles.push('border:1px solid #000000;'); // Placeholder
    }
  }

  // Shading
  if (properties.shd?.fill && properties.shd.fill !== 'auto' && properties.shd.fill !== '000000') {
    // fill can be "auto" or an RRGGBB hex string.
    // Ensure it's a valid hex color. '000000' might mean no fill if text bg is also black.
    // The themeColor attributes would need more complex lookup if used.
    styles.push(`background-color: #${properties.shd.fill};`);
  }

  return styles.join('');
}

/**
 * Converts run properties to a CSS style string.
 * @param {object} properties - The RunPropertiesSchema object.
 * @returns {{css: string, wrapTags: {open: string, close: string}}} An object containing CSS string and tags to wrap the span.
 */
export function convertRunPropertiesToCss(properties) {
  if (!properties) return { css: '', wrapTags: { open: '', close: '' } };
  const styles = [];
  const wrapTags = { open: '', close: '' };

  // Bold
  if (properties.b === true) { // OnOffSchema ensures this is boolean
    styles.push('font-weight:bold;');
  }
  
  // Color - match Python format exactly
  if (properties.color?.val) {
    if (properties.color.val === 'auto') {
      styles.push('color:auto;');
    } else {
      // Remove # prefix to match Python format
      const colorValue = properties.color.val.replace(/^#/, '');
      styles.push(`color:${colorValue};`);
    }
  } else {
    // Add default color:auto when no color is specified (to match Python)
    styles.push('color:auto;');
  }

  // Font family
  if (properties.rFonts) {
    const font = properties.rFonts.ascii || properties.rFonts.hAnsi || properties.rFonts.eastAsia || properties.rFonts.cs;
    if (font) {
      // Match Python format exactly - no quotes around font name
      styles.push(`font-family:${font};`);
    }
  } else {
    // Add default font family when none is specified (to match Python)
    styles.push('font-family:Liberation Serif;');
  }

  // Font size (sz is in half-points) - add default if not specified
  if (properties.sz?.val) {
    styles.push(`font-size:${(properties.sz.val / 2).toFixed(1)}pt;`);
  } else {
    // Add default font size to match Python (12.0pt)
    styles.push('font-size:12.0pt;');
  }

  // Italic
  if (properties.i === true) {
    styles.push('font-style:italic;');
  }
  
  // Underline
  if (properties.u && properties.u !== 'none') { // 'none' or other complex types
    // Simple underline for now. Complex underline types (double, dotted) are possible.
    styles.push('text-decoration:underline;');
  }
  
  // Strikethrough
  if (properties.strike === true || properties.dstrike === true) {
    styles.push('text-decoration:line-through;'); // CSS combines strike and dstrike
  }

  // Vertical alignment (superscript/subscript)
  if (properties.vertAlign) {
    if (properties.vertAlign === 'superscript') {
      wrapTags.open = '<sup>' + wrapTags.open;
      wrapTags.close = wrapTags.close + '</sup>';
      // styles.push('vertical-align: super;'); // Alternative CSS way
    } else if (properties.vertAlign === 'subscript') {
      wrapTags.open = '<sub>' + wrapTags.open;
      wrapTags.close = wrapTags.close + '</sub>';
      // styles.push('vertical-align: sub;'); // Alternative CSS way
    }
  }

  // Highlight
  if (properties.highlight && properties.highlight !== 'none') {
    // highlight values are usually color names like "yellow", "green".
    // These are valid CSS color keywords.
    styles.push(`background-color: ${properties.highlight};`);
  }

  return { css: styles.join(''), wrapTags };
}

/**
 * Converts document margins to CSS style string for a container div.
 * @param {object} margins - The DocMarginsSchema object.
 * @returns {string} A CSS style string for padding.
 */
export function convertMarginsToCss(margins) {
    if (!margins) return '';
    const styles = [];
    // Convert twips to points for CSS
    if (margins.top) styles.push(`padding-top: ${formatPoints(margins.top / TWIPS_PER_POINT)};`);
    if (margins.bottom) styles.push(`padding-bottom: ${formatPoints(margins.bottom / TWIPS_PER_POINT)};`);
    if (margins.left) styles.push(`padding-left: ${formatPoints(margins.left / TWIPS_PER_POINT)};`);
    if (margins.right) styles.push(`padding-right: ${formatPoints(margins.right / TWIPS_PER_POINT)};`);
    // Header and footer margins are not directly translated to padding on the main container
    // but define space reserved for headers/footers. Gutter is for page binding.
    return styles.join(' ');
}


/**
 * Converts table properties to a CSS style string for a <table> element.
 * @param {object} properties - The TablePropertiesSchema object.
 * @returns {string} A CSS style string.
 */
export function convertTablePropertiesToCss(properties) {
  if (!properties) return '';
  const styles = [];

  // Table width (tblW: { val: number (twips), type: string ('dxa', 'pct', 'auto') })
  // Note: The current MeasurementSchema only stores 'val'. Type handling would need schema update.
  // Assuming 'val' is in twips if type is 'dxa'. 'pct' would be 50ths of a percent.
  if (properties.tblW?.val) {
    // Assuming type 'dxa' (twips) for simplicity if type is not stored/parsed.
    // A 'pct' type (e.g., 5000 for 100%) would need different handling: val / 50 + '%'
    styles.push(`width: ${formatPoints(properties.tblW.val / TWIPS_PER_POINT)};`);
    // If type is 'auto', width: auto;
    // If type is 'pct', width: (val/50)%;
  } else {
    styles.push('width: auto;'); // Default if no width specified
  }

  // Table alignment (jc: 'left', 'center', 'right')
  if (properties.jc) {
    if (properties.jc === 'center') {
      styles.push('margin-left: auto;');
      styles.push('margin-right: auto;');
    } else if (properties.jc === 'right') {
      styles.push('margin-left: auto;');
      styles.push('margin-right: 0;'); // Or equivalent for desired right alignment
    } else { // left or start
      styles.push('margin-left: 0;');
      styles.push('margin-right: auto;');
    }
  }

  // Table cell spacing (tblCellSpacing: { val: number (twips) })
  if (properties.tblCellSpacing?.val) {
    styles.push(`border-spacing: ${formatPoints(properties.tblCellSpacing.val / TWIPS_PER_POINT)};`);
    styles.push('border-collapse: separate;'); // border-spacing only works with this
  } else {
    styles.push('border-collapse: collapse;'); // Default behavior
  }

  // Table indentation (tblInd: { val: number (twips) }) - applied as margin-left
  if (properties.tblInd?.val) {
    styles.push(`margin-left: ${formatPoints(properties.tblInd.val / TWIPS_PER_POINT)};`);
  }
  
  // Table-wide shading (shd: { fill: string (hex color) })
  if (properties.shd?.fill && properties.shd.fill !== 'auto') {
    styles.push(`background-color: #${properties.shd.fill};`);
  }

  // Table layout (tblLayout: 'fixed' | 'auto')
  if (properties.tblLayout) {
    styles.push(`table-layout: ${properties.tblLayout};`);
  }

  // Table-wide borders (tblBorders) - very simplified for now
  // This applies a default border if any specific border is set.
  // A more detailed approach would convert each BorderTypeSchema (top, left, etc.)
  // from tblBorders into specific CSS border properties.
  if (properties.tblBorders && Object.values(properties.tblBorders).some(b => b && b.val && b.val !== 'nil')) {
      styles.push('border: 1px solid #000000;'); // Default border if any are defined
  }


  return styles.join(' ');
}

/**
 * Converts table row properties to a CSS style string for a <tr> element.
 * @param {object} properties - The TableRowPropertiesSchema object.
 * @returns {string} A CSS style string.
 */
export function convertTableRowPropertiesToCss(properties) {
  if (!properties) return '';
  const styles = [];

  // Row height (trHeight: { val: number (twips), hRule: string ('atLeast', 'exact', 'auto') })
  // Note: Current MeasurementSchema only stores 'val'. hRule needs to be parsed and stored.
  if (properties.trHeight?.val) {
    // Assuming hRule is 'exact' or 'atLeast' for direct height mapping.
    // 'auto' would mean min-height or let content decide.
    // For simplicity, map directly to 'height'.
    styles.push(`height: ${formatPoints(properties.trHeight.val / TWIPS_PER_POINT)};`);
  }

  // tblHeader: if true, semantic HTML (<th>) handled by caller, CSS could add specific header styling.
  // if (properties.tblHeader === true) {
  //   styles.push('font-weight: bold;'); // Example, often handled by <th> default styles
  // }

  return styles.join(' ');
}

/**
 * Converts table cell properties to a CSS style string for a <td> or <th> element.
 * @param {object} properties - The TableCellPropertiesSchema object.
 * @param {object} tableProperties - The parent TablePropertiesSchema object (for default cell margins).
 * @returns {string} A CSS style string.
 */
export function convertTableCellPropertiesToCss(properties, tableProperties) {
  if (!properties) return '';
  const styles = [];

  // Cell width (tcW: { val: number (twips), type: string ('dxa', 'pct', 'auto') })
  // This is often better handled by <col> elements for fixed layouts.
  // If specified directly on cell, it can override <col>.
  if (properties.tcW?.val) {
    // Assuming type 'dxa' (twips)
    styles.push(`width: ${formatPoints(properties.tcW.val / TWIPS_PER_POINT)};`);
  }

  // Vertical alignment (vAlign: 'top', 'center', 'bottom')
  if (properties.vAlign) {
    styles.push(`vertical-align: ${properties.vAlign};`);
  }

  // Text direction (textDirection: 'btLr', 'tbRl', etc.) - Complex, requires CSS writing-mode
  if (properties.textDirection) {
    // Example: textDirection: 'tbRl' -> writing-mode: vertical-rl;
    // This is a simplified mapping. Full support is more involved.
    if (properties.textDirection === 'tbRl') styles.push('writing-mode: vertical-rl;');
    if (properties.textDirection === 'btLr') styles.push('writing-mode: vertical-lr;'); // Less common
  }

  // Cell shading (shd: { fill: string (hex color) })
  if (properties.shd?.fill && properties.shd.fill !== 'auto') {
    styles.push(`background-color: #${properties.shd.fill};`);
  }

  // Cell Margins (Padding) - tcMar overrides tblCellMar from tableProperties
  const cellMargins = properties.tcMar || tableProperties?.tblCellMar;
  if (cellMargins) {
    if (cellMargins.top?.val) styles.push(`padding-top: ${formatPoints(cellMargins.top.val / TWIPS_PER_POINT)};`);
    if (cellMargins.bottom?.val) styles.push(`padding-bottom: ${formatPoints(cellMargins.bottom.val / TWIPS_PER_POINT)};`);
    if (cellMargins.left?.val) styles.push(`padding-left: ${formatPoints(cellMargins.left.val / TWIPS_PER_POINT)};`);
    if (cellMargins.right?.val) styles.push(`padding-right: ${formatPoints(cellMargins.right.val / TWIPS_PER_POINT)};`);
  }
  
  // Cell Borders (tcBorders) - This is complex. Simplified: apply if any border is set.
  // A full implementation would convert each BorderTypeSchema to CSS border properties.
  // e.g. properties.tcBorders.top -> border-top: ...
  if (properties.tcBorders && Object.values(properties.tcBorders).some(b => b && b.val && b.val !== 'nil')) {
      // Simplified: if any border is defined, use a default.
      // A real implementation would iterate each border (top, bottom, left, right, insideH, insideV)
      // and convert its BorderTypeSchema to CSS.
      // Example for top border:
      const topBorder = properties.tcBorders.top;
      if (topBorder && topBorder.val && topBorder.val !== 'nil') {
          const widthPt = (topBorder.sz?.val || 8) / 8; // Default to 1pt if sz not specified (8/8ths of a point)
          const color = (topBorder.color?.val && topBorder.color.val !== 'auto') ? `#${topBorder.color.val}` : '#000000';
          // Border style mapping (e.g. 'single' -> 'solid', 'double' -> 'double')
          const style = topBorder.val === 'single' ? 'solid' : topBorder.val; // Basic mapping
          styles.push(`border-top: ${formatPoints(widthPt)} ${style} ${color};`);
      }
       // Similar logic for bottom, left, right borders.
       // For now, a generic border if any tcBorder is present:
      if (!styles.some(s => s.startsWith('border-top'))) { // Avoid adding if already specific
          styles.push('border: 0.5pt solid #cccccc;'); // Fallback generic border
      }

  } else if (!tableProperties?.tblBorders && !properties.tcBorders) {
      // If no table-level or cell-level borders defined, ensure a minimal visible border for structure.
      // This might be undesirable if the DOCX truly has no borders.
      // styles.push('border: 0.5pt solid #eeeeee;'); 
  }


  return styles.join(' ');
}