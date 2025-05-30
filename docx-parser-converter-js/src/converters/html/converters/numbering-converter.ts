/**
 * Numbering Converter for HTML Output - Schema-Based Implementation
 * 
 * Converts DOCX numbering/list elements to HTML spans using the actual
 * numbering schema from numbering.xml for accurate numbering.
 */

import type { ParagraphNumbering } from '@/models/paragraph-models.js';
import type { NumberingSchema, NumberingLevel } from '@/models/numbering-models.js';
import type { HtmlElement, ConversionContext } from './index.js';
import { StyleConverter } from './style-converter.js';

/**
 * Converter for DOCX numbering elements to HTML - Schema-based
 */
export class NumberingConverter {
  /** Static counters for numbering instances */
  private static numberingCounters: Map<string, number[]> = new Map();

  /**
   * Reset all numbering counters
   */
  static resetCounters(): void {
    this.numberingCounters.clear();
  }

  /**
   * Convert DOCX paragraph numbering to HTML spans using numbering schema
   * @param numbering - DOCX paragraph numbering
   * @param context - Conversion context (should contain numbering schema)
   * @returns Array of HTML elements representing the numbering
   */
  static convertNumbering(
    numbering: ParagraphNumbering,
    context: ConversionContext
  ): HtmlElement[] {
    const elements: HtmlElement[] = [];
    
    // Get numbering schema from context
    const numberingSchema = context.numberingSchema;
    if (!numberingSchema) {
      // Fallback to simple numbering if no schema available
      return this.generateFallbackNumbering(numbering);
    }

    try {
      const numberingLevel = this.getNumberingLevel(numberingSchema, numbering.numId, numbering.ilvl);
      if (!numberingLevel) {
        return this.generateFallbackNumbering(numbering);
      }

      // Get or initialize counters for this numbering instance
      const counterKey = `${numbering.numId}`;
      if (!this.numberingCounters.has(counterKey)) {
        this.numberingCounters.set(counterKey, new Array(9).fill(0)); // Support up to 9 levels
      }
      
      const counters = this.numberingCounters.get(counterKey)!; // Non-null assertion after setting
      
      // Validate level bounds before array access
      if (numbering.ilvl < 0 || numbering.ilvl >= counters.length) {
        return this.generateFallbackNumbering(numbering);
      }
      
      // Increment counter for current level
      counters[numbering.ilvl] += 1;
      
      // Reset counters for deeper levels
      for (let i = numbering.ilvl + 1; i < 9; i++) {
        if (i < counters.length) {
          counters[i] = 0;
        }
      }

      // Generate numbering text using the level format and counters
      const displayText = this.generateDisplayText(numberingLevel, counters, numbering.ilvl);
      
      // Create number span with font styling if available
      const numberSpan: HtmlElement = {
        tag: 'span',
        content: displayText
      };
      
      if (numberingLevel.fonts && numberingLevel.fonts.ascii) {
        numberSpan.attributes = {
          style: `font-family:${numberingLevel.fonts.ascii};`
        };
      }
      
      elements.push(numberSpan);
      
      // Create padding span based on tab position or default
      const paddingAmount = this.calculatePaddingAmount(numberingLevel, displayText);
      const paddingStyle = StyleConverter.createPaddingSpanStyles(paddingAmount);
      
      elements.push({
        tag: 'span',
        attributes: { style: paddingStyle },
        content: ''
      });
      
    } catch (error) {
      console.warn('Error processing numbering schema:', error);
      return this.generateFallbackNumbering(numbering);
    }
    
    return elements;
  }

  /**
   * Get numbering level from schema
   * @param schema - Numbering schema
   * @param numId - Numbering ID
   * @param ilvl - Indent level
   * @returns Numbering level or undefined
   */
  private static getNumberingLevel(
    schema: NumberingSchema,
    numId: number,
    ilvl: number
  ): NumberingLevel | undefined {
    // Find the numbering instance
    const instance = schema.instances.find(inst => inst.numId === numId);
    if (!instance) return undefined;
    
    // Find the level using the abstract numbering ID
    return schema.levels.find(
      level => level.numId === instance.abstractNumId && level.ilvl === ilvl
    );
  }

  /**
   * Generate display text for numbering level
   * @param level - Numbering level
   * @param counters - Counter array for all levels
   * @param currentLevel - Current indent level
   * @returns Generated display text
   */
  private static generateDisplayText(
    level: NumberingLevel,
    counters: number[],
    currentLevel: number
  ): string {
    const { numFmt, lvlText } = level;
    
    // Format the current level's counter
    const formattedCounters = counters.slice(0, currentLevel + 1).map((counter, index) => {
      const levelNumFmt = index === currentLevel ? numFmt : 'decimal'; // Use current level's format
      return this.formatNumber(counter, levelNumFmt);
    });
    
    // Replace placeholders in level text
    let displayText = lvlText || '%1.';
    for (let i = 1; i <= currentLevel + 1; i++) {
      const counterValue = formattedCounters[i - 1] || '';
      displayText = displayText.replace(new RegExp(`%${i}`, 'g'), counterValue);
    }
    
    return displayText;
  }

  /**
   * Format number according to numbering format
   * @param counter - Counter value
   * @param numFmt - Number format
   * @returns Formatted number string
   */
  private static formatNumber(counter: number, numFmt: string): string {
    switch (numFmt) {
      case 'decimal':
        return counter.toString();
      case 'upperRoman':
        return this.toRoman(counter).toUpperCase();
      case 'lowerRoman':
        return this.toRoman(counter).toLowerCase();
      case 'upperLetter':
        return this.toAlpha(counter).toUpperCase();
      case 'lowerLetter':
        return this.toAlpha(counter).toLowerCase();
      case 'bullet':
        return '•';
      default:
        return counter.toString();
    }
  }

  /**
   * Convert number to Roman numeral
   * @param num - Number to convert
   * @returns Roman numeral string
   */
  private static toRoman(num: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const symbol = symbols[i];
      if (value !== undefined && symbol !== undefined) {
        while (num >= value) {
          result += symbol;
          num -= value;
        }
      }
    }
    
    return result;
  }

  /**
   * Convert number to alphabetic character
   * @param num - Number to convert (1-based)
   * @returns Alphabetic character
   */
  private static toAlpha(num: number): string {
    return String.fromCharCode(65 + ((num - 1) % 26));
  }

  /**
   * Calculate padding amount based on tab position and text length
   * @param level - Numbering level
   * @param displayText - The generated display text
   * @returns Padding amount in points
   */
  private static calculatePaddingAmount(level: NumberingLevel, displayText: string): number {
    // If tab position is specified, calculate based on that
    if (level.tab_pt && level.indent) {
      const textLength = this.estimateTextWidth(displayText);
      const leftIndent = level.indent.left_pt ?? 0;
      const firstLineIndent = level.indent.firstline_pt ?? 0;
      
      const netPadding = level.tab_pt - (leftIndent + firstLineIndent) - textLength;
      return Math.max(netPadding, 7.2); // Minimum 7.2pt padding
    }
    
    // Default padding based on level (similar to Python implementation)
    return level.ilvl === 0 ? 10.8 : 7.2;
  }

  /**
   * Estimate text width in points (simplified calculation)
   * @param text - Text to measure
   * @returns Estimated width in points
   */
  private static estimateTextWidth(text: string): number {
    let width = 0;
    for (const char of text) {
      if (/[0-9a-zA-Z]/.test(char)) {
        width += 7.2; // Standard character width
      } else if (/[.()]/.test(char)) {
        width += 3.6; // Narrow characters
      } else {
        width += 7.2; // Default width
      }
    }
    return width;
  }

  /**
   * Generate fallback numbering when schema is not available
   * @param numbering - Paragraph numbering
   * @returns Array of HTML elements with simple numbering
   */
  private static generateFallbackNumbering(numbering: ParagraphNumbering): HtmlElement[] {
    const simpleNumber = this.generateSimpleNumber(numbering.ilvl);
    const paddingAmount = numbering.ilvl === 0 ? 10.8 : 7.2;
    
    return [
      {
        tag: 'span',
        content: simpleNumber
      },
      {
        tag: 'span',
        attributes: { style: StyleConverter.createPaddingSpanStyles(paddingAmount) },
        content: ''
      }
    ];
  }

  /**
   * Generate simple numbering for fallback
   * @param level - Numbering level
   * @returns Simple number string
   */
  private static generateSimpleNumber(level: number): string {
    // Simple fallback numbering
    const parts = ['1'];
    for (let i = 1; i <= level; i++) {
      parts.push('1');
    }
    return parts.join('.') + '.';
  }

  /**
   * Check if numbering represents a bullet list
   * @param numbering - DOCX paragraph numbering
   * @param context - Conversion context
   * @returns True if bullet list
   */
  static isBulletList(numbering: ParagraphNumbering, context?: ConversionContext): boolean {
    const numberingSchema = (context as any)?.numberingSchema as NumberingSchema;
    if (!numberingSchema) return false;
    
    const level = this.getNumberingLevel(numberingSchema, numbering.numId, numbering.ilvl);
    return level?.numFmt === 'bullet';
  }

  /**
   * Check if numbering represents a numbered list
   * @param numbering - DOCX paragraph numbering
   * @param context - Conversion context
   * @returns True if numbered list
   */
  static isNumberedList(numbering: ParagraphNumbering, context?: ConversionContext): boolean {
    return !this.isBulletList(numbering, context);
  }

  /**
   * Get the maximum numbering level supported
   * @returns Maximum level
   */
  static getMaxLevel(): number {
    return 8; // DOCX supports up to 9 levels (0-8)
  }

  /**
   * Validate numbering level
   * @param level - Numbering level to validate
   * @returns Clamped level within valid range
   */
  static validateLevel(level: number): number {
    return Math.max(0, Math.min(level, this.getMaxLevel()));
  }
} 