/**
 * DOCX Processor for TXT Output
 * 
 * Handles preprocessing and optimization of DOCX documents
 * specifically for plain text conversion.
 */

import type { DocumentSchema } from '@/models/document-models.js';
import type { Paragraph } from '@/models/paragraph-models.js';
import type { Table } from '@/models/table-models.js';
import type { TxtConversionOptions } from './index.js';
import { RunConverter } from './converters/run-converter.js';
import { ParagraphConverter } from './converters/paragraph-converter.js';
import { TableConverter } from './converters/table-converter.js';

/**
 * Processing statistics for TXT conversion
 */
export interface ProcessingStatistics {
  /** Original element count */
  originalElements: number;
  /** Elements after processing */
  processedElements: number;
  /** Number of empty elements removed */
  emptyElementsRemoved: number;
  /** Number of runs merged */
  runsMerged: number;
  /** Number of duplicate paragraphs removed */
  duplicatesRemoved: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Processor for optimizing DOCX documents for TXT conversion
 */
export class DocxProcessor {
  private readonly options: TxtConversionOptions;

  constructor(options: TxtConversionOptions = {}) {
    this.options = options;
  }

  /**
   * Process a DOCX document for optimal TXT conversion
   * @param document - DOCX document to process
   * @returns Processed document and statistics
   */
  async processDocument(document: DocumentSchema): Promise<{
    document: DocumentSchema;
    statistics: ProcessingStatistics;
  }> {
    const startTime = performance.now();
    const originalElements = document.elements.length;

    // Create a deep copy of the document for processing
    const processedDocument: DocumentSchema = {
      ...document,
      elements: [...document.elements],
    };

    let emptyElementsRemoved = 0;
    let runsMerged = 0;
    let duplicatesRemoved = 0;

    // Step 1: Remove empty elements
    if (this.shouldRemoveEmptyElements()) {
      const { elements, removed } = this.removeEmptyElements(processedDocument.elements);
      processedDocument.elements = elements;
      emptyElementsRemoved = removed;
    }

    // Step 2: Merge adjacent runs with same properties
    if (this.shouldMergeRuns()) {
      runsMerged = this.mergeAdjacentRuns(processedDocument.elements);
    }

    // Step 3: Remove duplicate consecutive paragraphs
    if (this.shouldRemoveDuplicates()) {
      const { elements, removed } = this.removeDuplicateParagraphs(processedDocument.elements);
      processedDocument.elements = elements;
      duplicatesRemoved = removed;
    }

    // Step 4: Optimize table content for text conversion
    if (this.shouldOptimizeTables()) {
      this.optimizeTablesForText(processedDocument.elements);
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    const statistics: ProcessingStatistics = {
      originalElements,
      processedElements: processedDocument.elements.length,
      emptyElementsRemoved,
      runsMerged,
      duplicatesRemoved,
      processingTime,
    };

    return {
      document: processedDocument,
      statistics,
    };
  }

  /**
   * Remove empty elements from document
   * @param elements - Document elements
   * @returns Filtered elements and count of removed elements
   */
  private removeEmptyElements(elements: (Paragraph | Table)[]): {
    elements: (Paragraph | Table)[];
    removed: number;
  } {
    const originalCount = elements.length;
    const filteredElements = elements.filter(element => {
      if (this.isParagraph(element)) {
        return !ParagraphConverter.isEmpty(element as Paragraph);
      } else if (this.isTable(element)) {
        // Create a temporary context for table checking
        const context = {
          indentLevel: 0,
          indentSize: 4,
          includeDebugComments: false,
          preserveFormatting: true,
          maxLineWidth: 0,
          preserveTableStructure: true,
          includeHeadingMarkers: false,
          warnings: [],
        };
        return !TableConverter.isEmpty(element as Table, context);
      }
      return true;
    });

    return {
      elements: filteredElements,
      removed: originalCount - filteredElements.length,
    };
  }

  /**
   * Merge adjacent runs with identical properties in all paragraphs
   * @param elements - Document elements
   * @returns Number of runs merged
   */
  private mergeAdjacentRuns(elements: (Paragraph | Table)[]): number {
    let totalMerged = 0;

    for (const element of elements) {
      if (this.isParagraph(element)) {
        const paragraph = element as Paragraph;
        const originalRunCount = paragraph.runs.length;
        paragraph.runs = RunConverter.mergeAdjacentRuns(paragraph.runs);
        totalMerged += originalRunCount - paragraph.runs.length;
      } else if (this.isTable(element)) {
        const table = element as Table;
        for (const row of table.rows) {
          for (const cell of row.cells) {
            for (const cellParagraph of cell.paragraphs) {
              const originalRunCount = cellParagraph.runs.length;
              cellParagraph.runs = RunConverter.mergeAdjacentRuns(cellParagraph.runs);
              totalMerged += originalRunCount - cellParagraph.runs.length;
            }
          }
        }
      }
    }

    return totalMerged;
  }

  /**
   * Remove duplicate consecutive paragraphs
   * @param elements - Document elements
   * @returns Filtered elements and count of removed duplicates
   */
  private removeDuplicateParagraphs(elements: (Paragraph | Table)[]): {
    elements: (Paragraph | Table)[];
    removed: number;
  } {
    if (elements.length < 2) {
      return { elements, removed: 0 };
    }

    const filteredElements: (Paragraph | Table)[] = [];
    let removed = 0;
    let lastParagraphText: string | null = null;

    for (const element of elements) {
      if (this.isParagraph(element)) {
        const paragraph = element as Paragraph;
        const currentText = ParagraphConverter.getTextContent(paragraph).trim();
        
        if (currentText !== lastParagraphText || currentText.length === 0) {
          filteredElements.push(element);
          lastParagraphText = currentText;
        } else {
          removed++;
        }
      } else {
        // Tables always included, reset text comparison
        filteredElements.push(element);
        lastParagraphText = null;
      }
    }

    return {
      elements: filteredElements,
      removed,
    };
  }

  /**
   * Optimize tables specifically for text conversion
   * @param elements - Document elements
   */
  private optimizeTablesForText(elements: (Paragraph | Table)[]): void {
    for (const element of elements) {
      if (this.isTable(element)) {
        const table = element as Table;
        
        // Remove empty rows and cells
        table.rows = table.rows.filter(row => {
          row.cells = row.cells.filter(cell => {
            return cell.paragraphs.some(p => !ParagraphConverter.isEmpty(p));
          });
          return row.cells.length > 0;
        });
      }
    }
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
   * Check if empty elements should be removed
   * @returns True if empty elements should be removed
   */
  private shouldRemoveEmptyElements(): boolean {
    return true; // Always remove empty elements for cleaner text output
  }

  /**
   * Check if runs should be merged
   * @returns True if runs should be merged
   */
  private shouldMergeRuns(): boolean {
    return true; // Always merge runs for simpler text processing
  }

  /**
   * Check if duplicate paragraphs should be removed
   * @returns True if duplicates should be removed
   */
  private shouldRemoveDuplicates(): boolean {
    return this.options.preserveFormatting !== false; // Remove duplicates unless explicitly preserving all formatting
  }

  /**
   * Check if tables should be optimized
   * @returns True if tables should be optimized
   */
  private shouldOptimizeTables(): boolean {
    return true; // Always optimize tables for better text conversion
  }

  /**
   * Get text content preview from document
   * @param document - DOCX document
   * @param maxLength - Maximum preview length
   * @returns Text preview
   */
  static getTextPreview(document: DocumentSchema, maxLength: number = 200): string {
    const textParts: string[] = [];
    let totalLength = 0;

    for (const element of document.elements) {
      if (totalLength >= maxLength) break;

      let elementText = '';
      
      if ('runs' in element && Array.isArray(element.runs)) {
        // Paragraph
        const paragraph = element as Paragraph;
        elementText = ParagraphConverter.getTextContent(paragraph);
      } else if ('rows' in element && Array.isArray(element.rows)) {
        // Table - get first few cells
        const table = element as Table;
        const context = {
          indentLevel: 0,
          indentSize: 4,
          includeDebugComments: false,
          preserveFormatting: false,
          maxLineWidth: 0,
          preserveTableStructure: false,
          includeHeadingMarkers: false,
          warnings: [],
        };
        elementText = TableConverter.getTextContent(table, context);
      }

      if (elementText.trim()) {
        const remainingLength = maxLength - totalLength;
        if (elementText.length > remainingLength) {
          elementText = elementText.substring(0, remainingLength - 3) + '...';
        }
        
        textParts.push(elementText.trim());
        totalLength += elementText.length;
      }
    }

    return textParts.join(' ').trim();
  }

  /**
   * Analyze document structure for conversion planning
   * @param document - DOCX document
   * @returns Document analysis
   */
  static analyzeDocument(document: DocumentSchema): {
    totalElements: number;
    paragraphCount: number;
    tableCount: number;
    totalTextLength: number;
    hasComplexFormatting: boolean;
    estimatedConversionTime: number;
  } {
    let paragraphCount = 0;
    let tableCount = 0;
    let totalTextLength = 0;
    let hasComplexFormatting = false;

    for (const element of document.elements) {
      if ('runs' in element && Array.isArray(element.runs)) {
        paragraphCount++;
        const paragraph = element as Paragraph;
        totalTextLength += ParagraphConverter.getTextContent(paragraph).length;
        
        // Check for complex formatting
        if (paragraph.properties?.style_id || paragraph.numbering) {
          hasComplexFormatting = true;
        }
      } else if ('rows' in element && Array.isArray(element.rows)) {
        tableCount++;
        hasComplexFormatting = true; // Tables are considered complex
        
        const table = element as Table;
        const context = {
          indentLevel: 0,
          indentSize: 4,
          includeDebugComments: false,
          preserveFormatting: false,
          maxLineWidth: 0,
          preserveTableStructure: false,
          includeHeadingMarkers: false,
          warnings: [],
        };
        totalTextLength += TableConverter.getTextContent(table, context).length;
      }
    }

    // Estimate conversion time (rough heuristic)
    const baseTime = 10; // base 10ms
    const elementTime = document.elements.length * 2; // 2ms per element
    const textTime = Math.floor(totalTextLength / 1000); // 1ms per 1000 characters
    const complexityTime = hasComplexFormatting ? 20 : 0;

    return {
      totalElements: document.elements.length,
      paragraphCount,
      tableCount,
      totalTextLength,
      hasComplexFormatting,
      estimatedConversionTime: baseTime + elementTime + textTime + complexityTime,
    };
  }
} 