import { RunParser } from './run_parser.js';
import { ParagraphSchema } from './models/paragraph_models.js';
import { ParagraphPropertiesParser } from './paragraph_properties_parser.js';
import { defaultParagraphProperties } from './models/properties_models.js';
import { getElement } from './xml_utils.js';

/**
 * Parses a <w:p> (paragraph) XML node into a Paragraph object.
 */
export class ParagraphParser {
  constructor() {
    this.runParser = new RunParser();
    this.paragraphPropertiesParser = new ParagraphPropertiesParser();
  }

  /**
   * Parses a WordprocessingML <w:p> element into a structured paragraph object.
   *
   * @param {Element} pNode - The <w:p> XML element.
   * @returns {object} An object conforming to the ParagraphSchema.
   * @throws {Error} If the input is not a valid <w:p> element or validation fails.
   */
  parse(pNode) {
    if (!pNode || pNode.nodeName !== 'w:p') {
      // console.warn('ParagraphParser.parse called with an invalid node:', pNode);
      // As with RunParser, assuming valid nodes are passed from DocumentParser.
    }

    const runs = [];
    // Iterate over child nodes of the paragraph <w:p> element.
    // We are interested in <w:r> (run) elements.
    if (pNode && pNode.childNodes && pNode.childNodes.length > 0) {
        for (let i = 0; i < pNode.childNodes.length; i++) {
            const childNode = pNode.childNodes[i];
            // Check if the node is an Element node and if its name is 'w:r'
            if (childNode.nodeType === 1 && childNode.nodeName === 'w:r') { // nodeType 1 is ELEMENT_NODE
                try {
                    const parsedRun = this.runParser.parse(childNode);
                    runs.push(parsedRun);
                } catch (e) {
                    console.error("Error parsing a run within paragraph:", childNode, e);
                    // Decide how to handle run parsing errors: skip, add placeholder, or re-throw
                }
            }
            // Other child elements of <w:p> like <w:pPr> (paragraph properties)
            // will be handled in a future task for property parsing.
        }
    }


    const pPrNode = getElement(pNode, 'w:pPr');
    const paragraphProperties = pPrNode
      ? this.paragraphPropertiesParser.parse(pPrNode)
      : { ...defaultParagraphProperties }; // Use default if no <w:pPr>

    const paragraphData = {
      runs: runs,
      properties: paragraphProperties,
      type: 'paragraph', // Explicitly set type
    };

    try {
      return ParagraphSchema.parse(paragraphData);
    } catch (error) {
      console.error('Paragraph schema validation failed for pNode:', pNode, error.errors);
      throw new Error('Invalid paragraph data after parsing.');
    }
  }
}

// Example Usage (Illustrative)
// This would typically be used by DocumentParser
//
// import { DOMParser } from 'xmldom-qsa'; // Assuming xmldom-qsa is available
//
// const parser = new DOMParser();
// const xmlString = `
//   <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//     <w:pPr>
//       <w:jc w:val="center"/>
//     </w:pPr>
//     <w:r>
//       <w:t>This is a </w:t>
//     </w:r>
//     <w:r>
//       <w:rPr><w:b/></w:rPr>
//       <w:t>bold</w:t>
//     </w:r>
//     <w:r>
//       <w:t> paragraph.</w:t>
//     </w:r>
//   </w:p>
// `;
// const doc = parser.parseFromString(xmlString, "application/xml");
// const pNode = doc.documentElement;
//
// const paragraphParser = new ParagraphParser();
// try {
//   const parsedParagraph = paragraphParser.parse(pNode);
//   console.log("Parsed Paragraph:", parsedParagraph);
//   // Expected (simplified):
//   // {
//   //   runs: [
//   //     { text: "This is a ", properties: {} },
//   //     { text: "bold", properties: {} }, // Properties for bold not yet parsed
//   //     { text: " paragraph.", properties: {} }
//   //   ],
//   //   properties: {}, // Paragraph properties not yet parsed
//   //   type: 'paragraph'
//   // }
// } catch (e) {
//   console.error("Error parsing paragraph:", e);
// }
