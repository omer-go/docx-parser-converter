/**
 * DOCX Parser Converter - JavaScript Library
 * High-performance TypeScript library for converting DOCX documents to HTML and TXT in browsers
 *
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

import type { DocumentSchema } from './models/document-models';
import { DocumentParser } from './parsers/document/document-parser';
// Import converters and types for non-worker path and method signatures
import { DocxToHtmlConverter, type HtmlConversionOptions, type HtmlConversionResult } from './converters/html/index';
import { DocxToTxtConverter, type TxtConversionOptions, type TxtConversionResult } from './converters/txt/index';

// Export all constants
export * from './constants/index';

// Export all utilities
export * from './utils/index';

// Export models (Phase 2 complete)
export * from './models/index';

// Export parsers (Phase 3 - basic implementation)
export * from './parsers/index';

// Export converters (Phase 7 HTML & Phase 8 TXT complete)
export { 
  DocxToHtmlConverter, 
  HtmlGenerator, 
  DocxProcessor as HtmlDocxProcessor,
  type HtmlConversionOptions,
  type HtmlConversionResult
} from './converters/html/index';
export { 
  DocxToTxtConverter, 
  TxtGenerator, 
  DocxProcessor as TxtDocxProcessor,
  type TxtConversionOptions,
  type TxtConversionResult
} from './converters/txt/index';

// Export worker manager and types
export { WorkerManager, type ProgressCallback } from './utils/worker-manager';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Library name
 */
export const LIBRARY_NAME = 'docx-parser-converter-js';

/**
 * Interface for parsed document data
 */
export interface ParsedDocumentData {
  // Will be refined as parsers are implemented
  [key: string]: unknown;
}

/**
 * Interface for document parsing result
 */
export interface DocumentParseResult {
  success: boolean;
  data?: ParsedDocumentData;
  errors: string[];
  warnings: string[];
}

/**
 * Performance monitoring interface
 */
export interface PerformanceMetrics {
  memoryUsage: number;
  processingTime: number;
  workerStats?: {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    pendingRequests: number;
  };
}

/**
 * Main library configuration
 */
export interface LibraryConfig {
  useWebWorkers: boolean;
  maxWorkers: number;
  workerTimeout: number;
  enableProgressReporting: boolean;
  enablePerformanceMetrics: boolean;
  memoryThreshold: number; // MB
}

/**
 * Progress event data
 */
export interface ProgressEvent {
  progress: number; // 0-100
  details?: string;
  stage: 'parsing' | 'converting' | 'finalizing';
}

/**
 * Main library class (Phase 9: API Integration & Web Workers)
 */
export class DocxParserConverter {
  private static instance: DocxParserConverter;
  private workerManager: import('./utils/worker-manager').WorkerManager | undefined;
  private config: LibraryConfig;
  private performanceMetrics: PerformanceMetrics = {
    memoryUsage: 0,
    processingTime: 0,
  };

  private constructor(config?: Partial<LibraryConfig>) {
    this.config = {
      useWebWorkers: typeof Worker !== 'undefined', // Auto-detect worker support
      maxWorkers: Math.max(2, Math.min(8, navigator?.hardwareConcurrency || 4)),
      workerTimeout: 30000,
      enableProgressReporting: true,
      enablePerformanceMetrics: true,
      memoryThreshold: 100, // 100MB
      ...config,
    };
  }

  /**
   * Get singleton instance
   * @param config - Optional library configuration
   * @returns DocxParserConverter instance
   */
  public static getInstance(config?: Partial<LibraryConfig>): DocxParserConverter {
    if (!DocxParserConverter.instance) {
      DocxParserConverter.instance = new DocxParserConverter(config);
    }
    return DocxParserConverter.instance;
  }

  /**
   * Initialize the library (sets up Web Workers if enabled)
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.config.useWebWorkers) {
      if (!this.workerManager) {
        const { WorkerManager } = await import('./utils/worker-manager');
        this.workerManager = new WorkerManager({
          maxWorkers: this.config.maxWorkers,
          workerTimeout: this.config.workerTimeout,
          enableProgressReporting: this.config.enableProgressReporting,
        });
      }
      try {
        await this.workerManager.initialize(); // Attempt to initialize its internal workers
        console.log('WorkerManager initialized successfully internally.');
      } catch (error) {
        console.warn('WorkerManager internal initialization failed. Falling back to non-worker mode.', error);
        if (this.workerManager) {
            this.workerManager.terminate(); // Clean up partially initialized manager
        }
        this.workerManager = undefined; // Unset workerManager so other methods fall back
        this.config.useWebWorkers = false; // Explicitly disable worker use in config
      }
    } else { // If config.useWebWorkers is false initially or set to false due to init failure
      if (this.workerManager) {
        this.workerManager.terminate();
        this.workerManager = undefined;
      }
    }
  }

  /**
   * Get library version
   * @returns Version string
   */
  public getVersion(): string {
    return VERSION;
  }

  /**
   * Get library name
   * @returns Library name
   */
  public getName(): string {
    return LIBRARY_NAME;
  }

  /**
   * Get current configuration
   * @returns Library configuration
   */
  public getConfig(): LibraryConfig {
    return { ...this.config };
  }

  /**
   * Get performance metrics
   * @returns Current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const metrics = { ...this.performanceMetrics };
    
    if (this.workerManager) {
      metrics.workerStats = this.workerManager.getStats();
    }
    
    // Check for Chrome-specific memory API
    if (this.config.enablePerformanceMetrics && 'memory' in performance) {
      const performanceMemory = (performance as any).memory;
      if (performanceMemory && performanceMemory.usedJSHeapSize) {
        metrics.memoryUsage = performanceMemory.usedJSHeapSize / 1024 / 1024; // MB
      }
    }
    
    return metrics;
  }

  /**
   * Parse DOCX file to DocumentSchema (with optional Web Worker support)
   * @param docxFile - DOCX file to parse
   * @param progressCallback - Optional progress callback
   * @returns Promise resolving to document parsing result
   */
  public async parseDocument(
    docxFile: File,
    progressCallback?: import('./utils/worker-manager').ProgressCallback
  ): Promise<DocumentParseResult> {
    const startTime = performance.now();
    let result: DocumentParseResult;

    try {
      if (this.config.useWebWorkers && this.workerManager) {
        // Worker parsing implementation - extract XML first
        if (progressCallback) progressCallback(0, 'Reading DOCX file...');
        const { extractMainDocumentXml, extractMultipleXMLFromDocx } = await import('./utils/file-utils.js');
        const arrayBuffer = await docxFile.arrayBuffer();
        
        // Extract main document XML
        const xmlData = await extractMainDocumentXml(docxFile);
        
        // Extract numbering.xml if it exists
        const xmlFiles = await extractMultipleXMLFromDocx(arrayBuffer, ['numbering.xml']);
        const numberingXml = xmlFiles.get('numbering.xml');
        
        if (progressCallback) progressCallback(20, 'Starting worker parsing...');

        const documentSchema: DocumentSchema = await this.workerManager.parseDocument(
          xmlData,
          'document',
          { numberingXml },
          (workerProgress, details) => {
            if (progressCallback) progressCallback(20 + workerProgress * 0.8, details);
          }
        );
        result = { success: true, data: documentSchema, errors: [], warnings: [] };
        if (progressCallback) progressCallback(100, 'Worker parsing complete.');

      } else {
        // Non-worker path implementation
        if (progressCallback) progressCallback(0, 'Reading DOCX file (main thread)...');
        
        // Extract both document.xml and numbering.xml
        const { extractMainDocumentXml, extractMultipleXMLFromDocx } = await import('./utils/file-utils.js');
        const arrayBuffer = await docxFile.arrayBuffer();
        
        // Extract main document XML
        const xmlData = await extractMainDocumentXml(docxFile);
        
        // Extract numbering.xml if it exists
        const xmlFiles = await extractMultipleXMLFromDocx(arrayBuffer, ['numbering.xml']);
        const numberingXml = xmlFiles.get('numbering.xml');
        
        if (progressCallback) progressCallback(20, 'Parsing XML (main thread)...');
        
        const parser = new DocumentParser();
        
        // Parse numbering schema if numbering.xml exists
        let numberingSchema = undefined;
        if (numberingXml) {
          try {
            const { DocumentNumberingParser } = await import('./parsers/document/document-numbering-parser.js');
            const numberingParser = new DocumentNumberingParser();
            const numberingResult = await numberingParser.parse(numberingXml);
            numberingSchema = numberingResult.data;
          } catch (error) {
            console.warn('Failed to parse numbering schema:', error);
          }
        }
        
        // Pass numbering schema to document parser - note: parser.parse only accepts XML string
        const parserResult = await parser.parse(xmlData); // Returns ParserResult<DocumentSchema>
        
        // TODO: For now we'll store the numbering schema for later use by converters
        // This is a temporary solution until we refactor the parser to accept numbering schema
        if (numberingSchema) {
          // Store numbering schema in the parser result data for later use
          (parserResult.data as any)._numberingSchema = numberingSchema;
        }
        
        result = {
          success: true, // Assuming parser.parse throws on critical failure
          data: parserResult.data, // DocumentSchema
          errors: [], // BaseParser.parse throws ParserError, caught by outer catch
          warnings: parserResult.warnings,
        };
        if (progressCallback) progressCallback(100, 'Main thread parsing complete.');
      }
    } catch (error: any) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      console.error('Error during DocxParserConverter.parseDocument:', error);
      const errorMessages = [error instanceof Error ? error.message : 'Unknown parsing error'];
      if (error.cause instanceof Error) {
        errorMessages.push(`Cause: ${error.cause.message}`);
      }
      result = {
        success: false,
        errors: errorMessages,
        warnings: (error.warnings as string[] || []),
      };
    }

    this.performanceMetrics.processingTime = performance.now() - startTime;
    return result;
  }

  /**
   * Convert DOCX file to HTML (with optional Web Worker support)
   * @param docxFile - DOCX file to convert
   * @param options - HTML conversion options
   * @param progressCallback - Optional progress callback
   * @returns Promise resolving to HTML conversion result
   */
  public async convertToHtml(
    docxFile: File, 
    options?: HtmlConversionOptions,
    progressCallback?: import('./utils/worker-manager').ProgressCallback
  ): Promise<HtmlConversionResult> {
    const startTime = performance.now();
    let conversionResult: HtmlConversionResult;

    try {
      const parsingProgress = progressCallback ? (progress: number, details?: string) => progressCallback(progress * 0.5, details) : undefined;
      const parseResult = await this.parseDocument(docxFile, parsingProgress);

      if (!parseResult.success || !parseResult.data) {
        this.performanceMetrics.processingTime = performance.now() - startTime;
        return {
          html: '<p>Error: Document parsing failed.</p>',
          css: '',
          warnings: [...(parseResult.warnings || []), ...(parseResult.errors || ['Document parsing failed.'])],
          metadata: { processingTime: this.performanceMetrics.processingTime } as any,
        };
      }
      const documentSchema = parseResult.data as DocumentSchema;

      const conversionProgress = progressCallback ? (progress: number, details?: string) => progressCallback(50 + progress * 0.5, details) : undefined;
      if (this.config.useWebWorkers && this.workerManager) {
        if (conversionProgress) conversionProgress(0, 'Converting to HTML (worker)...');
        conversionResult = await this.workerManager.convertToHtml(
          documentSchema,
          options,
          conversionProgress // Pass only the conversion part of progress
        );
        if (conversionProgress) conversionProgress(100, 'HTML conversion (worker) complete.');
      } else {
        // Non-worker HTML conversion
        if (conversionProgress) conversionProgress(0, 'Converting to HTML (main thread)...');
        const htmlConverter = new DocxToHtmlConverter(options);
        conversionResult = await htmlConverter.convert(documentSchema);
        if (conversionProgress) conversionProgress(100, 'HTML conversion (main thread) complete.');
      }
    } catch (error: any) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      console.error('Error during DocxParserConverter.convertToHtml:', error);
      conversionResult = {
        html: '<p>Error: HTML conversion failed.</p>',
        css: '',
        warnings: [error instanceof Error ? error.message : 'Unknown conversion error'],
        metadata: { processingTime: this.performanceMetrics.processingTime } as any,
      };
    }

    this.performanceMetrics.processingTime = performance.now() - startTime;
    if (conversionResult.metadata && conversionResult.metadata.processingTime === undefined) {
      conversionResult.metadata.processingTime = this.performanceMetrics.processingTime;
    } else if (!conversionResult.metadata) {
      (conversionResult as any).metadata = { processingTime: this.performanceMetrics.processingTime };
    }
    return conversionResult;
  }

  /**
   * Convert DOCX file to plain text (with optional Web Worker support)
   * @param docxFile - DOCX file to convert
   * @param options - TXT conversion options
   * @param progressCallback - Optional progress callback
   * @returns Promise resolving to TXT conversion result
   */
  public async convertToTxt(
    docxFile: File,
    options?: TxtConversionOptions,
    progressCallback?: import('./utils/worker-manager').ProgressCallback
  ): Promise<TxtConversionResult> {
    const startTime = performance.now();
    let conversionResult: TxtConversionResult;
    try {
      const parsingProgress = progressCallback ? (progress: number, details?: string) => progressCallback(progress * 0.5, details) : undefined;
      const parseResult = await this.parseDocument(docxFile, parsingProgress);

      if (!parseResult.success || !parseResult.data) {
        this.performanceMetrics.processingTime = performance.now() - startTime;
        return {
          text: 'Error: Document parsing failed.',
          warnings: [...(parseResult.warnings || []), ...(parseResult.errors || ['Document parsing failed.'])],
          metadata: { processingTime: this.performanceMetrics.processingTime } as any,
        };
      }
      const documentSchema = parseResult.data as DocumentSchema;

      const conversionProgress = progressCallback ? (progress: number, details?: string) => progressCallback(50 + progress * 0.5, details) : undefined;
      if (this.config.useWebWorkers && this.workerManager) {
        if (conversionProgress) conversionProgress(0, 'Converting to TXT (worker)...');
        conversionResult = await this.workerManager.convertToTxt(
          documentSchema,
          options,
          conversionProgress
        );
        if (conversionProgress) conversionProgress(100, 'TXT conversion (worker) complete.');
      } else {
        // Non-worker TXT conversion
        if (conversionProgress) conversionProgress(0, 'Converting to TXT (main thread)...');
        const txtConverter = new DocxToTxtConverter(options);
        conversionResult = await txtConverter.convert(documentSchema);
        if (conversionProgress) conversionProgress(100, 'TXT conversion (main thread) complete.');
      }
    } catch (error: any) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      console.error('Error during DocxParserConverter.convertToTxt:', error);
      conversionResult = {
        text: 'Error: TXT conversion failed.',
        warnings: [error instanceof Error ? error.message : 'Unknown conversion error'],
        metadata: { processingTime: this.performanceMetrics.processingTime } as any,
      };
    }

    this.performanceMetrics.processingTime = performance.now() - startTime;
    if (conversionResult.metadata && conversionResult.metadata.processingTime === undefined) {
      conversionResult.metadata.processingTime = this.performanceMetrics.processingTime;
    } else if (!conversionResult.metadata) {
      (conversionResult as any).metadata = { processingTime: this.performanceMetrics.processingTime };
    }
    return conversionResult;
  }

  /**
   * Convert DOCX file to plain text (simple version)
   * @param docxFile - DOCX file to convert
   * @returns Promise resolving to plain text string
   */
  public async convertToPlainText(docxFile: File): Promise<string> {
    try {
      const result = await this.convertToTxt(docxFile, {
        preserveFormatting: false,
        indentSize: 0,
        includeHeadingMarkers: false,
        preserveTableStructure: false,
        maxLineWidth: 0,
        includeDebugComments: false,
      });
      
      return result.text;
    } catch (error) {
      console.error('Error converting document to plain text:', error);
      return 'Error converting document to plain text';
    }
  }

  /**
   * Process multiple documents concurrently
   * @param files - Array of DOCX files to process
   * @param options - Processing options
   * @param progressCallback - Overall progress callback
   * @returns Promise resolving to array of results
   */
  public async processBatch<T>(
    files: File[],
    processor: (file: File, progressCallback?: import('./utils/worker-manager').ProgressCallback) => Promise<T>,
    options?: {
      concurrency?: number;
      failFast?: boolean;
    },
    progressCallback?: (overall: number, fileIndex: number, fileProgress: number) => void
  ): Promise<Array<{ file: File; result?: T; error?: string }>> {
    const concurrency = options?.concurrency || Math.min(files.length, this.config.maxWorkers);
    const results: Array<{ file: File; result?: T; error?: string }> = [];
    let completed = 0;

    await this.initialize();

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        
        try {
          const result = await processor(file, (progress, _details) => {
            if (progressCallback) {
              progressCallback(
                (completed / files.length) * 100,
                fileIndex,
                progress
              );
            }
          });
          
          completed++;
          
          if (progressCallback) {
            progressCallback((completed / files.length) * 100, fileIndex, 100);
          }
          
          return { file, result };
        } catch (error) {
          completed++;
          
          if (progressCallback) {
            progressCallback((completed / files.length) * 100, fileIndex, 100);
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (options?.failFast) {
            throw error;
          }
          
          return { file, error: errorMessage };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Monitor memory usage and cleanup if needed
   * @returns Current memory usage in MB
   */
  public async checkMemoryUsage(): Promise<number> {
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      console.warn(`Memory usage (${metrics.memoryUsage.toFixed(2)}MB) exceeds threshold (${this.config.memoryThreshold}MB)`);
      
      // Cleanup idle workers
      if (this.workerManager) {
        this.workerManager.cleanupIdleWorkers();
      }
      
      // Suggest garbage collection if available
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    }
    
    return metrics.memoryUsage;
  }

  /**
   * Enable or disable Web Workers
   * @param enabled - Whether to use Web Workers
   */
  public setWebWorkersEnabled(enabled: boolean): void {
    this.config.useWebWorkers = enabled && typeof Worker !== 'undefined';
    
    if (!enabled && this.workerManager) {
      this.workerManager.terminate();
      this.workerManager = undefined;
    }
  }

  /**
   * Update library configuration
   * @param config - Partial configuration to update
   */
  public updateConfig(config: Partial<LibraryConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize worker manager if configuration changed
    if (this.workerManager && (
      config.maxWorkers !== undefined ||
      config.workerTimeout !== undefined ||
      config.enableProgressReporting !== undefined
    )) {
      this.workerManager.terminate();
      this.workerManager = undefined;
    }
  }

  /**
   * Get detailed status information
   * @returns Comprehensive library status
   */
  public getStatus(): {
    version: string;
    config: LibraryConfig;
    metrics: PerformanceMetrics;
    webWorkersSupported: boolean;
    webWorkersEnabled: boolean;
    initialized: boolean;
  } {
    return {
      version: this.getVersion(),
      config: this.getConfig(),
      metrics: this.getPerformanceMetrics(),
      webWorkersSupported: typeof Worker !== 'undefined',
      webWorkersEnabled: this.config.useWebWorkers,
      initialized: this.workerManager !== undefined,
    };
  }

  /**
   * Cleanup resources and terminate workers
   */
  public cleanup(): void {
    if (this.workerManager) {
      this.workerManager.terminate();
      this.workerManager = undefined;
    }
    
    // Reset performance metrics
    this.performanceMetrics = {
      memoryUsage: 0,
      processingTime: 0,
    };
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    if (DocxParserConverter.instance) {
      DocxParserConverter.instance.cleanup();
      DocxParserConverter.instance = undefined as any;
    }
  }
}

/**
 * Default export - main converter instance
 */
export default DocxParserConverter;
