/**
 * DOCX XML list and structure utilities
 * Provides utilities for handling DOCX XML document structure and list processing
 */

import { getChildElements, getFirstChildElement, getAttributeValue } from '@/utils/xml-utils.js';
import { extractBooleanProperty, extractStyleId } from './common-helpers.js';

/**
 * DOCX XML element mapping for common element types
 */
export const DOCX_ELEMENT_TYPES = {
  // Document structure
  DOCUMENT: 'w:document',
  BODY: 'w:body',
  PARAGRAPH: 'w:p',
  RUN: 'w:r',
  TEXT: 'w:t',
  
  // Properties
  PARAGRAPH_PROPERTIES: 'w:pPr',
  RUN_PROPERTIES: 'w:rPr',
  
  // Tables
  TABLE: 'w:tbl',
  TABLE_ROW: 'w:tr',
  TABLE_CELL: 'w:tc',
  TABLE_PROPERTIES: 'w:tblPr',
  TABLE_ROW_PROPERTIES: 'w:trPr',
  TABLE_CELL_PROPERTIES: 'w:tcPr',
  
  // Numbering and lists
  NUMBERING_PROPERTIES: 'w:numPr',
  NUMBERING_LEVEL: 'w:ilvl',
  NUMBERING_ID: 'w:numId',
  
  // Styles
  STYLE: 'w:style',
  PARAGRAPH_STYLE: 'w:pStyle',
  RUN_STYLE: 'w:rStyle',
  
  // Special content
  TAB: 'w:tab',
  BREAK: 'w:br',
  DRAWING: 'w:drawing',
  
  // Sections
  SECTION_PROPERTIES: 'w:sectPr',
} as const;

/**
 * Extract all paragraphs from document body
 * @param documentBody - w:body element
 * @returns Array of paragraph elements
 */
export function extractParagraphs(documentBody: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(documentBody, DOCX_ELEMENT_TYPES.PARAGRAPH);
}

/**
 * Extract all tables from document body
 * @param documentBody - w:body element
 * @returns Array of table elements
 */
export function extractTables(documentBody: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(documentBody, DOCX_ELEMENT_TYPES.TABLE);
}

/**
 * Extract runs from paragraph
 * @param paragraph - w:p element
 * @returns Array of run elements
 */
export function extractRuns(paragraph: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(paragraph, DOCX_ELEMENT_TYPES.RUN);
}

/**
 * Extract text elements from run
 * @param run - w:r element
 * @returns Array of text elements
 */
export function extractTextElements(run: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(run, DOCX_ELEMENT_TYPES.TEXT);
}

/**
 * Extract table rows from table
 * @param table - w:tbl element
 * @returns Array of table row elements
 */
export function extractTableRows(table: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(table, DOCX_ELEMENT_TYPES.TABLE_ROW);
}

/**
 * Extract table cells from table row
 * @param tableRow - w:tr element
 * @returns Array of table cell elements
 */
export function extractTableCells(tableRow: Record<string, unknown>): Record<string, unknown>[] {
  return getChildElements(tableRow, DOCX_ELEMENT_TYPES.TABLE_CELL);
}

/**
 * Check if element is a paragraph
 * @param element - XML element
 * @returns True if element is a paragraph
 */
export function isParagraph(element: Record<string, unknown>): boolean {
  return DOCX_ELEMENT_TYPES.PARAGRAPH in element;
}

/**
 * Check if element is a table
 * @param element - XML element
 * @returns True if element is a table
 */
export function isTable(element: Record<string, unknown>): boolean {
  return DOCX_ELEMENT_TYPES.TABLE in element;
}

/**
 * Check if element is a run
 * @param element - XML element
 * @returns True if element is a run
 */
export function isRun(element: Record<string, unknown>): boolean {
  return DOCX_ELEMENT_TYPES.RUN in element;
}

/**
 * Get document body element
 * @param document - w:document element
 * @returns Document body element or undefined
 */
export function getDocumentBody(document: Record<string, unknown>): Record<string, unknown> | undefined {
  return getFirstChildElement(document, DOCX_ELEMENT_TYPES.BODY);
}

/**
 * Get element properties
 * @param element - XML element
 * @param propertiesElementName - Name of properties element
 * @returns Properties element or undefined
 */
export function getElementProperties(
  element: Record<string, unknown>,
  propertiesElementName: string
): Record<string, unknown> | undefined {
  return getFirstChildElement(element, propertiesElementName);
}

/**
 * Get paragraph properties
 * @param paragraph - w:p element
 * @returns Paragraph properties element or undefined
 */
export function getParagraphProperties(paragraph: Record<string, unknown>): Record<string, unknown> | undefined {
  return getElementProperties(paragraph, DOCX_ELEMENT_TYPES.PARAGRAPH_PROPERTIES);
}

/**
 * Get run properties
 * @param run - w:r element
 * @returns Run properties element or undefined
 */
export function getRunProperties(run: Record<string, unknown>): Record<string, unknown> | undefined {
  return getElementProperties(run, DOCX_ELEMENT_TYPES.RUN_PROPERTIES);
}

/**
 * Get table properties
 * @param table - w:tbl element
 * @returns Table properties element or undefined
 */
export function getTableProperties(table: Record<string, unknown>): Record<string, unknown> | undefined {
  return getElementProperties(table, DOCX_ELEMENT_TYPES.TABLE_PROPERTIES);
}

/**
 * Get numbering properties from paragraph properties
 * @param paragraphProperties - w:pPr element
 * @returns Numbering properties element or undefined
 */
export function getNumberingProperties(paragraphProperties: Record<string, unknown>): Record<string, unknown> | undefined {
  return getFirstChildElement(paragraphProperties, DOCX_ELEMENT_TYPES.NUMBERING_PROPERTIES);
}

/**
 * Extract numbering information from paragraph
 * @param paragraph - w:p element
 * @returns Numbering information or undefined
 */
export function extractNumberingInfo(paragraph: Record<string, unknown>): {
  ilvl: number;
  numId: number;
} | undefined {
  const pPr = getParagraphProperties(paragraph);
  if (!pPr) return undefined;

  const numPr = getNumberingProperties(pPr);
  if (!numPr) return undefined;

  const ilvlElement = getFirstChildElement(numPr, DOCX_ELEMENT_TYPES.NUMBERING_LEVEL);
  const numIdElement = getFirstChildElement(numPr, DOCX_ELEMENT_TYPES.NUMBERING_ID);

  if (!ilvlElement || !numIdElement) return undefined;

  const ilvl = getAttributeValue(ilvlElement, 'w:val');
  const numId = getAttributeValue(numIdElement, 'w:val');

  if (!ilvl || !numId) return undefined;

  return {
    ilvl: parseInt(ilvl, 10),
    numId: parseInt(numId, 10),
  };
}

/**
 * Extract style information from properties element
 * @param propertiesElement - Properties element (w:pPr, w:rPr, etc.)
 * @param styleElementName - Style element name (w:pStyle, w:rStyle, etc.)
 * @returns Style information
 */
export function extractStyleInfo(
  propertiesElement: Record<string, unknown>,
  styleElementName: string
): {
  styleId?: string;
  hasDirectFormatting: boolean;
} {
  const styleId = extractStyleId(propertiesElement, styleElementName);
  
  // Check if there are any direct formatting properties besides the style reference
  const hasDirectFormatting = Object.keys(propertiesElement).some(key => 
    key !== styleElementName && !key.startsWith('@_') && key !== '#text'
  );

  const result: {
    styleId?: string;
    hasDirectFormatting: boolean;
  } = {
    hasDirectFormatting,
  };

  if (styleId !== undefined) {
    result.styleId = styleId;
  }

  return result;
}

/**
 * Filter elements by type
 * @param elements - Array of XML elements
 * @param elementType - Element type to filter by
 * @returns Filtered array of elements
 */
export function filterElementsByType(
  elements: Record<string, unknown>[],
  elementType: string
): Record<string, unknown>[] {
  return elements.filter(element => elementType in element);
}

/**
 * Group elements by type
 * @param elements - Array of XML elements
 * @returns Object with elements grouped by type
 */
export function groupElementsByType(elements: Record<string, unknown>[]): Record<string, Record<string, unknown>[]> {
  const groups: Record<string, Record<string, unknown>[]> = {};

  for (const element of elements) {
    for (const key of Object.keys(element)) {
      if (!key.startsWith('@_') && key !== '#text') {
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(element);
        break; // Only consider the first non-attribute key as the element type
      }
    }
  }

  return groups;
}

/**
 * Check if paragraph has numbering
 * @param paragraph - w:p element
 * @returns True if paragraph has numbering
 */
export function hasNumbering(paragraph: Record<string, unknown>): boolean {
  return extractNumberingInfo(paragraph) !== undefined;
}

/**
 * Check if element has specific property
 * @param propertiesElement - Properties element
 * @param propertyName - Property element name
 * @returns True if property exists
 */
export function hasProperty(
  propertiesElement: Record<string, unknown>,
  propertyName: string
): boolean {
  return extractBooleanProperty(propertiesElement, propertyName);
}

/**
 * Extract all content elements from parent
 * @param parent - Parent XML element
 * @returns Array of all child elements (excluding properties)
 */
export function extractContentElements(parent: Record<string, unknown>): Record<string, unknown>[] {
  const content: Record<string, unknown>[] = [];
  
  for (const [key, value] of Object.entries(parent)) {
    // Skip attributes, text nodes, and property elements
    if (key.startsWith('@_') || key === '#text' || key.endsWith('Pr')) {
      continue;
    }
    
    if (Array.isArray(value)) {
      content.push(...value as Record<string, unknown>[]);
    } else if (typeof value === 'object' && value !== null) {
      content.push(value as Record<string, unknown>);
    }
  }
  
  return content;
}

/**
 * Check if element contains text content
 * @param element - XML element
 * @returns True if element has text content
 */
export function hasTextContent(element: Record<string, unknown>): boolean {
  // Direct text content
  if (element['#text']) return true;
  
  // Check for w:t elements
  const textElements = getChildElements(element, DOCX_ELEMENT_TYPES.TEXT);
  return textElements.length > 0;
}

/**
 * Get element hierarchy path
 * @param element - XML element
 * @returns Array of element names representing the path
 */
export function getElementPath(element: Record<string, unknown>): string[] {
  const path: string[] = [];
  
  for (const key of Object.keys(element)) {
    if (!key.startsWith('@_') && key !== '#text') {
      path.push(key);
    }
  }
  
  return path;
} 