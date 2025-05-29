/**
 * TXT Generator
 * 
 * Utilities for generating properly formatted plain text output
 * from TXT elements with proper spacing and indentation.
 */

import type { TxtElement, ConversionContext } from './converters/index.js';

/**
 * Options for text generation
 */
export interface TxtGenerationOptions {
  /** Whether to normalize line breaks */
  normalizeLineBreaks?: boolean;
  /** Whether to trim trailing whitespace */
  trimTrailingWhitespace?: boolean;
  /** Whether to remove empty lines */
  removeEmptyLines?: boolean;
  /** Maximum consecutive empty lines */
  maxConsecutiveEmptyLines?: number;
}

/**
 * Generator for assembling TXT elements into final plain text
 */
export class TxtGenerator {
  /**
   * Generate plain text from TXT elements
   * @param elements - Array of TXT elements
   * @param options - Generation options
   * @returns Plain text string
   */
  static generateText(
    elements: TxtElement[],
    options: TxtGenerationOptions = {}
  ): string {
    const opts = {
      normalizeLineBreaks: true,
      trimTrailingWhitespace: true,
      removeEmptyLines: false,
      maxConsecutiveEmptyLines: 2,
      ...options,
    };

    const lines: string[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (!element) continue;

      // Add space before if specified
      if (element.spaceBefore && lines.length > 0) {
        lines.push('');
      }

      // Process element content
      const processedContent = this.processElementContent(element);
      
      if (processedContent) {
        lines.push(processedContent);
      }

      // Add space after if specified
      if (element.spaceAfter) {
        lines.push('');
      }
    }

    let result = lines.join('\n');

    // Apply post-processing options
    if (opts.normalizeLineBreaks) {
      result = this.normalizeLineBreaks(result);
    }

    if (opts.trimTrailingWhitespace) {
      result = this.trimTrailingWhitespace(result);
    }

    if (opts.removeEmptyLines) {
      result = this.removeEmptyLines(result);
    } else if (opts.maxConsecutiveEmptyLines > 0) {
      result = this.limitConsecutiveEmptyLines(result, opts.maxConsecutiveEmptyLines);
    }

    return result;
  }

  /**
   * Process individual element content with indentation
   * @param element - TXT element to process
   * @returns Processed content string
   */
  private static processElementContent(element: TxtElement): string {
    if (!element.content) return '';

    let content = element.content;
    
    // Apply indentation if specified
    if (element.indent && element.indent > 0) {
      content = this.applyIndentation(content, element.indent);
    }

    return content;
  }

  /**
   * Apply indentation to content
   * @param content - Content to indent
   * @param indentSpaces - Number of spaces to indent
   * @returns Indented content
   */
  private static applyIndentation(content: string, indentSpaces: number): string {
    const indentStr = ' '.repeat(indentSpaces);
    const lines = content.split('\n');
    
    return lines.map(line => {
      // Don't indent empty lines
      return line.trim() ? indentStr + line : line;
    }).join('\n');
  }

  /**
   * Normalize line breaks (convert different line break styles)
   * @param text - Text to normalize
   * @returns Normalized text
   */
  private static normalizeLineBreaks(text: string): string {
    // Convert CRLF and CR to LF
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Trim trailing whitespace from all lines
   * @param text - Text to trim
   * @returns Trimmed text
   */
  private static trimTrailingWhitespace(text: string): string {
    return text.replace(/[ \t]+$/gm, '');
  }

  /**
   * Remove all empty lines
   * @param text - Text to process
   * @returns Text without empty lines
   */
  private static removeEmptyLines(text: string): string {
    return text.replace(/^\s*\n/gm, '');
  }

  /**
   * Limit consecutive empty lines
   * @param text - Text to process
   * @param maxEmptyLines - Maximum consecutive empty lines
   * @returns Text with limited empty lines
   */
  private static limitConsecutiveEmptyLines(text: string, maxEmptyLines: number): string {
    const pattern = new RegExp(`\\n\\s*\\n{${maxEmptyLines},}`, 'g');
    const replacement = '\n'.repeat(maxEmptyLines + 1);
    return text.replace(pattern, replacement);
  }

  /**
   * Wrap text to specified width
   * @param text - Text to wrap
   * @param width - Maximum line width
   * @param indent - Base indentation
   * @returns Wrapped text
   */
  static wrapText(text: string, width: number, indent: number = 0): string {
    if (width <= 0) return text;
    
    const lines = text.split('\n');
    const wrappedLines: string[] = [];
    const indentStr = ' '.repeat(indent);
    const effectiveWidth = width - indent;
    
    for (const line of lines) {
      if (line.length <= effectiveWidth) {
        wrappedLines.push(indentStr + line);
      } else {
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          if (currentLine.length + word.length + 1 <= effectiveWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) {
              wrappedLines.push(indentStr + currentLine);
              currentLine = word;
            } else {
              // Word is too long, break it
              wrappedLines.push(indentStr + word.substring(0, effectiveWidth));
              currentLine = word.substring(effectiveWidth);
            }
          }
        }
        
        if (currentLine) {
          wrappedLines.push(indentStr + currentLine);
        }
      }
    }
    
    return wrappedLines.join('\n');
  }

  /**
   * Convert TXT elements to formatted lines array
   * @param elements - Array of TXT elements
   * @param context - Conversion context
   * @returns Array of formatted lines
   */
  static elementsToLines(elements: TxtElement[], context: ConversionContext): string[] {
    const lines: string[] = [];
    
    for (const element of elements) {
      if (element.spaceBefore && lines.length > 0) {
        lines.push('');
      }

      let content = element.content || '';
      
      // Apply wrapping if needed
      if (context.maxLineWidth > 0 && content.length > context.maxLineWidth) {
        content = this.wrapText(content, context.maxLineWidth, element.indent || 0);
      } else if (element.indent && element.indent > 0) {
        content = this.applyIndentation(content, element.indent);
      }

      if (content) {
        lines.push(content);
      }

      if (element.spaceAfter) {
        lines.push('');
      }
    }
    
    return lines;
  }

  /**
   * Clean up generated text
   * @param text - Text to clean up
   * @returns Cleaned text
   */
  static cleanupText(text: string): string {
    return text
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines
      .trim(); // Remove leading/trailing whitespace
  }
} 