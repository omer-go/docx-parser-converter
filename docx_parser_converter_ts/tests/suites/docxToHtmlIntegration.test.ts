import { DocxToHtmlConverter } from '../../src/docx_to_html/DocxToHtmlConverter';
import { readFileInBrowser } from '../../src/docx_parsers/utils';

// Registration function for CLI/test-runner integration (no-op for now)
export function registerDocxToHtmlIntegrationTest() {
    // This test is only meaningful in the browser with a file upload
    // We'll expose a function for the browser UI to call directly
}

// Expose a function for the browser UI to call
// This function takes a File (from <input type="file">), runs the pipeline, and returns the HTML string
if (typeof window !== 'undefined') {
    (window as any).runDocxToHtmlIntegrationTest = async function(file: File): Promise<string> {
        if (!file || !file.name.endsWith('.docx')) {
            throw new Error('Please upload a valid .docx file.');
        }
        // Read file as Uint8Array
        const uint8 = await readFileInBrowser(file);
        // Convert DOCX to HTML
        const converter = await DocxToHtmlConverter.create(uint8, { useDefaultValues: true });
        const html = converter.convertToHtml();
        return html;
    };
} 