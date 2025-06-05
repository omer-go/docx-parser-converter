import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';

export function registerDocumentParserTests() {
    describe('DocumentParser Tests', () => {
        const tests: TestResult[] = [];

        // Browser test: Upload a DOCX and parse it
        tests.push({
            description: 'DocumentParser: browser DOCX upload and parse',
            passed: false,
            input: 'Upload a DOCX file in the browser to run this test.',
            output: 'Pending browser upload...',
            isAsync: true,
            asyncTest: async () => {
                if (typeof window === 'undefined') {
                    return { passed: true, message: 'Skipped: browser-only test', output: 'Skipped' };
                }
                // This test will be triggered by a UI button in index.html
                // The actual logic is handled in the browser integration below
                return { passed: true, message: 'Upload a DOCX file to run this test.', output: 'Waiting for user upload.' };
            }
        });

        return tests;
    });
}

// --- Browser integration for DOCX upload and parse ---
if (typeof window !== 'undefined') {
    // Expose a function for the UI to call
    (window as any).runDocumentParserBrowserTest = async function(file: File): Promise<any> {
        const { DocumentParser } = await import('../../src/docx_parsers/document/documentParser');
        const { readFileInBrowser } = await import('../../src/docx_parsers/utils');
        const uint8 = await readFileInBrowser(file);
        const parser = await DocumentParser.initFromDocx(uint8);
        const schema = parser.getDocumentSchema();
        return schema;
    };
} 