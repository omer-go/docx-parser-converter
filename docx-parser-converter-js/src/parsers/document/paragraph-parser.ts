/**
 * Enhanced paragraph parser for DOCX documents
 * Extends basic paragraph parsing with document-level context and advanced features
 */

import {
  type Paragraph,
  ParagraphModel,
  type ParagraphNumbering,
  ParagraphNumberingModel,
  type Run,
  RunModel,
} from '@/models/paragraph-models.js';
import {
  type ParagraphStyleProperties,
  ParagraphStylePropertiesModel,
} from '@/models/styles-models.js';
import { BaseParser } from '../base-parser.js';
import { RunParser } from './run-parser.js';
import { ParagraphPropertiesParser } from '../styles/paragraph-properties-parser.js';

/**
 * Enhanced paragraph parser with document context
 */
export class DocumentParagraphParser extends BaseParser<Paragraph> {
  private runParser: RunParser;
  private paragraphPropertiesParser: ParagraphPropertiesParser;

  constructor(options: Record<string, unknown> = {}) {
    super('DocumentParagraphParser', options);
    this.runParser = new RunParser();
    this.paragraphPropertiesParser = new ParagraphPropertiesParser();
  }

  /**
   * Parse XML object into Paragraph model
   * @param xmlObj - Parsed XML object containing w:p element
   * @returns Promise resolving to Paragraph model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<Paragraph> {
    this.logInfo('Starting paragraph parsing');
    this.logXmlStructure(xmlObj);
    
    // Extract paragraph element
    const paragraphElement = this.extractParagraphElement(xmlObj);
    this.logDebug('Extracted paragraph element', paragraphElement, 'PARAGRAPH_ELEMENT');
    
    const result = await this.parseParagraphElement(paragraphElement);
    this.logDebug('Final paragraph result', result, 'FINAL_PARAGRAPH');
    
    return result;
  }

  /**
   * Parse multiple paragraphs from a document
   * @param xmlObj - Parsed XML object containing multiple w:p elements
   * @returns Promise resolving to array of Paragraph models
   */
  public async parseMultiple(xmlObj: Record<string, unknown>): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];
    
    // Handle w:p elements that might be in various container elements
    const paragraphElements = this.extractParagraphElements(xmlObj);
    
    for (const [index, paragraphElement] of paragraphElements.entries()) {
      try {
        const paragraph = await this.parseParagraphElement(paragraphElement);
        paragraphs.push(paragraph);
      } catch (error) {
        this.addWarning(
          `Failed to parse paragraph ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return paragraphs;
  }

  /**
   * Extract paragraph element from XML object
   * @param xmlObj - Parsed XML object
   * @returns Paragraph element
   */
  private extractParagraphElement(xmlObj: Record<string, unknown>): Record<string, unknown> {
    if (xmlObj['w:p']) {
      const wpElement = xmlObj['w:p'];
      
      if (Array.isArray(wpElement)) {
        if (wpElement.length === 0) {
          throw new Error('Empty w:p array found in XML');
        }
        return wpElement[0] as Record<string, unknown>;
      } else {
        return wpElement as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      return xmlObj;
    } else {
      throw new Error('No w:p element found in XML');
    }
  }

  /**
   * Extract multiple paragraph elements from XML object
   * @param xmlObj - Parsed XML object
   * @returns Array of paragraph elements
   */
  private extractParagraphElements(xmlObj: Record<string, unknown>): Record<string, unknown>[] {
    const paragraphElements: Record<string, unknown>[] = [];

    // Look for w:p elements in common container elements
    const containerElements = [
      'w:document.w:body',
      'w:body',
      'w:tc',  // Table cell
      'w:txbxContent',  // Text box content
      'w:ftr',  // Footer
      'w:hdr',  // Header
    ];

    for (const containerPath of containerElements) {
      const container = this.getElement(xmlObj, containerPath);
      if (container && typeof container === 'object') {
        const pElements = this.getChildElements(container as Record<string, unknown>, 'w:p');
        paragraphElements.push(...pElements);
      }
    }

    // If no paragraphs found in containers, look directly for w:p
    if (paragraphElements.length === 0) {
      const directPElements = this.getChildElements(xmlObj, 'w:p');
      paragraphElements.push(...directPElements);
    }

    return paragraphElements;
  }

  /**
   * Parse a single paragraph element with enhanced features
   * @param pElement - w:p element
   * @returns Parsed Paragraph
   */
  private async parseParagraphElement(pElement: Record<string, unknown>): Promise<Paragraph> {
    this.logInfo('Starting parseParagraphElement');
    this.logDebug('Input paragraph element', pElement, 'P_ELEMENT');
    
    // Parse paragraph properties using the dedicated parser
    let properties: ParagraphStyleProperties = ParagraphStylePropertiesModel.create({});
    const pPr = this.getFirstChild(pElement, 'w:pPr');
    
    this.logDebug('Found paragraph properties (w:pPr)', pPr, 'PPR_ELEMENT');
    
    if (pPr) {
      try {
        this.logInfo('Parsing paragraph properties');
        const parsedProperties = await this.paragraphPropertiesParser.parse(`<w:pPr>${this.getInnerXml(pPr)}</w:pPr>`);
        properties = parsedProperties.data;
        this.logDebug('Parsed paragraph properties', properties, 'PARSED_PROPERTIES');
      } catch (error) {
        this.logError('Failed to parse paragraph properties', error);
        this.addWarning(
          `Failed to parse paragraph properties: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    } else {
      this.logInfo('No paragraph properties found, using defaults');
    }

    // Parse paragraph numbering with enhanced logic
    this.logInfo('Parsing paragraph numbering');
    const numbering = pPr ? await this.parseEnhancedNumbering(pPr) : undefined;
    this.logDebug('Parsed paragraph numbering', numbering, 'PARSED_NUMBERING');

    // Parse runs using the dedicated run parser
    this.logInfo('Parsing paragraph runs');
    const runs = await this.parseRuns(pElement);
    this.logDebug('Parsed paragraph runs', runs, 'PARSED_RUNS');
    this.logInfo(`Total runs parsed: ${runs.length}`);

    const finalParagraph = ParagraphModel.create({
      properties,
      runs,
      numbering,
    });

    this.logInfo('Successfully created paragraph model');
    this.logDebug('Final paragraph model', finalParagraph, 'FINAL_PARAGRAPH_MODEL');

    return finalParagraph;
  }

  /**
   * Parse paragraph numbering with enhanced features
   * @param pPrElement - w:pPr element
   * @returns Parsed numbering properties or undefined
   */
  private async parseEnhancedNumbering(
    pPrElement: Record<string, unknown>
  ): Promise<ParagraphNumbering | undefined> {
    const numPr = this.getFirstChild(pPrElement, 'w:numPr');
    if (!numPr) return undefined;

    const ilvl = this.getFirstChild(numPr, 'w:ilvl');
    const numId = this.getFirstChild(numPr, 'w:numId');

    // Enhanced validation and error handling
    if (!ilvl && !numId) {
      this.addWarning('Empty numbering properties found');
      return undefined;
    }

    // Default values for missing properties
    const ilvlValue = ilvl ? this.getNumberAttribute(ilvl, 'w:val', 0) : 0;
    const numIdValue = numId ? this.getNumberAttribute(numId, 'w:val', 0) : 0;

    // Validate numbering values
    if (ilvlValue < 0 || ilvlValue > 8) {
      this.addWarning(`Invalid numbering level: ${ilvlValue}. Using level 0.`);
    }

    if (numIdValue < 0) {
      this.addWarning(`Invalid numbering ID: ${numIdValue}. Using ID 0.`);
    }

    return ParagraphNumberingModel.create({
      ilvl: Math.max(0, Math.min(8, ilvlValue)),
      numId: Math.max(0, numIdValue),
    });
  }

  /**
   * Parse runs from paragraph element using dedicated parser
   * @param pElement - w:p element
   * @returns Array of parsed runs
   */
  private async parseRuns(pElement: Record<string, unknown>): Promise<Run[]> {
    const runElements = this.getChildElements(pElement, 'w:r');
    const runs: Run[] = [];

    for (const [index, runElement] of runElements.entries()) {
      try {
        const runXml = this.elementToXml(runElement);
        const parsedRun = await this.runParser.parse(runXml);
        runs.push(parsedRun.data);
      } catch (error) {
        this.addWarning(
          `Failed to parse run ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        
        // Create a minimal run for error recovery
        const fallbackRun = RunModel.create({
          contents: [],
          properties: undefined,
        });
        runs.push(fallbackRun);
      }
    }

    return runs;
  }

  /**
   * Get inner XML content of an element
   * @param element - XML element
   * @returns Inner XML string
   */
  private getInnerXml(element: Record<string, unknown>): string {
    // Use proper XML serialization instead of JSON.stringify
    return this.serializeElementContent(element);
  }

  /**
   * Convert element to XML string
   * @param element - XML element
   * @returns XML string
   */
  private elementToXml(element: Record<string, unknown>): string {
    // Serialize the element content properly
    const content = this.serializeElementContent(element);
    return `<w:r>${content}</w:r>`;
  }

  /**
   * Serialize element content to XML
   * @param element - XML element
   * @returns Serialized content
   */
  private serializeElementContent(element: Record<string, unknown>): string {
    let content = '';
    
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('@_')) {
        // Skip attributes - they should be handled by parent element
        continue;
      }
      
      if (Array.isArray(value)) {
        // Handle array of elements
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const attrs = this.serializeAttributes(item as Record<string, unknown>);
            const innerContent = this.serializeElementContent(item as Record<string, unknown>);
            if (innerContent) {
              content += `<${key}${attrs}>${innerContent}</${key}>`;
            } else {
              content += `<${key}${attrs}/>`;
            }
          } else if (typeof item === 'string') {
            content += `<${key}>${this.escapeXml(item)}</${key}>`;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle single object
        const attrs = this.serializeAttributes(value as Record<string, unknown>);
        const innerContent = this.serializeElementContent(value as Record<string, unknown>);
        if (innerContent) {
          content += `<${key}${attrs}>${innerContent}</${key}>`;
        } else {
          content += `<${key}${attrs}/>`;
        }
      } else if (typeof value === 'string') {
        // Handle text content
        content += `<${key}>${this.escapeXml(value)}</${key}>`;
      }
    }
    
    return content;
  }

  /**
   * Serialize element attributes
   * @param element - XML element
   * @returns Attribute string
   */
  private serializeAttributes(element: Record<string, unknown>): string {
    let attrs = '';
    
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('@_')) {
        const attrName = key.substring(2); // Remove @_ prefix
        attrs += ` ${attrName}="${this.escapeXml(String(value))}"`;
      }
    }
    
    return attrs;
  }

  /**
   * Escape XML special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Check if paragraph is a list item
   * @param paragraph - Parsed paragraph
   * @returns True if paragraph has numbering
   */
  public static isListItem(paragraph: Paragraph): boolean {
    return paragraph.numbering !== null && paragraph.numbering !== undefined;
  }

  /**
   * Type guard to check if a run has a text property (for backward compatibility with test data)
   */
  private static hasTextProperty(run: Run): run is Run & { text: string } {
    return 'text' in run && typeof (run as Record<string, unknown>).text === 'string';
  }

  /**
   * Get paragraph text content
   * @param paragraph - Parsed paragraph
   * @returns Combined text content from all runs
   */
  public static getTextContent(paragraph: Paragraph): string {
    if (!paragraph.runs || paragraph.runs.length === 0) {
      return '';
    }

    return paragraph.runs
      .flatMap(run => {
        // Handle proper run structure with contents array
        if (run.contents) {
          return run.contents;
        }
        // Handle simplified test structure where run might have direct text
        if (this.hasTextProperty(run)) {
          return [{ run: { text: run.text } }];
        }
        return [];
      })
      .map(content => {
        // Add safety check for content.run
        if (content && content.run) {
          if ('text' in content.run) {
            return content.run.text;
          } else if ('type' in content.run && content.run.type === 'tab') {
            return '\t';
          }
        }
        return '';
      })
      .join('');
  }

  /**
   * Check if paragraph is empty
   * @param paragraph - Parsed paragraph
   * @returns True if paragraph has no content
   */
  public static isEmpty(paragraph: Paragraph): boolean {
    return this.getTextContent(paragraph).trim().length === 0;
  }
} 