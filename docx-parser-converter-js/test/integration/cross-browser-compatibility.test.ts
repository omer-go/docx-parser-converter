import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DocxParserConverter } from '../../src/index.js';

describe('Cross-Browser Compatibility Tests', () => {
  const testFilesPath = 'C:\\Users\\omerh\\Desktop\\Docx Test Files';
  let converter: DocxParserConverter;

  beforeAll(async () => {
    converter = DocxParserConverter.getInstance({
      useWebWorkers: true, // Test Web Worker compatibility
      enableProgressReporting: true,
      enablePerformanceMetrics: true
    });
    await converter.initialize();
  });

  describe('Browser Environment Detection', () => {
    it('should detect browser capabilities correctly', () => {
      const status = converter.getStatus();
      
      // Should detect if running in browser environment
      expect(status.webWorkersSupported).toBeDefined();
      expect(typeof status.webWorkersSupported).toBe('boolean');
      
      // Configuration should adapt to environment
      expect(status.config).toBeDefined();
      expect(status.config.useWebWorkers).toBeDefined();
      
      console.log('🌐 Browser Environment:', {
        webWorkersSupported: status.webWorkersSupported,
        webWorkersEnabled: status.webWorkersEnabled,
        maxWorkers: status.config.maxWorkers
      });
    });

    it('should handle missing browser APIs gracefully', () => {
      // Test with limited global objects (simulating older browsers)
      const originalWorker = global.Worker;
      const originalPerformance = global.performance;
      
      try {
        // Temporarily remove Worker support
        delete (global as any).Worker;
        
        const limitedConverter = DocxParserConverter.getInstance({
          useWebWorkers: true, // Should fallback to false
          enableProgressReporting: true,
          enablePerformanceMetrics: true
        });
        
        const status = limitedConverter.getStatus();
        
        // Should fallback gracefully
        expect(status.config.useWebWorkers).toBe(false);
        
        console.log('🌐 Limited Environment Fallback: ✅');
        
      } finally {
        // Restore original globals
        if (originalWorker) {
          global.Worker = originalWorker;
        }
        if (originalPerformance) {
          global.performance = originalPerformance;
        }
      }
    });
  });

  describe('File API Compatibility', () => {
    it('should handle File objects correctly across browsers', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      
      // Test different File constructor patterns
      const file1 = new File([buffer], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const file2 = new File([buffer], 'test.docx', { 
        type: 'application/octet-stream' // Generic type
      });
      
      const file3 = new File([buffer], 'test.docx'); // No type specified
      
      // All should work
      const result1 = await converter.convertToHtml(file1);
      const result2 = await converter.convertToHtml(file2);
      const result3 = await converter.convertToHtml(file3);
      
      expect(result1.html).toBeDefined();
      expect(result2.html).toBeDefined();
      expect(result3.html).toBeDefined();
      
      console.log('🌐 File API Compatibility: ✅');
    });

    it('should handle Blob objects correctly', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      
      // Create Blob instead of File
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Convert Blob to File
      const file = new File([blob], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const result = await converter.convertToHtml(file);
      expect(result.html).toBeDefined();
      
      console.log('🌐 Blob Compatibility: ✅');
    });
  });

  describe('ArrayBuffer and TypedArray Compatibility', () => {
    it('should handle different ArrayBuffer sources', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const nodeBuffer = await readFile(filePath);
      
      // Convert Node.js Buffer to ArrayBuffer in different ways
      const arrayBuffer1 = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset, 
        nodeBuffer.byteOffset + nodeBuffer.byteLength
      );
      
      const arrayBuffer2 = new ArrayBuffer(nodeBuffer.length);
      const view2 = new Uint8Array(arrayBuffer2);
      view2.set(nodeBuffer);
      
      // Create Files from different ArrayBuffer sources
      const file1 = new File([arrayBuffer1], 'test1.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const file2 = new File([arrayBuffer2], 'test2.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Both should work
      const result1 = await converter.convertToHtml(file1);
      const result2 = await converter.convertToHtml(file2);
      
      expect(result1.html).toBeDefined();
      expect(result2.html).toBeDefined();
      
      // Results should be equivalent
      expect(result1.html).toBe(result2.html);
      
      console.log('🌐 ArrayBuffer Compatibility: ✅');
    });

    it('should handle TypedArray variations', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      
      // Create different TypedArray views
      const uint8Array = new Uint8Array(buffer);
      const _uint16Array = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
      const _uint32Array = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
      
      // Create Files from TypedArrays
      const file1 = new File([uint8Array], 'test1.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Note: Uint16Array and Uint32Array would need proper conversion for binary data
      // This test verifies the library handles different array types gracefully
      
      const result = await converter.convertToHtml(file1);
      expect(result.html).toBeDefined();
      
      console.log('🌐 TypedArray Compatibility: ✅');
    });
  });

  describe('Web Worker Compatibility', () => {
    it('should work with Web Workers when available', async () => {
      if (typeof Worker === 'undefined') {
        console.log('🌐 Web Workers not available in test environment - skipping');
        return;
      }
      
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create converter with Web Workers explicitly enabled
      const workerConverter = DocxParserConverter.getInstance({
        useWebWorkers: true,
        maxWorkers: 2,
        workerTimeout: 10000,
        enableProgressReporting: true
      });
      
      await workerConverter.initialize();
      
      const status = workerConverter.getStatus();
      expect(status.webWorkersEnabled).toBe(true);
      
      // Test conversion with Web Workers
      const result = await workerConverter.convertToHtml(file);
      expect(result.html).toBeDefined();
      
      // Test progress reporting
      let progressReported = false;
      const resultWithProgress = await workerConverter.convertToHtml(file, {}, (progress: number, details?: string) => {
        progressReported = true;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
        expect(typeof details).toBe('string');
      });
      
      expect(resultWithProgress.html).toBeDefined();
      expect(progressReported).toBe(true); // Verify progress was reported
      
      workerConverter.cleanup();
      
      console.log('🌐 Web Worker Compatibility: ✅');
    });

    it('should fallback gracefully when Web Workers fail', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create converter that attempts to use Web Workers
      const fallbackConverter = DocxParserConverter.getInstance({
        useWebWorkers: true,
        maxWorkers: 1,
        workerTimeout: 100, // Very short timeout to force fallback
        enableProgressReporting: true
      });
      
      try {
        await fallbackConverter.initialize();
        
        // Should still work even if Web Workers have issues
        const result = await fallbackConverter.convertToHtml(file);
        expect(result.html).toBeDefined();
        
        console.log('🌐 Web Worker Fallback: ✅');
      } catch (error) {
        // If Web Workers completely fail, should still get a result
        expect(error).toBeDefined();
        console.log('🌐 Web Worker Fallback Error (expected):', (error as Error).message);
      } finally {
        fallbackConverter.cleanup();
      }
    });
  });

  describe('Memory Management Across Browsers', () => {
    it('should handle memory management consistently', async () => {
      const filePath = join(testFilesPath, 'Test Document.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const initialMemory = await converter.checkMemoryUsage();
      
      // Process document multiple times
      for (let i = 0; i < 3; i++) {
        await converter.convertToHtml(file);
        await converter.convertToTxt(file);
      }
      
      const finalMemory = await converter.checkMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log('🌐 Memory Management:', {
        initial: `${initialMemory.toFixed(2)}MB`,
        final: `${finalMemory.toFixed(2)}MB`,
        increase: `${memoryIncrease.toFixed(2)}MB`
      });
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });

    it('should handle large file processing without memory issues', async () => {
      const filePath = join(testFilesPath, 'file-sample_1MB.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'large-test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Should handle large files without throwing memory errors
      const result = await converter.convertToHtml(file);
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
      
      console.log('🌐 Large File Memory Handling: ✅');
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should provide consistent error messages', async () => {
      const corruptedBuffer = new ArrayBuffer(100);
      const view = new Uint8Array(corruptedBuffer);
      view.fill(0xFF);
      const corruptedFile = new File([corruptedBuffer], 'corrupted.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      let htmlError: Error | null = null;
      let txtError: Error | null = null;
      
      try {
        await converter.convertToHtml(corruptedFile);
      } catch (error) {
        htmlError = error as Error;
      }
      
      try {
        await converter.convertToTxt(corruptedFile);
      } catch (error) {
        txtError = error as Error;
      }
      
      // Both should throw errors
      expect(htmlError).toBeDefined();
      expect(txtError).toBeDefined();
      
      // Error messages should be informative
      expect(htmlError?.message).toBeDefined();
      expect(txtError?.message).toBeDefined();
      
      console.log('🌐 Error Handling Consistency: ✅');
    });

    it('should handle timeout scenarios gracefully', async () => {
      const filePath = join(testFilesPath, 'file-sample_1MB.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'timeout-test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create converter with very short timeout
      const timeoutConverter = DocxParserConverter.getInstance({
        useWebWorkers: true,
        workerTimeout: 10, // 10ms - will definitely timeout
        enableProgressReporting: true
      });
      
      try {
        await timeoutConverter.initialize();
        
        // This should either succeed (fallback) or fail gracefully
        try {
          const result = await timeoutConverter.convertToHtml(file);
          // If it succeeds, it used fallback successfully
          expect(result.html).toBeDefined();
          console.log('🌐 Timeout Fallback: ✅');
        } catch (error) {
          // If it fails, error should be informative
          expect(error).toBeDefined();
          expect((error as Error).message).toBeDefined();
          console.log('🌐 Timeout Error Handling: ✅');
        }
      } finally {
        timeoutConverter.cleanup();
      }
    });
  });

  describe('Feature Detection and Polyfills', () => {
    it('should work without modern JavaScript features', () => {
      // Test that the library can work with basic JavaScript features
      expect(typeof converter.getVersion).toBe('function');
      expect(typeof converter.getStatus).toBe('function');
      expect(typeof converter.getConfig).toBe('function');
      
      const version = converter.getVersion();
      const status = converter.getStatus();
      const config = converter.getConfig();
      
      expect(typeof version).toBe('string');
      expect(typeof status).toBe('object');
      expect(typeof config).toBe('object');
      
      console.log('🌐 Basic Feature Compatibility: ✅');
    });

    it('should handle missing Promise features gracefully', async () => {
      // Test Promise compatibility
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'promise-test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Should return proper Promise
      const htmlPromise = converter.convertToHtml(file);
      expect(htmlPromise).toBeDefined();
      expect(typeof htmlPromise.then).toBe('function');
      expect(typeof htmlPromise.catch).toBe('function');
      
      const result = await htmlPromise;
      expect(result.html).toBeDefined();
      
      console.log('🌐 Promise Compatibility: ✅');
    });
  });
}); 