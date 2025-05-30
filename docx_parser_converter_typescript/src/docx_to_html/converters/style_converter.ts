import {
  FontPropertiesModel,
  SpacingPropertiesModel,
  IndentationPropertiesModel,
  DocMarginsModel,
  RunStylePropertiesModel,
  ParagraphStylePropertiesModel,
  ShadingPropertiesModel,
} from '../../../docx_parsers/models/index';

// --- Helper for CSS String Aggregation ---

/**
 * Aggregates multiple CSS style parts into a single string.
 * Filters out empty or null/undefined parts.
 * @param cssParts Array of CSS style strings.
 * @returns A single CSS style string.
 */
function aggregateCss(...cssParts: string[]): string {
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
