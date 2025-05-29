/**
 * Document numbering parser for DOCX documents
 * Extracts numbering information from document context and provides numbering resolution
 */

import {
  type NumberingSchema,
  NumberingSchemaModel,
  type NumberingLevel,
  NumberingLevelModel,
  type NumberingInstance,
  NumberingInstanceModel,
} from '@/models/numbering-models.js';
import {
  type ParagraphNumbering,
} from '@/models/paragraph-models.js';
import {
  type FontProperties,
  FontPropertiesModel,
  type IndentationProperties,
  IndentationPropertiesModel,
} from '@/models/styles-models.js';
import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { BaseParser } from '../base-parser.js';

/**
 * Represents a resolved numbering context for a paragraph
 */
export interface ResolvedNumbering {
  /** The numbering level information */
  level: NumberingLevel;
  /** The resolved display text */
  displayText: string;
  /** The current counter value */
  counterValue: number;
  /** Whether this is a bullet list */
  isBullet: boolean;
}

/**
 * Document numbering parser and resolver
 */
export class DocumentNumberingParser extends BaseParser<NumberingSchema> {
  /** Cache for parsed numbering schemas */
  private numberingCache = new Map<string, NumberingSchema>();
  
  /** Counter state for numbering levels */
  private levelCounters = new Map<string, number>();

  constructor(options: Record<string, unknown> = {}) {
    super('DocumentNumberingParser', options);
  }

  /**
   * Parse numbering.xml content
   * @param xmlObj - Parsed XML object from numbering.xml
   * @returns Promise resolving to NumberingSchema
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<NumberingSchema> {
    const numberingElement = this.extractNumberingElement(xmlObj);
    
    // Parse abstract numbering definitions
    const levels = await this.parseAbstractNumbering(numberingElement);
    
    // Parse numbering instances
    const instances = await this.parseNumberingInstances(numberingElement);
    
    const schema = NumberingSchemaModel.create({
      levels,
      instances,
    });

    // Cache the schema for later use
    this.numberingCache.set('default', schema);
    
    return schema;
  }

  /**
   * Extract numbering element from XML
   * @param xmlObj - Parsed XML object
   * @returns Numbering element
   */
  private extractNumberingElement(xmlObj: Record<string, unknown>): Record<string, unknown> {
    if (xmlObj['w:numbering']) {
      const numberingEl = xmlObj['w:numbering'];
      return Array.isArray(numberingEl) ? numberingEl[0] : (numberingEl as Record<string, unknown>);
    }
    
    // If no w:numbering wrapper, assume the root is the numbering element
    return xmlObj;
  }

  /**
   * Parse abstract numbering definitions
   * @param numberingElement - w:numbering element
   * @returns Array of numbering levels
   */
  private async parseAbstractNumbering(
    numberingElement: Record<string, unknown>
  ): Promise<NumberingLevel[]> {
    const levels: NumberingLevel[] = [];
    
    // Get all w:abstractNum elements
    const abstractNums = this.getChildElements(numberingElement, 'w:abstractNum');
    
    for (const abstractNum of abstractNums) {
      const abstractNumId = this.getNumberAttribute(abstractNum, 'w:abstractNumId', 0);
      
      // Parse levels within this abstract numbering
      const lvlElements = this.getChildElements(abstractNum, 'w:lvl');
      
      for (const lvlElement of lvlElements) {
        try {
          const level = await this.parseNumberingLevel(lvlElement, abstractNumId);
          levels.push(level);
        } catch (error) {
          this.addWarning(
            `Failed to parse numbering level in abstractNum ${abstractNumId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }
    
    return levels;
  }

  /**
   * Parse a single numbering level
   * @param lvlElement - w:lvl element
   * @param numId - The numbering ID
   * @returns Parsed NumberingLevel
   */
  private async parseNumberingLevel(
    lvlElement: Record<string, unknown>,
    numId: number
  ): Promise<NumberingLevel> {
    // Extract level attributes
    const ilvl = this.getNumberAttribute(lvlElement, 'w:ilvl', 0);
    
    // Parse start value
    const startElement = this.getFirstChild(lvlElement, 'w:start');
    const start = startElement ? this.getNumberAttribute(startElement, 'w:val', 1) : 1;
    
    // Parse number format
    const numFmtElement = this.getFirstChild(lvlElement, 'w:numFmt');
    const numFmt = numFmtElement ? this.getAttribute(numFmtElement, 'w:val') || 'decimal' : 'decimal';
    
    // Parse level text
    const lvlTextElement = this.getFirstChild(lvlElement, 'w:lvlText');
    const lvlText = lvlTextElement ? this.getAttribute(lvlTextElement, 'w:val') || '' : '';
    
    // Parse justification
    const lvlJcElement = this.getFirstChild(lvlElement, 'w:lvlJc');
    const lvlJc = lvlJcElement ? this.getAttribute(lvlJcElement, 'w:val') || 'left' : 'left';
    
    // Parse paragraph properties for indentation
    const indent = await this.parseIndentationFromPPr(lvlElement);
    
    // Parse tab position
    const tab_pt = await this.parseTabPosition(lvlElement);
    
    // Parse run properties for fonts
    const fonts = await this.parseFontsFromRPr(lvlElement);

    return NumberingLevelModel.create({
      numId,
      ilvl,
      start,
      numFmt,
      lvlText,
      lvlJc,
      counter: start, // Initialize counter with start value
      indent,
      tab_pt,
      fonts,
    });
  }

  /**
   * Parse indentation from paragraph properties
   * @param lvlElement - w:lvl element
   * @returns Indentation properties or undefined
   */
  private async parseIndentationFromPPr(
    lvlElement: Record<string, unknown>
  ): Promise<IndentationProperties | undefined> {
    const pPr = this.getFirstChild(lvlElement, 'w:pPr');
    if (!pPr) return undefined;
    
    const ind = this.getFirstChild(pPr, 'w:ind');
    if (!ind) return undefined;
    
    const left = this.getAttribute(ind, 'w:left');
    const right = this.getAttribute(ind, 'w:right');
    const firstLine = this.getAttribute(ind, 'w:firstLine');
    const hanging = this.getAttribute(ind, 'w:hanging');
    
    return IndentationPropertiesModel.create({
      left_pt: left ? convertTwipsToPoints(parseInt(left)) : undefined,
      right_pt: right ? convertTwipsToPoints(parseInt(right)) : undefined,
      firstline_pt: firstLine 
        ? convertTwipsToPoints(parseInt(firstLine))
        : hanging 
        ? -convertTwipsToPoints(parseInt(hanging))
        : undefined,
    });
  }

  /**
   * Parse tab position from paragraph properties
   * @param lvlElement - w:lvl element
   * @returns Tab position in points or undefined
   */
  private async parseTabPosition(lvlElement: Record<string, unknown>): Promise<number | undefined> {
    const pPr = this.getFirstChild(lvlElement, 'w:pPr');
    if (!pPr) return undefined;
    
    const tabs = this.getFirstChild(pPr, 'w:tabs');
    if (!tabs) return undefined;
    
    const tab = this.getFirstChild(tabs, 'w:tab');
    if (!tab) return undefined;
    
    const pos = this.getAttribute(tab, 'w:pos');
    return pos ? convertTwipsToPoints(parseInt(pos)) : undefined;
  }

  /**
   * Parse fonts from run properties
   * @param lvlElement - w:lvl element
   * @returns Font properties or undefined
   */
  private async parseFontsFromRPr(
    lvlElement: Record<string, unknown>
  ): Promise<FontProperties | undefined> {
    const rPr = this.getFirstChild(lvlElement, 'w:rPr');
    if (!rPr) return undefined;
    
    const rFonts = this.getFirstChild(rPr, 'w:rFonts');
    if (!rFonts) return undefined;
    
    return FontPropertiesModel.create({
      ascii: this.getAttribute(rFonts, 'w:ascii'),
      hAnsi: this.getAttribute(rFonts, 'w:hAnsi'),
      eastAsia: this.getAttribute(rFonts, 'w:eastAsia'),
      cs: this.getAttribute(rFonts, 'w:cs'),
    });
  }

  /**
   * Parse numbering instances
   * @param numberingElement - w:numbering element
   * @returns Array of numbering instances
   */
  private async parseNumberingInstances(
    numberingElement: Record<string, unknown>
  ): Promise<NumberingInstance[]> {
    const instances: NumberingInstance[] = [];
    
    // Get all w:num elements
    const numElements = this.getChildElements(numberingElement, 'w:num');
    
    for (const numElement of numElements) {
      try {
        const numId = this.getNumberAttribute(numElement, 'w:numId', 0);
        
        const abstractNumIdElement = this.getFirstChild(numElement, 'w:abstractNumId');
        const abstractNumId = abstractNumIdElement 
          ? this.getNumberAttribute(abstractNumIdElement, 'w:val', 0)
          : 0;
        
        instances.push(NumberingInstanceModel.create({
          numId,
          abstractNumId,
        }));
      } catch (error) {
        this.addWarning(
          `Failed to parse numbering instance: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
    
    return instances;
  }

  /**
   * Resolve numbering for a paragraph
   * @param paragraphNumbering - Paragraph numbering properties
   * @param numberingSchema - Optional numbering schema (uses cached if not provided)
   * @returns Resolved numbering information or undefined
   */
  public async resolveNumbering(
    paragraphNumbering: ParagraphNumbering,
    numberingSchema?: NumberingSchema
  ): Promise<ResolvedNumbering | undefined> {
    const schema = numberingSchema || this.numberingCache.get('default');
    if (!schema) {
      this.addWarning('No numbering schema available for resolution');
      return undefined;
    }

    // Find the numbering level
    const level = schema.levels.find(
      l => l.numId === paragraphNumbering.numId && l.ilvl === paragraphNumbering.ilvl
    );
    
    if (!level) {
      this.addWarning(
        `No numbering level found for numId=${paragraphNumbering.numId}, ilvl=${paragraphNumbering.ilvl}`
      );
      return undefined;
    }

    // Update counter for this level - use level.start if counter is not set
    const counterKey = `${level.numId}-${level.ilvl}`;
    const currentCounter = this.levelCounters.get(counterKey) || (level.counter ?? level.start);
    
    // Generate display text
    const displayText = this.generateDisplayText(level, currentCounter);
    
    // Increment counter for next use
    this.levelCounters.set(counterKey, currentCounter + 1);
    
    return {
      level,
      displayText,
      counterValue: currentCounter,
      isBullet: this.isBulletFormat(level.numFmt),
    };
  }

  /**
   * Generate display text for a numbering level
   * @param level - Numbering level
   * @param counter - Current counter value
   * @returns Generated display text
   */
  private generateDisplayText(level: NumberingLevel, counter: number): string {
    const numFmt = level.numFmt;
    const lvlText = level.lvlText;
    
    // Handle different number formats
    let numberText: string;
    
    switch (numFmt) {
      case 'decimal':
        numberText = counter.toString();
        break;
      case 'upperRoman':
        numberText = this.toRoman(counter).toUpperCase();
        break;
      case 'lowerRoman':
        numberText = this.toRoman(counter).toLowerCase();
        break;
      case 'upperLetter':
        numberText = this.toAlpha(counter).toUpperCase();
        break;
      case 'lowerLetter':
        numberText = this.toAlpha(counter).toLowerCase();
        break;
      case 'bullet':
        return '•'; // Default bullet character
      default:
        numberText = counter.toString();
    }
    
    // Replace placeholders in level text, handling potential undefined
    if (!lvlText) {
      return numberText;
    }
    
    return lvlText.replace(/%(\d+)/g, (match, levelNum) => {
      const levelIndex = parseInt(levelNum) - 1;
      if (levelIndex === level.ilvl) {
        return numberText;
      }
      // For multi-level numbering, you'd need to track other levels
      return match;
    });
  }

  /**
   * Check if number format is a bullet format
   * @param numFmt - Number format
   * @returns True if bullet format
   */
  private isBulletFormat(numFmt: string): boolean {
    return numFmt === 'bullet';
  }

  /**
   * Convert number to Roman numerals
   * @param num - Number to convert
   * @returns Roman numeral string
   */
  private toRoman(num: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
    
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
   * Convert number to alphabetic representation
   * @param num - Number to convert (1-based)
   * @returns Alphabetic string
   */
  private toAlpha(num: number): string {
    let result = '';
    while (num > 0) {
      num--; // Convert to 0-based
      result = String.fromCharCode(97 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result || 'a';
  }

  /**
   * Reset counters for a new document
   */
  public resetCounters(): void {
    this.levelCounters.clear();
  }

  /**
   * Get current counter value for a numbering level
   * @param numId - Numbering ID
   * @param ilvl - Indent level
   * @returns Current counter value
   */
  public getCurrentCounter(numId: number, ilvl: number): number {
    const counterKey = `${numId}-${ilvl}`;
    return this.levelCounters.get(counterKey) || 1;
  }

  /**
   * Set counter value for a numbering level
   * @param numId - Numbering ID
   * @param ilvl - Indent level
   * @param value - Counter value to set
   */
  public setCounter(numId: number, ilvl: number, value: number): void {
    const counterKey = `${numId}-${ilvl}`;
    this.levelCounters.set(counterKey, value);
  }
} 