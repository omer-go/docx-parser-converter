/**
 * Style Converter for HTML Output - Python-Compatible Version
 * 
 * Converts DOCX style properties to inline CSS style strings that exactly match
 * the Python DOCX converter output format.
 */

import type { ParagraphStyleProperties, RunStyleProperties } from '@/models/styles-models.js';
import type { ConversionContext } from './index.js';

/**
 * Utility class for converting DOCX styles to Python-compatible inline CSS
 */
export class StyleConverter {
  /**
   * Convert paragraph style properties to inline style string - Python compatible
   * @param properties - DOCX paragraph style properties
   * @param _context - Conversion context
   * @returns Inline style string matching Python format
   */
  static convertParagraphStyles(
    properties: ParagraphStyleProperties,
    _context: ConversionContext
  ): string {
    const styles: string[] = [];

    // Handle indentation (margin-left and text-indent for numbering)
    if (properties.indent) {
      if (properties.indent.left_pt !== null && properties.indent.left_pt !== undefined) {
        styles.push(`margin-left:${properties.indent.left_pt}pt`);
      }
      if (properties.indent.firstline_pt !== null && properties.indent.firstline_pt !== undefined) {
        styles.push(`text-indent:${properties.indent.firstline_pt}pt`);
      }
      if (properties.indent.right_pt !== null && properties.indent.right_pt !== undefined) {
        styles.push(`margin-right:${properties.indent.right_pt}pt`);
      }
    }

    // Handle spacing (margin-top and margin-bottom)
    if (properties.spacing) {
      if (properties.spacing.before_pt !== null && properties.spacing.before_pt !== undefined) {
        styles.push(`margin-top:${properties.spacing.before_pt}pt`);
      }
      if (properties.spacing.after_pt !== null && properties.spacing.after_pt !== undefined) {
        styles.push(`margin-bottom:${properties.spacing.after_pt}pt`);
      }
    }

    // Handle text alignment - Python format
    if (properties.justification) {
      const alignment = this.mapJustificationToPython(properties.justification);
      if (alignment) {
        styles.push(`text-align:${alignment}`);
      }
    } else {
      // Default alignment in Python format
      styles.push('text-align:left');
    }

    return styles.join(';');
  }

  /**
   * Convert run style properties to inline style string - Python compatible
   * @param properties - DOCX run style properties
   * @param _context - Conversion context
   * @returns Inline style string matching Python format
   */
  static convertRunStyles(
    properties: RunStyleProperties,
    _context: ConversionContext
  ): string {
    const styles: string[] = [];

    // Handle font style (italic) - must come before other properties
    if (properties.italic === true) {
      styles.push('font-style:italic');
    }

    // Handle text decoration (underline)
    if (properties.underline && properties.underline !== 'none') {
      styles.push('text-decoration:underline');
    }

    // Handle font weight (bold)
    if (properties.bold === true) {
      styles.push('font-weight:bold');
    }

    // Handle font color - Python format
    if (properties.color) {
      const color = this.normalizeColorToPython(properties.color);
      styles.push(`color:${color}`);
    } else {
      // Default color in Python format
      styles.push('color:auto');
    }

    // Handle font family - Python format
    if (properties.font) {
      const fontFamily = this.buildFontFamilyPython(properties.font);
      if (fontFamily) {
        styles.push(`font-family:${fontFamily}`);
      }
    }

    // Handle font size - Python format with .0pt precision
    if (properties.size_pt !== null && properties.size_pt !== undefined) {
      styles.push(`font-size:${properties.size_pt.toFixed(1)}pt`);
    }

    return styles.join(';');
  }

  /**
   * Create inline styles for numbering paragraphs - Python compatible
   * @param level - Numbering level (0-based)
   * @param isNumbered - Whether this is a numbered paragraph
   * @returns Inline style string for numbering margins and indentation
   */
  static createNumberingStyles(level: number, isNumbered: boolean = true): string {
    if (!isNumbered) {
      return 'text-align:left';
    }

    // Python numbering indentation: 36pt base + 18pt per level for margin-left
    // -18pt text-indent for all numbered items
    const marginLeft = 36 + (level * 18);
    const textIndent = -18;

    return `margin-left:${marginLeft.toFixed(1)}pt;text-indent:${textIndent.toFixed(1)}pt;text-align:left`;
  }

  /**
   * Create padding span styles for numbering spacing - Python compatible
   * @param paddingPt - Padding amount in points
   * @returns Inline style string for padding span
   */
  static createPaddingSpanStyles(paddingPt: number): string {
    return `padding-left:${paddingPt.toFixed(1)}pt;`;
  }

  /**
   * Create table styles - Python compatible
   * @param width - Table width in points
   * @param marginLeft - Table margin-left in points
   * @returns Inline style string for table element
   */
  static createTableStyles(width: number, marginLeft: number = -0.25): string {
    const styles = [
      'border-collapse: collapse',
      `width:${width.toFixed(1)}pt`,
      'text-align:start',
      `margin-left:${marginLeft}pt`,
      'padding: 2.75pt 2.75pt 2.75pt 2.75pt',
      'table-layout:fixed'
    ];

    return styles.join('; ') + ';';
  }

  /**
   * Create table cell styles - Python compatible
   * @param width - Cell width in points
   * @param borders - Border configuration
   * @returns Inline style string for table cell
   */
  static createTableCellStyles(
    width: number,
    borders: {
      top?: boolean;
      right?: boolean;
      bottom?: boolean;
      left?: boolean;
    } = {}
  ): string {
    const styles = [
      'word-wrap: break-word',
      'word-break: break-all',
      'overflow-wrap: break-word',
      'overflow: hidden',
      `width:${width.toFixed(2)}pt`
    ];

    // Add borders - Python format
    const borderStyle = '0.5pt solid #000000';
    if (borders.top) styles.push(`border-top:${borderStyle}`);
    if (borders.left) styles.push(`border-left:${borderStyle}`);
    if (borders.bottom) styles.push(`border-bottom:${borderStyle}`);
    if (borders.right) styles.push(`border-right:${borderStyle}`);

    styles.push('padding: 2.75pt 2.75pt 2.75pt 2.75pt');
    styles.push('vertical-align: top');

    return styles.join('; ') + ';';
  }

  /**
   * Map DOCX justification to Python text alignment
   * @param justification - DOCX justification value
   * @returns Python-compatible text alignment
   */
  private static mapJustificationToPython(justification: string): string | null {
    const alignmentMap: Record<string, string> = {
      'left': 'left',
      'center': 'center',
      'right': 'right',
      'both': 'justify',
      'justify': 'justify',
      'start': 'left',
      'end': 'right'
    };

    return alignmentMap[justification.toLowerCase()] || 'left';
  }

  /**
   * Normalize color to Python format
   * @param color - Color value from DOCX
   * @returns Python-compatible color string
   */
  private static normalizeColorToPython(color: string): string {
    if (!color || color === 'auto') {
      return 'auto';
    }

    // Handle RGB hex colors (6 characters) - Python uses uppercase without #
    if (color.match(/^#?[0-9A-Fa-f]{6}$/)) {
      return color.replace('#', '').toUpperCase();
    }

    // Handle RGB hex colors (3 characters) - expand to 6
    if (color.match(/^#?[0-9A-Fa-f]{3}$/)) {
      const hex = color.replace('#', '');
      const expanded = hex.split('').map(c => c + c).join('');
      return expanded.toUpperCase();
    }

    // Handle named colors - convert to hex without #
    const namedColors: Record<string, string> = {
      'black': '000000',
      'white': 'FFFFFF',
      'red': 'FF0000',
      'green': '00FF00',
      'blue': '0000FF',
      'yellow': 'FFFF00',
      'cyan': '00FFFF',
      'magenta': 'FF00FF',
      'purple': '800080'
    };

    const namedColor = namedColors[color.toLowerCase()];
    if (namedColor) {
      return namedColor;
    }

    // Default to auto if can't parse
    return 'auto';
  }

  /**
   * Build font family string - Python format
   * @param font - Font object from DOCX
   * @returns Python-compatible font family string
   */
  private static buildFontFamilyPython(font: {
    ascii?: string | null | undefined;
    hAnsi?: string | null | undefined;
    eastAsia?: string | null | undefined;
    cs?: string | null | undefined;
  }): string | null {
    // Python uses simple font family names without quotes or fallbacks
    const fontName = font.ascii || font.hAnsi || font.eastAsia || font.cs;
    
    if (!fontName) {
      return null;
    }

    // Return font name exactly as it appears in Python output
    return fontName;
  }

  /**
   * Merge multiple style objects into a single inline style string
   * @param styles - Array of style objects or strings
   * @returns Combined inline style string
   */
  static mergeInlineStyles(...styles: (string | Record<string, string> | undefined)[]): string {
    const combined: Record<string, string> = {};

    for (const style of styles) {
      if (!style) continue;

      if (typeof style === 'string') {
        // Parse existing style string
        style.split(';').forEach(rule => {
          const [prop, value] = rule.split(':').map(s => s.trim());
          if (prop && value) {
            combined[prop] = value;
          }
        });
      } else {
        // Merge style object
        Object.assign(combined, style);
      }
    }

    return Object.entries(combined)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');
  }

  /**
   * Generate default paragraph style - Python compatible
   * @returns Default paragraph inline style string
   */
  static getDefaultParagraphStyle(): string {
    return 'text-align:left';
  }

  /**
   * Generate default run style - Python compatible
   * @returns Default run inline style string
   */
  static getDefaultRunStyle(): string {
    return 'color:auto;font-family:Arial Black;font-size:12.0pt';
  }

  /**
   * Check if styles are empty or default
   * @param styles - Style string to check
   * @returns Whether styles are empty or just defaults
   */
  static areStylesEmpty(styles: string): boolean {
    if (!styles || styles.trim() === '') {
      return true;
    }

    // Check if only contains default values
    const defaultPatterns = [
      'text-align:left',
      'color:auto',
      'font-family:Arial Black',
      'font-size:12.0pt'
    ];

    const styleParts = styles.split(';').map(s => s.trim()).filter(s => s);
    return styleParts.every(part => defaultPatterns.some(pattern => part === pattern));
  }
} 