/**
 * Main DOCX to TXT Converter
 * 
 * Orchestrates the conversion process from parsed DOCX document structures
 * to complete plain text documents with proper formatting and structure.
 */

import type { DocumentSchema } from '@/models/document-models.js';
import type { Paragraph } from '@/models/paragraph-models.js';
import type { Table } from '@/models/table-models.js';
import type { 
  TxtConversionOptions, 
  TxtConversionResult 
} from './index.js';
import type { 
  TxtElement, 
  ConversionContext 
} from './converters/index.js';
import { ParagraphConverter } from './converters/paragraph-converter.js';
import { TableConverter } from './converters/table-converter.js';
import { TxtGenerator } from './txt-generator.js';

/**
 * Main converter class for DOCX to TXT conversion
 */
export class DocxToTxtConverter {
  private readonly options: Required<TxtConversionOptions>;

  constructor(options: TxtConversionOptions = {}) {
    this.options = {
      preserveFormatting: options.preserveFormatting ?? true,
      indentSize: options.indentSize ?? 4,
      includeHeadingMarkers: options.includeHeadingMarkers ?? false,
      preserveTableStructure: options.preserveTableStructure ?? true,
      maxLineWidth: options.maxLineWidth ?? 0,
      includeDebugComments: options.includeDebugComments ?? false,
    };
  }

  /**
   * Convert a parsed DOCX document to plain text
   * @param document - Parsed DOCX document
   * @returns TXT conversion result
   */
  async convert(document: DocumentSchema): Promise<TxtConversionResult> {
    const startTime = performance.now();
    
    // Create conversion context
    const context: ConversionContext = {
      indentLevel: 0,
      indentSize: this.options.indentSize,
      includeDebugComments: this.options.includeDebugComments,
      preserveFormatting: this.options.preserveFormatting,
      maxLineWidth: this.options.maxLineWidth,
      preserveTableStructure: this.options.preserveTableStructure,
      includeHeadingMarkers: this.options.includeHeadingMarkers,
      warnings: [],
    };

    try {
      // Convert document elements to TXT elements
      const txtElements = await this.convertDocumentElements(document, context);
      
      // Generate final text string
      const text = TxtGenerator.generateText(txtElements, {
        normalizeLineBreaks: true,
        trimTrailingWhitespace: true,
        removeEmptyLines: false,
        maxConsecutiveEmptyLines: 2,
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Calculate metadata
      const lines = text.split('\n');
      const metadata = {
        paragraphCount: this.countParagraphs(document),
        tableCount: this.countTables(document),
        totalElements: document.elements.length,
        lineCount: lines.length,
        characterCount: text.length,
        processingTime,
      };

      return {
        text: TxtGenerator.cleanupText(text),
        warnings: context.warnings,
        metadata,
      };
    } catch (error) {
      context.warnings.push(
        `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Return minimal result on error
      return {
        text: 'Error converting document to text',
        warnings: context.warnings,
        metadata: {
          paragraphCount: 0,
          tableCount: 0,
          totalElements: 0,
          lineCount: 1,
          characterCount: 0,
          processingTime: performance.now() - startTime,
        },
      };
    }
  }

  /**
   * Convert document elements to TXT elements
   * @param document - DOCX document
   * @param context - Conversion context
   * @returns Array of TXT elements
   */
  private async convertDocumentElements(
    document: DocumentSchema,
    context: ConversionContext
  ): Promise<TxtElement[]> {
    const txtElements: TxtElement[] = [];

    // Convert each document element
    for (const [index, element] of document.elements.entries()) {
      try {
        if (this.isParagraph(element)) {
          const paragraphElement = ParagraphConverter.convertParagraphWithHeadingDetection(
            element as Paragraph,
            context
          );
          txtElements.push(paragraphElement);
        } else if (this.isTable(element)) {
          const tableElement = TableConverter.convertTable(
            element as Table,
            context
          );
          txtElements.push(tableElement);
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

    return txtElements;
  }

  /**
   * Check if element is a paragraph
   * @param element - Document element
   * @returns True if element is a paragraph
   */
  private isParagraph(element: Paragraph | Table): element is Paragraph {
    return 'runs' in element && Array.isArray(element.runs);
  }

  /**
   * Check if element is a table
   * @param element - Document element
   * @returns True if element is a table
   */
  private isTable(element: Paragraph | Table): element is Table {
    return 'rows' in element && Array.isArray(element.rows);
  }

  /**
   * Count paragraphs in document
   * @param document - DOCX document
   * @returns Number of paragraphs
   */
  private countParagraphs(document: DocumentSchema): number {
    return document.elements.filter(element => this.isParagraph(element)).length;
  }

  /**
   * Count tables in document
   * @param document - DOCX document
   * @returns Number of tables
   */
  private countTables(document: DocumentSchema): number {
    return document.elements.filter(element => this.isTable(element)).length;
  }

  /**
   * Convert document to plain text content only (no formatting)
   * @param document - DOCX document
   * @returns Plain text string
   */
  async convertToPlainText(document: DocumentSchema): Promise<string> {
    const simpleOptions: TxtConversionOptions = {
      preserveFormatting: false,
      indentSize: 0,
      includeHeadingMarkers: false,
      preserveTableStructure: false,
      maxLineWidth: 0,
      includeDebugComments: false,
    };

    const converter = new DocxToTxtConverter(simpleOptions);
    const result = await converter.convert(document);
    return result.text;
  }

  /**
   * Convert document to text fragments (one per element)
   * @param document - DOCX document
   * @returns Array of text fragments
   */
  async convertToFragments(document: DocumentSchema): Promise<string[]> {
    const context: ConversionContext = {
      indentLevel: 0,
      indentSize: this.options.indentSize,
      includeDebugComments: false,
      preserveFormatting: this.options.preserveFormatting,
      maxLineWidth: this.options.maxLineWidth,
      preserveTableStructure: this.options.preserveTableStructure,
      includeHeadingMarkers: this.options.includeHeadingMarkers,
      warnings: [],
    };

    const fragments: string[] = [];

    for (const element of document.elements) {
      try {
        let txtElement: TxtElement;
        
        if (this.isParagraph(element)) {
          txtElement = ParagraphConverter.convertParagraph(element as Paragraph, context);
        } else if (this.isTable(element)) {
          txtElement = TableConverter.convertTable(element as Table, context);
        } else {
          continue;
        }

        if (txtElement.content && txtElement.content.trim()) {
          fragments.push(txtElement.content.trim());
        }
      } catch (error) {
        // Skip failed elements in fragment mode
        continue;
      }
    }

    return fragments;
  }

  /**
   * Get conversion statistics for a document
   * @param document - DOCX document
   * @returns Document statistics
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

    // Estimate complexity based on content
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    
    if (tableCount > 5 || elementCount > 100) {
      estimatedComplexity = 'high';
    } else if (tableCount > 0 || elementCount > 20) {
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