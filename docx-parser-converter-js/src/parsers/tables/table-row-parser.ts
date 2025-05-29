/**
 * Table row parser for DOCX documents
 * Parses table rows from w:tr elements including their properties and cells
 */

import type { TableRow, TableCell } from '@/models/table-models.js';
import { TableRowModel } from '@/models/table-models.js';
import { BaseParser } from '../base-parser.js';
import { TableRowPropertiesParser } from './table-row-properties-parser.js';
import { TableCellParser } from './table-cell-parser.js';

/**
 * Table row parser class
 */
export class TableRowParser extends BaseParser<TableRow> {
  private readonly rowPropertiesParser: TableRowPropertiesParser;
  private readonly cellParser: TableCellParser;

  constructor(options: Record<string, unknown> = {}) {
    super('TableRowParser', options);
    this.rowPropertiesParser = new TableRowPropertiesParser(options);
    this.cellParser = new TableCellParser(options);
  }

  /**
   * Parse XML object into TableRow model
   * @param xmlObj - Parsed XML object containing w:tr element
   * @returns Promise resolving to TableRow model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<TableRow> {
    // Extract w:tr element
    let trElement: Record<string, unknown>;

    if (xmlObj['w:tr']) {
      const trValue = xmlObj['w:tr'];
      
      // Handle case where w:tr is an array
      if (Array.isArray(trValue)) {
        if (trValue.length === 0) {
          throw new Error('Empty w:tr array found in XML');
        }
        trElement = trValue[0] as Record<string, unknown>;
      } else {
        trElement = trValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tr element
      trElement = xmlObj;
    } else {
      throw new Error('No w:tr element found in XML');
    }

    return this.parseTableRowElement(trElement);
  }

  /**
   * Parse table row element
   * @param trElement - w:tr element
   * @returns Parsed TableRow
   */
  private async parseTableRowElement(trElement: Record<string, unknown>): Promise<TableRow> {
    const props: Partial<TableRow> = {};

    // Parse row properties from w:trPr element
    const trPrElement = this.getFirstChild(trElement, 'w:trPr');
    if (trPrElement) {
      try {
        // Create a wrapped object for the properties parser and serialize to XML
        const trPrWrapper = { 'w:trPr': trPrElement };
        const trPrXml = this.serializeToXml(trPrWrapper, 'w:trPr');
        const propertiesResult = await this.rowPropertiesParser.parse(trPrXml);
        props.properties = propertiesResult.data;
      } catch (error) {
        this.addWarning(`Failed to parse row properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Parse cells from w:tc elements
    const cellElements = this.getChildElements(trElement, 'w:tc');
    const cells: TableCell[] = [];

    for (const tcElement of cellElements) {
      try {
        // Create a wrapped object for the cell parser and serialize to XML
        const tcWrapper = { 'w:tc': tcElement };
        const tcXml = this.serializeToXml(tcWrapper, 'w:tc');
        const cell = await this.cellParser.parse(tcXml);
        cells.push(cell.data);
      } catch (error) {
        this.addWarning(`Failed to parse cell in row: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    props.cells = cells;

    return TableRowModel.create(props);
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