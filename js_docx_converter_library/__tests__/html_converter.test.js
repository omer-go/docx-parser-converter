/**
 * @file html_converter.test.js
 * @description Integration tests for convertDocxToHtml.
 */

import { convertDocxToHtml } from '../index.js';
import { sampleDocxBase64 } from './sample_docx_content.js';

// Helper function to convert Base64 to ArrayBuffer (Node.js specific)
function base64ToArrayBuffer(base64) {
  const buffer = Buffer.from(base64, 'base64');
  // Create an ArrayBuffer from the Buffer:
  // The .buffer property of a Buffer instance refers to the underlying ArrayBuffer.
  // However, it's important to get a slice if the Buffer is a view on a larger ArrayBuffer
  // to avoid holding onto more memory than necessary, though for Buffer.from it's usually fine.
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

describe('convertDocxToHtml Integration Tests', () => {
  let docxBuffer;

  beforeAll(() => {
    // Decode the Base64 sample DOCX content once for all tests in this suite
    docxBuffer = base64ToArrayBuffer(sampleDocxBase64);
  });

  test('should convert sample DOCX to basic HTML', async () => {
    const html = await convertDocxToHtml(docxBuffer);

    // Basic assertions
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);

    // Check for container div with margin styles (from document margins)
    expect(html).toMatch(/<div class="docx-container" style="padding-top: 72pt; padding-bottom: 72pt; padding-left: 72pt; padding-right: 72pt;">/);


    // Check for specific text content from the sample DOCX
    expect(html).toContain('This is a simple paragraph.');
    expect(html).toContain('This is bold');
    expect(html).toContain('and this is italic');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('This paragraph is centered.');

    // Check for presence of expected tags
    expect(html).toMatch(/<p[^>]*>/);       // Paragraph tag
    expect(html).toMatch(/<span[^>]*>/);    // Span tag (for runs)
    expect(html).toMatch(/<ul[^>]*>/);      // Unordered list
    expect(html).toMatch(/<li[^>]*>/);      // List item
    
    // Check for basic style applications
    // Bold text: <span style="font-weight: bold;">This is bold</span>
    expect(html).toMatch(/<span style="[^"]*font-weight: bold;[^"]*">This is bold<\/span>/);
    // Italic text: <span style="font-style: italic;">and this is italic</span>
    expect(html).toMatch(/<span style="[^"]*font-style: italic;[^"]*">and this is italic<\/span>/);
    
    // Centered paragraph: <p style="text-align: center;">This paragraph is centered.</p>
    expect(html).toMatch(/<p style="[^"]*text-align: center;[^"]*">This paragraph is centered.<\/p>/);

    // List item structure with custom marker
    // Example: <li style="list-style-type: none;"><span class="list-marker" style="display: inline-block; margin-right: 0.25em; ">• </span><p style="margin:0;padding:0; ">Item 1</p></li>
    expect(html).toMatch(/<li style="list-style-type: none;"><span class="list-marker"[^>]*>• <\/span><p style="margin:0; padding:0;[^"]*">Item 1<\/p><\/li>/);
    expect(html).toMatch(/<li style="list-style-type: none;"><span class="list-marker"[^>]*>• <\/span><p style="margin:0; padding:0;[^"]*">Item 2<\/p><\/li>/);

    // Snapshot testing for more comprehensive checks (optional, enable if desired)
    // expect(html).toMatchSnapshot();
  });

  test('should return empty string for null input buffer', async () => {
     try {
        await convertDocxToHtml(null);
     } catch (e) {
        expect(e.message).toBe('docxBuffer is required.');
     }
  });
});
