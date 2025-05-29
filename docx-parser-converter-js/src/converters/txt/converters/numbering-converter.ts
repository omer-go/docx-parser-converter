/**
 * Numbering Converter for TXT Output
 * 
 * Converts DOCX numbering and list elements to plain text
 * with proper bullet points and numbering representation.
 */

import type { NumberingLevel } from '@/models/numbering-models.js';
import type { ParagraphNumbering } from '@/models/paragraph-models.js';
import type { TxtElement, ConversionContext } from './index.js';

/**
 * Converter for DOCX numbering elements to plain text
 */
export class NumberingConverter {
  /**
   * Convert numbering level to text representation
   * @param numbering - DOCX numbering level
   * @param context - Conversion context
   * @returns TXT element with numbering prefix
   */
  static convertNumbering(
    numbering: NumberingLevel,
    context: ConversionContext
  ): TxtElement {
    const prefix = this.generateNumberingPrefix(numbering, context);
    
    return {
      content: prefix,
      indent: numbering.ilvl * context.indentSize,
      lineBreak: false,
    };
  }

  /**
   * Convert paragraph numbering to text representation
   * @param numbering - DOCX paragraph numbering
   * @param context - Conversion context
   * @param level - Override level if different from numbering.ilvl
   * @returns TXT element with numbering prefix
   */
  static convertParagraphNumbering(
    numbering: ParagraphNumbering,
    context: ConversionContext,
    level?: number
  ): TxtElement {
    const effectiveLevel = level ?? numbering.ilvl;
    const prefix = this.generateSimpleNumberingPrefix(numbering);
    
    return {
      content: prefix,
      indent: effectiveLevel * context.indentSize,
      lineBreak: false,
    };
  }

  /**
   * Generate numbering prefix based on format type
   * @param numbering - DOCX numbering level
   * @param context - Conversion context
   * @returns Numbering prefix string
   */
  private static generateNumberingPrefix(
    numbering: NumberingLevel,
    context: ConversionContext
  ): string {
    // Handle bullet points
    if (numbering.numFmt === 'bullet') {
      return this.getBulletCharacter(numbering.ilvl);
    }

    // Handle numbered lists
    if (numbering.numFmt === 'decimal') {
      const number = numbering.start ?? 1;
      return `${number}.`;
    }

    // Handle other numbering formats
    switch (numbering.numFmt) {
      case 'lowerLetter':
        return this.generateLetterNumbering(numbering.start ?? 1, false) + '.';
      case 'upperLetter':
        return this.generateLetterNumbering(numbering.start ?? 1, true) + '.';
      case 'lowerRoman':
        return this.generateRomanNumbering(numbering.start ?? 1, false) + '.';
      case 'upperRoman':
        return this.generateRomanNumbering(numbering.start ?? 1, true) + '.';
      case 'none':
        return '';
      default:
        context.warnings.push(`Unknown numbering format: ${numbering.numFmt}`);
        return '•';
    }
  }

  /**
   * Generate simple numbering prefix for paragraph numbering
   * @param numbering - DOCX paragraph numbering
   * @returns Numbering prefix string
   */
  private static generateSimpleNumberingPrefix(
    numbering: ParagraphNumbering
  ): string {
    // For paragraph numbering, we'll use a simple bullet or number
    // since we don't have format information
    const level = numbering.ilvl;
    
    // Default to bullet for unknown format
    return this.getBulletCharacter(level);
  }

  /**
   * Get bullet character based on nesting level
   * @param level - Nesting level
   * @returns Bullet character
   */
  private static getBulletCharacter(level: number): string {
    const bullets = ['•', '◦', '▪', '▫', '‣'];
    return bullets[level % bullets.length] || '•';
  }

  /**
   * Generate letter-based numbering (a, b, c, ... or A, B, C, ...)
   * @param number - Number to convert
   * @param uppercase - Whether to use uppercase letters
   * @returns Letter representation
   */
  private static generateLetterNumbering(number: number, uppercase: boolean): string {
    const baseCharCode = uppercase ? 65 : 97; // A or a
    let result = '';
    let num = number - 1; // Convert to 0-based
    
    do {
      result = String.fromCharCode(baseCharCode + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    
    return result;
  }

  /**
   * Generate Roman numeral representation
   * @param number - Number to convert
   * @param uppercase - Whether to use uppercase
   * @returns Roman numeral string
   */
  private static generateRomanNumbering(number: number, uppercase: boolean): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = uppercase 
      ? ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
      : ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
    
    let result = '';
    let num = number;
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const symbol = symbols[i];
      
      if (!value || !symbol) continue;
      
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    
    return result;
  }

  /**
   * Calculate hanging indent for numbered items
   * @param prefix - Numbering prefix
   * @param context - Conversion context
   * @returns Number of spaces for hanging indent
   */
  static calculateHangingIndent(prefix: string, context: ConversionContext): number {
    // Base hanging indent on prefix length plus a space
    return Math.max(prefix.length + 1, context.indentSize);
  }

  /**
   * Create a formatted list item with proper indentation
   * @param prefix - Numbering prefix
   * @param content - Item content
   * @param level - Nesting level
   * @param context - Conversion context
   * @returns Formatted list item
   */
  static formatListItem(
    prefix: string,
    content: string,
    level: number,
    context: ConversionContext
  ): TxtElement {
    const indent = level * context.indentSize;
    const hangingIndent = this.calculateHangingIndent(prefix, context);
    
    // Split content into lines for proper hanging indent
    const lines = content.split('\n');
    const firstLine = `${prefix} ${lines[0] || ''}`;
    
    let formattedContent = firstLine;
    
    // Add hanging indent to subsequent lines
    if (lines.length > 1) {
      const hangingSpaces = ' '.repeat(hangingIndent);
      const remainingLines = lines.slice(1).map(line => hangingSpaces + line);
      formattedContent = [firstLine, ...remainingLines].join('\n');
    }
    
    return {
      content: formattedContent,
      indent,
      lineBreak: true,
      spaceAfter: false,
    };
  }
} 