/**
 * Parser Web Worker
 * Handles document parsing in background thread to avoid blocking UI
 */

import { DocumentParser } from '@/parsers/document/document-parser.js';
import { DocumentParagraphParser } from '@/parsers/document/paragraph-parser.js';
import { TablesParser } from '@/parsers/tables/tables-parser.js';
import { StylesParser } from '@/parsers/styles/styles-parser.js';
import { NumberingParser } from '@/parsers/numbering/numbering-parser.js';

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'parse' | 'progress' | 'error' | 'complete';
  data?: unknown;
  error?: string;
  progress?: number;
}

interface ParseRequest {
  id: string;
  type: 'document' | 'paragraph' | 'table' | 'styles' | 'numbering';
  xmlData: string;
  options?: Record<string, unknown>;
}

interface ParseResult {
  id: string;
  success: boolean;
  data?: unknown;
  warnings: string[];
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
function sendComplete(id: string, result: ParseResult): void {
  sendMessage({
    id,
    type: 'complete',
    data: result,
  });
}

/**
 * Parse document using appropriate parser
 */
async function parseDocument(request: ParseRequest): Promise<ParseResult> {
  const startTime = performance.now();
  const result: ParseResult = {
    id: request.id,
    success: false,
    warnings: [],
    processingTime: 0,
  };

  try {
    sendProgress(request.id, 10, 'Initializing parser...');

    let parser;
    let parseResult;

    switch (request.type) {
      case 'document': {
        parser = new DocumentParser(request.options);
        sendProgress(request.id, 30, 'Parsing document structure...');
        parseResult = await parser.parse(request.xmlData);
        break;
      }
      
      case 'paragraph': {
        parser = new DocumentParagraphParser(request.options);
        sendProgress(request.id, 50, 'Parsing paragraphs...');
        parseResult = await parser.parse(request.xmlData);
        break;
      }
      
      case 'table': {
        parser = new TablesParser(request.options);
        sendProgress(request.id, 60, 'Parsing tables...');
        parseResult = await parser.parse(request.xmlData);
        break;
      }
      
      case 'styles': {
        parser = new StylesParser(request.options);
        sendProgress(request.id, 70, 'Parsing styles...');
        parseResult = await parser.parse(request.xmlData);
        break;
      }
      
      case 'numbering': {
        parser = new NumberingParser(request.options);
        sendProgress(request.id, 80, 'Parsing numbering...');
        parseResult = await parser.parse(request.xmlData);
        break;
      }
      
      default:
        throw new Error(`Unknown parser type: ${request.type}`);
    }

    sendProgress(request.id, 90, 'Finalizing results...');

    result.success = true;
    result.data = parseResult.data;
    result.warnings = parseResult.warnings || [];
    
    sendProgress(request.id, 100, 'Parsing complete');

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown parsing error';
    result.warnings.push(`Parsing failed: ${result.error}`);
  }

  result.processingTime = performance.now() - startTime;
  return result;
}

/**
 * Process incoming message from main thread
 */
async function handleMessage(event: MessageEvent<ParseRequest>): Promise<void> {
  const request = event.data;

  // Validate request
  if (!request.id || !request.type || !request.xmlData) {
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
    sendProgress(request.id, 0, 'Starting parsing...');
    
    const result = await parseDocument(request);
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
  data: 'Parser worker initialized and ready',
});

// Export types for TypeScript (these won't be used at runtime in worker)
export type { WorkerMessage, ParseRequest, ParseResult }; 