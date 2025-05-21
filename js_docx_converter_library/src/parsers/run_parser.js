import { getElement } from './xml_utils.js';
import { RunSchema } from './models/paragraph_models.js';
import { RunPropertiesParser } from './run_properties_parser.js';
import { defaultRunProperties } from './models/properties_models.js';

/**
 * Parses a <w:r> (run) XML node into a Run object.
 */
export class RunParser {
  constructor() {
    this.runPropertiesParser = new RunPropertiesParser();
  }
  /**
   * Parses the properties and text content of a WordprocessingML <w:r> element.
   *
   * @param {Element} runNode - The <w:r> XML element.
   * @returns {object} An object conforming to the RunSchema,
   *                   representing the text run.
   * @throws {Error} If the input is not a valid <w:r> element or validation fails.
   */
  parse(runNode) {
    if (!runNode || runNode.nodeName !== 'w:r') {
      // This basic check can be expanded if needed.
      // console.warn('RunParser.parse called with an invalid node:', runNode);
      // Depending on strictness, might throw an error or return a default/empty run.
      // For now, let's assume valid nodes are passed from ParagraphParser.
    }

    let textContent = '';
    const textElements = runNode.getElementsByTagName('w:t'); // <w:t> elements

    for (let i = 0; i < textElements.length; i++) {
      // According to OOXML spec, <w:t> contains the text.
      // The child nodes of <w:t> should be text nodes.
      // textContent property of element node itself is standard way to get text
      if (textElements[i].textContent) {
        textContent += textElements[i].textContent;
      }
    }
    
    const rPrNode = getElement(runNode, 'w:rPr');
    const runProperties = rPrNode
      ? this.runPropertiesParser.parse(rPrNode)
      : { ...defaultRunProperties }; // Use default if no <w:rPr>

    const runData = {
      text: textContent,
      properties: runProperties,
    };

    try {
      return RunSchema.parse(runData);
    } catch (error) {
      console.error('Run schema validation failed for run node:', runNode, error.errors);
      throw new Error('Invalid run data after parsing.');
    }
  }
}

// Example Usage (Illustrative)
// This would typically be used by ParagraphParser
//
// const parser = new DOMParser();
// const xmlString = `
//   <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//     <w:rPr>
//       <w:b/>
//     </w:rPr>
//     <w:t>Hello</w:t>
//     <w:t xml:space="preserve"> World</w:t>
//   </w:r>
// `;
// const doc = parser.parseFromString(xmlString, "application/xml");
// const runNode = doc.documentElement;
//
// const runParser = new RunParser();
// try {
//   const parsedRun = runParser.parse(runNode);
//   console.log("Parsed Run:", parsedRun);
//   // Expected: { text: "Hello World", properties: {} }
// } catch (e) {
//   console.error("Error parsing run:", e);
// }
