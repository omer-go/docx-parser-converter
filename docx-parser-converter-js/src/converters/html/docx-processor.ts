/**
 * DOCX Processor for HTML Output
 * 
 * Handles the complete pipeline from DOCX file input to HTML output,
 * including document parsing and HTML conversion.
 */

import { DocumentParser } from '@/parsers/document/document-parser.js';
import { DocxToHtmlConverter } from './docx-to-html-converter.js';
import type { 
  HtmlConversionOptions, 
  HtmlConversionResult 
} from './index.js';

/**
 * Complete processor for DOCX to HTML conversion
 */
export class DocxProcessor {
  private readonly documentParser: DocumentParser;
  private readonly htmlConverter: DocxToHtmlConverter;

  constructor(options: HtmlConversionOptions = {}) {
    this.documentParser = new DocumentParser();
    this.htmlConverter = new DocxToHtmlConverter(options);
  }

  /**
   * Process DOCX content and return complete HTML document
   * @param xmlObj - Parsed XML object from DOCX document.xml
   * @returns HTML conversion result
   */
  async processDocument(xmlObj: Record<string, unknown>): Promise<HtmlConversionResult> {
    try {
      // Parse DOCX document structure
      const document = await this.documentParser['parseInternal'](xmlObj);
      
      // Convert to HTML
      const result = await this.htmlConverter.convert(document);
      
      return result;
    } catch (error) {
      // Return error result
      return {
        html: '<p>Error processing document</p>',
        css: '',
        warnings: [
          `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ],
        metadata: {
          paragraphCount: 0,
          tableCount: 0,
          totalElements: 0,
          processingTime: 0,
        },
      };
    }
  }

  /**
   * Process DOCX content and return only body HTML content
   * @param xmlObj - Parsed XML object from DOCX document.xml
   * @returns HTML body content string
   */
  async processToBodyContent(xmlObj: Record<string, unknown>): Promise<string> {
    try {
      const document = await this.documentParser['parseInternal'](xmlObj);
      return await this.htmlConverter.convertToBodyContent(document);
    } catch (error) {
      return `<p>Error processing document: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</p>`;
    }
  }

  /**
   * Process DOCX content and return HTML fragments
   * @param xmlObj - Parsed XML object from DOCX document.xml
   * @returns Array of HTML element strings
   */
  async processToFragments(xmlObj: Record<string, unknown>): Promise<string[]> {
    try {
      const document = await this.documentParser['parseInternal'](xmlObj);
      return await this.htmlConverter.convertToFragments(document);
    } catch (error) {
      return [
        `<p>Error processing document: ${
          error instanceof Error ? error.message : 'Unknown error'
        }</p>`
      ];
    }
  }

  /**
   * Get processing statistics for DOCX content
   * @param xmlObj - Parsed XML object from DOCX document.xml
   * @returns Processing statistics
   */
  async getStatistics(xmlObj: Record<string, unknown>): Promise<{
    parsing: {
      elementCount: number;
      paragraphCount: number;
      tableCount: number;
      hasMargins: boolean;
    };
    conversion: {
      elementCount: number;
      paragraphCount: number;
      tableCount: number;
      estimatedComplexity: 'low' | 'medium' | 'high';
    };
  }> {
    try {
      const document = await this.documentParser['parseInternal'](xmlObj);
      
      const parsingStats = DocumentParser.getDocumentStatistics(document);
      const conversionStats = this.htmlConverter.getStatistics(document);
      
      return {
        parsing: {
          elementCount: parsingStats.totalElements,
          paragraphCount: parsingStats.paragraphCount,
          tableCount: parsingStats.tableCount,
          hasMargins: parsingStats.hasMargins,
        },
        conversion: conversionStats,
      };
    } catch (error) {
      // Return empty statistics on error
      return {
        parsing: {
          elementCount: 0,
          paragraphCount: 0,
          tableCount: 0,
          hasMargins: false,
        },
        conversion: {
          elementCount: 0,
          paragraphCount: 0,
          tableCount: 0,
          estimatedComplexity: 'low',
        },
      };
    }
  }

  /**
   * Validate DOCX content before processing
   * @param xmlObj - Parsed XML object from DOCX document.xml
   * @returns Validation result
   */
  async validateDocument(xmlObj: Record<string, unknown>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check basic structure
      if (!xmlObj || typeof xmlObj !== 'object') {
        errors.push('Invalid XML object: must be a non-null object');
        return { isValid: false, errors, warnings };
      }

      if (!xmlObj['w:document']) {
        errors.push('Missing w:document element');
        return { isValid: false, errors, warnings };
      }

      // Try parsing to validate structure
      const document = await this.documentParser['parseInternal'](xmlObj);
      
      // Check if document is empty
      if (DocumentParser.isEmpty(document)) {
        warnings.push('Document appears to be empty');
      }

      return {
        isValid: true,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Process multiple documents in batch
   * @param xmlObjects - Array of parsed XML objects
   * @returns Array of HTML conversion results
   */
  async processBatch(xmlObjects: Record<string, unknown>[]): Promise<HtmlConversionResult[]> {
    const results: HtmlConversionResult[] = [];

    for (const [index, xmlObj] of xmlObjects.entries()) {
      try {
        const result = await this.processDocument(xmlObj);
        result.warnings.unshift(`Document ${index + 1}:`);
        results.push(result);
      } catch (error) {
        results.push({
          html: '<p>Error processing document</p>',
          css: '',
          warnings: [
            `Document ${index + 1}: Processing failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          ],
          metadata: {
            paragraphCount: 0,
            tableCount: 0,
            totalElements: 0,
            processingTime: 0,
          },
        });
      }
    }

    return results;
  }

  /**
   * Get processor information
   * @returns Processor information
   */
  getInfo(): {
    version: string;
    supportedFeatures: string[];
    limitations: string[];
  } {
    return {
      version: '1.0.0',
      supportedFeatures: [
        'Paragraphs with text formatting',
        'Tables with borders and styling',
        'Headings with automatic detection',
        'Text runs with fonts and colors',
        'Document margins',
        'Basic numbering/lists',
        'CSS generation',
        'HTML document generation',
      ],
      limitations: [
        'Complex numbering requires numbering.xml parsing',
        'Advanced table features may not be fully supported',
        'Some DOCX features may not have HTML equivalents',
        'Font embedding not supported',
        'Page breaks converted to CSS hints only',
      ],
    };
  }
} 