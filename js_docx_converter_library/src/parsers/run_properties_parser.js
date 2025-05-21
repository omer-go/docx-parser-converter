import {
  RunPropertiesSchema,
  defaultRunProperties,
  // Import specific schemas if direct construction is needed, though often parsing happens via parent
} from './models/properties_models.js';
import { getElement, getAttribute, getOnOffElement, getChildAttribute } from './xml_utils.js';

/**
 * Parses a <w:rPr> (run properties) XML node into a RunProperties object.
 */
export class RunPropertiesParser {
  /**
   * Parses the <w:rPr> XML element.
   *
   * @param {Element | null} rPrNode - The <w:rPr> XML element.
   * @returns {object} An object conforming to RunPropertiesSchema.
   *                   Returns default run properties if rPrNode is null or empty.
   */
  parse(rPrNode) {
    if (!rPrNode || rPrNode.childNodes.length === 0) {
      return { ...defaultRunProperties }; // Return a copy of default properties
    }

    const props = {};

    // Boolean-like properties (handled by OnOffSchema via getOnOffElement)
    props.b = getOnOffElement(rPrNode, 'w:b');
    props.i = getOnOffElement(rPrNode, 'w:i');
    props.strike = getOnOffElement(rPrNode, 'w:strike');
    props.dstrike = getOnOffElement(rPrNode, 'w:dstrike');

    // Underline <w:u w:val="..."/>
    const uVal = getChildAttribute(rPrNode, 'w:u', 'w:val');
    if (uVal) props.u = uVal;

    // Color <w:color w:val="RRGGBB" .../>
    const colorNode = getElement(rPrNode, 'w:color');
    if (colorNode) {
      props.color = {
        val: getAttribute(colorNode, 'w:val') || 'auto', // Default to 'auto' if val is missing
        themeColor: getAttribute(colorNode, 'w:themeColor'),
        themeTint: getAttribute(colorNode, 'w:themeTint'),
        themeShade: getAttribute(colorNode, 'w:themeShade'),
      };
    }

    // Font size <w:sz w:val="HPS"/> (Half-Point Size)
    const szVal = getChildAttribute(rPrNode, 'w:sz', 'w:val');
    if (szVal) {
        const szNum = parseInt(szVal, 10);
        if (!isNaN(szNum)) {
            props.sz = { val: szNum }; // Storing raw half-points, consistent with MeasurementSchema
        }
    }


    // Fonts <w:rFonts w:ascii="..." w:hAnsi="..." .../>
    const rFontsNode = getElement(rPrNode, 'w:rFonts');
    if (rFontsNode) {
      props.rFonts = {
        ascii: getAttribute(rFontsNode, 'w:ascii'),
        hAnsi: getAttribute(rFontsNode, 'w:hAnsi'),
        eastAsia: getAttribute(rFontsNode, 'w:eastAsia'),
        cs: getAttribute(rFontsNode, 'w:cs'),
        hint: getAttribute(rFontsNode, 'w:hint'),
      };
    }

    // Vertical alignment <w:vertAlign w:val="superscript"/>
    const vertAlignVal = getChildAttribute(rPrNode, 'w:vertAlign', 'w:val');
    if (vertAlignVal) props.vertAlign = vertAlignVal;

    // Highlight <w:highlight w:val="yellow"/>
    const highlightVal = getChildAttribute(rPrNode, 'w:highlight', 'w:val');
    if (highlightVal) props.highlight = highlightVal;

    // Character Style <w:rStyle w:val="..."/>
    const rStyleVal = getChildAttribute(rPrNode, 'w:rStyle', 'w:val');
    if (rStyleVal) props.rStyle = rStyleVal;

    // TODO: Parse other run properties (caps, smallCaps, spacing, position, kern, etc.)

    try {
      // Merge with defaults to ensure all fields are present if not explicitly parsed
      // and to let Zod coerce/validate types (like OnOffSchema).
      return RunPropertiesSchema.parse(props);
    } catch (error) {
      console.error('RunProperties schema validation failed for rPrNode:', rPrNode, error.errors);
      // Fallback to defaults in case of parsing/validation error to prevent crashes
      return { ...defaultRunProperties };
    }
  }
}

// Example Usage (Illustrative)
// import { DOMParser } from 'xmldom-qsa';
//
// const xmlString = `
//   <w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//     <w:b/>
//     <w:i w:val="true"/>
//     <w:u w:val="single"/>
//     <w:color w:val="FF0000" w:themeColor="accent1"/>
//     <w:sz w:val="28"/>
//     <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
//     <w:vertAlign w:val="superscript"/>
//     <w:highlight w:val="yellow"/>
//     <w:strike w:val="0"/>
//   </w:rPr>
// `;
// const doc = new DOMParser().parseFromString(xmlString, "application/xml");
// const rPrNode = doc.documentElement;
//
// const parser = new RunPropertiesParser();
// try {
//   const parsedProps = parser.parse(rPrNode);
//   console.log("Parsed Run Properties:", JSON.stringify(parsedProps, null, 2));
// } catch (e) {
//   console.error("Error parsing run properties:", e);
// }
//
// // Test with empty node
// const emptyRPrNode = new DOMParser().parseFromString('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:rPr>', "application/xml").documentElement;
// const defaultProps = parser.parse(emptyRPrNode);
// console.log("Default Run Properties (from empty node):", JSON.stringify(defaultProps, null, 2));
//
// // Test with null node
// const nullProps = parser.parse(null);
// console.log("Default Run Properties (from null node):", JSON.stringify(nullProps, null, 2));
