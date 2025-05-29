/**
 * Main document parser for DOCX documents
 * Integrates all sub-parsers to parse complete document structure including paragraphs, tables, and document properties
 */

import type { DocumentSchema, DocMargins } from '@/models/document-models.js';
import { DocumentSchemaModel, DocMarginsModel } from '@/models/document-models.js';
import type { Paragraph } from '@/models/paragraph-models.js';
import type { Table } from '@/models/table-models.js';
import { BaseParser } from '../base-parser.js';
import { DocumentParagraphParser } from './paragraph-parser.js';
import { TablesParser } from '../tables/tables-parser.js';
import { MarginsParser } from './margins-parser.js';

/**
 * Union type for document elements (paragraphs and tables)
 */
type DocumentElement = Paragraph | Table;

/**
 * Main document parser class
 * Coordinates all sub-parsers to create complete document structure
 */
export class DocumentParser extends BaseParser<DocumentSchema> {
  private readonly paragraphParser: DocumentParagraphParser;
  private readonly tablesParser: TablesParser;
  private readonly marginsParser: MarginsParser;

  constructor(options: Record<string, unknown> = {}) {
    super('DocumentParser', options);
    this.paragraphParser = new DocumentParagraphParser(options);
    this.tablesParser = new TablesParser(options);
    this.marginsParser = new MarginsParser();
  }

  /**
   * Parse XML object into DocumentSchema model
   * @param xmlObj - Parsed XML object containing w:document element
   * @returns Promise resolving to DocumentSchema model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<DocumentSchema> {
    try {
      // Extract document element
      const documentElement = this.extractDocumentElement(xmlObj);
      
      // Extract document body
      const bodyElement = this.extractBodyElement(documentElement);
      
      // Parse document elements (paragraphs and tables) in document order
      const elements = await this.parseDocumentElements(bodyElement);
      
      // Parse document margins from sectPr elements
      const docMargins = await this.parseDocumentMargins(bodyElement);

      return DocumentSchemaModel.create({
        elements,
        doc_margins: docMargins,
      });
    } catch (error) {
      // For now, return a minimal document structure with warnings
      this.addWarning(`Document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return DocumentSchemaModel.create({
        elements: [],
        doc_margins: undefined,
      });
    }
  }

  /**
   * Extract document element from XML object
   * @param xmlObj - Parsed XML object
   * @returns Document element
   */
  private extractDocumentElement(xmlObj: Record<string, unknown>): Record<string, unknown> {
    if (xmlObj['w:document']) {
      const docElement = xmlObj['w:document'];
      
      if (Array.isArray(docElement)) {
        if (docElement.length === 0) {
          throw new Error('Empty w:document array found in XML');
        }
        return docElement[0] as Record<string, unknown>;
      } else {
        return docElement as Record<string, unknown>;
      }
    } else {
      throw new Error('No w:document element found in XML');
    }
  }

  /**
   * Extract body element from document element
   * @param documentElement - w:document element
   * @returns Body element
   */
  private extractBodyElement(documentElement: Record<string, unknown>): Record<string, unknown> {
    const bodyElement = documentElement['w:body'];
    
    // Check for undefined or null (but not empty string which is valid for empty bodies)
    if (bodyElement === undefined || bodyElement === null) {
      throw new Error('No w:body element found in document');
    }

    // Handle case where body is an empty string (empty document)
    if (typeof bodyElement === 'string') {
      // Empty body element - return empty object
      return {};
    }

    return bodyElement as Record<string, unknown>;
  }

  /**
   * Parse document elements (paragraphs and tables) in document order
   * @param bodyElement - w:body element containing document content
   * @returns Promise resolving to array of document elements
   */
  private async parseDocumentElements(bodyElement: Record<string, unknown>): Promise<DocumentElement[]> {
    const elements: DocumentElement[] = [];
    
    // Handle empty body
    if (Object.keys(bodyElement).length === 0) {
      return elements;
    }
    
    try {
      // Get all paragraphs
      const paragraphs = this.getChildElements(bodyElement, 'w:p');
      for (const paragraphData of paragraphs) {
        try {
          const paragraph = await this.parseParagraphElement({ 'w:p': paragraphData });
          elements.push(paragraph);
        } catch (error) {
          this.addWarning(`Failed to parse paragraph: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Get all tables
      const tables = this.getChildElements(bodyElement, 'w:tbl');
      for (const tableData of tables) {
        try {
          const table = await this.parseTableElement({ 'w:tbl': tableData });
          elements.push(table);
        } catch (error) {
          this.addWarning(`Failed to parse table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      this.addWarning(`Error parsing document elements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return elements;
  }

  /**
   * Parse document margins from sectPr elements
   * @param bodyElement - w:body element
   * @returns Promise resolving to document margins or undefined
   */
  private async parseDocumentMargins(bodyElement: Record<string, unknown>): Promise<DocMargins | undefined> {
    // Look for w:sectPr element in the body
    const sectPrElement = this.getFirstChild(bodyElement, 'w:sectPr');
    
    if (!sectPrElement) {
      this.addWarning('No section properties found in document');
      return undefined;
    }

    try {
      // Create a wrapped object for the margins parser
      const sectPrWrapper = { 'w:sectPr': sectPrElement };
      const marginsResult = await this.marginsParser.parse(sectPrWrapper);
      
      // Convert PageMargins to DocMargins
      return DocMarginsModel.create({
        top_pt: marginsResult.top_pt,
        right_pt: marginsResult.right_pt,
        bottom_pt: marginsResult.bottom_pt,
        left_pt: marginsResult.left_pt,
        header_pt: marginsResult.header_pt,
        footer_pt: marginsResult.footer_pt,
        gutter_pt: marginsResult.gutter_pt,
      });
    } catch (error) {
      this.addWarning(`Failed to parse document margins: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return undefined;
    }
  }

  /**
   * Parse a table element
   * @param element - Element containing w:tbl
   * @returns Promise resolving to Table model
   */
  private async parseTableElement(element: Record<string, unknown>): Promise<Table> {
    // Convert element to XML string for the tables parser
    const rootTag = Object.keys(element)[0];
    if (!rootTag) {
      throw new Error('No root tag found in table element');
    }
    
    const xmlString = this.elementToXmlString(element, rootTag);
    const result = await this.tablesParser.parse(xmlString);
    
    return result.data;
  }

  /**
   * Parse a paragraph element
   * @param element - Element containing w:p
   * @returns Promise resolving to Paragraph model
   */
  private async parseParagraphElement(element: Record<string, unknown>): Promise<Paragraph> {
    // Convert element to XML string for the paragraph parser
    const rootTag = Object.keys(element)[0];
    if (!rootTag) {
      throw new Error('No root tag found in paragraph element');
    }
    
    const xmlString = this.elementToXmlString(element, rootTag);
    const result = await this.paragraphParser.parse(xmlString);
    return result.data;
  }

  /**
   * Convert XML element to XML string for sub-parsers
   * @param element - XML element
   * @param rootTag - Root tag name
   * @returns XML string
   */
  private elementToXmlString(element: Record<string, unknown>, rootTag: string): string {
    try {
      // Get the actual element content (the value of the root tag)
      const elementContent = element[rootTag];
      if (!elementContent || typeof elementContent !== 'object') {
        return `<${rootTag}></${rootTag}>`;
      }
      
      // Serialize the element content
      const content = this.serializeElementContent(elementContent as Record<string, unknown>);
      return `<${rootTag}>${content}</${rootTag}>`;
    } catch (error) {
      this.addWarning(`Failed to serialize element to XML: ${error}`);
      return `<${rootTag}></${rootTag}>`;
    }
  }

  /**
   * Serialize element content to XML (simplified)
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
   * Parse multiple documents from XML
   * @param xmlObj - Parsed XML object containing multiple documents
   * @returns Promise resolving to array of DocumentSchema models
   */
  public async parseMultiple(xmlObj: Record<string, unknown>): Promise<DocumentSchema[]> {
    const documents: DocumentSchema[] = [];
    
    // Extract all w:document elements
    const documentElements = this.extractDocumentElements(xmlObj);
    
    for (const [index, documentElement] of documentElements.entries()) {
      try {
        const document = await this.parseInternal({ 'w:document': documentElement });
        documents.push(document);
      } catch (error) {
        this.addWarning(
          `Failed to parse document ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return documents;
  }

  /**
   * Extract multiple document elements from XML object
   * @param xmlObj - Parsed XML object
   * @returns Array of document elements
   */
  private extractDocumentElements(xmlObj: Record<string, unknown>): Record<string, unknown>[] {
    const documentElements: Record<string, unknown>[] = [];

    // Look for w:document elements directly
    const docElements = this.getChildElements(xmlObj, 'w:document');
    documentElements.push(...docElements);

    return documentElements;
  }

  /**
   * Get document statistics
   * @param document - Parsed document
   * @returns Document statistics
   */
  public static getDocumentStatistics(document: DocumentSchema): {
    paragraphCount: number;
    tableCount: number;
    totalElements: number;
    hasMargins: boolean;
  } {
    let paragraphCount = 0;
    let tableCount = 0;

    for (const element of document.elements) {
      // Type check based on the presence of specific properties
      if ('runs' in element) {
        paragraphCount++;
      } else if ('rows' in element) {
        tableCount++;
      }
    }

    return {
      paragraphCount,
      tableCount,
      totalElements: document.elements.length,
      hasMargins: !!document.doc_margins,
    };
  }

  /**
   * Extract text content from entire document
   * @param document - Parsed document
   * @returns Plain text content
   */
  public static getTextContent(document: DocumentSchema): string {
    const textParts: string[] = [];

    for (const element of document.elements) {
      if ('runs' in element) {
        // Paragraph element - use DocumentParagraphParser utility
        const paragraphText = DocumentParagraphParser.getTextContent(element);
        if (paragraphText.trim()) {
          textParts.push(paragraphText);
        }
      } else if ('rows' in element) {
        // Table element - extract text from all cells
        for (const row of element.rows) {
          for (const cell of row.cells) {
            for (const cellParagraph of cell.paragraphs) {
              const cellText = DocumentParagraphParser.getTextContent(cellParagraph);
              if (cellText.trim()) {
                textParts.push(cellText);
              }
            }
          }
        }
      }
    }

    return textParts.join('\n');
  }

  /**
   * Check if document is empty
   * @param document - Parsed document
   * @returns True if document has no meaningful content
   */
  public static isEmpty(document: DocumentSchema): boolean {
    if (document.elements.length === 0) {
      return true;
    }

    // Check if all elements are empty
    for (const element of document.elements) {
      if ('runs' in element) {
        // Paragraph element
        if (!DocumentParagraphParser.isEmpty(element)) {
          return false;
        }
      } else if ('rows' in element) {
        // Table element - check if any cell has content
        for (const row of element.rows) {
          for (const cell of row.cells) {
            for (const cellParagraph of cell.paragraphs) {
              if (!DocumentParagraphParser.isEmpty(cellParagraph)) {
                return false;
              }
            }
          }
        }
      }
    }

    return true;
  }
} 