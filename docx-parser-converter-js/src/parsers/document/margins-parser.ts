/**
 * Margins parser for DOCX documents
 * Parses page margin information from section properties (w:sectPr)
 */

import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { getFirstChildElement } from '@/utils/xml-utils.js';

/**
 * Represents page margins in points
 */
export interface PageMargins {
  /** Top margin in points */
  top_pt: number;
  /** Bottom margin in points */
  bottom_pt: number;
  /** Left margin in points */
  left_pt: number;
  /** Right margin in points */
  right_pt: number;
  /** Header margin in points */
  header_pt?: number;
  /** Footer margin in points */
  footer_pt?: number;
  /** Gutter margin in points */
  gutter_pt?: number;
}

/**
 * Margins parser class - Note: This doesn't extend BaseParser since PageMargins is not a BaseModel
 */
export class MarginsParser {
  private warnings: string[] = [];

  constructor() {}

  /**
   * Parse XML object into PageMargins
   * @param xmlObj - Parsed XML object containing w:sectPr element
   * @returns Promise resolving to PageMargins
   */
  public async parse(xmlObj: Record<string, unknown>): Promise<PageMargins> {
    this.warnings = [];
    
    // Extract w:sectPr element
    let sectPrElement: Record<string, unknown>;

    if (xmlObj['w:sectPr']) {
      sectPrElement = xmlObj['w:sectPr'] as Record<string, unknown>;
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:sectPr element
      sectPrElement = xmlObj;
    } else {
      throw new Error('No w:sectPr element found in XML');
    }

    return this.parseSectionProperties(sectPrElement);
  }

  /**
   * Parse section properties to extract margins
   * @param sectPrElement - w:sectPr element
   * @returns Parsed PageMargins
   */
  private async parseSectionProperties(sectPrElement: Record<string, unknown>): Promise<PageMargins> {
    // Find page margins element (w:pgMar)
    const pgMar = getFirstChildElement(sectPrElement, 'w:pgMar');
    
    if (!pgMar) {
      // Return default margins if no pgMar element found
      this.addWarning('No page margins element found, using default margins');
      return this.getDefaultMargins();
    }

    return this.parsePageMargins(pgMar);
  }

  /**
   * Parse page margins element
   * @param pgMarElement - w:pgMar element
   * @returns Parsed PageMargins
   */
  private parsePageMargins(pgMarElement: Record<string, unknown>): PageMargins {
    const margins: PageMargins = {
      top_pt: this.parseMarginAttributeRequired(pgMarElement, 'w:top', 1440), // Default 1 inch
      bottom_pt: this.parseMarginAttributeRequired(pgMarElement, 'w:bottom', 1440), // Default 1 inch
      left_pt: this.parseMarginAttributeRequired(pgMarElement, 'w:left', 1440), // Default 1 inch
      right_pt: this.parseMarginAttributeRequired(pgMarElement, 'w:right', 1440), // Default 1 inch
    };

    // Optional margins
    const header = this.parseMarginAttributeOptional(pgMarElement, 'w:header');
    if (header !== undefined) {
      margins.header_pt = header;
    }

    const footer = this.parseMarginAttributeOptional(pgMarElement, 'w:footer');
    if (footer !== undefined) {
      margins.footer_pt = footer;
    }

    const gutter = this.parseMarginAttributeOptional(pgMarElement, 'w:gutter');
    if (gutter !== undefined) {
      margins.gutter_pt = gutter;
    }

    return margins;
  }

  /**
   * Parse required margin attribute from twips to points
   * @param element - XML element
   * @param attributeName - Attribute name
   * @param defaultTwips - Default value in twips if attribute not found
   * @returns Margin value in points
   */
  private parseMarginAttributeRequired(
    element: Record<string, unknown>, 
    attributeName: string, 
    defaultTwips: number
  ): number {
    const value = this.getAttribute(element, attributeName);
    
    if (value) {
      const twips = parseInt(value, 10);
      if (!isNaN(twips)) {
        return convertTwipsToPoints(twips);
      } else {
        this.addWarning(`Invalid margin value for ${attributeName}: ${value}`);
      }
    }

    return convertTwipsToPoints(defaultTwips);
  }

  /**
   * Parse optional margin attribute from twips to points
   * @param element - XML element
   * @param attributeName - Attribute name
   * @returns Margin value in points or undefined
   */
  private parseMarginAttributeOptional(
    element: Record<string, unknown>, 
    attributeName: string
  ): number | undefined {
    const value = this.getAttribute(element, attributeName);
    
    if (value) {
      const twips = parseInt(value, 10);
      if (!isNaN(twips)) {
        return convertTwipsToPoints(twips);
      } else {
        this.addWarning(`Invalid margin value for ${attributeName}: ${value}`);
      }
    }

    return undefined;
  }

  /**
   * Get attribute value from XML element
   * @param element - XML element
   * @param attributeName - Attribute name
   * @returns Attribute value or undefined
   */
  private getAttribute(element: Record<string, unknown>, attributeName: string): string | undefined {
    const attrKey = `@_${attributeName}`;
    const value = element[attrKey];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return undefined;
  }

  /**
   * Add warning to parsing context
   * @param message - Warning message
   */
  private addWarning(message: string): void {
    this.warnings.push(`[MarginsParser] ${message}`);
  }

  /**
   * Get accumulated warnings
   * @returns Array of warning messages
   */
  public getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Get default page margins (1 inch on all sides)
   * @returns Default PageMargins
   */
  private getDefaultMargins(): PageMargins {
    const defaultMarginPt = convertTwipsToPoints(1440); // 1 inch in twips = 1440

    return {
      top_pt: defaultMarginPt,
      bottom_pt: defaultMarginPt,
      left_pt: defaultMarginPt,
      right_pt: defaultMarginPt,
    };
  }

  /**
   * Parse margins from document body's last section
   * @param documentBody - w:body element
   * @returns Promise resolving to PageMargins
   */
  public async parseFromDocumentBody(documentBody: Record<string, unknown>): Promise<PageMargins> {
    // Look for section properties at the end of the document body
    const sectPr = getFirstChildElement(documentBody, 'w:sectPr');
    
    if (sectPr) {
      return this.parseSectionProperties(sectPr);
    }

    // If no section properties found, return default margins
    this.addWarning('No section properties found in document body, using default margins');
    return this.getDefaultMargins();
  }

  /**
   * Parse margins from multiple sections
   * @param sections - Array of w:sectPr elements
   * @returns Promise resolving to array of PageMargins
   */
  public async parseMultipleSections(sections: Record<string, unknown>[]): Promise<PageMargins[]> {
    const margins: PageMargins[] = [];

    for (const section of sections) {
      try {
        const sectionMargins = await this.parseSectionProperties(section);
        margins.push(sectionMargins);
      } catch (error) {
        this.addWarning(`Failed to parse section margins: ${error instanceof Error ? error.message : 'Unknown error'}`);
        margins.push(this.getDefaultMargins());
      }
    }

    return margins;
  }

  /**
   * Convert margins to CSS style object
   * @param margins - PageMargins object
   * @returns CSS style object with margin properties
   */
  public static toCssMargins(margins: PageMargins): Record<string, string> {
    return {
      'margin-top': `${margins.top_pt}pt`,
      'margin-bottom': `${margins.bottom_pt}pt`,
      'margin-left': `${margins.left_pt}pt`,
      'margin-right': `${margins.right_pt}pt`,
    };
  }

  /**
   * Check if margins are default (1 inch on all sides)
   * @param margins - PageMargins object
   * @returns True if margins are default
   */
  public static isDefaultMargins(margins: PageMargins): boolean {
    const defaultMargin = convertTwipsToPoints(1440); // 1 inch
    const tolerance = 0.1; // Small tolerance for floating point comparison

    return (
      Math.abs(margins.top_pt - defaultMargin) < tolerance &&
      Math.abs(margins.bottom_pt - defaultMargin) < tolerance &&
      Math.abs(margins.left_pt - defaultMargin) < tolerance &&
      Math.abs(margins.right_pt - defaultMargin) < tolerance
    );
  }
} 