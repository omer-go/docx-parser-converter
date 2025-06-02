// tests/suites/utils.test.ts
import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import {
    assertEquals,
    assertNotNull,
    assertTrue 
} from '../test-utils';

import {
    extractXmlRootFromString,
    readFileInBrowser,
    convertTwipsToPoints,
    convertHalfPointsToPoints,
    mergeProperties,
    extractXmlRootFromDocx,
    // readBinaryFromFilePath
} from '../../src/docx_parsers/utils';

// Minimal valid DOCX base64 string (contains "Hello World!") - REMOVED
// const minimalDocxBase64 = '...';

// REMOVED as no longer needed by tests in this file
// async function base64ToUint8Array(base64: string): Promise<Uint8Array> { ... }

function createMockFile(content: Uint8Array | string, name: string, type: string): File {
    const blobContent = typeof content === 'string' ? [new TextEncoder().encode(content)] : [content];
    return new File(blobContent, name, { type });
}

export function registerUtilsTests() {
    describe("Utils Script Tests", () => {
        const tests: TestResult[] = [];

        // --- Test extractXmlRootFromString ---
        const validXmlInput = '<root><child attr="val">text</child></root>';
        let parsedRoot: Element | null = null;
        let extractXmlStrPassed = false;
        let extractXmlStrOutput: any = "null (parsing failed)";
        try {
            parsedRoot = extractXmlRootFromString(validXmlInput);
            extractXmlStrOutput = parsedRoot; // Store the actual output (Element object)
            const notNullResult = assertNotNull(parsedRoot, "Root element should be parsed from valid XML", validXmlInput);
            const tagNameResult = assertEquals(parsedRoot?.tagName, "root", "Parsed root tag name should be 'root'", validXmlInput);
            extractXmlStrPassed = notNullResult.passed && tagNameResult.passed;
        } catch (e: any) {
            extractXmlStrPassed = false; 
            extractXmlStrOutput = e.message || String(e);
        }
        tests.push({
            description: "extractXmlRootFromString: valid XML string should parse to root element",
            passed: extractXmlStrPassed,
            input: validXmlInput,
            output: extractXmlStrOutput instanceof Element ? extractXmlStrOutput.outerHTML : extractXmlStrOutput
        });

        // --- Test readFileInBrowser ---
        const readFileInBrowserInput = "Mock File('hello browser', 'test.txt', 'text/plain')";
        tests.push({
            description: "readFileInBrowser: mock File object returns Uint8Array (async)",
            passed: false, 
            input: readFileInBrowserInput,
            output: "Pending async test execution...", // Initial placeholder
            isAsync: true, 
            asyncTest: async (): Promise<Partial<TestResult>> => {
                if (typeof window === 'undefined') {
                    return { passed: true, message: "Skipped: readFileInBrowser is browser-only.", output: "Skipped" };
                }
                const textContent = "hello browser";
                const mockFile = createMockFile(textContent, "test.txt", "text/plain");
                try {
                    const resultUint8 = await readFileInBrowser(mockFile);
                    const notNullCheck = assertNotNull(resultUint8, "readFileInBrowser should return a Uint8Array", mockFile.name);
                    if (!notNullCheck.passed) return { ...notNullCheck, input: readFileInBrowserInput };
                    
                    const decodedText = new TextDecoder().decode(resultUint8);
                    const contentCheck = assertEquals(decodedText, textContent, "Decoded content should match original text", textContent);
                    return { ...contentCheck, input: readFileInBrowserInput, output: resultUint8 };
                } catch (e: any) {
                    return { passed: false, message: `Error in readFileInBrowser test: ${e.message}`, error: e, input: readFileInBrowserInput, output: e.message };
                }
            }
        });

        // --- Test convertTwipsToPoints ---
        const twipsInput1 = 240;
        tests.push(assertEquals(convertTwipsToPoints(twipsInput1), 12, "convertTwipsToPoints: 240 twips should be 12 points", twipsInput1));
        const twipsInput2 = 0;
        tests.push(assertEquals(convertTwipsToPoints(twipsInput2), 0, "convertTwipsToPoints: 0 twips should be 0 points", twipsInput2));
        const twipsInput3 = -100;
        tests.push(assertEquals(convertTwipsToPoints(twipsInput3), -5, "convertTwipsToPoints: -100 twips should be -5 points", twipsInput3));

        // --- Test convertHalfPointsToPoints ---
        const halfPointsInput1 = 24;
        tests.push(assertEquals(convertHalfPointsToPoints(halfPointsInput1), 12, "convertHalfPointsToPoints: 24 half-points should be 12 points", halfPointsInput1));
        const halfPointsInput2 = 0;
        tests.push(assertEquals(convertHalfPointsToPoints(halfPointsInput2), 0, "convertHalfPointsToPoints: 0 half-points should be 0 points", halfPointsInput2));
        const halfPointsInput3 = 3;
        tests.push(assertEquals(convertHalfPointsToPoints(halfPointsInput3), 1.5, "convertHalfPointsToPoints: 3 half-points should be 1.5 points", halfPointsInput3));

        // --- Test mergeProperties ---
        const mergeBase1 = { a: 1, b: 2 };
        const mergeDerived1 = { b: 3, c: 4 };
        const mergeExpected1 = { a: 1, b: 3, c: 4 };
        tests.push(assertEquals(mergeProperties(mergeBase1, mergeDerived1), mergeExpected1, "mergeProperties: basic merge", {base: mergeBase1, derived: mergeDerived1}));

        const mergeBase2 = { a: 1, nested: { x: 10, y: 20 }, arr: [1,2] };
        const mergeDerived2 = { nested: { y: 25, z: 30 }, arr: [3,4] };
        const mergeExpected2 = { a: 1, nested: { x: 10, y: 25, z: 30 }, arr: [3,4] };
        tests.push(assertEquals(mergeProperties(mergeBase2, mergeDerived2), mergeExpected2, "mergeProperties: nested objects and array overwrite", {base: mergeBase2, derived: mergeDerived2}));

        tests.push(assertEquals(mergeProperties(mergeBase1, null), mergeBase1, "mergeProperties: derived is null", {base: mergeBase1, derived: null}));
        tests.push(assertEquals(mergeProperties(null, mergeDerived1), mergeDerived1, "mergeProperties: base is null", {base: null, derived: mergeDerived1}));
        tests.push(assertEquals(mergeProperties(undefined, mergeDerived1), mergeDerived1, "mergeProperties: base is undefined", {base: undefined, derived: mergeDerived1}));
        
        const mergeEmptyBase = {};
        tests.push(assertEquals(mergeProperties(mergeEmptyBase, mergeDerived1), mergeDerived1, "mergeProperties: base is empty object", {base: mergeEmptyBase, derived: mergeDerived1}));
        const mergeEmptyDerived = {};
        tests.push(assertEquals(mergeProperties(mergeBase1, mergeEmptyDerived), mergeBase1, "mergeProperties: derived is empty object", {base: mergeBase1, derived: mergeEmptyDerived}));

        // --- Test extractXmlRootFromDocx (using a real DOCX file) ---
        const docxFixturePath = '../fixtures/minimal_for_test.docx'; 
        const extractDocxInput1 = { path: docxFixturePath, target: 'document.xml' };
        tests.push({
            description: `extractXmlRootFromDocx: check word/document.xml from fixture (async)`,
            passed: false, 
            input: `DOCX Fixture (content not shown), target: ${extractDocxInput1.target}`,
            output: "Pending async test execution...",
            isAsync: true,
            asyncTest: async (): Promise<Partial<TestResult>> => {
                if (typeof window === 'undefined') {
                    return { passed: true, message: "Skipped: extractXmlRootFromDocx test with fetch is browser-specific.", output:"Skipped" };
                }
                try {
                    const response = await fetch(docxFixturePath);
                    if (!response.ok) {
                        return { passed: false, message: `Failed to fetch DOCX fixture '${docxFixturePath}': ${response.status} ${response.statusText}. Ensure file exists.`, output: `Fetch failed: ${response.status}` };
                    }
                    const docxArrayBuffer = await response.arrayBuffer();
                    const docxBytes = new Uint8Array(docxArrayBuffer);
                    
                    const docXmlRoot = await extractXmlRootFromDocx(docxBytes, extractDocxInput1.target);
                    const notNullCheck = assertNotNull(docXmlRoot, "word/document.xml root should be parsed", `File: ${extractDocxInput1.target}`);
                    if (!notNullCheck.passed || !docXmlRoot) return { ...notNullCheck, output: notNullCheck.output };
                    
                    const tagCheck = assertTrue(
                        docXmlRoot.localName === "document" || docXmlRoot.nodeName === "w:document", 
                        `Root element tag name check. Got: '${docXmlRoot.localName || docXmlRoot.nodeName}'`,
                        `File: ${extractDocxInput1.target}`,
                        docXmlRoot.localName || docXmlRoot.nodeName
                    );
                    return { ...tagCheck, output: docXmlRoot.outerHTML }; // Show serialized XML as output
                } catch (e: any) {
                    return { passed: false, message: `extractXmlRootFromDocx (document.xml) Error: ${e.message || String(e)}`, error: e, output: e.message };
                }
            }
        });

        const extractDocxInput2 = { path: docxFixturePath, target: 'non_existent.xml' };
        tests.push({
            description: `extractXmlRootFromDocx: check non-existent file in fixture throws (async)`,
            passed: false,
            input: `DOCX Fixture (content not shown), target: ${extractDocxInput2.target}`,
            output: "Pending async test execution...",
            isAsync: true,
            asyncTest: async (): Promise<Partial<TestResult>> => {
                if (typeof window === 'undefined') {
                    return { passed: true, message: "Skipped: extractXmlRootFromDocx test with fetch is browser-specific.", output: "Skipped" };
                }
                try {
                    const response = await fetch(docxFixturePath);
                    if (!response.ok) {
                        return { passed: false, message: `Failed to fetch DOCX fixture '${docxFixturePath}': ${response.status} ${response.statusText}.`, output: `Fetch failed: ${response.status}` };
                    }
                    const docxArrayBuffer = await response.arrayBuffer();
                    const docxBytes = new Uint8Array(docxArrayBuffer);

                    await extractXmlRootFromDocx(docxBytes, extractDocxInput2.target);
                    // If it reaches here, the expected error was not thrown.
                    return { passed: false, message: "extractXmlRootFromDocx should throw for non-existent XML file but didn't.", output: "No error thrown" };
                } catch (e: any) {
                    const errorCheck = assertTrue(
                        e instanceof Error && e.message.includes("not found in DOCX archive"),
                        `Should throw an Error indicating file not found. Got: ${String(e)}`,
                        `File: ${extractDocxInput2.target}`,
                        e.message // Show the actual error message as output
                    );
                    return { ...errorCheck }; 
                }
            }
        });

        // --- Test readBinaryFromFilePath (Node.js specific) ---
        tests.push({
            description: "readBinaryFromFilePath: (Node.js specific test - SKIPPED in browser)",
            passed: typeof window !== 'undefined', // Will be true (passed/skipped) in browser, false (pending) in Node if run there
            input: "N/A (Node.js specific)",
            output: typeof window !== 'undefined' ? "Skipped: Test is for Node.js environment" : "Pending Node.js execution",
            isAsync: false, // This definition is sync, the actual test logic for Node would be elsewhere or more complex
            // For a real Node.js test, you'd do: 
            // asyncTest: async () => { /* Node.js fs operations */ } and set isAsync: true
            // but that requires a Node test runner setup.
        });

        return tests;
    });
} 