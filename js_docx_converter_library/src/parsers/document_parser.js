import { extractXmlRootFromDocx, getElement, getAttribute } from './xml_utils.js';
import { DocumentSchema, DocMarginsSchema } from './models/document_models.js';
import { ParagraphParser } from './paragraph_parser.js';
import { TableParser } from './table_parser.js'; // Import TableParser

/**
 * Parses the main document structure from a DOCX file.
 */
export class DocumentParser {
  /**
   * @param {ArrayBuffer} docxBuffer - The DOCX file buffer.
   */
  constructor(docxBuffer) {
    this.docxBuffer = docxBuffer;
    this.documentXmlRoot = null; // To be populated by _loadDocumentXml
    this.paragraphParser = new ParagraphParser();
    this.tableParser = new TableParser(this.paragraphParser); // Instantiate TableParser
  }

  /**
   * Loads the main document.xml part from the DOCX file.
   * This is an internal helper method.
   * @private
   */
  async _loadDocumentXml() {
    if (!this.documentXmlRoot) {
      this.documentXmlRoot = await extractXmlRootFromDocx(this.docxBuffer, 'word/document.xml');
    }
  }

  /**
   * Parses the entire document content.
   * This method is now the primary way to get the parsed document.
   * @returns {Promise<object>} A promise that resolves with the parsed document object, validated by DocumentSchema.
   * @throws {Error} If parsing fails or the document structure is invalid.
   */
  async parse() {
    await this._loadDocumentXml();

    if (!this.documentXmlRoot) {
      throw new Error('Document XML root could not be loaded.');
    }

    const margins = this.extractMargins();
    const elements = this.extractElements(); // Placeholder for now

    const documentData = {
      margins: margins,
      elements: elements,
    };

    // Validate the parsed data against the Zod schema
    try {
      return DocumentSchema.parse(documentData);
    } catch (error) {
      console.error('Document schema validation failed:', error.errors);
      throw new Error('Invalid document structure after parsing.');
    }
  }

  /**
   * Extracts document margins.
   * Assumes this.documentXmlRoot is already loaded.
   * @returns {object} An object representing document margins, validated by DocMarginsSchema.
   * @throws {Error} If margin information cannot be found or parsed.
   */
  extractMargins() {
    if (!this.documentXmlRoot) {
      throw new Error('Document XML root not loaded. Call parse() or _loadDocumentXml() first.');
    }

    // Find the <w:sectPr> element, which contains page margin information.
    // The <w:body> element is the direct child of <w:document>.
    const bodyElement = getElement(this.documentXmlRoot, 'w:body');
    if (!bodyElement) {
      throw new Error('Could not find <w:body> element in document.xml.');
    }

    const sectPrElement = getElement(bodyElement, 'w:sectPr');
    if (!sectPrElement) {
      // It's possible for sectPr to be a child of the last paragraph for section breaks.
      // This simplified version expects it under w:body.
      // Consider a default or throw if critical. For now, let's assume default if not found.
      console.warn('<w:sectPr> not found directly under <w:body>. Using default margins.');
      return DocMarginsSchema.parse({ top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0, gutter: 0 });
    }

    const pgMarElement = getElement(sectPrElement, 'w:pgMar');
    if (!pgMarElement) {
      console.warn('<w:pgMar> not found within <w:sectPr>. Using default margins.');
      return DocMarginsSchema.parse({ top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0, gutter: 0 });
    }

    // Extract margin attributes. Values are in twentieths of a point (twips).
    // Default to 0 if an attribute is missing.
    const marginsData = {
      top: parseInt(getAttribute(pgMarElement, 'w:top') || '0', 10),
      bottom: parseInt(getAttribute(pgMarElement, 'w:bottom') || '0', 10),
      left: parseInt(getAttribute(pgMarElement, 'w:left') || '0', 10),
      right: parseInt(getAttribute(pgMarElement, 'w:right') || '0', 10),
      header: parseInt(getAttribute(pgMarElement, 'w:header') || '0', 10),
      footer: parseInt(getAttribute(pgMarElement, 'w:footer') || '0', 10),
      gutter: parseInt(getAttribute(pgMarElement, 'w:gutter') || '0', 10),
    };

    try {
      return DocMarginsSchema.parse(marginsData);
    } catch (error) {
      console.error('Margins schema validation failed:', error.errors);
      throw new Error('Invalid margin data extracted.');
    }
  }

  /**
   * Extracts elements (paragraphs, tables, etc.) from the document.
   * Assumes this.documentXmlRoot is already loaded.
   * @returns {Array<object>} An array of parsed element objects (paragraphs, tables, etc.).
   */
  extractElements() {
    if (!this.documentXmlRoot) {
      console.warn('extractElements called before documentXmlRoot was loaded.');
      return [];
    }

    const bodyElement = getElement(this.documentXmlRoot, 'w:body');
    if (!bodyElement) {
      console.warn('<w:body> element not found in document.xml. Cannot extract elements.');
      return [];
    }

    const elements = [];
    if (bodyElement.childNodes && bodyElement.childNodes.length > 0) {
      for (let i = 0; i < bodyElement.childNodes.length; i++) {
        const childNode = bodyElement.childNodes[i];

        if (childNode.nodeType === 1) { // Check if it's an ELEMENT_NODE
          switch (childNode.nodeName) {
            case 'w:p':
              try {
                const paragraph = this.paragraphParser.parse(childNode);
                elements.push(paragraph);
              } catch (e) {
                console.error("Error parsing a paragraph:", childNode, e);
                // Optionally, add a placeholder or skip
              }
              break;
            case 'w:tbl':
              try {
                const table = this.tableParser.parse(childNode);
                elements.push(table);
              } catch (e) {
                console.error("Error parsing a table:", childNode, e);
                // Optionally, add a placeholder or skip
              }
              break;
            // Add cases for other element types as needed (e.g., w:sectPr if not handled globally)
            default:
              // Ignore other elements for now
              // console.log(`Ignoring element: ${childNode.nodeName}`);
              break;
          }
        }
      }
    }
    return elements;
  }

  /**
   * Returns the Zod schema for the document. (Mainly for internal type reference)
   * @returns {z.ZodObject} The DocumentSchema.
   */
  static getDocumentSchemaObject() { // Renamed to avoid confusion, static as it doesn't depend on instance state
    return DocumentSchema;
  }
}

// Example Usage (for testing purposes, not part of the library's main export)
// async function testParser() {
//   // This requires a way to get a DOCX file as an ArrayBuffer in Node.js or browser
//   // For example, in Node.js:
//   // import fs from 'fs/promises';
//   // const filePath = 'path/to/your/document.docx';
//   // const fileBuffer = await fs.readFile(filePath);
//   // const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

//   // In a browser, you might get it from an <input type="file">
//   // const fileInputElement = document.getElementById('docxFile');
//   // const file = fileInputElement.files[0];
//   // const arrayBuffer = await file.arrayBuffer();

//   // Placeholder ArrayBuffer for now
//   const placeholderDocxBuffer = new ArrayBuffer(0); // Replace with actual DOCX data for real testing

//   if (placeholderDocxBuffer.byteLength === 0) {
//     console.warn("Using a placeholder ArrayBuffer. Real DOCX data is needed for full testing.");
//     // Mocking documentXmlRoot for basic structure testing if no buffer
//     const parser = new DocumentParser(placeholderDocxBuffer);
//     parser.documentXmlRoot = { // Mocked XML structure
//       documentElement: {
//         getElementsByTagName: (tagName) => {
//           if (tagName === 'w:body') {
//             return [{
//               getElementsByTagName: (childTagName) => {
//                 if (childTagName === 'w:sectPr') {
//                   return [{
//                     getElementsByTagName: (grandChildTagName) => {
//                       if (grandChildTagName === 'w:pgMar') {
//                         return [{
//                           getAttribute: (attr) => {
//                             const attrs = { 'w:top': '1440', 'w:bottom': '1440', 'w:left': '1080', 'w:right': '1080', 'w:header': '720', 'w:footer': '720', 'w:gutter': '0' };
//                             return attrs[attr] || null;
//                           }
//                         }];
//                       }
//                       return [];
//                     }
//                   }];
//                 }
//                 return [];
//               }
//             }];
//           }
//           return [];
//         }
//       }
//     }.documentElement; // Simulate the structure extractXmlRootFromDocx would return

//     try {
//       const parsedDoc = await parser.parse();
//       console.log("Parsed Document (with mocked XML):", parsedDoc);
//     } catch (e) {
//       console.error("Error during mocked parsing:", e);
//     }
//     return;
//   }

//   // const parser = new DocumentParser(arrayBuffer);
//   // try {
//   //   const documentObject = await parser.parse();
//   //   console.log('Parsed Document:', documentObject);
//   // } catch (error) {
//   //   console.error('Error parsing document:', error);
//   // }
// }

// testParser(); // Uncomment to run test if you have a way to load a DOCX file
