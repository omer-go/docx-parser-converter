/**
 * @file index.js
 * @description Main entry point for the DOCX to HTML and Text converter library.
 */

import { DocumentParser } from './src/parsers/document_parser.js';
import { StylesParser } from './src/parsers/styles_parser.js';
import { NumberingParser } from './src/parsers/numbering_parser.js';
import { StyleEnhancer } from './src/enhancers/style_enhancer.js';
import { HtmlConverter } from './src/converters/html_converter.js';
import { TextConverter } from './src/converters/text_converter.js';

/**
 * Converts a DOCX file buffer to an HTML string.
 *
 * @async
 * @param {ArrayBuffer} docxBuffer - The DOCX file content as an ArrayBuffer.
 * @returns {Promise<string>} A promise that resolves with the HTML string.
 * @throws {Error} If any step of the parsing or conversion process fails.
 */
async function convertDocxToHtml(docxBuffer) {
  if (!docxBuffer) throw new Error("docxBuffer is required.");

  try {
    const documentParser = new DocumentParser(docxBuffer);
    const stylesParser = new StylesParser(docxBuffer);
    const numberingParser = new NumberingParser(docxBuffer);

    // Concurrently load all necessary XML parts and parse their schemas
    const [initialDocumentSchema, stylesSchema, numberingDefinitions] = await Promise.all([
      documentParser.parse(), // Main document content
      stylesParser.getStylesSchema(),
      numberingParser.getNumberingDefinitions(),
    ]);

    const styleEnhancer = new StyleEnhancer(stylesSchema, numberingDefinitions);
    const enhancedDocument = styleEnhancer.enhanceDocument(initialDocumentSchema);

    const htmlConverter = new HtmlConverter(); // Add options if any
    return htmlConverter.convertToHtml(enhancedDocument);

  } catch (error) {
    console.error("Error during DOCX to HTML conversion:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

/**
 * Converts a DOCX file buffer to a plain text string.
 *
 * @async
 * @param {ArrayBuffer} docxBuffer - The DOCX file content as an ArrayBuffer.
 * @param {object} [textOptions={}] - Optional configuration for the TextConverter.
 * @returns {Promise<string>} A promise that resolves with the plain text string.
 * @throws {Error} If any step of the parsing or conversion process fails.
 */
async function convertDocxToText(docxBuffer, textOptions = {}) {
  if (!docxBuffer) throw new Error("docxBuffer is required.");

  try {
    const documentParser = new DocumentParser(docxBuffer);
    const stylesParser = new StylesParser(docxBuffer);
    const numberingParser = new NumberingParser(docxBuffer);

    // Concurrently load all necessary XML parts and parse their schemas
    const [initialDocumentSchema, stylesSchema, numberingDefinitions] = await Promise.all([
      documentParser.parse(), // Main document content
      stylesParser.getStylesSchema(),
      numberingParser.getNumberingDefinitions(),
    ]);

    const styleEnhancer = new StyleEnhancer(stylesSchema, numberingDefinitions);
    const enhancedDocument = styleEnhancer.enhanceDocument(initialDocumentSchema);

    const textConverter = new TextConverter(textOptions);
    return textConverter.convertToText(enhancedDocument);

  } catch (error) {
    console.error("Error during DOCX to Text conversion:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

export { convertDocxToHtml, convertDocxToText };
