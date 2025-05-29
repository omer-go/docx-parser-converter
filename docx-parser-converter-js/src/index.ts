/**
 * DOCX Parser Converter - JavaScript Library
 * High-performance TypeScript library for converting DOCX documents to HTML and TXT in browsers
 *
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

// Export all constants
export * from './constants/index.js';

// Export all utilities
export * from './utils/index.js';

// Export models (Phase 2 complete)
export * from './models/index.js';

// Export parsers (Phase 3 - basic implementation)
export * from './parsers/index.js';

// Export converters (Phase 7 HTML & Phase 8 TXT complete)
export { 
  DocxToHtmlConverter, 
  HtmlGenerator, 
  DocxProcessor as HtmlDocxProcessor,
  type HtmlConversionOptions,
  type HtmlConversionResult
} from './converters/html/index.js';
export { 
  DocxToTxtConverter, 
  TxtGenerator, 
  DocxProcessor as TxtDocxProcessor,
  type TxtConversionOptions,
  type TxtConversionResult
} from './converters/txt/index.js';

// Export worker manager and types
export { WorkerManager, type ProgressCallback } from './utils/worker-manager.js';

// Export simplified parsers and converters
export { SimpleDocumentParser } from './parsers/simple-document-parser.js';
export { SimpleHtmlConverter } from './converters/simple-html-converter.js';
export { SimpleTxtConverter } from './converters/simple-txt-converter.js';

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
  private workerManager: import('./utils/worker-manager.js').WorkerManager | undefined;
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
    if (this.config.useWebWorkers && !this.workerManager) {
      const { WorkerManager } = await import('./utils/worker-manager.js');
      this.workerManager = new WorkerManager({
        maxWorkers: this.config.maxWorkers,
        workerTimeout: this.config.workerTimeout,
        enableProgressReporting: this.config.enableProgressReporting,
      });
      await this.workerManager.initialize();
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
   * Parse DOCX file and extract structured data (with optional Web Worker support)
   * @param docxFile - DOCX file to parse
   * @param progressCallback - Optional progress callback
   * @returns Promise resolving to parsed document structure
   */
  public async parseDocument(
    docxFile: File,
    progressCallback?: import('./utils/worker-manager.js').ProgressCallback
  ): Promise<DocumentParseResult> {
    const startTime = performance.now();

    try {
      await this.initialize();

      if (progressCallback) {
        progressCallback(0, 'Starting document parsing...');
      }

      const { fileToArrayBuffer, extractXMLFromDocx } = await import('./utils/file-utils.js');

      // Convert file to ArrayBuffer
      const arrayBuffer = await fileToArrayBuffer(docxFile);
      
      if (progressCallback) {
        progressCallback(20, 'Extracting XML content...');
      }

      // Extract document.xml
      const documentXml = await extractXMLFromDocx(arrayBuffer, 'document.xml');

      if (progressCallback) {
        progressCallback(40, 'Parsing document structure...');
      }

      let result;

      // Use Web Worker if available and enabled
      if (this.config.useWebWorkers && this.workerManager) {
        result = await this.workerManager.parseDocument(
          documentXml,
          'document',
          undefined,
          progressCallback
        );
      } else {
        // Fallback to main thread
        const { DocumentParser } = await import('./parsers/document/document-parser.js');
        const parser = new DocumentParser();
        const parseResult = await parser.parse(documentXml);
        result = parseResult.data;
        
        if (progressCallback) {
          progressCallback(100, 'Parsing complete');
        }
      }

      this.performanceMetrics.processingTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      // Log the detailed error here
      console.error('Error during DocxParserConverter.parseDocument:', error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        warnings: [],
      };
    }
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
    options?: import('./converters/html/index.js').HtmlConversionOptions,
    progressCallback?: import('./utils/worker-manager.js').ProgressCallback
  ): Promise<import('./converters/html/index.js').HtmlConversionResult> {
    const startTime = performance.now();

    try {
      await this.initialize();

      if (progressCallback) {
        progressCallback(0, 'Starting HTML conversion...');
      }

      // Step 1: Parse the document using the full parser
      // We need the DocumentSchema for the full DocxToHtmlConverter
      const parsedDocumentResult = await this.parseDocument(docxFile, (progress, details) => {
        // Adjust progress for parsing phase (0-60% of total conversion)
        if (progressCallback) progressCallback(progress * 0.6, details || 'Parsing document...');
      });

      if (!parsedDocumentResult.success || !parsedDocumentResult.data) {
        throw new Error(parsedDocumentResult.errors.join('; ') || 'Failed to parse document for HTML conversion');
      }

      // Ensure parsedDocumentResult.data is treated as DocumentSchema
      const documentSchema = parsedDocumentResult.data as import('./models/document-models.js').DocumentSchema;

      if (progressCallback) {
        progressCallback(60, 'Converting to HTML...');
      }

      // Step 2: Use the full DocxToHtmlConverter
      const { DocxToHtmlConverter } = await import('./converters/html/docx-to-html-converter.js');
      const htmlConverter = new DocxToHtmlConverter(options);
      const result = await htmlConverter.convert(documentSchema);

      if (progressCallback) {
        progressCallback(100, 'HTML conversion complete');
      }

      this.performanceMetrics.processingTime = performance.now() - startTime;
      return result;

    } catch (error) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      
      return {
        html: '<p>Error converting document to HTML</p>',
        css: '',
        warnings: [error instanceof Error ? error.message : 'Unknown conversion error'],
        metadata: {
          paragraphCount: 0,
          tableCount: 0,
          totalElements: 0,
          processingTime: this.performanceMetrics.processingTime,
        },
      };
    }
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
    options?: import('./converters/txt/index.js').TxtConversionOptions,
    progressCallback?: import('./utils/worker-manager.js').ProgressCallback
  ): Promise<import('./converters/txt/index.js').TxtConversionResult> {
    const startTime = performance.now();

    try {
      await this.initialize();

      if (progressCallback) {
        progressCallback(0, 'Starting TXT conversion...');
      }

      const { fileToArrayBuffer, extractXMLFromDocx } = await import('./utils/file-utils.js');

      // Convert file to ArrayBuffer
      const arrayBuffer = await fileToArrayBuffer(docxFile);

      if (progressCallback) {
        progressCallback(15, 'Extracting XML content...');
      }

      // Extract document.xml
      const documentXml = await extractXMLFromDocx(arrayBuffer, 'document.xml');

      if (progressCallback) {
        progressCallback(30, 'Parsing document structure...');
      }

      // Use simplified parser
      const { SimpleDocumentParser } = await import('./parsers/simple-document-parser.js');
      const document = SimpleDocumentParser.parseDocument(documentXml);

      if (progressCallback) {
        progressCallback(60, 'Converting to text...');
      }

      // Use simplified TXT converter
      const { SimpleTxtConverter } = await import('./converters/simple-txt-converter.js');
      const result = SimpleTxtConverter.convert(document);

      if (progressCallback) {
        progressCallback(100, 'TXT conversion complete');
      }

      this.performanceMetrics.processingTime = performance.now() - startTime;
      return result;

    } catch (error) {
      this.performanceMetrics.processingTime = performance.now() - startTime;
      
      return {
        text: 'Error converting document to text',
        warnings: [error instanceof Error ? error.message : 'Unknown conversion error'],
        metadata: {
          characterCount: 0,
          lineCount: 0,
          paragraphCount: 0,
          tableCount: 0,
          totalElements: 0,
          processingTime: this.performanceMetrics.processingTime,
        },
      };
    }
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
    processor: (file: File, progressCallback?: import('./utils/worker-manager.js').ProgressCallback) => Promise<T>,
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
