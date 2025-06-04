import { DocxProcessor } from '../../src/docx_parsers/DocxProcessor';
import { assertEquals } from '../test-utils';

// Integration test registration function
export function registerDocxProcessorIntegrationTest() {
  // This test is only meaningful in the browser with a file upload
  // We'll expose a function for the browser UI to call directly
  // (see below for window.runDocxProcessorIntegrationTest)
}

// Expose a function for the browser UI to call
// This function takes a File (from <input type="file">), runs the pipeline, and returns the schema
if (typeof window !== 'undefined') {
  (window as any).runDocxProcessorIntegrationTest = async function(file: File) {
    if (!file || !file.name.endsWith('.docx')) {
      throw new Error('Please upload a valid .docx file.');
    }
    const result = await DocxProcessor.processDocx(file);
    return result.documentSchema;
  };

  // New: Expose a function to compare DOCX output to a reference JSON
  (window as any).runDocxProcessorAndCompareToReference = async function(docxFile: File, referenceJsonFile: File) {
    if (!docxFile || !docxFile.name.endsWith('.docx')) {
      throw new Error('Please upload a valid .docx file.');
    }
    if (!referenceJsonFile || !referenceJsonFile.name.endsWith('.json')) {
      throw new Error('Please upload a valid reference .json file.');
    }
    // Run the processor
    const result = await DocxProcessor.processDocx(docxFile);
    const outputSchema = result.documentSchema;
    // Read the reference JSON file
    const referenceJsonText = await referenceJsonFile.text();
    let referenceSchema;
    try {
      referenceSchema = JSON.parse(referenceJsonText);
    } catch (e: any) {
      return {
        passed: false,
        message: 'Failed to parse reference JSON: ' + (e.message || String(e)),
        error: e,
      };
    }
    // Compare using assertEquals
    const comparison: any = assertEquals(outputSchema, referenceSchema, 'DocxProcessor output vs reference JSON');
    // If failed, include a diff (simple string diff for now)
    if (!comparison.passed) {
      comparison.diff = {
        output: outputSchema,
        reference: referenceSchema,
      };
    }
    return comparison;
  };

  // Expose a function to get all schemas for download (document, styles, numbering, merged)
  (window as any).runDocxProcessorAllSchemas = async function(file: File) {
    if (!file || !file.name.endsWith('.docx')) {
      throw new Error('Please upload a valid .docx file.');
    }
    const result = await DocxProcessor.processDocx(file);
    // Return all schemas for download
    return {
      documentSchema: result.documentSchema,
      stylesSchema: result.stylesSchema,
      numberingSchema: result.numberingSchema,
      mergedSchema: result.documentSchema // merged after style merger
    };
  };

  // Expose a function to get all pretty-printed XMLs for download (document.xml, styles.xml, numbering.xml)
  (window as any).runDocxProcessorAllXmls = async function(file: File) {
    if (!file || !file.name.endsWith('.docx')) {
      throw new Error('Please upload a valid .docx file.');
    }
    // Dynamically import extractAllXmlPartsFromDocx from utils
    const { extractAllXmlPartsFromDocx } = await import('../../src/docx_parsers/utils');
    // Use the prettyPrintXml logic from the HTML UI
    function prettyPrintXml(xmlString: string): string {
      const PADDING = '  ';
      let reg = /(>)(<)(\/*)/g;
      xmlString = xmlString.replace(reg, '$1\r\n$2$3');
      let pad = 0;
      let formatted = '';
      xmlString.split(/\r\n|\n|\r/).forEach(node => {
        let indent = 0;
        if (node.match(/.+<\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\w/) && !node.match(/.+<\/\w[^>]*>$/) && !node.match(/\/>$/)) {
          indent = 1;
        } else if (node.match(/^<\/\w/)) {
          if (pad !== 0) {
            pad -= 1;
          }
        } else if (node.match(/\/>$/)) {
          indent = 0;
        } else {
          indent = 1;
        }
        const padding = Array(pad + 1).join(PADDING);
        formatted += padding + node + '\n';
        pad += indent;
      });
      return formatted.trim();
    }
    // Read file as Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const docxBuffer = new Uint8Array(arrayBuffer);
    const xmls = await extractAllXmlPartsFromDocx(docxBuffer);
    return {
      documentXml: prettyPrintXml(xmls.documentXml),
      stylesXml: prettyPrintXml(xmls.stylesXml),
      numberingXml: prettyPrintXml(xmls.numberingXml)
    };
  };
} 