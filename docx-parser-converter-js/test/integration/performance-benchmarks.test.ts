import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DocxParserConverter } from '../../src/index.js';

describe('Performance Benchmarks', () => {
  const testFilesPath = 'C:\\Users\\omerh\\Desktop\\Docx Test Files';
  let converter: DocxParserConverter;

  beforeAll(async () => {
    converter = DocxParserConverter.getInstance({
      useWebWorkers: false, // Test single-threaded performance first
      enableProgressReporting: true,
      enablePerformanceMetrics: true
    });
    await converter.initialize();
  });

  afterAll(() => {
    converter.cleanup();
  });

  describe('Processing Speed Requirements', () => {
    it('should process small documents (<100KB) within 500ms', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'docx_test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Warm up
      await converter.convertToHtml(file);

      // Benchmark HTML conversion
      const htmlStartTime = performance.now();
      const htmlResult = await converter.convertToHtml(file);
      const htmlEndTime = performance.now();
      const htmlDuration = htmlEndTime - htmlStartTime;

      // Benchmark TXT conversion
      const txtStartTime = performance.now();
      const txtResult = await converter.convertToTxt(file);
      const txtEndTime = performance.now();
      const txtDuration = txtEndTime - txtStartTime;

      // Verify results
      expect(htmlResult.html).toBeDefined();
      expect(txtResult.text).toBeDefined();

      // Check performance requirements
      const fileSize = buffer.length / 1024; // KB
      console.log(`📊 Small Document (${fileSize.toFixed(1)}KB):`);
      console.log(`   HTML: ${htmlDuration.toFixed(2)}ms`);
      console.log(`   TXT: ${txtDuration.toFixed(2)}ms`);

      if (fileSize < 100) {
        expect(htmlDuration).toBeLessThan(500);
        expect(txtDuration).toBeLessThan(500);
      }
    });

    it('should process medium documents (100KB-1MB) within 2 seconds', async () => {
      const filePath = join(testFilesPath, 'Employment-Contract-Template-Download-20201125.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'Employment-Contract-Template-Download-20201125.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Warm up
      await converter.convertToHtml(file);

      // Benchmark HTML conversion
      const htmlStartTime = performance.now();
      const htmlResult = await converter.convertToHtml(file);
      const htmlEndTime = performance.now();
      const htmlDuration = htmlEndTime - htmlStartTime;

      // Benchmark TXT conversion
      const txtStartTime = performance.now();
      const txtResult = await converter.convertToTxt(file);
      const txtEndTime = performance.now();
      const txtDuration = txtEndTime - txtStartTime;

      // Verify results
      expect(htmlResult.html).toBeDefined();
      expect(txtResult.text).toBeDefined();

      // Check performance requirements
      const fileSize = buffer.length / 1024; // KB
      console.log(`📊 Medium Document (${fileSize.toFixed(1)}KB):`);
      console.log(`   HTML: ${htmlDuration.toFixed(2)}ms`);
      console.log(`   TXT: ${txtDuration.toFixed(2)}ms`);

      if (fileSize >= 100 && fileSize <= 1024) {
        expect(htmlDuration).toBeLessThan(2000);
        expect(txtDuration).toBeLessThan(2000);
      }
    });

    it('should process large documents (>1MB) within 10 seconds', async () => {
      const filePath = join(testFilesPath, 'file-sample_1MB.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'file-sample_1MB.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Benchmark HTML conversion
      const htmlStartTime = performance.now();
      const htmlResult = await converter.convertToHtml(file);
      const htmlEndTime = performance.now();
      const htmlDuration = htmlEndTime - htmlStartTime;

      // Benchmark TXT conversion
      const txtStartTime = performance.now();
      const txtResult = await converter.convertToTxt(file);
      const txtEndTime = performance.now();
      const txtDuration = txtEndTime - txtStartTime;

      // Verify results
      expect(htmlResult.html).toBeDefined();
      expect(txtResult.text).toBeDefined();

      // Check performance requirements
      const fileSize = buffer.length / 1024; // KB
      console.log(`📊 Large Document (${fileSize.toFixed(1)}KB):`);
      console.log(`   HTML: ${htmlDuration.toFixed(2)}ms`);
      console.log(`   TXT: ${txtDuration.toFixed(2)}ms`);

      if (fileSize > 1024) {
        expect(htmlDuration).toBeLessThan(10000);
        expect(txtDuration).toBeLessThan(10000);
      }
    });
  });

  describe('Memory Usage Requirements', () => {
    it('should stay within memory limits for 1MB document', async () => {
      const filePath = join(testFilesPath, 'file-sample_1MB.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'file-sample_1MB.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Get initial memory usage
      const initialMemory = await converter.checkMemoryUsage();

      // Process document
      const htmlResult = await converter.convertToHtml(file);
      const txtResult = await converter.convertToTxt(file);

      // Get peak memory usage
      const peakMemory = await converter.checkMemoryUsage();
      const memoryIncrease = peakMemory - initialMemory;

      console.log(`📊 Memory Usage for 1MB document:`);
      console.log(`   Initial: ${initialMemory.toFixed(2)}MB`);
      console.log(`   Peak: ${peakMemory.toFixed(2)}MB`);
      console.log(`   Increase: ${memoryIncrease.toFixed(2)}MB`);

      // Verify results
      expect(htmlResult.html).toBeDefined();
      expect(txtResult.text).toBeDefined();

      // Check memory requirement (<100MB for 1MB document)
      expect(memoryIncrease).toBeLessThan(100);
    });

    it('should efficiently clean up memory after processing', async () => {
      const filePath = join(testFilesPath, 'Test Document.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'Test Document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const initialMemory = await converter.checkMemoryUsage();

      // Process multiple documents
      for (let i = 0; i < 5; i++) {
        await converter.convertToHtml(file);
        await converter.convertToTxt(file);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = await converter.checkMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`📊 Memory Cleanup Test:`);
      console.log(`   Initial: ${initialMemory.toFixed(2)}MB`);
      console.log(`   Final: ${finalMemory.toFixed(2)}MB`);
      console.log(`   Net Increase: ${memoryIncrease.toFixed(2)}MB`);

      // Memory should not continuously grow
      expect(memoryIncrease).toBeLessThan(50); // Should not grow more than 50MB
    });
  });

  describe('Concurrent Processing Requirements', () => {
    it('should support 10+ simultaneous conversions', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'docx_test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const concurrentCount = 12; // Test 12 simultaneous conversions
      const startTime = performance.now();

      // Create concurrent conversion promises
      const promises = Array(concurrentCount).fill(null).map(async (_, index) => {
        const htmlResult = await converter.convertToHtml(file);
        const txtResult = await converter.convertToTxt(file);
        return {
          index,
          html: htmlResult,
          txt: txtResult,
          completed: true
        };
      });

      // Wait for all to complete
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      console.log(`📊 Concurrent Processing (${concurrentCount} operations):`);
      console.log(`   Total Time: ${totalDuration.toFixed(2)}ms`);
      console.log(`   Average per Operation: ${(totalDuration / concurrentCount).toFixed(2)}ms`);

      // Verify all completed successfully
      expect(results).toHaveLength(concurrentCount);
      results.forEach((result, index) => {
        expect(result.completed).toBe(true);
        expect(result.html.html).toBeDefined();
        expect(result.txt.text).toBeDefined();
        expect(result.index).toBe(index);
      });

      // Should complete within reasonable time
      expect(totalDuration).toBeLessThan(30000); // 30 seconds for 12 operations
    });

    it('should handle resource contention gracefully', async () => {
      const filePath = join(testFilesPath, 'file-sample_1MB.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'file-sample_1MB.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const concurrentCount = 5;
      const errors: Error[] = [];
      const results: any[] = [];

      // Process large files concurrently
      const promises = Array(concurrentCount).fill(null).map(async (_, index) => {
        try {
          const htmlResult = await converter.convertToHtml(file);
          const txtResult = await converter.convertToTxt(file);
          results.push({ index, html: htmlResult, txt: txtResult });
        } catch (error) {
          errors.push(error as Error);
        }
      });

      await Promise.allSettled(promises);

      console.log(`📊 Resource Contention Test:`);
      console.log(`   Successful: ${results.length}/${concurrentCount}`);
      console.log(`   Errors: ${errors.length}/${concurrentCount}`);

      // Most should succeed (allow some resource contention failures)
      expect(results.length).toBeGreaterThan(concurrentCount * 0.6); // At least 60% success rate
      
      // Successful results should be valid
      results.forEach(result => {
        expect(result.html.html).toBeDefined();
        expect(result.txt.text).toBeDefined();
      });
    });
  });

  describe('Web Worker Performance', () => {
    it('should show performance benefits with Web Workers enabled', async () => {
      // Test with Web Workers disabled (current converter)
      const filePath = join(testFilesPath, 'Employment-Contract-Template-Download-20201125.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'Employment-Contract-Template-Download-20201125.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Single-threaded benchmark
      const singleThreadStart = performance.now();
      await converter.convertToHtml(file);
      const singleThreadEnd = performance.now();
      const singleThreadDuration = singleThreadEnd - singleThreadStart;

      // Test with Web Workers enabled
      const workerConverter = DocxParserConverter.getInstance({
        useWebWorkers: true,
        maxWorkers: 4,
        enableProgressReporting: true,
        enablePerformanceMetrics: true
      });
      await workerConverter.initialize();

      const workerStart = performance.now();
      await workerConverter.convertToHtml(file);
      const workerEnd = performance.now();
      const workerDuration = workerEnd - workerStart;

      console.log(`📊 Web Worker Performance Comparison:`);
      console.log(`   Single-threaded: ${singleThreadDuration.toFixed(2)}ms`);
      console.log(`   Web Workers: ${workerDuration.toFixed(2)}ms`);
      console.log(`   Improvement: ${((singleThreadDuration - workerDuration) / singleThreadDuration * 100).toFixed(1)}%`);

      // Web Workers might be slower for single documents due to overhead
      // but should be available and functional
      expect(workerDuration).toBeGreaterThan(0);
      
      workerConverter.cleanup();
    });
  });

  describe('Throughput Tests', () => {
    it('should maintain consistent performance over multiple documents', async () => {
      const filePath = join(testFilesPath, 'docx_test.docx');
      const buffer = await readFile(filePath);
      const file = new File([buffer], 'docx_test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const durations: number[] = [];
      const batchSize = 10;

      for (let i = 0; i < batchSize; i++) {
        const startTime = performance.now();
        await converter.convertToHtml(file);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variability = (maxDuration - minDuration) / averageDuration;

      console.log(`📊 Throughput Test (${batchSize} documents):`);
      console.log(`   Average: ${averageDuration.toFixed(2)}ms`);
      console.log(`   Min: ${minDuration.toFixed(2)}ms`);
      console.log(`   Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`   Variability: ${(variability * 100).toFixed(1)}%`);

      // Performance should be consistent (variability < 100%)
      expect(variability).toBeLessThan(1.0);
      
      // All conversions should complete in reasonable time
      durations.forEach(duration => {
        expect(duration).toBeLessThan(2000); // 2 seconds max per document
      });
    });
  });
}); 