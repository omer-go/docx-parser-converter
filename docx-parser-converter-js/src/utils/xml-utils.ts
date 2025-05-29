// src/utils/xml-utils.ts
import { XMLParser, X2jOptionsOptional } from 'fast-xml-parser';

// Define elements that should always be parsed as arrays, even if they appear once.
// This list will be expanded as more DOCX elements are handled.
const ALWAYS_ARRAY_ELEMENTS = new Set([
  'w:p', 'w:r', 'w:t', // Common paragraph, run, text elements
  'w:tr', 'w:tc',      // Table row, table cell
  'w:sdt',             // Structured Document Tag
  'w:smartTag',
  'w:sectPr',          // Section Properties
  'w:style',           // Style definitions
  'w:num', 'w:abstractNum', // Numbering definitions
  'w:lvl',             // Numbering levels
  // Add any other elements known to appear multiple times or that are convenient to always access as arrays
  'w:tab',             // Tab stops in paragraph properties
  'w:br',              // Breaks
  'w:drawing',
  'w:txbxContent',     // Text box content
  'w:footnote', 'w:endnote', // Footnotes and endnotes
  'mc:AlternateContent', 'mc:Choice', 'mc:Fallback', // For Word 2010+ features
]);

const DEFAULT_XML_PARSER_OPTIONS: X2jOptionsOptional = {
  ignoreAttributes: false,
  attributeNamePrefix: '', // No prefix for attributes (e.g., xmlNode.val instead of xmlNode['@_val'])
  attributesGroupName: false, // Do not group attributes under a specific key
  parseTagValue: false, // We will get text using a dedicated text node key (textNodeName)
  parseAttributeValue: false, // We will parse attribute values manually as needed (e.g. for booleans, numbers)
  allowBooleanAttributes: true, // Allows attributes like <w:b/> (parsed as { b: true })
  trimValues: true,
  textNodeName: '#text', // Name for the text content node, e.g., <w:t>Hello</w:t> -> { '#text': 'Hello' }
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    return !isAttribute && ALWAYS_ARRAY_ELEMENTS.has(name);
  },
  // stopNodes: ["w:p", "w:r"], // Example: if you want to process nodes as raw XML string
  // preserveOrder: true, // If element order matters significantly and is mixed with text
};

const parser = new XMLParser(DEFAULT_XML_PARSER_OPTIONS);

export function parseXmlString(xmlString: string): any {
  try {
    return parser.parse(xmlString);
  } catch (error) {
    // console.error("XML parsing error:", error);
    throw new Error(`XML parsing failed: ${(error as Error).message}`);
  }
}

export function getElement(xmlNode: any, tagName: string): any | undefined {
  if (!xmlNode || typeof xmlNode !== 'object') {
    return undefined;
  }
  const element = xmlNode[tagName];
  if (Array.isArray(element)) {
    return element[0]; // Return the first element if it's an array (consistent with fast-xml-parser's single item array)
  }
  return element;
}

export function getElements(xmlNode: any, tagName: string): any[] {
  if (!xmlNode || typeof xmlNode !== 'object') {
    return [];
  }
  const elements = xmlNode[tagName];
  if (Array.isArray(elements)) {
    return elements;
  }
  if (elements) {
    return [elements]; // Wrap single element in an array
  }
  return [];
}

// Gets an attribute value. Assumes attributeNamePrefix is ''
export function getAttribute(xmlNode: any, attributeName: string): string | undefined {
  if (!xmlNode || typeof xmlNode !== 'object') {
    return undefined;
  }
  // With attributeNamePrefix: '', attributes are direct properties
  // However, fast-xml-parser with attributesGroupName: false (default) and no prefix
  // might place them under a specific key if there's a text node or child conflict.
  // Let's assume they are direct properties for now, or under a standard '@' if no prefix is used but there's collision.
  // The options above (attributeNamePrefix: '', attributesGroupName: false) should make them direct properties.
  const value = xmlNode[attributeName];
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined;
}

export function getChildElementText(xmlNode: any, childTagName: string): string | undefined {
  const childElement = getElement(xmlNode, childTagName);
  if (childElement && typeof childElement === 'object' && childElement['#text']) {
    return String(childElement['#text']);
  }
  if (typeof childElement === 'string') { // If parseTagValue was true for this specific tag
    return childElement;
  }
  return undefined;
}

// Handles boolean attributes: "true", "false", "1", "0", "on", "off", or presence of attribute (if allowBooleanAttributes: true)
export function getElementBooleanAttribute(xmlNode: any, attributeName: string): boolean | undefined {
  if (!xmlNode || typeof xmlNode !== 'object') {
    return undefined;
  }
  const attrValue = xmlNode[attributeName];

  if (typeof attrValue === 'boolean') {
    return attrValue; // Directly from allowBooleanAttributes: true, e.g. <w:b/>
  }
  if (attrValue === undefined || attrValue === null) {
    return undefined; // Attribute not present
  }
  const valStr = String(attrValue).toLowerCase();
  if (valStr === 'true' || valStr === '1' || valStr === 'on') {
    return true;
  }
  if (valStr === 'false' || valStr === '0' || valStr === 'off') {
    return false;
  }
  // If attribute exists but is not a recognized boolean string (e.g. w:val="other"), return undefined
  return undefined; 
}
