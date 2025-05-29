/**
 * Paragraph Converter for HTML Output - Python-Compatible Version
 * 
 * Converts DOCX paragraph elements to HTML p elements with inline styles
 * that exactly match the Python DOCX converter output format.
 */

import type { Paragraph } from '@/models/paragraph-models.js';
import type { HtmlElement, ConversionContext } from './index.js';
import { StyleConverter } from './style-converter.js';
import { RunConverter } from './run-converter.js';
import { NumberingConverter } from './numbering-converter.js';

/**
 * Converter for DOCX paragraph elements to HTML - Python compatible
 */
export class ParagraphConverter {
  /**
   * Convert a DOCX paragraph to HTML p element with inline styles - Python compatible
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns HTML element representing the paragraph
   */
  static convertParagraph(paragraph: Paragraph, context: ConversionContext): HtmlElement {
    // Convert runs to HTML content - ensuring all text is wrapped in spans
    const runElements: HtmlElement[] = [];
    
    // Handle numbering if present
    if (paragraph.numbering) {
      const numberingElements = NumberingConverter.convertNumbering(
        paragraph.numbering,
        context
      );
      if (numberingElements && numberingElements.length > 0) {
        runElements.push(...numberingElements);
      }
    }

    // Convert all runs to styled spans
    for (const run of paragraph.runs) {
      const runElement = RunConverter.convertRun(run, context);
      runElements.push(runElement);
    }

    // Create paragraph inline styles
    let inlineStyle = '';
    
    if (paragraph.properties) {
      // Handle numbering styles first (if this is a numbered paragraph)
      if (paragraph.numbering) {
        const level = paragraph.numbering.ilvl || 0;
        inlineStyle = StyleConverter.createNumberingStyles(level, true);
      } else {
        // Regular paragraph styles
        inlineStyle = StyleConverter.convertParagraphStyles(paragraph.properties, context);
      }
    } else {
      // Default paragraph style
      inlineStyle = StyleConverter.getDefaultParagraphStyle();
    }

    // Create paragraph element with inline styles
    const attributes: Record<string, string> = {};
    if (inlineStyle && !StyleConverter.areStylesEmpty(inlineStyle)) {
      attributes.style = inlineStyle;
    }

    return {
      tag: 'p',
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      content: runElements.length > 0 ? runElements : ''
    };
  }

  /**
   * Get text content from a paragraph (for utility purposes)
   * @param paragraph - DOCX paragraph element
   * @returns Plain text content
   */
  static getTextContent(paragraph: Paragraph): string {
    return paragraph.runs
      .map(run => RunConverter.getTextContent(run))
      .join('');
  }

  /**
   * Check if a paragraph is empty (no text content)
   * @param paragraph - DOCX paragraph element
   * @returns True if paragraph has no meaningful content
   */
  static isEmpty(paragraph: Paragraph): boolean {
    const textContent = this.getTextContent(paragraph).trim();
    return textContent.length === 0;
  }

  /**
   * Check if a paragraph is a heading
   * @param paragraph - DOCX paragraph element
   * @returns True if paragraph is a heading
   */
  static isHeading(paragraph: Paragraph): boolean {
    if (!paragraph.properties?.style_id) return false;
    
    const styleId = paragraph.properties.style_id.toLowerCase();
    return styleId.includes('heading') || 
           styleId.includes('title') ||
           /^h[1-6]$/i.test(styleId);
  }

  /**
   * Get heading level from paragraph
   * @param paragraph - DOCX paragraph element
   * @returns Heading level (1-6) or null if not a heading
   */
  static getHeadingLevel(paragraph: Paragraph): number | null {
    if (!this.isHeading(paragraph)) return null;
    
    const styleId = paragraph.properties?.style_id?.toLowerCase();
    if (!styleId) return null;
    
    // Check for outline level first
    if (paragraph.properties?.outline_level !== null && 
        paragraph.properties?.outline_level !== undefined) {
      const level = paragraph.properties.outline_level + 1; // outline level is 0-based
      return Math.min(Math.max(level, 1), 6); // Clamp to 1-6
    }
    
    // Extract from style name
    const headingMatch = styleId.match(/heading\s*(\d+)|h(\d+)/);
    if (headingMatch) {
      const levelStr = headingMatch[1] || headingMatch[2] || '1';
      const level = parseInt(levelStr, 10);
      return Math.min(Math.max(level, 1), 6); // Clamp to 1-6
    }
    
    // Default to h1 for unspecified headings
    return 1;
  }

  /**
   * Convert paragraph to heading element if appropriate - Python compatible
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns HTML heading element or null if not a heading
   */
  static convertToHeading(paragraph: Paragraph, context: ConversionContext): HtmlElement | null {
    const headingLevel = this.getHeadingLevel(paragraph);
    if (headingLevel === null) return null;
    
    // Use the regular paragraph conversion but change the tag
    const paragraphElement = this.convertParagraph(paragraph, context);
    return {
      ...paragraphElement,
      tag: `h${headingLevel}`,
    };
  }

  /**
   * Convert paragraph with automatic heading detection - Python compatible
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns HTML element (p or h1-h6)
   */
  static convertParagraphWithHeadingDetection(
    paragraph: Paragraph, 
    context: ConversionContext
  ): HtmlElement {
    const headingElement = this.convertToHeading(paragraph, context);
    return headingElement || this.convertParagraph(paragraph, context);
  }

  /**
   * Get paragraph statistics
   * @param paragraph - DOCX paragraph element
   * @returns Statistics about the paragraph
   */
  static getStatistics(paragraph: Paragraph): {
    runCount: number;
    textLength: number;
    hasNumbering: boolean;
    isHeading: boolean;
    isEmpty: boolean;
  } {
    return {
      runCount: paragraph.runs.length,
      textLength: this.getTextContent(paragraph).length,
      hasNumbering: !!paragraph.numbering,
      isHeading: this.isHeading(paragraph),
      isEmpty: this.isEmpty(paragraph)
    };
  }
} 