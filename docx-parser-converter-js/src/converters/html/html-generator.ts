/**
 * HTML Generator - Python-Compatible Version
 * 
 * Generates raw HTML with inline styles to match the Python DOCX converter output exactly.
 * This implementation produces HTML in the format: <html><body><div style="...">content</div></body></html>
 */

import type { HtmlElement } from './converters/index.js';

/**
 * Utility class for generating Python-compatible HTML strings from HtmlElement structures
 */
export class HtmlGenerator {
  /**
   * Generate HTML string from HtmlElement - Python compatible format
   * @param element - HTML element structure
   * @returns Raw HTML string without formatting
   */
  static generateHtml(element: HtmlElement | HtmlElement[]): string {
    if (Array.isArray(element)) {
      return element.map(el => this.generateHtml(el)).join('');
    }

    return this.generateSingleElement(element);
  }

  /**
   * Generate HTML string for a single element - Python compatible
   * @param element - HTML element structure
   * @returns Raw HTML string
   */
  private static generateSingleElement(element: HtmlElement): string {
    // Handle special cases
    if (element.tag === 'text') {
      // Text nodes don't have tags, just return content
      return typeof element.content === 'string' ? this.escapeHtmlText(element.content) : '';
    }

    if (element.tag === '!--') {
      // HTML comments
      return `<!--${element.content || ''}-->`;
    }

    // Generate opening tag with inline styles
    const attributesStr = this.generateInlineStyles(element.attributes);
    const openingTag = `<${element.tag}${attributesStr}>`;

    // Handle self-closing tags (not used in Python output but keeping for completeness)
    if (element.selfClosing) {
      return openingTag.slice(0, -1) + ' />';
    }

    // Handle content
    if (!element.content || element.content === '') {
      // Empty element - Python style uses space for empty cells
      const isEmpty = element.tag === 'td' || element.tag === 'th';
      return `${openingTag}${isEmpty ? ' ' : ''}</${element.tag}>`;
    }

    if (typeof element.content === 'string') {
      // Text content - inline
      return `${openingTag}${this.escapeHtmlText(element.content)}</${element.tag}>`;
    }

    // Array of child elements - no indentation, raw format
    const childrenHtml = element.content
      .map(child => this.generateHtml(child))
      .join('');
    
    return `${openingTag}${childrenHtml}</${element.tag}>`;
  }

  /**
   * Generate inline style attributes from attributes object - Python compatible
   * @param attributes - Element attributes
   * @returns Formatted attributes string
   */
  private static generateInlineStyles(attributes?: Record<string, string>): string {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    return ' ' + Object.entries(attributes)
      .map(([key, value]) => `${key}="${this.escapeAttributeValue(value)}"`)
      .join(' ');
  }

  /**
   * Escape attribute values for HTML
   * @param value - Attribute value to escape
   * @returns Escaped attribute value
   */
  private static escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Generate a complete HTML document - Python compatible format
   * @param elements - Array of HTML elements
   * @param options - Generation options
   * @returns Complete HTML document string in Python format
   */
  static generateDocument(
    elements: HtmlElement[],
    options: {
      pageMargins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    } = {}
  ): string {
    const {
      pageMargins = {
        top: 56.7,
        right: 56.7,
        bottom: 56.7,
        left: 56.7
      }
    } = options;

    // Create the page margins div style - exactly matching Python format
    const marginStyle = `padding-top:${pageMargins.top}pt; padding-right:${pageMargins.right}pt; padding-bottom:${pageMargins.bottom}pt; padding-left:${pageMargins.left}pt;`;

    const bodyContent = elements
      .map(element => this.generateHtml(element))
      .join('');

    // Python format: <html><body><div style="margins">content</div></body></html>
    return `<html><body><div style="${marginStyle}">${bodyContent}</div></body></html>`;
  }

  /**
   * Escape HTML text content
   * @param text - Text to escape
   * @returns Escaped text
   */
  private static escapeHtmlText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Create a span element with inline styles - Python compatible
   * @param content - Text content
   * @param styles - Style properties
   * @returns HtmlElement for span with inline styles
   */
  static createStyledSpan(content: string, styles: Record<string, string>): HtmlElement {
    const styleStr = Object.entries(styles)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');

    return {
      tag: 'span',
      content: content,
      attributes: styleStr ? { style: styleStr } : undefined
    };
  }

  /**
   * Create a paragraph element with inline styles - Python compatible
   * @param content - Content elements or text
   * @param styles - Style properties
   * @returns HtmlElement for paragraph with inline styles
   */
  static createStyledParagraph(
    content: HtmlElement[] | string, 
    styles: Record<string, string>
  ): HtmlElement {
    const styleStr = Object.entries(styles)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');

    return {
      tag: 'p',
      content: typeof content === 'string' ? content : content,
      attributes: styleStr ? { style: styleStr } : undefined
    };
  }

  /**
   * Create a table element with colgroup and inline styles - Python compatible
   * @param content - Table content (tbody with rows)
   * @param columnWidths - Array of column widths in points
   * @param tableStyles - Table style properties
   * @returns HtmlElement for table with Python-compatible structure
   */
  static createStyledTable(
    content: HtmlElement[],
    columnWidths: number[],
    tableStyles: Record<string, string>
  ): HtmlElement {
    const tableStyleStr = Object.entries(tableStyles)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');

    // Create colgroup with column widths
    const colgroup: HtmlElement = {
      tag: 'colgroup',
      content: columnWidths.map(width => ({
        tag: 'col',
        attributes: { style: `width:${width}pt;` },
        selfClosing: false,
        content: ''
      }))
    };

    // Create tbody wrapper
    const tbody: HtmlElement = {
      tag: 'tbody',
      content: content
    };

    return {
      tag: 'table',
      content: [colgroup, tbody],
      attributes: tableStyleStr ? { style: tableStyleStr } : undefined
    };
  }

  /**
   * Create a table cell with complex inline styles - Python compatible
   * @param content - Cell content
   * @param width - Cell width in points
   * @param borders - Border specifications
   * @param isHeader - Whether this is a header cell
   * @returns HtmlElement for table cell with detailed styling
   */
  static createStyledTableCell(
    content: HtmlElement[] | string,
    width: number,
    borders: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    },
    isHeader: boolean = false
  ): HtmlElement {
    const styles: Record<string, string> = {
      'word-wrap': 'break-word',
      'word-break': 'break-all',
      'overflow-wrap': 'break-word',
      'overflow': 'hidden',
      'width': `${width}pt`,
      'padding': '2.75pt 2.75pt 2.75pt 2.75pt',
      'vertical-align': 'top'
    };

    // Add borders
    if (borders.top) styles['border-top'] = borders.top;
    if (borders.right) styles['border-right'] = borders.right;
    if (borders.bottom) styles['border-bottom'] = borders.bottom;
    if (borders.left) styles['border-left'] = borders.left;

    const styleStr = Object.entries(styles)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ');

    return {
      tag: isHeader ? 'th' : 'td',
      content: typeof content === 'string' ? content : content,
      attributes: { style: styleStr + ';' }
    };
  }

  /**
   * Extract text content from HTML elements
   * @param elements - HTML elements to extract text from
   * @returns Plain text content
   */
  static extractTextContent(elements: HtmlElement | HtmlElement[]): string {
    if (Array.isArray(elements)) {
      return elements.map(el => this.extractTextContent(el)).join(' ');
    }

    if (elements.tag === 'text' || typeof elements.content === 'string') {
      return elements.content as string || '';
    }

    if (Array.isArray(elements.content)) {
      return elements.content.map(child => this.extractTextContent(child)).join(' ');
    }

    return '';
  }

  /**
   * Count total elements in structure
   * @param elements - HTML elements to count
   * @returns Total element count
   */
  static countElements(elements: HtmlElement | HtmlElement[]): number {
    if (Array.isArray(elements)) {
      return elements.reduce((count, el) => count + this.countElements(el), 0);
    }

    let count = 1;
    if (Array.isArray(elements.content)) {
      count += elements.content.reduce((subCount, child) => subCount + this.countElements(child), 0);
    }

    return count;
  }
} 