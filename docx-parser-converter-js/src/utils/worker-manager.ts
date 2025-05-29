/**
 * Worker Manager
 * Manages Web Worker lifecycle and communication for background processing
 */

import type { DocumentSchema } from '@/models/document-models.js';
import type { HtmlConversionOptions, HtmlConversionResult } from '@/converters/html/index.js';
import type { TxtConversionOptions, TxtConversionResult } from '@/converters/txt/index.js';

// Progress callback type
export type ProgressCallback = (progress: number, details?: string) => void;

// Worker pool configuration
interface WorkerPoolConfig {
  maxWorkers: number;
  workerTimeout: number;
  enableProgressReporting: boolean;
}

// Worker instance wrapper
interface WorkerInstance {
  id: string;
  worker: Worker;
  busy: boolean;
  lastUsed: number;
  type: 'parser' | 'converter';
}

// Promise resolver for worker requests
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  progressCallback?: ProgressCallback;
  timeout?: NodeJS.Timeout;
}

/**
 * Worker Manager class for handling background processing
 */
export class WorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private config: WorkerPoolConfig;
  private nextWorkerId = 0;

  constructor(config?: Partial<WorkerPoolConfig>) {
    this.config = {
      maxWorkers: Math.max(2, Math.min(8, navigator.hardwareConcurrency || 4)),
      workerTimeout: 30000, // 30 seconds
      enableProgressReporting: true,
      ...config,
    };
  }

  /**
   * Initialize worker manager
   */
  public async initialize(): Promise<void> {
    // Pre-create one parser and one converter worker
    await this.createWorker('parser');
    await this.createWorker('converter');
  }

  /**
   * Parse document in background worker
   */
  public async parseDocument(
    xmlData: string,
    parserType: 'document' | 'paragraph' | 'table' | 'styles' | 'numbering' = 'document',
    options?: Record<string, unknown>,
    progressCallback?: ProgressCallback
  ): Promise<DocumentSchema> {
    const worker = await this.getAvailableWorker('parser');
    const requestId = this.generateRequestId();

    return new Promise<DocumentSchema>((resolve, reject) => {
      const request: PendingRequest = {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: setTimeout(() => {
          this.handleTimeout(requestId);
        }, this.config.workerTimeout),
      };

      if (progressCallback) {
        request.progressCallback = progressCallback;
      }

      this.pendingRequests.set(requestId, request);

      worker.worker.postMessage({
        id: requestId,
        type: parserType,
        xmlData,
        options,
      });

      worker.busy = true;
      worker.lastUsed = Date.now();
    });
  }

  /**
   * Convert document to HTML in background worker
   */
  public async convertToHtml(
    documentData: DocumentSchema,
    options?: HtmlConversionOptions,
    progressCallback?: ProgressCallback
  ): Promise<HtmlConversionResult> {
    const worker = await this.getAvailableWorker('converter');
    const requestId = this.generateRequestId();

    return new Promise<HtmlConversionResult>((resolve, reject) => {
      const request: PendingRequest = {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: setTimeout(() => {
          this.handleTimeout(requestId);
        }, this.config.workerTimeout),
      };

      if (progressCallback) {
        request.progressCallback = progressCallback;
      }

      this.pendingRequests.set(requestId, request);

      worker.worker.postMessage({
        id: requestId,
        type: 'html',
        documentData,
        options,
      });

      worker.busy = true;
      worker.lastUsed = Date.now();
    });
  }

  /**
   * Convert document to TXT in background worker
   */
  public async convertToTxt(
    documentData: DocumentSchema,
    options?: TxtConversionOptions,
    progressCallback?: ProgressCallback
  ): Promise<TxtConversionResult> {
    const worker = await this.getAvailableWorker('converter');
    const requestId = this.generateRequestId();

    return new Promise<TxtConversionResult>((resolve, reject) => {
      const request: PendingRequest = {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: setTimeout(() => {
          this.handleTimeout(requestId);
        }, this.config.workerTimeout),
      };

      if (progressCallback) {
        request.progressCallback = progressCallback;
      }

      this.pendingRequests.set(requestId, request);

      worker.worker.postMessage({
        id: requestId,
        type: 'txt',
        documentData,
        options,
      });

      worker.busy = true;
      worker.lastUsed = Date.now();
    });
  }

  /**
   * Get or create an available worker
   */
  private async getAvailableWorker(type: 'parser' | 'converter'): Promise<WorkerInstance> {
    // Find available worker of the right type
    for (const worker of this.workers.values()) {
      if (worker.type === type && !worker.busy) {
        return worker;
      }
    }

    // Create new worker if under limit
    if (this.workers.size < this.config.maxWorkers) {
      return await this.createWorker(type);
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkWorkers = () => {
        for (const worker of this.workers.values()) {
          if (worker.type === type && !worker.busy) {
            resolve(worker);
            return;
          }
        }
        setTimeout(checkWorkers, 100); // Check every 100ms
      };
      checkWorkers();
    });
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(type: 'parser' | 'converter'): Promise<WorkerInstance> {
    const workerId = `${type}-worker-${this.nextWorkerId++}`;
    
    // Create worker from appropriate script
    const workerScript = type === 'parser' 
      ? '/dist/workers/parser-worker.js'
      : '/dist/workers/converter-worker.js';
    
    const worker = new Worker(workerScript, { type: 'module' });
    
    const workerInstance: WorkerInstance = {
      id: workerId,
      worker,
      busy: false,
      lastUsed: Date.now(),
      type,
    };

    // Set up message handling
    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event.data);
    };

    worker.onerror = (error) => {
      this.handleWorkerError(workerId, error);
    };

    // Wait for worker to be ready
    await new Promise<void>((resolve) => {
      const readyHandler = (event: MessageEvent) => {
        if (event.data.id === 'worker-ready') {
          worker.removeEventListener('message', readyHandler);
          resolve();
        }
      };
      worker.addEventListener('message', readyHandler);
    });

    this.workers.set(workerId, workerInstance);
    return workerInstance;
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const { id, type, data, error, progress } = message;
    const pendingRequest = this.pendingRequests.get(id);

    if (!pendingRequest) return;

    switch (type) {
      case 'progress':
        if (this.config.enableProgressReporting && pendingRequest.progressCallback) {
          pendingRequest.progressCallback(progress, data);
        }
        break;

      case 'complete':
        worker.busy = false;
        this.clearPendingRequest(id);
        pendingRequest.resolve(data.result || data);
        break;

      case 'error':
        worker.busy = false;
        this.clearPendingRequest(id);
        pendingRequest.reject(new Error(error));
        break;
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`Worker ${workerId} error:`, error);
    
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.busy = false;
      
      // Find and reject any pending requests for this worker
      for (const [requestId, request] of this.pendingRequests.entries()) {
        this.clearPendingRequest(requestId);
        request.reject(new Error(`Worker error: ${error.message}`));
      }
    }
  }

  /**
   * Handle request timeout
   */
  private handleTimeout(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      this.clearPendingRequest(requestId);
      request.reject(new Error('Worker request timeout'));
    }
  }

  /**
   * Clear pending request
   */
  private clearPendingRequest(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request?.timeout) {
      clearTimeout(request.timeout);
    }
    this.pendingRequests.delete(requestId);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup idle workers
   */
  public cleanupIdleWorkers(maxIdleTime: number = 300000): void { // 5 minutes
    const now = Date.now();
    
    for (const [workerId, worker] of this.workers.entries()) {
      if (!worker.busy && (now - worker.lastUsed) > maxIdleTime) {
        worker.worker.terminate();
        this.workers.delete(workerId);
      }
    }
  }

  /**
   * Terminate all workers
   */
  public terminate(): void {
    // Reject all pending requests
    for (const [requestId, request] of this.pendingRequests.entries()) {
      this.clearPendingRequest(requestId);
      request.reject(new Error('Worker manager terminated'));
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.worker.terminate();
    }

    this.workers.clear();
  }

  /**
   * Get worker pool statistics
   */
  public getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    pendingRequests: number;
  } {
    const busyWorkers = Array.from(this.workers.values()).filter(w => w.busy).length;
    
    return {
      totalWorkers: this.workers.size,
      busyWorkers,
      idleWorkers: this.workers.size - busyWorkers,
      pendingRequests: this.pendingRequests.size,
    };
  }
} 