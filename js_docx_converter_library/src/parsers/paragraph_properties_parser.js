import {
  ParagraphPropertiesSchema,
  defaultParagraphProperties,
  // Import specific sub-schemas if direct construction is needed
} from './models/properties_models.js';
import { getElement, getAttribute, getOnOffElement, getChildAttribute } from './xml_utils.js';
import { RunPropertiesParser } from './run_properties_parser.js'; // For pPr/rPr

/**
 * Parses a <w:pPr> (paragraph properties) XML node into a ParagraphProperties object.
 */
export class ParagraphPropertiesParser {
  constructor() {
    this.runPropertiesParser = new RunPropertiesParser(); // For parsing <w:rPr> within <w:pPr>
  }

  /**
   * Parses the <w:pPr> XML element.
   *
   * @param {Element | null} pPrNode - The <w:pPr> XML element.
   * @returns {object} An object conforming to ParagraphPropertiesSchema.
   *                   Returns default paragraph properties if pPrNode is null or empty.
   */
  parse(pPrNode) {
    if (!pPrNode || pPrNode.childNodes.length === 0) {
      return { ...defaultParagraphProperties }; // Return a copy of default properties
    }

    const props = {};

    // Justification/Alignment <w:jc w:val="..."/>
    const jcVal = getChildAttribute(pPrNode, 'w:jc', 'w:val');
    if (jcVal) props.jc = jcVal;

    // Indentation <w:ind .../>
    const indNode = getElement(pPrNode, 'w:ind');
    if (indNode) {
      props.ind = {};
      const left = getAttribute(indNode, 'w:left') || getAttribute(indNode, 'w:start');
      const right = getAttribute(indNode, 'w:right') || getAttribute(indNode, 'w:end');
      const firstLine = getAttribute(indNode, 'w:firstLine');
      const hanging = getAttribute(indNode, 'w:hanging');

      if (left) props.ind.left = { val: parseInt(left, 10) };
      if (right) props.ind.right = { val: parseInt(right, 10) };
      if (firstLine) props.ind.firstLine = { val: parseInt(firstLine, 10) };
      if (hanging) props.ind.hanging = { val: parseInt(hanging, 10) };
    }

    // Spacing <w:spacing .../>
    const spacingNode = getElement(pPrNode, 'w:spacing');
    if (spacingNode) {
      props.spacing = {};
      const before = getAttribute(spacingNode, 'w:before');
      const after = getAttribute(spacingNode, 'w:after');
      const line = getAttribute(spacingNode, 'w:line');
      const lineRule = getAttribute(spacingNode, 'w:lineRule');

      if (before) props.spacing.before = { val: parseInt(before, 10) };
      if (after) props.spacing.after = { val: parseInt(after, 10) };
      if (line) props.spacing.line = { val: parseInt(line, 10) };
      if (lineRule) props.spacing.lineRule = lineRule;
    }

    // Numbering Reference <w:numPr>
    const numPrNode = getElement(pPrNode, 'w:numPr');
    if (numPrNode) {
      props.numPr = {};
      const numIdNode = getElement(numPrNode, 'w:numId');
      const ilvlNode = getElement(numPrNode, 'w:ilvl');
      if (numIdNode) {
        const numIdVal = getAttribute(numIdNode, 'w:val');
        if (numIdVal) props.numPr.numId = numIdVal;
      }
      if (ilvlNode) {
        const ilvlVal = getAttribute(ilvlNode, 'w:val');
        if (ilvlVal) props.numPr.ilvl = ilvlVal;
      }
    }

    // Paragraph Borders <w:pBdr> - Placeholder, just pass the node if exists
    const pBdrNode = getElement(pPrNode, 'w:pBdr');
    if (pBdrNode) {
      // For now, we're not parsing specific borders.
      // If ParagraphBordersSchema becomes more detailed, this needs expansion.
      props.pBdr = {}; // Indicates presence, could be detailed later
    }

    // Shading <w:shd w:fill="..." w:color="..." w:val="..."/>
    const shdNode = getElement(pPrNode, 'w:shd');
    if (shdNode) {
      props.shd = {
        fill: getAttribute(shdNode, 'w:fill'),
        color: getAttribute(shdNode, 'w:color'),
        val: getAttribute(shdNode, 'w:val'),
      };
    }

    // Default Run Properties for the paragraph <w:pPr><w:rPr>...</w:rPr></w:pPr>
    const pRprNode = getElement(pPrNode, 'w:rPr');
    if (pRprNode) {
      props.rPr = this.runPropertiesParser.parse(pRprNode);
    }

    // Paragraph Style <w:pStyle w:val="..."/>
    const pStyleVal = getChildAttribute(pPrNode, 'w:pStyle', 'w:val');
    if (pStyleVal) props.pStyle = pStyleVal;

    // TODO: Parse other paragraph properties (keepNext, keepLines, pageBreakBefore, tabs, etc.)

    try {
      // Merge with defaults to ensure all fields are present if not explicitly parsed
      // and to let Zod coerce/validate types.
      return ParagraphPropertiesSchema.parse(props);
    } catch (error) {
      console.error('ParagraphProperties schema validation failed for pPrNode:', pPrNode, error.errors);
      // Fallback to defaults in case of parsing/validation error
      return { ...defaultParagraphProperties };
    }
  }
}

// Example Usage (Illustrative)
// import { DOMParser } from 'xmldom-qsa';
//
// const xmlString = `
// <w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//   <w:jc w:val="center"/>
//   <w:ind w:left="720" w:firstLine="360"/>
//   <w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/>
//   <w:numPr>
//     <w:ilvl w:val="0"/>
//     <w:numId w:val="1"/>
//   </w:numPr>
//   <w:shd w:val="clear" w:color="auto" w:fill="FCE5CD"/>
//   <w:rPr>
//     <w:b/>
//     <w:sz w:val="20"/>
//   </w:rPr>
// </w:pPr>
// `;
// const doc = new DOMParser().parseFromString(xmlString, "application/xml");
// const pPrNode = doc.documentElement;
//
// const parser = new ParagraphPropertiesParser();
// try {
//   const parsedProps = parser.parse(pPrNode);
//   console.log("Parsed Paragraph Properties:", JSON.stringify(parsedProps, null, 2));
// } catch (e) {
//   console.error("Error parsing paragraph properties:", e);
// }
//
// // Test with empty node
// const emptyPPrNode = new DOMParser().parseFromString('<w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:pPr>', "application/xml").documentElement;
// const defaultProps = parser.parse(emptyPPrNode);
// console.log("Default Paragraph Properties (from empty node):", JSON.stringify(defaultProps, null, 2));
//
// // Test with null node
// const nullProps = parser.parse(null);
// console.log("Default Paragraph Properties (from null node):", JSON.stringify(nullProps, null, 2));
