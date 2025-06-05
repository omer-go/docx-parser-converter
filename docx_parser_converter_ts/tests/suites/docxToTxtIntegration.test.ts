// tests/suites/docxToTxtIntegration.test.ts
import { DocxToTxtConverter, type DocxToTxtOptions } from '../../src/main'; // Import from main.ts
import { readFileInBrowser } from '../../src/docx_parsers/utils'; // Assuming this utility is still needed and browser-safe

// Registration function for CLI/test-runner integration (no-op for now)
export function registerDocxToTxtIntegrationTest() {
    // This test is only meaningful in the browser with a file upload
    // We'll expose a function for the browser UI to call directly
}

// Expose a function for the browser UI to call
// This function takes a File (from <input type="file">), runs the pipeline, and returns the TXT string
if (typeof window !== 'undefined') {
    (window as any).runDocxToTxtIntegrationTest = async function(file: File): Promise<string> {
        if (!file || !file.name.endsWith('.docx')) {
            throw new Error('Please upload a valid .docx file.');
        }
        // Read file as Uint8Array
        const uint8 = await readFileInBrowser(file);

        // Convert DOCX to TXT - UPDATED WAY
        // Define options if needed, e.g., for useDefaultValues
        const options: DocxToTxtOptions = { useDefaultValues: true }; // Or just pass {} or undefined if defaults are fine
        const converter = await DocxToTxtConverter.create(uint8, options);

        // Convert to text with indentation
        const txt = converter.convertToTxt({ indent: true });
        return txt;
    };
}