/**
 * Run parser for DOCX documents
 * Parses text run elements (w:r) and their content
 */

import type { Run } from '@/models/paragraph-models.js';
import { RunModel } from '@/models/paragraph-models.js';
import { BaseParser } from '../base-parser.js';
import { 
  extractTextFromElements,
  hasChildElements 
} from '../helpers/common-helpers.js';
import { 
  getFirstChildElement, 
  getChildElements,
  getTextContent 
} from '@/utils/xml-utils.js';

/**
 * Run parser class
 */
export class RunParser extends BaseParser<Run> {
  constructor(options: Record<string, unknown> = {}) {
    super('RunParser', options);
  }

  /**
   * Parse XML object into Run model
   * @param xmlObj - Parsed XML object containing w:r element
   * @returns Promise resolving to Run model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<Run> {
    // Extract w:r element
    let runElement: Record<string, unknown>;

    if (xmlObj['w:r']) {
      // If w:r is a property of the root object
      const runValue = xmlObj['w:r'];
      
      // Handle case where w:r is an array (due to XML parser configuration)
      if (Array.isArray(runValue)) {
        if (runValue.length === 0) {
          throw new Error('Empty w:r array found in XML');
        }
        runElement = runValue[0] as Record<string, unknown>;
      } else {
        runElement = runValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:r element
      runElement = xmlObj;
    } else {
      throw new Error('No w:r element found in XML');
    }

    return this.parseRunElement(runElement);
  }

  /**
   * Parse a single run element
   * @param runElement - w:r element
   * @returns Parsed Run
   */
  private async parseRunElement(runElement: Record<string, unknown>): Promise<Run> {
    // Parse run properties
    const rPr = getFirstChildElement(runElement, 'w:rPr');
    let properties = undefined;
    
    if (rPr) {
      try {
        // Try to parse properties directly with our fallback method
        properties = await this.parseRunPropertiesDirectly(rPr);
      } catch (error) {
        this.addWarning(`Failed to parse run properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
        properties = undefined;
      }
    }

    // Parse run contents
    const contents = await this.parseRunContents(runElement);

    return RunModel.create({
      properties,
      contents,
    });
  }

  /**
   * Parse run properties directly if the dedicated parser fails
   * @param rPrElement - w:rPr element
   * @returns Basic run properties
   */
  private async parseRunPropertiesDirectly(rPrElement: Record<string, unknown>): Promise<Record<string, unknown>> {
    const props: Record<string, unknown> = {};

    // Basic text formatting
    if (getFirstChildElement(rPrElement, 'w:b')) {
      props.bold = true;
    }

    if (getFirstChildElement(rPrElement, 'w:i')) {
      props.italic = true;
    }

    const color = getFirstChildElement(rPrElement, 'w:color');
    if (color) {
      props.color = this.getAttribute(color, 'w:val');
    }

    const sz = getFirstChildElement(rPrElement, 'w:sz');
    if (sz) {
      const sizeValue = this.getAttribute(sz, 'w:val');
      if (sizeValue) {
        props.size_pt = parseInt(sizeValue, 10) / 2; // Half-points to points
      }
    }

    return props;
  }

  /**
   * Parse run contents
   * @param runElement - w:r element
   * @returns Array of run content objects
   */
  private async parseRunContents(runElement: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const contents: Record<string, unknown>[] = [];

    // Parse text elements
    const textElements = getChildElements(runElement, 'w:t');
    for (const textElement of textElements) {
      const textContent = await this.parseTextContent(textElement);
      if (textContent) {
        contents.push(textContent);
      }
    }

    // Parse tab elements
    const tabElements = getChildElements(runElement, 'w:tab');
    for (const tabElement of tabElements) {
      const tabContent = await this.parseTabContent(tabElement);
      if (tabContent) {
        contents.push(tabContent);
      }
    }

    // Parse break elements
    const breakElements = getChildElements(runElement, 'w:br');
    for (const breakElement of breakElements) {
      const breakContent = await this.parseBreakContent(breakElement);
      if (breakContent) {
        contents.push(breakContent);
      }
    }

    // Parse drawing elements
    const drawingElements = getChildElements(runElement, 'w:drawing');
    for (const drawingElement of drawingElements) {
      const drawingContent = await this.parseDrawingContent(drawingElement);
      if (drawingContent) {
        contents.push(drawingContent);
      }
    }

    // If no specific content found, try to extract any text content
    if (contents.length === 0) {
      const directText = extractTextFromElements(runElement, 'w:t');
      if (directText) {
        contents.push({
          type: 'text',
          text: directText,
        });
      }
    }

    return contents;
  }

  /**
   * Parse text content from w:t element
   * @param textElement - w:t element
   * @returns Text content object
   */
  private async parseTextContent(textElement: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const text = getTextContent(textElement);
    
    if (!text) return null;

    // Check for xml:space="preserve" attribute
    const xmlSpace = this.getAttribute(textElement, 'xml:space');
    const preserveSpace = xmlSpace === 'preserve';

    return {
      type: 'text',
      text: text,
      preserve_space: preserveSpace,
    };
  }

  /**
   * Parse tab content from w:tab element
   * @param _tabElement - w:tab element (unused but required for consistency)
   * @returns Tab content object
   */
  private async parseTabContent(_tabElement: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      type: 'tab',
    };
  }

  /**
   * Parse break content from w:br element
   * @param breakElement - w:br element
   * @returns Break content object
   */
  private async parseBreakContent(breakElement: Record<string, unknown>): Promise<Record<string, unknown>> {
    const breakType = this.getAttribute(breakElement, 'w:type') || 'textWrapping';
    const clear = this.getAttribute(breakElement, 'w:clear') || 'none';

    return {
      type: 'break',
      break_type: breakType,
      clear: clear,
    };
  }

  /**
   * Parse drawing content from w:drawing element
   * @param drawingElement - w:drawing element
   * @returns Drawing content object
   */
  private async parseDrawingContent(drawingElement: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Basic drawing parsing - can be extended later
    return {
      type: 'drawing',
      // TODO: Parse actual drawing content when needed
      raw_xml: JSON.stringify(drawingElement),
    };
  }

  /**
   * Check if run has text content
   * @param runElement - w:r element
   * @returns True if run contains text
   */
  public hasTextContent(runElement: Record<string, unknown>): boolean {
    const textElements = getChildElements(runElement, 'w:t');
    if (textElements.length > 0) {
      return textElements.some(element => {
        const text = getTextContent(element);
        return text && text.trim().length > 0;
      });
    }

    // Check for other content types
    return hasChildElements(runElement);
  }

  /**
   * Extract all text from run
   * @param runElement - w:r element
   * @returns Concatenated text content
   */
  public extractAllText(runElement: Record<string, unknown>): string {
    const textParts: string[] = [];

    // Extract text from w:t elements
    const textContent = extractTextFromElements(runElement, 'w:t');
    if (textContent) {
      textParts.push(textContent);
    }

    // Add tab representation
    const tabElements = getChildElements(runElement, 'w:tab');
    for (let i = 0; i < tabElements.length; i++) {
      textParts.push('\t');
    }

    // Add break representation
    const breakElements = getChildElements(runElement, 'w:br');
    for (const breakElement of breakElements) {
      const breakType = this.getAttribute(breakElement, 'w:type') || 'textWrapping';
      if (breakType === 'page') {
        textParts.push('\f'); // Form feed for page break
      } else if (breakType === 'column') {
        textParts.push('\v'); // Vertical tab for column break
      } else {
        textParts.push('\n'); // Line break
      }
    }

    return textParts.join('');
  }
} 