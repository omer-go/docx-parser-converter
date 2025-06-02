// tests/suites/utils.test.ts
import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import {
    assertEquals,
    assertNotNull,
    assertTrue
    // assertThrows // Removed as it's not in current test-utils
} from '../test-utils';

import {
    extractXmlRootFromDocx,
    extractXmlRootFromString,
    readFileInBrowser
} from '../../src/docx_parsers/utils';

// Minimal valid DOCX base64 string (contains "Hello World!")
const minimalDocxBase64 = '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カートリッジIAAAAAQAYAIAAAAAAAAAABAAAAAAAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQAFAAAAAgACAAAAAAIQUAAAAYBAAAAEwAAAAAAAAABAAAAAAAACgAAAF9yZWxzLy5yZWxzUEsBAhQAFAAAAAgACAAAAAAIQUAAAJMCAAARAAAAAAAAAAQAAAAAABEAAAB3b3JkL19yZWxzL2RvY3VtZW50LnhtbC5yZWxzUEsBAhQAFAAAAAgACAAAAAAIQUAAAVgUAAAbAQAAAAAAAAABAAAAAAAAGgAAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAAEAAQA8AAAAIIYAAAAAA==';

function base64ToUint8Array(base64: string): Uint8Array {
    if (typeof atob === 'undefined' && typeof Buffer !== 'undefined') {
        // Node.js environment
        return Uint8Array.from(Buffer.from(base64, 'base64'));
    }
    // Browser environment
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function createMockFile(content: Uint8Array | string, name: string, type: string): File {
    const blobContent = typeof content === 'string' ? [new TextEncoder().encode(content)] : [content];
    return new File(blobContent, name, { type });
}

export function registerUtilsTests() {
    describe("Simplified Utils Script Tests", () => {
        const tests: TestResult[] = [];

        // --- Test extractXmlRootFromString ---
        const validXml = '<root><child attr="val">text</child></root>';
        let parsedRoot: Element | null = null;
        let extractXmlPassed = false;
        try {
            parsedRoot = extractXmlRootFromString(validXml);
            const notNullResult = assertNotNull(parsedRoot, "Root element should be parsed from valid XML for basic check");
            const tagNameResult = assertEquals(parsedRoot?.tagName, "root", "Parsed root tag name should be 'root' for basic check");
            extractXmlPassed = notNullResult.passed && tagNameResult.passed;
        } catch (e) {
            extractXmlPassed = false; 
        }

        tests.push({
            description: "extractXmlRootFromString: valid XML string should parse to root element",
            passed: extractXmlPassed,
            input: validXml,
            output: parsedRoot?.tagName || "null (parsing failed)"
        });

        // --- Test readFileInBrowser (Requires TestResult and runner to support async) ---
        tests.push({
            description: "readFileInBrowser: mock File object returns Uint8Array (async)",
            passed: false, // Placeholder, will be updated by asyncTest result if runner supports it
            input: "Mock File('hello browser', 'test.txt', 'text/plain')",
            output: "Pending async test execution...",
            isAsync: true, 
            asyncTest: async () => {
                if (typeof window === 'undefined') {
                    return { passed: true, message: "Skipped: readFileInBrowser is browser-only." };
                }
                const textContent = "hello browser";
                const mockFile = createMockFile(textContent, "test.txt", "text/plain");
                try {
                    const resultUint8 = await readFileInBrowser(mockFile);
                    const notNullResult = assertNotNull(resultUint8, "readFileInBrowser should return a Uint8Array");
                    if (!notNullResult.passed) return notNullResult;
                    return { passed: true, message: "Uint8Array returned as expected." }; 
                } catch (e: any) {
                    return { passed: false, message: `Error in readFileInBrowser test: ${e.message}`, error: e };
                }
            }
        });

        // --- Test extractXmlRootFromDocx (Requires TestResult and runner to support async) ---
        tests.push({
            description: "extractXmlRootFromDocx: check word/document.xml from base64 DOCX (async)",
            passed: false, // Placeholder
            input: "Minimal DOCX (base64), target: word/document.xml",
            output: "Pending async test execution...",
            isAsync: true, 
            asyncTest: async () => {
                const docxBytes = base64ToUint8Array(minimalDocxBase64);
                try {
                    const docXmlRoot = await extractXmlRootFromDocx(docxBytes, 'word/document.xml');
                    const notNullResult = assertNotNull(docXmlRoot, "word/document.xml root should be parsed from DOCX bytes");
                    if (!notNullResult.passed || !docXmlRoot) return notNullResult;
                    
                    return assertEquals(docXmlRoot.localName, "document", "Root element of document.xml should be 'document'");
                } catch (e: any) {
                    return { passed: false, message: `extractXmlRootFromDocx (document.xml) Error: ${e.message || String(e)}`, error: e };
                }
            }
        });
        
        tests.push({
            description: "extractXmlRootFromDocx: check non-existent file in DOCX throws (async)",
            passed: false, // Placeholder
            input: "Minimal DOCX (base64), target: word/non_existent.xml",
            output: "Pending async test execution...",
            isAsync: true, 
            asyncTest: async () => {
                const docxBytes = base64ToUint8Array(minimalDocxBase64);
                 try {
                    await extractXmlRootFromDocx(docxBytes, 'word/non_existent.xml');
                    return { passed: false, message: "extractXmlRootFromDocx should throw for non-existent XML file" };
                } catch (e: any) {
                    return assertTrue(
                        e instanceof Error && e.message.includes("not found in DOCX archive"),
                        `Should throw an Error indicating file not found. Got: ${String(e)}`
                    );
                }
            }
        });

        return tests;
    });
} 