import {
  FontPropertiesModel,
  SpacingPropertiesModel,
  IndentationPropertiesModel,
  DocMarginsModel,
  RunStylePropertiesModel,
  ParagraphStylePropertiesModel,
  ShadingPropertiesModel,
  BorderPropertiesModel,
  TableCellBordersModel,
  TablePropertiesModel,
  TableRowPropertiesModel,
  TableCellPropertiesModel,
  MarginPropertiesModel,
} from '../../../docx_parsers/models/index';

// --- Helper for CSS String Aggregation ---

/**
 * Aggregates multiple CSS style parts into a single string.
 * Filters out empty or null/undefined parts.
 * @param cssParts Array of CSS style strings.
 * @returns A single CSS style string.
 */
export function aggregateCss(...cssParts: string[]): string { // Added export
  return cssParts.filter(part => part && part.trim() !== '').join('');
}

// --- Individual Property Converters ---

/**
 * Converts bold property to CSS.
 * @param bold Boolean indicating if text is bold.
 * @returns CSS string for font-weight or empty string.
 */
export function convertBold(bold?: boolean): string {
  return bold ? 'font-weight:bold;' : '';
}

/**
 * Converts italic property to CSS.
 * @param italic Boolean indicating if text is italic.
 * @returns CSS string for font-style or empty string.
 */
export function convertItalic(italic?: boolean): string {
  return italic ? 'font-style:italic;' : '';
}

/**
 * Converts underline property to CSS.
 * @param underline Underline type string (e.g., "single", "double", "none").
 * @returns CSS string for text-decoration or empty string.
 */
export function convertUnderline(underline?: string): string {
  if (!underline || underline === 'none') return '';

  let style = 'text-decoration:underline;';
  switch (underline) {
    case 'double':
      style += 'text-decoration-style:double;';
      break;
    case 'dotted':
      style += 'text-decoration-style:dotted;';
      break;
    case 'dashed':
      style += 'text-decoration-style:dashed;';
      break;
    case 'wave':
      style += 'text-decoration-style:wavy;'; // CSS uses 'wavy' for 'wave'
      break;
    case 'words':
      // CSS doesn't have a direct 'words' equivalent for text-decoration skipping spaces.
      // This would require more complex span wrapping or is ignored.
      // For simplicity, treating as 'single' underline.
      break;
    case 'single':
    default:
      // Default is 'text-decoration:underline;' which implies single solid.
      break;
  }
  return style;
}

/**
 * Converts font color property to CSS.
 * @param color Hex color string (e.g., "FF0000") or "auto".
 * @returns CSS string for color or empty string.
 */
export function convertFontColor(color?: string): string {
  if (!color || color === 'auto') return '';
  return `color:#${color};`;
}

/**
 * Converts font properties to CSS font-family.
 * @param font FontPropertiesModel object.
 * @returns CSS string for font-family or empty string.
 *          Tries to use ascii, hAnsi, eastAsia, or cs fonts in order of preference.
 */
export function convertFontFamily(font?: FontPropertiesModel): string {
  if (!font) return '';
  const fontFamily = font.ascii || font.hAnsi || font.eastAsia || font.cs;
  // Quote font names that contain spaces
  return fontFamily ? `font-family:"${fontFamily.replace(/"/g, "'")}";` : '';
}

/**
 * Converts font size (in points) to CSS.
 * @param sizePt Font size in points.
 * @returns CSS string for font-size or empty string.
 */
export function convertFontSize(sizePt?: number): string {
  return sizePt && sizePt > 0 ? `font-size:${sizePt}pt;` : '';
}

/**
 * Converts highlight color to CSS background-color.
 * Standard highlight colors are mapped.
 * @param highlightColor Highlight color string (e.g., "yellow", "green").
 * @returns CSS string for background-color or empty string.
 */
export function convertHighlightColor(highlightColor?: string): string {
  if (!highlightColor || highlightColor === "none") return '';
  // This can be expanded with more colors or direct hex if available from model
  return `background-color:${highlightColor};`;
}

/**
 * Converts shading properties to CSS background-color.
 * @param shading ShadingPropertiesModel object.
 * @returns CSS string for background-color or empty string.
 */
export function convertShadingToCss(shading?: ShadingPropertiesModel): string {
  if (!shading || !shading.fill || shading.fill === 'auto' || shading.val === 'clear') return '';
  return `background-color:#${shading.fill};`;
}

/**
 * Converts strikethrough property to CSS.
 * @param strike Boolean indicating if text has strikethrough.
 * @returns CSS string for text-decoration or empty string.
 */
export function convertStrikethrough(strike?: boolean): string {
  return strike ? 'text-decoration:line-through;' : '';
}

/**
 * Converts small caps property to CSS.
 * @param smallCaps Boolean indicating if text is small caps.
 * @returns CSS string for font-variant-caps or empty string.
 */
export function convertSmallCaps(smallCaps?: boolean): string {
  return smallCaps ? 'font-variant-caps:small-caps;' : '';
}

/**
 * Converts all caps property to CSS.
 * @param allCaps Boolean indicating if text is all caps.
 * @returns CSS string for text-transform or empty string.
 */
export function convertAllCaps(allCaps?: boolean): string {
  return allCaps ? 'text-transform:uppercase;' : '';
}

/**
 * Converts vertical alignment (subscript/superscript) to CSS.
 * @param vertAlign Vertical alignment string ("superscript", "subscript", "baseline").
 * @returns CSS string for vertical-align or empty string.
 */
export function convertVerticalAlign(vertAlign?: string): string {
  if (vertAlign === 'superscript' || vertAlign === 'subscript') {
    return `vertical-align:${vertAlign};`;
  }
  // 'baseline' is default, so no CSS needed unless explicitly overriding.
  return '';
}

/**
 * Converts text position (in points, for raised/lowered text) to CSS.
 * @param positionPt Text position in points (positive for raised, negative for lowered).
 * @returns CSS string for position and top/bottom, or empty string.
 */
export function convertTextPosition(positionPt?: number): string {
    if (positionPt && positionPt !== 0) {
        // Using relative positioning and top. Note: 1pt in Word is often more than 1px on web.
        return `position:relative; top:${-positionPt}pt;`; // Negative top for raised text
    }
    return '';
}


/**
 * Converts paragraph spacing properties to CSS margin.
 * @param spacing SpacingPropertiesModel object.
 * @returns CSS string for margin-top, margin-bottom, line-height or empty string.
 */
export function convertSpacingToCss(spacing?: SpacingPropertiesModel): string {
  if (!spacing) return '';
  let css = '';
  if (spacing.before_pt !== undefined) css += `margin-top:${spacing.before_pt}pt;`;
  if (spacing.after_pt !== undefined) css += `margin-bottom:${spacing.after_pt}pt;`;
  if (spacing.line_pt !== undefined) {
    // line_pt in DOCX is absolute line height in points.
    // CSS line-height can be unitless (multiplier of font size) or absolute.
    // For direct point mapping:
    css += `line-height:${spacing.line_pt}pt;`;
  }
  // TODO: spacing.lineRule (e.g., "auto", "exact", "atLeast") could influence line-height interpretation.
  // 'auto' often means 120% of font size in Word. 'exact' means line_pt is strict.
  // 'atLeast' means line_pt is a minimum.
  return css;
}

/**
 * Converts paragraph indentation properties to CSS.
 * @param indent IndentationPropertiesModel object.
 * @returns CSS string for margin-left, margin-right, text-indent or empty string.
 */
export function convertIndentationToCss(indent?: IndentationPropertiesModel): string {
  if (!indent) return '';
  let css = '';
  if (indent.left_pt !== undefined) css += `margin-left:${indent.left_pt}pt;`;
  if (indent.right_pt !== undefined) css += `margin-right:${indent.right_pt}pt;`;
  if (indent.firstline_pt !== undefined) css += `text-indent:${indent.firstline_pt}pt;`;
  // Note: hanging indents are represented by a negative firstline_pt.
  return css;
}

/**
 * Converts paragraph alignment (justification) to CSS text-align.
 * @param alignment Alignment string (e.g., "left", "center", "right", "both" for justified).
 * @returns CSS string for text-align or empty string.
 */
export function convertAlignment(alignment?: string): string {
  if (!alignment) return '';
  switch (alignment.toLowerCase()) {
    case 'left': return 'text-align:left;';
    case 'center': return 'text-align:center;';
    case 'right': return 'text-align:right;';
    case 'both': return 'text-align:justify;'; // 'both' in DOCX usually means justify
    case 'distribute': return 'text-align:justify; text-align-last:justify;'; // More complex
    default: return '';
  }
}

/**
 * Converts document margins to CSS padding for a page container div.
 * @param margins DocMarginsModel object.
 * @returns CSS string for padding (top, right, bottom, left) and potentially margin for gutter.
 */
export function convertDocMarginsToCss(margins?: DocMarginsModel): string {
  if (!margins) return '';
  let css = '';
  if (margins.top_pt !== undefined) css += `padding-top:${margins.top_pt}pt;`;
  if (margins.right_pt !== undefined) css += `padding-right:${margins.right_pt}pt;`;
  if (margins.bottom_pt !== undefined) css += `padding-bottom:${margins.bottom_pt}pt;`;
  if (margins.left_pt !== undefined) css += `padding-left:${margins.left_pt}pt;`;
  // Gutter might be page-level margin, not padding of content div.
  // if (margins.gutter_pt !== undefined && margins.gutter_pt > 0) css += `margin-left:${margins.gutter_pt}pt;`; // Assuming gutter on left
  // Header/Footer margins are distances from page edge to header/footer content, not directly page content padding.
  return css;
}

/**
 * Converts page break before property to CSS.
 * @param pageBreakBefore Boolean indicating if a page break should occur before the paragraph.
 * @returns CSS string for break-before or empty string.
 */
export function convertPageBreakBefore(pageBreakBefore?: boolean): string {
    return pageBreakBefore ? 'break-before:page;' : ''; // or 'always'
}

// --- Table Style Converters ---

/**
 * Maps DOCX border type and color to a CSS border string part.
 * @param docxBorder A BorderPropertiesModel object.
 * @returns CSS string for a single border (e.g., "1pt solid #000000").
 */
export function mapDocxBorderToCss(docxBorder?: BorderPropertiesModel): string {
  if (!docxBorder || !docxBorder.val || docxBorder.val === 'nil' || docxBorder.val === 'none') {
    return 'none'; // Explicitly 'none' if border is not set or 'nil'
  }

  // Size is in eighths of a point. Default to 1pt if size is 0 or undefined.
  const sizeInPts = (docxBorder.size ?? 8) / 8;
  const color = docxBorder.color && docxBorder.color !== 'auto' ? `#${docxBorder.color}` : 'black'; // Default to black if auto

  // Map DOCX border types to CSS border styles
  // This is a simplified mapping. More complex DOCX borders exist (e.g., themed, art borders).
  let style = 'solid'; // Default
  switch (docxBorder.val) {
    case 'single': style = 'solid'; break;
    case 'double': style = 'double'; break;
    case 'dotted': style = 'dotted'; break;
    case 'dashed': style = 'dashed'; break;
    // TODO: Add more mappings (e.g., dashDot, dashSmallGap, dotDash, dotDotDash, etc.)
    // Some might need creative CSS or be approximated.
    // For 'nil' or 'none', we already returned 'none'.
  }
  return `${sizeInPts}pt ${style} ${color}`;
}


/**
 * Converts a single BorderPropertiesModel to a full CSS border property string.
 * @param border The BorderPropertiesModel object.
 * @param side The border side (e.g., "top", "left").
 * @returns Full CSS border string (e.g., "border-top:1pt solid #FF0000;").
 */
export function getBorderCss(border?: BorderPropertiesModel, side?: string): string {
  if (!border || !side) return '';
  const borderStyle = mapDocxBorderToCss(border);
  return borderStyle !== 'none' ? `border-${side}:${borderStyle};` : `border-${side}:none;`;
}

/**
 * Converts TableCellBordersModel to a CSS string.
 * @param borders The TableCellBordersModel object.
 * @returns Aggregated CSS string for all borders.
 */
export function getTableCellBordersCss(borders?: TableCellBordersModel): string {
  if (!borders) return '';
  return aggregateCss(
    getBorderCss(borders.top, 'top'),
    getBorderCss(borders.right, 'right'),
    getBorderCss(borders.bottom, 'bottom'),
    getBorderCss(borders.left, 'left')
    // Note: insideH and insideV are for table-level defaults, not directly applied with border-* properties
    // They are used by browsers for internal cell borders if not overridden by cell-specific borders.
  );
}


/**
 * Maps DOCX vertical alignment values to CSS vertical-align.
 * @param vAlign DOCX vertical alignment string ('top', 'center', 'bottom').
 * @returns CSS vertical-align value or empty string.
 */
export function mapVerticalAlignment(vAlign?: string): string {
  switch (vAlign) {
    case 'top': return 'top';
    case 'center': return 'middle';
    case 'bottom': return 'bottom';
    default: return '';
  }
}

/**
 * Gets CSS styles for TablePropertiesModel.
 * @param props The TablePropertiesModel object.
 * @returns A concatenated string of CSS styles for the <table> element.
 */
export function getTablePropertiesCss(props?: TablePropertiesModel): string {
  if (!props) return '';
  let css = '';
  if (props.width?.val && props.width.type) {
    if (props.width.type === 'dxa') { // Twips
      css += `width:${convertTwipsToPoints(props.width.val)}pt;`;
    } else if (props.width.type === 'pct') { // Fiftieths of a percent
      css += `width:${props.width.val / 50}%;`;
    } else if (props.width.type === 'auto') {
      css += `width:auto;`;
    }
  } else {
    css += `width:auto;`; // Default if not specified
  }

  if (props.alignment) { // 'left', 'center', 'right'
    if (props.alignment === 'center') {
      css += 'margin-left:auto;margin-right:auto;';
    } else if (props.alignment === 'right') {
      css += 'margin-left:auto;margin-right:0;'; // Or float:right; clear:both;
    } else {
      // css += 'margin-left:0;margin-right:auto;'; // Default for left
    }
  }

  if (props.indent?.val) { // Assuming val is in points from parser
      css += `margin-left:${props.indent.val}pt;`; // This might conflict with alignment
  }

  // Default cell margins (applied as padding to the table, then cells can override)
  // This is a simplification; usually, cell margins are on cells.
  // if (props.cell_margins) {
  //   if (props.cell_margins.left_pt) css += `padding-left:${props.cell_margins.left_pt}pt;`;
  //   if (props.cell_margins.top_pt) css += `padding-top:${props.cell_margins.top_pt}pt;`;
  // }

  // Table layout
  if (props.layout_type === 'fixed') {
    css += 'table-layout:fixed;';
  }

  // Table-level default cell borders (can be complex to translate directly to table CSS)
  // Often managed by browser's interpretation of border-collapse and individual cell borders.
  // css += getTableCellBordersCss(props.borders); // This might be too aggressive on <table>

  // Table shading
  css += convertShadingToCss(props.shading);

  // Cell spacing (HTML border-spacing attribute)
  if (props.cell_spacing_dxa !== undefined) {
      css += `border-spacing:${convertTwipsToPoints(props.cell_spacing_dxa)}pt;border-collapse:separate;`;
  } else {
      css += `border-collapse:collapse;`; // Default for most modern looks
  }

  return css;
}

/**
 * Gets CSS styles for TableRowPropertiesModel.
 * @param props The TableRowPropertiesModel object.
 * @returns A concatenated string of CSS styles for the <tr> element.
 */
export function getTableRowPropertiesCss(props?: TableRowPropertiesModel): string {
  if (!props) return '';
  let css = '';
  if (props.trHeight_val !== undefined) {
    css += `height:${props.trHeight_val}pt;`;
    // TODO: Handle props.trHeight_hRule ('atLeast', 'exact', 'auto')
    // 'exact' means height is strict. 'atLeast' means min-height. 'auto' is default.
    if (props.trHeight_hRule === 'atLeast') {
        css = `min-height:${props.trHeight_val}pt;`; // replace height with min-height
    }
  }
  // Justification for row content (usually handled by cells)
  // if (props.justification) css += `text-align:${props.justification};`;

  // Row-level default shading and borders are less common to apply directly to <tr>
  // and are usually superseded by cell-specific formatting.
  // css += convertShadingToCss(props.shd);
  // css += getTableCellBordersCss(props.tblBorders); // These are default cell borders

  return css;
}

/**
 * Gets CSS styles for TableCellPropertiesModel.
 * @param props The TableCellPropertiesModel object.
 * @param defaultCellMar Optional default cell margins from table properties (not typically used this way).
 * @returns A concatenated string of CSS styles for <td> or <th>.
 */
export function getTableCellPropertiesCss(props?: TableCellPropertiesModel, _defaultCellMar?: MarginPropertiesModel): string {
  if (!props) return '';
  let css = '';

  // Cell width
  if (props.width?.val && props.width.type) {
    if (props.width.type === 'dxa') {
      css += `width:${convertTwipsToPoints(props.width.val)}pt;`;
    } else if (props.width.type === 'pct') {
      css += `width:${props.width.val / 50}%;`;
    } else if (props.width.type === 'auto' || props.width.type === 'nil') {
        // css += `width:auto;`; // browser default
    }
  }

  // Cell margins (applied as padding to the cell)
  if (props.margins) {
    if (props.margins.top_pt !== undefined) css += `padding-top:${props.margins.top_pt}pt;`;
    if (props.margins.right_pt !== undefined) css += `padding-right:${props.margins.right_pt}pt;`;
    if (props.margins.bottom_pt !== undefined) css += `padding-bottom:${props.margins.bottom_pt}pt;`;
    if (props.margins.left_pt !== undefined) css += `padding-left:${props.margins.left_pt}pt;`;
  }

  // Cell borders
  css += getTableCellBordersCss(props.borders);

  // Cell shading
  css += convertShadingToCss(props.shading);

  // Vertical alignment
  if (props.vAlign) {
    css += `vertical-align:${mapVerticalAlignment(props.vAlign)};`;
  }

  // Text direction
  if (props.textDirection) {
    // e.g., "tbRl" (top to bottom, right to left)
    // This is complex, might need writing-mode CSS property.
    // Example: if (props.textDirection === 'tbRl') css += 'writing-mode:vertical-rl;';
    // console.warn(`Text direction ${props.textDirection} not fully supported in CSS.`);
  }

  // NoWrap
  if (props.noWrap) {
    css += 'white-space:nowrap;';
  }

  return css;
}


// --- Aggregate Style Functions ---

/**
 * Gets all CSS styles for a run based on its properties.
 * @param props RunStylePropertiesModel object.
 * @returns A concatenated string of CSS styles.
 */
export function getRunStyles(props?: RunStylePropertiesModel): string {
  if (!props) return '';
  return aggregateCss(
    convertBold(props.bold),
    convertItalic(props.italic),
    convertUnderline(props.underline),
    convertFontColor(props.color),
    convertFontFamily(props.fonts),
    convertFontSize(props.size_pt),
    convertHighlightColor(props.highlight),
    convertShadingToCss( { fill: props.shading_fill, color: props.shading_color } as ShadingPropertiesModel), // Reconstruct for helper
    convertStrikethrough(props.strike),
    convertSmallCaps(props.small_caps),
    convertAllCaps(props.all_caps),
    convertVerticalAlign(props.vert_align),
    convertTextPosition(props.position_pt)
    // TODO: Add other run properties like kerning, character_spacing_twips, hidden, emboss, outline, shadow if direct CSS mappings exist or are desired.
    // convertKerning(props.kerning_pt),
    // convertCharacterSpacing(props.character_spacing_twips),
    // convertHidden(props.hidden) // display:none ?
    // convertEmboss(props.emboss) // text-shadow trickery?
    // convertOutline(props.outline) // -webkit-text-stroke?
    // convertShadow(props.shadow) // text-shadow
  );
}

/**
 * Gets all CSS styles for a paragraph based on its properties.
 * @param props ParagraphStylePropertiesModel object.
 * @param isListItem If the paragraph is part of a list item (currently not used for special handling).
 * @returns A concatenated string of CSS styles.
 */
export function getParagraphStyles(props?: ParagraphStylePropertiesModel, isListItem?: boolean): string {
  if (!props) return '';

  // Suppress text-indent for list items if list marker handles indentation (common browser behavior)
  // However, explicit indentation from DOCX should probably still be applied.
  // This might need more sophisticated logic based on specific list styling.
  // For now, apply all styles.
  // const indentCss = (isListItem && props.indentation?.firstLinePt) ? '' : convertIndentationToCss(props.indentation);

  return aggregateCss(
    convertSpacingToCss(props.spacing),
    convertIndentationToCss(props.indentation),
    convertAlignment(props.alignment),
    convertPageBreakBefore(props.page_break_before)
    // TODO: Add other paragraph properties like widow_control, keep_next, keep_lines, borders
    // convertWidowControl(props.widow_control) // CSS: widow-orphan properties
    // convertKeepNext(props.keep_next) // CSS: break-after:avoid-page;
    // convertKeepLines(props.keep_lines) // CSS: break-inside:avoid-page;
    // convertParagraphBorders(props.borders) // Complex: border-top, border-bottom etc.
  );
}
