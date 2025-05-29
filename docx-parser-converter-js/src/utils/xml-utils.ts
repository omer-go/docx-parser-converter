import { NAMESPACE_PREFIXES } from '@/constants/namespaces.js';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

/**
 * XML utility functions for DOCX parsing
 * Provides essential XML processing capabilities for browser-based DOCX parsing
 */

/**
 * Error thrown when XML parsing fails
 */
export class XMLParseError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'XMLParseError';
  }
}

/**
 * XML parser configuration optimized for DOCX parsing
 */
const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  ignoreNameSpace: false,
  removeNSPrefix: false,
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
  isArray: (
    _name: string,
    _jpath: string,
    _isLeafNode: boolean,
    _isAttribute: boolean
  ): boolean => {
    // Define which elements should always be treated as arrays
    // We exclude w:t from this list because text elements should only be arrays
    // when there are multiple instances, not when they contain simple text
    const arrayElements = [
      'w:p',
      'w:r',
      'w:tr',
      'w:tc',
      'w:tbl',
      'w:style',
      'w:abstractNum',
      'w:num',
      'w:lvl',
      'w:pPr',
      'w:rPr',
      'w:tcPr',
      'w:trPr',
      'w:tblPr',
    ];
    return arrayElements.includes(_name);
  },
  stopNodes: ['*.pre', '*.script'],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: (tagName: string): string => tagName,
  transformAttributeName: (attributeName: string): string => attributeName,
  onError: (error: Error): void => {
    throw new Error(`XML parsing error: ${error.message}`);
  },
};

/**
 * XML builder configuration for generating XML
 */
const XML_BUILDER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
  suppressBooleanAttributes: false,
  tagValueProcessor: (_name: string, value: unknown): unknown => value,
  attributeValueProcessor: (_attrName: string, attrValue: unknown): unknown => attrValue,
};

/**
 * Global XML parser instance
 */
export const xmlParser = new XMLParser(XML_PARSER_OPTIONS);

/**
 * Global XML builder instance
 */
export const xmlBuilder = new XMLBuilder(XML_BUILDER_OPTIONS);

/**
 * Parse XML string to JavaScript object
 * @param xmlString - XML string to parse
 * @returns Parsed JavaScript object
 */
export function parseXml(xmlString: string): Record<string, unknown> {
  try {
    return xmlParser.parse(xmlString) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build XML string from JavaScript object
 * @param obj - JavaScript object to convert to XML
 * @returns XML string
 */
export function buildXml(obj: Record<string, unknown>): string {
  try {
    return xmlBuilder.build(obj);
  } catch (error) {
    throw new Error(
      `Failed to build XML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get element value from parsed XML object
 * @param obj - Parsed XML object
 * @param path - Dot-separated path to the element
 * @returns Element value or undefined if not found
 */
export function getElementValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Get attribute value from XML element
 * @param element - XML element object
 * @param attributeName - Name of the attribute
 * @returns Attribute value or undefined if not found
 */
export function getAttributeValue(
  element: Record<string, unknown>,
  attributeName: string
): string | undefined {
  const attrKey = `@_${attributeName}`;
  const value = element[attrKey];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

/**
 * Get text content from XML element
 * @param element - XML element object
 * @returns Text content or empty string if not found
 */
export function getTextContent(element: Record<string, unknown>): string {
  if (typeof element === 'string') {
    return element;
  }

  if (element && typeof element === 'object') {
    const textNode = element['#text'];
    if (typeof textNode === 'string') {
      return textNode;
    }

    // If no direct text node, try to concatenate all text nodes
    const textNodes: string[] = [];
    for (const value of Object.values(element)) {
      if (typeof value === 'string') {
        textNodes.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          const text = getTextContent(item as Record<string, unknown>);
          if (text) {
            textNodes.push(text);
          }
        }
      }
    }
    return textNodes.join('');
  }

  return '';
}

/**
 * Check if element has specified attribute
 * @param element - XML element object
 * @param attributeName - Name of the attribute
 * @returns True if attribute exists
 */
export function hasAttribute(element: Record<string, unknown>, attributeName: string): boolean {
  const attrKey = `@_${attributeName}`;
  return attrKey in element;
}

/**
 * Get child elements of specified name from parent
 * @param parent - Parent XML element object
 * @param childName - Name of child elements to retrieve
 * @returns Array of child elements
 */
export function getChildElements(
  parent: Record<string, unknown>,
  childName: string
): Record<string, unknown>[] {
  const child = parent[childName];
  if (!child) {
    return [];
  }

  // Handle both single elements and arrays
  if (Array.isArray(child)) {
    return child as Record<string, unknown>[];
  }

  return [child as Record<string, unknown>];
}

/**
 * Get first child element of specified name from parent
 * @param parent - Parent XML element object
 * @param childName - Name of child element to retrieve
 * @returns First child element or undefined
 */
export function getFirstChildElement(
  parent: Record<string, unknown>,
  childName: string
): Record<string, unknown> | undefined {
  const children = getChildElements(parent, childName);
  return children.length > 0 ? children[0] : undefined;
}

/**
 * Create qualified XML name with namespace prefix
 * @param localName - Local name of the element
 * @param namespace - Namespace prefix (default: 'w')
 * @returns Qualified name
 */
export function createQualifiedName(localName: string, namespace: string = 'w'): string {
  return `${namespace}:${localName}`;
}

/**
 * Parse qualified XML name to get namespace and local name
 * @param qualifiedName - Qualified name (e.g., 'w:p')
 * @returns Object with namespace and localName
 */
export function parseQualifiedName(qualifiedName: string): {
  namespace: string;
  localName: string;
} {
  const colonIndex = qualifiedName.indexOf(':');
  if (colonIndex === -1) {
    return { namespace: '', localName: qualifiedName };
  }

  return {
    namespace: qualifiedName.substring(0, colonIndex),
    localName: qualifiedName.substring(colonIndex + 1),
  };
}

/**
 * Get namespace URI from prefix
 * @param prefix - Namespace prefix
 * @returns Namespace URI or undefined
 */
export function getNamespaceUri(prefix: string): string | undefined {
  return NAMESPACE_PREFIXES[prefix as keyof typeof NAMESPACE_PREFIXES];
}

/**
 * Check if element exists at given path
 * @param obj - XML object
 * @param elementPath - Dot-separated path to element
 * @returns True if element exists
 */
export function elementExists(obj: Record<string, unknown>, elementPath: string): boolean {
  return getElementValue(obj, elementPath) !== undefined;
}

/**
 * Normalize element structure for consistent processing
 * @param element - Raw element from XML parser
 * @returns Normalized element structure
 */
export function normalizeElement(element: unknown): {
  name: string;
  attributes: Record<string, string>;
  text: string;
  children: Record<string, unknown>[];
} {
  const result = {
    name: '',
    attributes: {} as Record<string, string>,
    text: '',
    children: [] as Record<string, unknown>[],
  };

  if (!element || typeof element !== 'object') {
    return result;
  }

  const elementObj = element as Record<string, unknown>;

  // Extract attributes (keys starting with @_)
  for (const [key, value] of Object.entries(elementObj)) {
    if (key.startsWith('@_')) {
      const attributeName = key.substring(2); // Remove @_ prefix
      result.attributes[attributeName] = String(value);
    } else if (key === '#text') {
      result.text = String(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result.children.push(...(value as Record<string, unknown>[]));
      } else {
        result.children.push(value as Record<string, unknown>);
      }
    }
  }

  return result;
}

/**
 * Safely get a string value from an XML element attribute or text
 * @param value - Value to convert to string
 * @param defaultValue - Default value if conversion fails
 * @returns String value
 */
export function safeStringValue(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value != null) {
    return String(value);
  }
  return defaultValue;
}

/**
 * Safely get a number value from an XML element attribute or text
 * @param value - Value to convert to number
 * @param defaultValue - Default value if conversion fails
 * @returns Number value
 */
export function safeNumberValue(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safely get a boolean value from an XML element attribute or text
 * @param value - Value to convert to boolean
 * @param defaultValue - Default value if conversion fails
 * @returns Boolean value
 */
export function safeBooleanValue(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'on' || lower === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return defaultValue;
}
