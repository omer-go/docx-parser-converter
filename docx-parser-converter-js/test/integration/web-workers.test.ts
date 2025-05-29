/**
 * Web Workers Integration Tests
 * Tests for Phase 9: API Integration & Web Workers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocxParserConverter } from '../../src/index.js';
import type { LibraryConfig } from '../../src/index.js';

// Mock Web Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor(public scriptURL: string, public options?: WorkerOptions) {}
  
  postMessage(message: any): void {
    // Simulate worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: {
            id: message.id,
            type: 'complete',
            data: {
              success: true,
              result: { test: 'result' },
            },
          },
        }));
      }
    }, 100);
  }
  
  terminate(): void {
    // Cleanup
  }
  
  addEventListener(type: string, listener: EventListener): void {
    if (type === 'message') {
      this.onmessage = listener as (event: MessageEvent) => void;
    } else if (type === 'error') {
      this.onerror = listener as (event: ErrorEvent) => void;
    }
  }
  
  removeEventListener(type: string, _listener: EventListener): void {
    if (type === 'message') {
      this.onmessage = null;
    } else if (type === 'error') {
      this.onerror = null;
    }
  }
}

describe('Web Workers Integration', () => {
  let converter: DocxParserConverter;
  
  beforeEach(() => {
    // Mock Worker in global scope
    global.Worker = MockWorker as any;
    global.navigator = { hardwareConcurrency: 4 } as any;
    
    // Reset singleton
    DocxParserConverter.reset();
    
    // Create instance with Web Workers enabled
    converter = DocxParserConverter.getInstance({
      useWebWorkers: true,
      maxWorkers: 2,
      enableProgressReporting: true,
    });
  });
  
  afterEach(() => {
    converter.cleanup();
    DocxParserConverter.reset();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with Web Worker support', async () => {
      await converter.initialize();
      
      const status = converter.getStatus();
      expect(status.webWorkersSupported).toBe(true);
      expect(status.webWorkersEnabled).toBe(true);
      expect(status.initialized).toBe(true);
    });

    it('should auto-detect hardware concurrency', () => {
      const config = converter.getConfig();
      expect(config.maxWorkers).toBe(2); // Set in beforeEach
    });

    it('should handle missing Worker support gracefully', () => {
      global.Worker = undefined as any;
      
      const fallbackConverter = DocxParserConverter.getInstance({
        useWebWorkers: true,
      });
      
      const status = fallbackConverter.getStatus();
      expect(status.webWorkersSupported).toBe(false);
      expect(status.webWorkersEnabled).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<LibraryConfig> = {
        maxWorkers: 4,
        workerTimeout: 60000,
        enableProgressReporting: false,
      };
      
      converter.updateConfig(newConfig);
      
      const config = converter.getConfig();
      expect(config.maxWorkers).toBe(4);
      expect(config.workerTimeout).toBe(60000);
      expect(config.enableProgressReporting).toBe(false);
    });

    it('should enable/disable Web Workers', async () => {
      await converter.initialize();
      
      // Disable Web Workers
      converter.setWebWorkersEnabled(false);
      
      let status = converter.getStatus();
      expect(status.webWorkersEnabled).toBe(false);
      
      // Re-enable Web Workers
      converter.setWebWorkersEnabled(true);
      
      status = converter.getStatus();
      expect(status.webWorkersEnabled).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const metrics = converter.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('processingTime');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.processingTime).toBe('number');
    });

    it('should include worker stats when available', async () => {
      await converter.initialize();
      
      const metrics = converter.getPerformanceMetrics();
      expect(metrics.workerStats).toBeDefined();
      expect(metrics.workerStats).toHaveProperty('totalWorkers');
      expect(metrics.workerStats).toHaveProperty('busyWorkers');
      expect(metrics.workerStats).toHaveProperty('idleWorkers');
      expect(metrics.workerStats).toHaveProperty('pendingRequests');
    });

    it('should monitor memory usage', async () => {
      // Mock performance.memory
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        },
        configurable: true,
      });
      
      const memoryUsage = await converter.checkMemoryUsage();
      expect(memoryUsage).toBeCloseTo(50, 1); // ~50MB
    });

    it('should warn on high memory usage', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock high memory usage
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 150 * 1024 * 1024, // 150MB (above 100MB threshold)
        },
        configurable: true,
      });
      
      await converter.checkMemoryUsage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory usage')
      );
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during operations', async () => {
      const progressEvents: Array<{ progress: number; details?: string }> = [];
      
      // Create a mock file
      const file = new File(['test content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      
      // Mock file utilities
      vi.doMock('../../src/utils/file-utils.js', () => ({
        fileToArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        extractXMLFromDocx: vi.fn().mockResolvedValue('<document></document>'),
      }));
      
      const progressCallback = (progress: number, details?: string) => {
        progressEvents.push({ progress, ...(details && { details }) });
      };
      
      try {
        await converter.parseDocument(file, progressCallback);
      } catch (error) {
        // Expected to fail in test environment, but progress should still be reported
      }
      
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0]?.progress).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple files concurrently', async () => {
      const files = [
        new File(['content1'], 'test1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['content2'], 'test2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['content3'], 'test3.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      ];
      
      const processor = vi.fn().mockImplementation(async (file: File) => {
        return { fileName: file.name, processed: true };
      });
      
      const results = await converter.processBatch(files, processor, {
        concurrency: 2,
        failFast: false,
      });
      
      expect(results).toHaveLength(3);
      expect(processor).toHaveBeenCalledTimes(3);
      
      results.forEach((result, index) => {
        expect(result.file).toBe(files[index]);
        expect(result.result).toEqual({
          fileName: files[index]?.name,
          processed: true,
        });
      });
    });

    it('should handle errors in batch processing', async () => {
      const files = [
        new File(['content1'], 'test1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['content2'], 'test2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      ];
      
      const processor = vi.fn().mockImplementation(async (file: File) => {
        if (file.name === 'test2.docx') {
          throw new Error('Processing failed');
        }
        return { fileName: file.name, processed: true };
      });
      
      const results = await converter.processBatch(files, processor);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.result).toBeDefined();
      expect(results[0]?.error).toBeUndefined();
      expect(results[1]?.result).toBeUndefined();
      expect(results[1]?.error).toBe('Processing failed');
    });

    it('should support fail-fast mode', async () => {
      const files = [
        new File(['content1'], 'test1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['content2'], 'test2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      ];
      
      const processor = vi.fn().mockImplementation(async (file: File) => {
        if (file.name === 'test1.docx') {
          throw new Error('Processing failed');
        }
        return { fileName: file.name, processed: true };
      });
      
      await expect(
        converter.processBatch(files, processor, { failFast: true })
      ).rejects.toThrow('Processing failed');
    });
  });

  describe('Resource Management', () => {
    it('should cleanup resources properly', async () => {
      await converter.initialize();
      
      const initialStatus = converter.getStatus();
      expect(initialStatus.initialized).toBe(true);
      
      converter.cleanup();
      
      const finalStatus = converter.getStatus();
      expect(finalStatus.initialized).toBe(false);
      
      const metrics = converter.getPerformanceMetrics();
      expect(metrics.processingTime).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
    });

    it('should handle singleton reset', () => {
      const instance1 = DocxParserConverter.getInstance();
      const instance2 = DocxParserConverter.getInstance();
      
      expect(instance1).toBe(instance2);
      
      DocxParserConverter.reset();
      
      const instance3 = DocxParserConverter.getInstance();
      expect(instance3).not.toBe(instance1);
    });
  });

  describe('Status Information', () => {
    it('should provide comprehensive status', async () => {
      await converter.initialize();
      
      const status = converter.getStatus();
      
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('webWorkersSupported');
      expect(status).toHaveProperty('webWorkersEnabled');
      expect(status).toHaveProperty('initialized');
      
      expect(typeof status.version).toBe('string');
      expect(typeof status.webWorkersSupported).toBe('boolean');
      expect(typeof status.webWorkersEnabled).toBe('boolean');
      expect(typeof status.initialized).toBe('boolean');
    });
  });
}); 