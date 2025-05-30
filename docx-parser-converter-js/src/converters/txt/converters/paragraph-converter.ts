/**
 * Paragraph Converter for TXT Output
 * 
 * Converts DOCX paragraph elements to plain text with proper
 * text content, formatting, and numbering preservation.
 */

import type { Paragraph } from '@/models/paragraph-models.js';
import type { TxtElement, ConversionContext } from './index.js';
import { RunConverter } from './run-converter.js';
import { NumberingConverter } from './numbering-converter.js';

/**
 * Converter for DOCX paragraph elements to plain text
 */
export class ParagraphConverter {
  /**
   * Convert a DOCX paragraph to plain text
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns TXT element representing the paragraph
   */
  static convertParagraph(paragraph: Paragraph, context: ConversionContext): TxtElement {
    // Convert runs to text content
    const runTexts: string[] = [];
    
    // Add numbering if present
    if (paragraph.numbering) {
      const numberingElement = NumberingConverter.convertNumbering(
        paragraph.numbering,
        context
      );
      if (numberingElement.content) {
        runTexts.push(numberingElement.content + ' ');
      }
    }

    // Convert all runs to text
    for (const run of paragraph.runs) {
      const runElement = RunConverter.convertRun(run, context);
      if (runElement.content) {
        runTexts.push(runElement.content);
      }
    }

    const content = runTexts.join('');

    // Add indentation based on paragraph properties or numbering
    let indent = 0;
    if (paragraph.numbering) {
      indent = paragraph.numbering.ilvl * context.indentSize;
    } else if (paragraph.properties?.indent?.left_pt) {
      // Convert points to approximate spaces (rough conversion)
      indent = Math.floor(paragraph.properties.indent.left_pt / 12);
    }

    // Add debug comment if enabled
    if (context.includeDebugComments && content.trim().length > 0) {
      return {
        content: `[Paragraph: ${paragraph.runs.length} run(s)] ${content}`,
        indent,
        lineBreak: true,
        spaceAfter: true,
      };
    }

    return {
      content,
      indent,
      lineBreak: true,
      spaceAfter: this.shouldAddSpaceAfter(paragraph),
    };
  }

  /**
   * Convert paragraph to heading format if appropriate
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns TXT element with heading formatting
   */
  static convertToHeading(paragraph: Paragraph, context: ConversionContext): TxtElement | null {
    const headingLevel = this.getHeadingLevel(paragraph);
    if (headingLevel === null) return null;

    const textContent = this.getTextContent(paragraph);
    if (!textContent.trim()) return null;

    let headingContent = textContent;

    // Add heading markers if enabled
    if (context.includeHeadingMarkers) {
      const marker = '#'.repeat(headingLevel);
      headingContent = `${marker} ${textContent}`;
    } else {
      // Add underline for headings 1-2
      if (headingLevel <= 2) {
        const underlineChar = headingLevel === 1 ? '=' : '-';
        const underline = underlineChar.repeat(textContent.length);
        headingContent = `${textContent}\n${underline}`;
      }
    }

    return {
      content: headingContent,
      indent: 0,
      lineBreak: true,
      spaceBefore: true,
      spaceAfter: true,
    };
  }

  /**
   * Convert paragraph with automatic heading detection
   * @param paragraph - DOCX paragraph element
   * @param context - Conversion context
   * @returns TXT element (paragraph or heading)
   */
  static convertParagraphWithHeadingDetection(
    paragraph: Paragraph,
    context: ConversionContext
  ): TxtElement {
    const headingElement = this.convertToHeading(paragraph, context);
    return headingElement || this.convertParagraph(paragraph, context);
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
   * Determine if paragraph should have space after
   * @param paragraph - DOCX paragraph element
   * @returns True if should add space after
   */
  private static shouldAddSpaceAfter(paragraph: Paragraph): boolean {
    // Add space after headings and paragraphs with specific properties
    if (this.isHeading(paragraph)) return true;
    
    // Check for space after in paragraph properties
    if (paragraph.properties?.spacing?.after_pt && 
        paragraph.properties.spacing.after_pt > 0) {
      return true;
    }
    
    // Default to no extra space
    return false;
  }

  /**
   * Apply text wrapping to content
   * @param content - Text content to wrap
   * @param maxWidth - Maximum line width
   * @param indent - Base indentation
   * @returns Wrapped text
   */
  static wrapText(content: string, maxWidth: number, indent: number = 0): string {
    if (maxWidth <= 0 || !content) return content;
    
    const indentStr = ' '.repeat(indent);
    const effectiveWidth = maxWidth - indent;
    
    if (effectiveWidth <= 0) return content;
    
    const words = content.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= effectiveWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(indentStr + currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          lines.push(indentStr + word.substring(0, effectiveWidth));
          currentLine = word.substring(effectiveWidth);
        }
      }
    }
    
    if (currentLine) {
      lines.push(indentStr + currentLine);
    }
    
    return lines.join('\n');
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
    headingLevel: number | null;
  } {
    return {
      runCount: paragraph.runs.length,
      textLength: this.getTextContent(paragraph).length,
      hasNumbering: paragraph.numbering !== null && paragraph.numbering !== undefined,
      isHeading: this.isHeading(paragraph),
      headingLevel: this.getHeadingLevel(paragraph),
    };
  }
} 