/**
 * Main DOCX to HTML Converter - Python-Compatible Version
 * 
 * Orchestrates the conversion process from parsed DOCX document structures
 * to Python-compatible HTML documents with inline styles.
 */

import type { DocumentSchema } from '@/models/document-models.js';
import type { Paragraph } from '@/models/paragraph-models.js';
import type { Table } from '@/models/table-models.js';
import type { 
  HtmlConversionOptions, 
  HtmlConversionResult 
} from './index.js';
import type { 
  HtmlElement, 
  ConversionContext 
} from './converters/index.js';
import { ParagraphConverter } from './converters/paragraph-converter.js';
import { TableConverter } from './converters/table-converter.js';
import { HtmlGenerator } from './html-generator.js';

/**
 * Main converter class for DOCX to HTML conversion - Python compatible
 */
export class DocxToHtmlConverter {
  private readonly options: Required<HtmlConversionOptions>;

  constructor(options: HtmlConversionOptions = {}) {
    this.options = {
      inlineStyles: options.inlineStyles ?? true, // Default to inline styles for Python compatibility
      classPrefix: options.classPrefix ?? 'docx-',
      preserveStructure: options.preserveStructure ?? true,
      includeDebugComments: options.includeDebugComments ?? false,
    };
  }

  /**
   * Convert a parsed DOCX document to HTML - Python compatible
   * @param document - Parsed DOCX document
   * @returns HTML conversion result
   */
  async convert(document: DocumentSchema): Promise<HtmlConversionResult> {
    const startTime = performance.now();
    
    // Extract numbering schema if available
    const numberingSchema = (document as any)._numberingSchema;
    
    // Create conversion context
    const context: ConversionContext = {
      classPrefix: this.options.classPrefix,
      includeDebugComments: this.options.includeDebugComments,
      cssRules: [], // Not used in Python-compatible mode
      warnings: [],
      numberingSchema, // Pass the numbering schema to the context
    };

    try {
      // Convert document elements to HTML
      const htmlElements = await this.convertDocumentElements(document, context);
      
      // Generate HTML string in Python format
      const html = HtmlGenerator.generateDocument(htmlElements, {
        pageMargins: this.extractPageMargins(document)
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        html,
        css: '', // No separate CSS in Python format
        warnings: context.warnings,
        metadata: {
          paragraphCount: this.countParagraphs(document),
          tableCount: this.countTables(document),
          totalElements: document.elements.length,
          processingTime,
        },
      };
    } catch (error) {
      context.warnings.push(
        `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Log the detailed error to the console
      console.error('Detailed conversion error:', error);
      
      // Return minimal result on error
      return {
        html: '<html><body><div><p>Error converting document</p></div></body></html>',
        css: '',
        warnings: context.warnings,
        metadata: {
          paragraphCount: 0,
          tableCount: 0,
          totalElements: 0,
          processingTime: performance.now() - startTime,
        },
      };
    }
  }

  /**
   * Extract page margins from document - Python compatible
   * @param document - DOCX document
   * @returns Page margins in points
   */
  private extractPageMargins(document: DocumentSchema): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    // Default Python margins
    const defaultMargins = {
      top: 56.7,
      right: 56.7,
      bottom: 56.7,
      left: 56.7
    };

    if (!document.doc_margins) {
      return defaultMargins;
    }

    return {
      top: document.doc_margins.top_pt ?? defaultMargins.top,
      right: document.doc_margins.right_pt ?? defaultMargins.right,
      bottom: document.doc_margins.bottom_pt ?? defaultMargins.bottom,
      left: document.doc_margins.left_pt ?? defaultMargins.left
    };
  }

  /**
   * Convert document elements to HTML elements
   * @param document - DOCX document
   * @param context - Conversion context
   * @returns Array of HTML elements
   */
  private async convertDocumentElements(
    document: DocumentSchema,
    context: ConversionContext
  ): Promise<HtmlElement[]> {
    const htmlElements: HtmlElement[] = [];

    // Convert each document element
    for (const [index, element] of document.elements.entries()) {
      try {
        if (this.isParagraph(element)) {
          const paragraphElement = ParagraphConverter.convertParagraphWithHeadingDetection(
            element as Paragraph,
            context
          );
          htmlElements.push(paragraphElement);
        } else if (this.isTable(element)) {
          const tableElement = TableConverter.convertTable(
            element as Table,
            context
          );
          htmlElements.push(tableElement);
        } else {
          context.warnings.push(`Unknown element type at index ${index}`);
        }
      } catch (error) {
        context.warnings.push(
          `Failed to convert element ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return htmlElements;
  }

  /**
   * Check if element is a paragraph
   * @param element - Document element
   * @returns True if paragraph
   */
  private isParagraph(element: Paragraph | Table): element is Paragraph {
    return 'runs' in element;
  }

  /**
   * Check if element is a table
   * @param element - Document element
   * @returns True if table
   */
  private isTable(element: Paragraph | Table): element is Table {
    return 'rows' in element;
  }

  /**
   * Count paragraphs in document
   * @param document - DOCX document
   * @returns Number of paragraphs
   */
  private countParagraphs(document: DocumentSchema): number {
    return document.elements.filter(el => this.isParagraph(el)).length;
  }

  /**
   * Count tables in document
   * @param document - DOCX document
   * @returns Number of tables
   */
  private countTables(document: DocumentSchema): number {
    return document.elements.filter(el => this.isTable(el)).length;
  }

  /**
   * Convert document to HTML body content only (no HTML document wrapper)
   * @param document - Parsed DOCX document
   * @returns HTML body content
   */
  async convertToBodyContent(document: DocumentSchema): Promise<string> {
    const result = await this.convert(document);
    
    // Extract body content from full HTML document
    const bodyMatch = result.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch && bodyMatch[1] ? bodyMatch[1].trim() : result.html;
  }

  /**
   * Convert document to HTML fragments (array of element strings)
   * @param document - Parsed DOCX document
   * @returns Array of HTML element strings
   */
  async convertToFragments(document: DocumentSchema): Promise<string[]> {
    const context: ConversionContext = {
      classPrefix: this.options.classPrefix,
      includeDebugComments: this.options.includeDebugComments,
      cssRules: [],
      warnings: [],
    };

    const htmlElements = await this.convertDocumentElements(document, context);
    
    return htmlElements.map(element => HtmlGenerator.generateHtml(element));
  }

  /**
   * Get conversion statistics for a document
   * @param document - Parsed DOCX document
   * @returns Conversion statistics
   */
  getStatistics(document: DocumentSchema): {
    elementCount: number;
    paragraphCount: number;
    tableCount: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
  } {
    const elementCount = document.elements.length;
    const paragraphCount = this.countParagraphs(document);
    const tableCount = this.countTables(document);
    
    // Simple complexity estimation
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    if (elementCount > 100 || tableCount > 10) {
      estimatedComplexity = 'high';
    } else if (elementCount > 20 || tableCount > 2) {
      estimatedComplexity = 'medium';
    }

    return {
      elementCount,
      paragraphCount,
      tableCount,
      estimatedComplexity,
    };
  }
} 