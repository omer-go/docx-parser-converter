import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFile as topLevelReadFile } from 'fs/promises';
import { join as topLevelJoin } from 'path';
import { DocxParserConverter } from '../../src/index.js';

const testFilesPathConst = 'C:\\Users\\omerh\\Desktop\\Docx Test Files';
const testFileToFocus = 'docx_test.docx';

vi.mock('../../src/utils/file-utils.js', async (importOriginal) => {
  console.log('[MOCK ATTEMPT] Mock factory for file-utils.js is being set up.');
  const originalModule = await importOriginal() as Record<string, unknown>;
  return {
    ...originalModule,
    fileToArrayBuffer: async (file: File): Promise<ArrayBuffer> => {
      console.log(`[MOCK fileToArrayBuffer ENTRY] Called for ${file.name}. Attempting to read directly.`);
      try {
        const filePath = topLevelJoin(testFilesPathConst, file.name);
        const nodeBuffer = await topLevelReadFile(filePath);
        if (nodeBuffer.length === 0) {
          console.error(`[MOCK fileToArrayBuffer ERROR] NodeBuffer is empty for ${file.name}`);
          throw new Error(`[MOCK] NodeBuffer empty for ${file.name}`);
        }
        const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
        console.log(`[MOCK fileToArrayBuffer SUCCESS] Returning ArrayBuffer of length ${arrayBuffer.byteLength} for ${file.name}`);
        return arrayBuffer;
      } catch (e) {
        console.error(`[MOCK fileToArrayBuffer CATCH_ERROR] Error in mock for ${file.name}:`, e);
        // Fallback or rethrow:
        // Forcing an error if mock fails to ensure test failure
        throw new Error(`[MOCK fileToArrayBuffer FAILED] ${e instanceof Error ? e.message : String(e)}`); 
      }
    },
  };
});

describe('Real DOCX File Processing Integration Tests - FOCUSED DEBUG', () => {
  let converter: DocxParserConverter;

  beforeAll(async () => {
    console.log('[TEST MAIN LOG] beforeAll - Initializing DocxParserConverter.');
    converter = DocxParserConverter.getInstance({
      useWebWorkers: false,
      enableProgressReporting: true,
      enablePerformanceMetrics: true
    });
    await converter.initialize();
    console.log('[TEST MAIN LOG] beforeAll - DocxParserConverter initialized.');
  });

  it(`FOCUS: should successfully convert ${testFileToFocus} to HTML`, async () => {
    console.log(`[TEST MAIN LOG] Starting test for ${testFileToFocus}`);
    try {
      const filePath = topLevelJoin(testFilesPathConst, testFileToFocus);
      console.log(`[TEST MAIN LOG] Reading file: ${filePath}`);
      const nodeBuffer = await topLevelReadFile(filePath);
      console.log(`[TEST MAIN LOG] Node.js buffer length for ${testFileToFocus}: ${nodeBuffer.length}`);
      
      if (nodeBuffer.length === 0) {
        throw new Error("NodeBuffer read from disk is empty, aborting test.");
      }

      // Explicitly use ArrayBuffer for File constructor
      const arrayBufferForFileObject = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
      const file = new File([arrayBufferForFileObject], testFileToFocus, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      console.log(`[TEST MAIN LOG] File object created for ${testFileToFocus}, name: ${file.name}, size: ${file.size}, type: ${file.type}`);

      console.log(`[TEST MAIN LOG] Calling converter.convertToHtml for ${testFileToFocus}`);
      const result = await converter.convertToHtml(file);
      console.log(`[TEST MAIN LOG] converter.convertToHtml call completed for ${testFileToFocus}`);

      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
      console.log(`[TEST MAIN LOG] HTML Output for ${testFileToFocus} (first 100 chars): ${result.html.substring(0,100)}`);
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.html).toMatch(/<html>/); // Basic check
      console.log(`[TEST MAIN LOG] ✅ ${testFileToFocus}: HTML conversion assertions passed.`);

    } catch (error) {
      console.error(`[TEST MAIN LOG CATCH_ERROR] Test failed for ${testFileToFocus}:`, error);
      throw error;
    }
  });

  // Add a direct JSZip test case
  it('[TEMP JSZip TEST] Directly test JSZip with ArrayBuffer from Node.js fs.readFile', async () => {
    console.log('[TEMP JSZip TEST] Starting direct JSZip load test...');
    const JSZip = (await import('jszip')).default;
    const filePath = topLevelJoin(testFilesPathConst, testFileToFocus);
    const nodeBuffer = await topLevelReadFile(filePath);
    const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

    console.log(`[TEMP JSZip TEST] ArrayBuffer length: ${arrayBuffer.byteLength}, constructor: ${arrayBuffer.constructor.name}`);
    expect(arrayBuffer.byteLength).toBeGreaterThan(0); // Sanity check

    try {
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer); // Pass the ArrayBuffer directly
      console.log('[TEMP JSZip TEST] JSZip.loadAsync SUCCEEDED directly in test.');
    } catch (e) {
      console.error('[TEMP JSZip TEST] JSZip.loadAsync FAILED directly in test:', e);
      throw e; // Re-throw to fail the test and see the error
    }
  });

}); 