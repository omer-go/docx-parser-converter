/**
 * Converter Web Worker
 * Handles document conversion to HTML/TXT in background thread to avoid blocking UI
 */

import { DocxToHtmlConverter } from '@/converters/html/docx-to-html-converter.js';
import { DocxToTxtConverter } from '@/converters/txt/docx-to-txt-converter.js';
import type { HtmlConversionOptions, HtmlConversionResult } from '@/converters/html/index.js';
import type { TxtConversionOptions, TxtConversionResult } from '@/converters/txt/index.js';
import type { DocumentSchema } from '@/models/document-models.js';

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'convert' | 'progress' | 'error' | 'complete';
  data?: unknown;
  error?: string;
  progress?: number;
}

interface ConversionRequest {
  id: string;
  type: 'html' | 'txt';
  documentData: unknown; // Parsed document data (validated at runtime)
  options?: HtmlConversionOptions | TxtConversionOptions;
}

interface ConversionResult {
  id: string;
  success: boolean;
  result?: HtmlConversionResult | TxtConversionResult;
  processingTime: number;
  error?: string;
}

// Global state for the worker
let isProcessing = false;
let currentJobId: string | null = null;

/**
 * Send message to main thread
 */
function sendMessage(message: WorkerMessage): void {
  self.postMessage(message);
}

/**
 * Send progress update
 */
function sendProgress(id: string, progress: number, details?: string): void {
  sendMessage({
    id,
    type: 'progress',
    progress,
    data: details,
  });
}

/**
 * Send error message
 */
function sendError(id: string, error: string): void {
  sendMessage({
    id,
    type: 'error',
    error,
  });
}

/**
 * Send completion message
 */
function sendComplete(id: string, result: ConversionResult): void {
  sendMessage({
    id,
    type: 'complete',
    data: result,
  });
}

/**
 * Convert document to HTML
 */
async function convertToHtml(
  documentData: DocumentSchema,
  options?: HtmlConversionOptions,
  progressId?: string
): Promise<HtmlConversionResult> {
  if (progressId) {
    sendProgress(progressId, 20, 'Initializing HTML converter...');
  }

  const converter = new DocxToHtmlConverter(options);
  
  if (progressId) {
    sendProgress(progressId, 40, 'Converting document structure to HTML...');
  }

  const result = await converter.convert(documentData);
  
  if (progressId) {
    sendProgress(progressId, 80, 'Generating CSS styles...');
  }

  return result;
}

/**
 * Convert document to TXT
 */
async function convertToTxt(
  documentData: DocumentSchema,
  options?: TxtConversionOptions,
  progressId?: string
): Promise<TxtConversionResult> {
  if (progressId) {
    sendProgress(progressId, 20, 'Initializing TXT converter...');
  }

  const converter = new DocxToTxtConverter(options);
  
  if (progressId) {
    sendProgress(progressId, 40, 'Converting document structure to text...');
  }

  const result = await converter.convert(documentData);
  
  if (progressId) {
    sendProgress(progressId, 80, 'Formatting text output...');
  }

  return result;
}

/**
 * Process conversion request
 */
async function processConversion(request: ConversionRequest): Promise<ConversionResult> {
  const startTime = performance.now();
  const result: ConversionResult = {
    id: request.id,
    success: false,
    processingTime: 0,
  };

  try {
    sendProgress(request.id, 10, 'Starting conversion...');

    // Validate document data structure
    if (!request.documentData || typeof request.documentData !== 'object') {
      throw new Error('Invalid document data: expected DocumentSchema object');
    }

    // Type assertion after validation
    const documentData = request.documentData as DocumentSchema;

    let conversionResult;

    switch (request.type) {
      case 'html': {
        conversionResult = await convertToHtml(
          documentData,
          request.options as HtmlConversionOptions,
          request.id
        );
        break;
      }
      
      case 'txt': {
        conversionResult = await convertToTxt(
          documentData,
          request.options as TxtConversionOptions,
          request.id
        );
        break;
      }
      
      default:
        throw new Error(`Unknown conversion type: ${request.type}`);
    }

    sendProgress(request.id, 90, 'Finalizing output...');

    result.success = true;
    result.result = conversionResult;
    
    sendProgress(request.id, 100, 'Conversion complete');

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown conversion error';
  }

  result.processingTime = performance.now() - startTime;
  return result;
}

/**
 * Process incoming message from main thread
 */
async function handleMessage(event: MessageEvent<ConversionRequest>): Promise<void> {
  const request = event.data;

  // Validate request
  if (!request.id || !request.type || !request.documentData) {
    sendError('invalid-request', 'Invalid request format');
    return;
  }

  // Check if already processing
  if (isProcessing) {
    sendError(request.id, 'Worker is busy processing another request');
    return;
  }

  isProcessing = true;
  currentJobId = request.id;

  try {
    sendProgress(request.id, 0, 'Initializing conversion...');
    
    const result = await processConversion(request);
    sendComplete(request.id, result);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendError(request.id, errorMessage);
  } finally {
    isProcessing = false;
    currentJobId = null;
  }
}

/**
 * Handle termination request
 */
function handleTermination(): void {
  if (currentJobId) {
    sendError(currentJobId, 'Worker terminated');
  }
  isProcessing = false;
  currentJobId = null;
}

// Set up message listeners
self.addEventListener('message', handleMessage);
self.addEventListener('error', (error) => {
  if (currentJobId) {
    sendError(currentJobId, `Worker error: ${error.message}`);
  }
});

// Handle worker termination
self.addEventListener('beforeunload', handleTermination);

// Send ready signal
sendMessage({
  id: 'worker-ready',
  type: 'progress',
  progress: 0,
  data: 'Converter worker initialized and ready',
});

// Export types for TypeScript (these won't be used at runtime in worker)
export type { WorkerMessage, ConversionRequest, ConversionResult }; 