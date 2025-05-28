// Import necessary libraries
import JSZip from 'jszip';
import pkg from 'xmldom-qsa';
const { DOMParser, QuerySelector } = pkg;

/**
 * Extracts the root XML element from a DOCX file.
 *
 * @param {ArrayBuffer} docxBuffer - The DOCX file buffer.
 * @param {string} xmlPath - The path to the XML file within the DOCX archive.
 * @returns {Promise<Element>} A promise that resolves with the root XML element.
 * @throws {Error} If the XML file is not found or cannot be parsed.
 */
export async function extractXmlRootFromDocx(docxBuffer, xmlPath) {
  const zip = await JSZip.loadAsync(docxBuffer);
  const xmlFile = zip.file(xmlPath);

  if (!xmlFile) {
    throw new Error(`XML file not found: ${xmlPath}`);
  }

  const xmlContent = await xmlFile.async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Check for parsing errors
  const parserError = doc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error(`Error parsing XML: ${parserError[0].textContent}`);
  }

  return doc.documentElement;
}

/**
 * Gets the first child element with the specified tag name.
 *
 * @param {Element} node - The parent XML element.
 * @param {string} tagName - The tag name to search for (e.g., "w:p").
 * @returns {Element | null} The found element or null if not found.
 */
export function getElement(node, tagName) {
  if (!node || typeof node.getElementsByTagName !== 'function') {
    return null;
  }
  // Use standard DOM getElementsByTagName method
  const elements = node.getElementsByTagName(tagName);
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Gets the value of an attribute from an XML element.
 *
 * @param {Element} element - The XML element.
 * @param {string} attributeName - The name of the attribute (e.g., "w:val").
 * @returns {string | null} The attribute value or null if not found.
 */
export function getAttribute(element, attributeName) {
  if (!element || typeof element.getAttribute !== 'function') {
    return null;
  }
  // Attributes can also have namespaces (e.g., "w:val").
  // getAttribute handles this directly if the prefix is included.
  return element.getAttribute(attributeName);
}

// TODO: Consider adding namespace handling if simple tag/attribute names become problematic.
// const NAMESPACE = {
//   w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
//   // Add other namespaces as needed
// };
//
// More robust getElement using namespace:
// export function getElementNS(node, namespaceURI, localName) {
//   if (!node || typeof node.getElementsByTagNameNS !== 'function') {
//     return null;
//   }
//   const elements = node.getElementsByTagNameNS(namespaceURI, localName);
//   return elements.length > 0 ? elements[0] : null;
// }
//
// More robust getAttributeNS using namespace:
// export function getAttributeNS(element, namespaceURI, localName) {
//   if (!element || typeof element.getAttributeNS !== 'function') {
//     return null;
//   }
//   return element.getAttributeNS(namespaceURI, localName);
// }

/**
 * Converts a value from twentieths of a point (twips) to points.
 * @param {number | string | null} twips - The value in twips.
 * @returns {number | null} The value in points, or null if input is invalid.
 */
export function convertTwipsToPoints(twips) {
  if (twips === null || twips === undefined) return null;
  const numTwips = typeof twips === 'string' ? parseInt(twips, 10) : twips;
  if (isNaN(numTwips)) return null;
  return numTwips / 20;
}

/**
 * Parses a boolean-like "on/off" property from an XML element.
 * This function is designed to be used with the Zod OnOffSchema's preprocess.
 * It checks for the presence of the element and its 'w:val' attribute.
 *
 * @param {Element | null} element - The XML element representing the property (e.g., <w:b>).
 *                                   If null or undefined, property is considered false.
 * @returns {any} The element itself if it exists (for Zod OnOffSchema to process),
 *                or `false` if the element does not exist.
 *                The Zod OnOffSchema will then handle the actual conversion.
 *
 * Note: This function's role is simplified. The core logic is now primarily in `OnOffSchema`.
 * This helper can still be used to *get* the element for `OnOffSchema`.
 */
export function getOnOffElement(parentNode, tagName) {
    if (!parentNode) return null; // Or false, depending on how OnOffSchema expects missing elements
    const element = getElement(parentNode, tagName);
    return element; // OnOffSchema will handle null as false, and existing element as true or based on w:val
}

/**
 * Extracts the value of a <w:val> attribute from a given element.
 * Often used for properties where the value is in an attribute of a specific child element.
 * E.g., <w:u w:val="singleUnderline"/> -> "singleUnderline"
 * E.g., <w:sz w:val="24"/> -> "24"
 *
 * @param {Element | null} parentElement - The parent XML element.
 * @param {string} childTagName - The tag name of the child element (e.g., "w:u", "w:sz").
 * @param {string} attributeName - The name of the attribute to get from the child (usually "w:val").
 * @returns {string | null} The attribute value or null if the child or attribute is not found.
 */
export function getChildAttribute(parentElement, childTagName, attributeName = 'w:val') {
    const childElement = getElement(parentElement, childTagName);
    if (childElement) {
        return getAttribute(childElement, attributeName);
    }
    return null;
}
