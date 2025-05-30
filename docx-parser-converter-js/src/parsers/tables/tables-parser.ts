/**
 * Main table parser for DOCX documents
 * Parses complete tables from w:tbl elements including properties, grid, and rows
 */

import type { Table, TableRow, TableCell } from '@/models/table-models.js';
import { TableModel } from '@/models/table-models.js';
import { BaseParser } from '../base-parser.js';
import { TablePropertiesParser } from './table-properties-parser.js';
import { TableGridParser } from './table-grid-parser.js';
import { TableRowParser } from './table-row-parser.js';

/**
 * Main table parser class
 */
export class TablesParser extends BaseParser<Table> {
  private readonly propertiesParser: TablePropertiesParser;
  private readonly gridParser: TableGridParser;
  private readonly rowParser: TableRowParser;

  constructor(options: Record<string, unknown> = {}) {
    super('TablesParser', options);
    this.propertiesParser = new TablePropertiesParser(options);
    this.gridParser = new TableGridParser(options);
    this.rowParser = new TableRowParser(options);
  }

  /**
   * Parse XML object into Table model
   * @param xmlObj - Parsed XML object containing w:tbl element
   * @returns Promise resolving to Table model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<Table> {
    this.logInfo('Starting table parsing');
    this.logXmlStructure(xmlObj);
    
    // Extract w:tbl element
    let tblElement: Record<string, unknown>;

    if (xmlObj['w:tbl']) {
      const tblValue = xmlObj['w:tbl'];
      this.logDebug('Found w:tbl property in xmlObj', tblValue, 'TBL_PROPERTY');
      
      // Handle case where w:tbl is an array
      if (Array.isArray(tblValue)) {
        if (tblValue.length === 0) {
          throw new Error('Empty w:tbl array found in XML');
        }
        this.logInfo(`w:tbl is array with ${tblValue.length} elements, taking first`);
        tblElement = tblValue[0] as Record<string, unknown>;
      } else {
        this.logInfo('w:tbl is single object');
        tblElement = tblValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tbl element
      this.logInfo('xmlObj itself appears to be the w:tbl element');
      tblElement = xmlObj;
    } else {
      this.logError('No w:tbl element found in XML', xmlObj);
      throw new Error('No w:tbl element found in XML');
    }

    this.logDebug('Extracted table element', tblElement, 'TABLE_ELEMENT');
    const result = await this.parseTableElement(tblElement);
    this.logDebug('Final table result', result, 'FINAL_TABLE');
    
    return result;
  }

  /**
   * Parse table element
   * @param tblElement - w:tbl element
   * @returns Parsed Table
   */
  private async parseTableElement(tblElement: Record<string, unknown>): Promise<Table> {
    this.logInfo('Starting parseTableElement');
    this.logDebug('Input table element', tblElement, 'TABLE_ELEMENT_INPUT');
    
    const props: Partial<Table> = {};

    // Parse table properties - support both w:tblPr (standard) and w:tblPrEx (extended/real-world)
    this.logInfo('Parsing table properties');
    let tblPrElement = this.getFirstChild(tblElement, 'w:tblPr');
    let isExtendedFormat = false;

    if (!tblPrElement) {
      // Try extended format
      tblPrElement = this.getFirstChild(tblElement, 'w:tblPrEx');
      isExtendedFormat = true;
    }
    
    this.logDebug('Found table properties element', { tblPrElement, isExtendedFormat }, 'TABLE_PROPERTIES');
    
    if (tblPrElement) {
      try {
        this.logInfo(`Parsing table properties (${isExtendedFormat ? 'extended' : 'standard'} format)`);
        // Create a wrapped object for the properties parser and serialize to XML
        const rootTag = isExtendedFormat ? 'w:tblPrEx' : 'w:tblPr';
        const tblPrWrapper = { [rootTag]: tblPrElement };
        const tblPrXml = this.serializeToXml(tblPrWrapper, rootTag);
        const propertiesResult = await this.propertiesParser.parse(tblPrXml);
        props.properties = propertiesResult.data;
        this.logDebug('Parsed table properties', props.properties, 'PARSED_TABLE_PROPERTIES');
      } catch (error) {
        this.logError('Failed to parse table properties', error);
        this.addWarning(`Failed to parse table properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      this.logInfo('No table properties found');
    }

    // Parse table grid from w:tblGrid element (may not exist in real-world format)
    this.logInfo('Parsing table grid');
    const tblGridElement = this.getFirstChild(tblElement, 'w:tblGrid');
    this.logDebug('Found table grid element', tblGridElement, 'TABLE_GRID');
    
    if (tblGridElement) {
      try {
        this.logInfo('Parsing table grid structure');
        // Create a wrapped object for the grid parser and serialize to XML
        const tblGridWrapper = { 'w:tblGrid': tblGridElement };
        const tblGridXml = this.serializeToXml(tblGridWrapper, 'w:tblGrid');
        const gridResult = await this.gridParser.parse(tblGridXml);
        props.grid = gridResult.data;
        this.logDebug('Parsed table grid', props.grid, 'PARSED_TABLE_GRID');
      } catch (error) {
        this.logError('Failed to parse table grid', error);
        this.addWarning(`Failed to parse table grid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      this.logInfo('No table grid found');
    }

    // Parse table rows - handle both standard format (w:tr elements) and real-world format (direct w:tc elements)
    this.logInfo('Parsing table rows');
    const rowElements = this.getChildElements(tblElement, 'w:tr');
    const directCellElements = this.getChildElements(tblElement, 'w:tc');
    
    this.logDebug('Found table structure', { 
      rowElementsCount: rowElements.length, 
      directCellElementsCount: directCellElements.length 
    }, 'TABLE_STRUCTURE');

    const rows: TableRow[] = [];

    if (rowElements.length > 0) {
      // Standard format: w:tr elements containing w:tc cells
      for (const trElement of rowElements) {
        try {
          // Create a wrapped object for the row parser and serialize to XML
          const trWrapper = { 'w:tr': trElement };
          const trXml = this.serializeToXml(trWrapper, 'w:tr');
          const row = await this.rowParser.parse(trXml);
          rows.push(row.data);
        } catch (error) {
          this.addWarning(`Failed to parse table row: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else if (directCellElements.length > 0) {
      // Real-world format: direct w:tc cells under the table
      this.addWarning('Table uses real-world format with direct cells - converting to row-based structure');
      
      try {
        // Group cells into a single row (this is a simplification - real tables might have multiple rows)
        // In real-world documents, we'd need more sophisticated logic to determine row boundaries
        const cells: TableCell[] = [];
        
        for (const tcElement of directCellElements) {
          // Create a wrapped object for the cell parser and serialize to XML
          const tcWrapper = { 'w:tc': tcElement };
          const tcXml = this.serializeToXml(tcWrapper, 'w:tc');
          
          // We need to create a cell parser since the row parser expects w:tc elements
          const cellParser = new (await import('./table-cell-parser.js')).TableCellParser();
          const cell = await cellParser.parse(tcXml);
          cells.push(cell.data);
        }
        
        // Create a single row with all cells
        const row: TableRow = {
          properties: undefined,
          cells: cells
        };
        
        rows.push(row);
      } catch (error) {
        this.addWarning(`Failed to parse direct table cells: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    props.rows = rows;

    // If no grid was found but we have cells, try to infer grid from cell widths
    if (!props.grid && rows.length > 0 && rows[0]?.cells) {
      try {
        const cellWidths: number[] = [];
        for (const cell of rows[0].cells) {
          if (cell.properties?.width) {
            cellWidths.push(cell.properties.width);
          } else {
            // Default width if not specified
            cellWidths.push(1440); // 1 inch in twips
          }
        }
        
        if (cellWidths.length > 0) {
          props.grid = {
            columns: cellWidths
          };
          this.addWarning('Generated table grid from cell widths - real-world table format detected');
        }
      } catch (error) {
        this.addWarning(`Failed to generate table grid from cell widths: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return TableModel.create(props);
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

  /**
   * Parse multiple tables from a document
   * @param xmlObj - Parsed XML object containing multiple w:tbl elements
   * @returns Promise resolving to array of Table models
   */
  public async parseMultiple(xmlObj: Record<string, unknown>): Promise<Table[]> {
    const tables: Table[] = [];
    
    // Extract all w:tbl elements from the document
    const tableElements = this.extractTableElements(xmlObj);
    
    for (const [index, tableElement] of tableElements.entries()) {
      try {
        const table = await this.parseTableElement(tableElement);
        tables.push(table);
      } catch (error) {
        this.addWarning(
          `Failed to parse table ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return tables;
  }

  /**
   * Extract multiple table elements from XML object
   * @param xmlObj - Parsed XML object
   * @returns Array of table elements
   */
  private extractTableElements(xmlObj: Record<string, unknown>): Record<string, unknown>[] {
    const tableElements: Record<string, unknown>[] = [];

    // Look for w:tbl elements in common container elements
    const containerElements = [
      'w:document.w:body',
      'w:body',
      'w:tc',  // Table cell (nested tables)
      'w:txbxContent',  // Text box content
      'w:ftr',  // Footer
      'w:hdr',  // Header
    ];

    for (const containerPath of containerElements) {
      const container = this.getElement(xmlObj, containerPath);
      if (container && typeof container === 'object') {
        const tblElements = this.getChildElements(container as Record<string, unknown>, 'w:tbl');
        tableElements.push(...tblElements);
      }
    }

    // If no tables found in containers, look directly for w:tbl
    if (tableElements.length === 0) {
      const directTblElements = this.getChildElements(xmlObj, 'w:tbl');
      tableElements.push(...directTblElements);
    }

    return tableElements;
  }
} 