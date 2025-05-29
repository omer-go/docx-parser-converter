/**
 * Table cell parser for DOCX documents
 * Parses table cells from w:tc elements including their properties and content
 */

import type { TableCell } from '@/models/table-models.js';
import type { Paragraph } from '@/models/paragraph-models.js';
import { TableCellModel } from '@/models/table-models.js';
import { BaseParser } from '../base-parser.js';
import { TableCellPropertiesParser } from './table-cell-properties-parser.js';
import { DocumentParagraphParser } from '../document/paragraph-parser.js';

/**
 * Table cell parser class
 */
export class TableCellParser extends BaseParser<TableCell> {
  private readonly cellPropertiesParser: TableCellPropertiesParser;
  private readonly paragraphParser: DocumentParagraphParser;

  constructor(options: Record<string, unknown> = {}) {
    super('TableCellParser', options);
    this.cellPropertiesParser = new TableCellPropertiesParser(options);
    this.paragraphParser = new DocumentParagraphParser(options);
  }

  /**
   * Parse XML object into TableCell model
   * @param xmlObj - Parsed XML object containing w:tc element
   * @returns Promise resolving to TableCell model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<TableCell> {
    // Extract w:tc element
    let tcElement: Record<string, unknown>;

    if (xmlObj['w:tc']) {
      const tcValue = xmlObj['w:tc'];
      
      // Handle case where w:tc is an array
      if (Array.isArray(tcValue)) {
        if (tcValue.length === 0) {
          throw new Error('Empty w:tc array found in XML');
        }
        tcElement = tcValue[0] as Record<string, unknown>;
      } else {
        tcElement = tcValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tc element
      tcElement = xmlObj;
    } else {
      throw new Error('No w:tc element found in XML');
    }

    return this.parseTableCellElement(tcElement);
  }

  /**
   * Parse table cell element
   * @param tcElement - w:tc element
   * @returns Parsed TableCell
   */
  private async parseTableCellElement(tcElement: Record<string, unknown>): Promise<TableCell> {
    const props: Partial<TableCell> = {};

    // Parse cell properties from w:tcPr element
    const tcPrElement = this.getFirstChild(tcElement, 'w:tcPr');
    if (tcPrElement) {
      try {
        // Create a wrapped object for the properties parser and serialize to XML
        const tcPrWrapper = { 'w:tcPr': tcPrElement };
        const tcPrXml = this.serializeToXml(tcPrWrapper, 'w:tcPr');
        const propertiesResult = await this.cellPropertiesParser.parse(tcPrXml);
        props.properties = propertiesResult.data;
      } catch (error) {
        this.addWarning(`Failed to parse cell properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Parse paragraphs from w:p elements
    const paragraphElements = this.getChildElements(tcElement, 'w:p');
    const paragraphs: Paragraph[] = [];

    for (const pElement of paragraphElements) {
      try {
        // Create a wrapped object for the paragraph parser and serialize to XML
        const pWrapper = { 'w:p': pElement };
        const pXml = this.serializeToXml(pWrapper, 'w:p');
        const paragraph = await this.paragraphParser.parse(pXml);
        paragraphs.push(paragraph.data);
      } catch (error) {
        this.addWarning(`Failed to parse paragraph in cell: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    props.paragraphs = paragraphs;

    // Set convenience property for test compatibility
    props.content = paragraphs;

    return TableCellModel.create(props);
  }

  /**
   * Serialize object to XML string
   * @param wrapper - Object wrapper
   * @param rootTag - Root XML tag
   * @returns XML string
   */
  private serializeToXml(wrapper: Record<string, unknown>, rootTag: string): string {
    const element = wrapper[rootTag];
    if (!element || typeof element !== 'object') {
      return `<${rootTag}></${rootTag}>`;
    }
    
    const content = this.serializeElementContent(element as Record<string, unknown>);
    return `<${rootTag}>${content}</${rootTag}>`;
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
            content += `<${key}>${item}</${key}>`;
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
        content += `<${key}>${value}</${key}>`;
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
        attrs += ` ${attrName}="${value}"`;
      }
    }
    
    return attrs;
  }
} 