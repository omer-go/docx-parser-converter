/**
 * Base parser class for DOCX parsing
 * Provides common functionality and structure for all specific parsers
 */

import type { BaseModel } from '@/models/base-model.js';
import { getAttributeValue, getElementValue, parseXml } from '@/utils/xml-utils.js';

/**
 * Base parser error class
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public readonly parserType: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

/**
 * Parser context for maintaining state during parsing
 */
export interface ParserContext {
  /** Current XML namespace mappings */
  namespaces: Record<string, string>;
  /** Current parsing depth */
  depth: number;
  /** Parser-specific options */
  options: Record<string, unknown>;
  /** Accumulated warnings during parsing */
  warnings: string[];
}

/**
 * Parser result containing parsed data and metadata
 */
export interface ParserResult<T extends BaseModel> {
  /** Successfully parsed data */
  data: T;
  /** Any warnings encountered during parsing */
  warnings: string[];
  /** Parser metadata */
  metadata: {
    parserType: string;
    parseTime: number;
    elementsProcessed: number;
  };
}

/**
 * Abstract base parser class
 */
export abstract class BaseParser<T extends BaseModel> {
  protected readonly parserType: string;
  protected context: ParserContext;

  constructor(parserType: string, options: Record<string, unknown> = {}) {
    this.parserType = parserType;
    this.context = {
      namespaces: {
        w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
        pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        xml: 'http://www.w3.org/XML/1998/namespace',
      },
      depth: 0,
      options,
      warnings: [],
    };
  }

  /**
   * Parse XML content into model
   * @param xmlContent - XML content as string
   * @returns Promise resolving to parser result
   */
  public async parse(xmlContent: string): Promise<ParserResult<T>> {
    const startTime = performance.now();
    let elementsProcessed = 0;

    try {
      // Reset context for new parsing session
      this.context.depth = 0;
      this.context.warnings = [];

      // Parse XML to JavaScript object
      const xmlObj = parseXml(xmlContent);
      elementsProcessed = this.countElements(xmlObj);

      // Delegate to specific parser implementation
      const data = await this.parseInternal(xmlObj);

      const endTime = performance.now();

      return {
        data,
        warnings: [...this.context.warnings],
        metadata: {
          parserType: this.parserType,
          parseTime: endTime - startTime,
          elementsProcessed,
        },
      };
    } catch (error) {
      throw new ParserError(
        `${this.parserType} parsing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        this.parserType,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Abstract method for specific parser implementation
   * @param xmlObj - Parsed XML object
   * @returns Promise resolving to parsed model
   */
  protected abstract parseInternal(xmlObj: Record<string, unknown>): Promise<T>;

  /**
   * Add warning to current parsing context
   * @param message - Warning message
   */
  protected addWarning(message: string): void {
    this.context.warnings.push(`[${this.parserType}] ${message}`);
  }

  /**
   * Get element value with type safety
   * @param obj - XML object
   * @param path - Dot-separated path to element
   * @returns Element value or undefined
   */
  protected getElement(obj: Record<string, unknown>, path: string): unknown {
    return getElementValue(obj, path);
  }

  /**
   * Get attribute value with type safety
   * @param element - XML element
   * @param attributeName - Attribute name
   * @returns Attribute value or undefined
   */
  protected getAttribute(
    element: Record<string, unknown>,
    attributeName: string
  ): string | undefined {
    return getAttributeValue(element, attributeName);
  }

  /**
   * Parse string attribute to number
   * @param element - XML element
   * @param attributeName - Attribute name
   * @param defaultValue - Default value if parsing fails
   * @returns Parsed number or default value
   */
  protected getNumberAttribute(
    element: Record<string, unknown>,
    attributeName: string,
    defaultValue: number = 0
  ): number {
    const value = this.getAttribute(element, attributeName);
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      this.addWarning(`Invalid number value for attribute '${attributeName}': ${value}`);
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Parse string attribute to boolean
   * @param element - XML element
   * @param attributeName - Attribute name
   * @param defaultValue - Default value if parsing fails
   * @returns Parsed boolean or default value
   */
  protected getBooleanAttribute(
    element: Record<string, unknown>,
    attributeName: string,
    defaultValue: boolean = false
  ): boolean {
    const value = this.getAttribute(element, attributeName);
    if (!value) return defaultValue;

    // DOCX boolean values can be '1', 'true', 'on', or 'yes'
    const truthyValues = ['1', 'true', 'on', 'yes'];
    const falsyValues = ['0', 'false', 'off', 'no'];

    const lowerValue = value.toLowerCase();
    if (truthyValues.includes(lowerValue)) return true;
    if (falsyValues.includes(lowerValue)) return false;

    this.addWarning(`Invalid boolean value for attribute '${attributeName}': ${value}`);
    return defaultValue;
  }

  /**
   * Get child elements of specific type
   * @param parent - Parent XML element
   * @param childName - Child element name
   * @returns Array of child elements
   */
  protected getChildElements(
    parent: Record<string, unknown>,
    childName: string
  ): Record<string, unknown>[] {
    const child = parent[childName];
    if (!child) return [];

    // Handle both single elements and arrays
    if (Array.isArray(child)) {
      return child.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
      );
    }

    // Single element case
    if (typeof child === 'object' && child !== null && !Array.isArray(child)) {
      return [child as Record<string, unknown>];
    }

    return [];
  }

  /**
   * Get first child element of specific type
   * @param parent - Parent XML element
   * @param childName - Child element name
   * @returns First child element or undefined
   */
  protected getFirstChild(
    parent: Record<string, unknown>,
    childName: string
  ): Record<string, unknown> | undefined {
    const children = this.getChildElements(parent, childName);
    return children.length > 0 ? children[0] : undefined;
  }

  /**
   * Check if element exists
   * @param obj - XML object
   * @param path - Dot-separated path to element
   * @returns True if element exists
   */
  protected hasElement(obj: Record<string, unknown>, path: string): boolean {
    return this.getElement(obj, path) !== undefined;
  }

  /**
   * Count total elements in XML object (for metadata)
   * @param obj - XML object
   * @returns Number of elements
   */
  private countElements(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) return 0;

    let count = 1; // Count current element
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        count += value.reduce((sum, item) => sum + this.countElements(item), 0);
      } else if (typeof value === 'object' && value !== null) {
        count += this.countElements(value);
      }
    }
    return count;
  }
}
