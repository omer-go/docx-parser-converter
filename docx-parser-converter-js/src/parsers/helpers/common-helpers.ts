/**
 * Common helper functions for DOCX XML parsing
 * Provides essential XML element extraction and manipulation utilities
 */

import { getAttributeValue, getChildElements, getFirstChildElement, getTextContent } from '@/utils/xml-utils.js';

/**
 * Extract text content from multiple XML text elements
 * @param parent - Parent XML element
 * @param textElementName - Name of text elements (e.g., 'w:t')
 * @returns Concatenated text content
 */
export function extractTextFromElements(
  parent: Record<string, unknown>,
  textElementName: string = 'w:t'
): string {
  const textElements = getChildElements(parent, textElementName);
  const textParts: string[] = [];

  for (const element of textElements) {
    const text = getTextContent(element);
    if (text) {
      textParts.push(text);
    }
  }

  return textParts.join('');
}

/**
 * Extract attribute values from multiple elements
 * @param elements - Array of XML elements
 * @param attributeName - Name of attribute to extract
 * @returns Array of attribute values (excluding undefined values)
 */
export function extractAttributeValues(
  elements: Record<string, unknown>[],
  attributeName: string
): string[] {
  const values: string[] = [];

  for (const element of elements) {
    const value = getAttributeValue(element, attributeName);
    if (value !== undefined) {
      values.push(value);
    }
  }

  return values;
}

/**
 * Find elements by attribute value
 * @param parent - Parent XML element
 * @param elementName - Name of elements to search
 * @param attributeName - Attribute name to match
 * @param attributeValue - Attribute value to match
 * @returns Array of matching elements
 */
export function findElementsByAttribute(
  parent: Record<string, unknown>,
  elementName: string,
  attributeName: string,
  attributeValue: string
): Record<string, unknown>[] {
  const elements = getChildElements(parent, elementName);
  return elements.filter(element => {
    const value = getAttributeValue(element, attributeName);
    return value === attributeValue;
  });
}

/**
 * Find first element by attribute value
 * @param parent - Parent XML element
 * @param elementName - Name of elements to search
 * @param attributeName - Attribute name to match
 * @param attributeValue - Attribute value to match
 * @returns First matching element or undefined
 */
export function findFirstElementByAttribute(
  parent: Record<string, unknown>,
  elementName: string,
  attributeName: string,
  attributeValue: string
): Record<string, unknown> | undefined {
  const elements = findElementsByAttribute(parent, elementName, attributeName, attributeValue);
  return elements.length > 0 ? elements[0] : undefined;
}

/**
 * Extract style ID from style reference element
 * @param element - XML element containing style reference
 * @param styleElementName - Name of style element (e.g., 'w:pStyle', 'w:rStyle')
 * @returns Style ID or undefined
 */
export function extractStyleId(
  element: Record<string, unknown>,
  styleElementName: string
): string | undefined {
  const styleElement = getFirstChildElement(element, styleElementName);
  return styleElement ? getAttributeValue(styleElement, 'w:val') : undefined;
}

/**
 * Extract boolean property from element presence
 * @param parent - Parent XML element
 * @param elementName - Name of boolean element
 * @returns True if element exists, false otherwise
 */
export function extractBooleanProperty(
  parent: Record<string, unknown>,
  elementName: string
): boolean {
  // First check if the element exists directly as a property
  if (elementName in parent) {
    const element = parent[elementName];
    
    // If it's a string (empty element like <w:tblHeader/>), it exists
    if (typeof element === 'string') {
      return true;
    }
    
    // If it's an object, check for w:val attribute
    if (element && typeof element === 'object') {
      const val = getAttributeValue(element as Record<string, unknown>, 'w:val');
      if (val !== undefined) {
        // DOCX boolean values: '1', 'true', 'on', 'yes' are truthy
        const truthyValues = ['1', 'true', 'on', 'yes'];
        const falsyValues = ['0', 'false', 'off', 'no'];
        
        const lowerVal = val.toLowerCase();
        if (truthyValues.includes(lowerVal)) return true;
        if (falsyValues.includes(lowerVal)) return false;
        
        // If value doesn't match known patterns, presence indicates true
        return true;
      }
      
      // Element exists without w:val attribute means true
      return true;
    }
    
    // Element exists in some other form
    return true;
  }
  
  // Fallback: check if element exists as a child element (for compatibility)
  const element = getFirstChildElement(parent, elementName);
  if (!element) return false;

  // Check if element has a w:val attribute
  const val = getAttributeValue(element, 'w:val');
  if (val !== undefined) {
    // DOCX boolean values: '1', 'true', 'on', 'yes' are truthy
    const truthyValues = ['1', 'true', 'on', 'yes'];
    const falsyValues = ['0', 'false', 'off', 'no'];
    
    const lowerVal = val.toLowerCase();
    if (truthyValues.includes(lowerVal)) return true;
    if (falsyValues.includes(lowerVal)) return false;
    
    // If value doesn't match known patterns, presence indicates true
    return true;
  }

  // Element exists without w:val attribute means true
  return true;
}

/**
 * Extract numeric attribute with unit conversion
 * @param element - XML element
 * @param attributeName - Attribute name
 * @param defaultValue - Default value if parsing fails
 * @param unitConverter - Optional unit conversion function
 * @returns Converted numeric value
 */
export function extractNumericAttribute(
  element: Record<string, unknown>,
  attributeName: string,
  defaultValue: number = 0,
  unitConverter?: (value: number) => number
): number {
  const value = getAttributeValue(element, attributeName);
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;

  return unitConverter ? unitConverter(parsed) : parsed;
}

/**
 * Extract color value from XML element
 * @param element - XML element
 * @param attributeName - Attribute name (default: 'w:val')
 * @returns Color value or undefined
 */
export function extractColorValue(
  element: Record<string, unknown>,
  attributeName: string = 'w:val'
): string | undefined {
  const value = getAttributeValue(element, attributeName);
  if (!value) return undefined;

  // Validate hex color format (6 characters)
  if (/^[0-9A-Fa-f]{6}$/.test(value)) {
    return `#${value}`;
  }

  // Return as-is for named colors or other formats
  return value;
}

/**
 * Extract border properties from border element
 * @param borderElement - w:bdr, w:top, w:bottom, etc. element
 * @returns Border properties object
 */
export function extractBorderProperties(borderElement: Record<string, unknown>): {
  color?: string;
  size?: number;
  style?: string;
  space?: number;
} {
  const properties: {
    color?: string;
    size?: number;
    style?: string;
    space?: number;
  } = {};

  const color = getAttributeValue(borderElement, 'w:color');
  if (color) {
    const colorValue = extractColorValue({ '@_w:color': color });
    if (colorValue) {
      properties.color = colorValue;
    }
  }

  const size = getAttributeValue(borderElement, 'w:sz');
  if (size) {
    properties.size = parseInt(size, 10);
  }

  const style = getAttributeValue(borderElement, 'w:val');
  if (style) {
    properties.style = style;
  }

  const space = getAttributeValue(borderElement, 'w:space');
  if (space) {
    properties.space = parseInt(space, 10);
  }

  return properties;
}

/**
 * Check if element has any children
 * @param element - XML element
 * @returns True if element has child elements
 */
export function hasChildElements(element: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(element)) {
    // Skip attributes and text content
    if (key.startsWith('@_') || key === '#text') continue;
    
    // Check for objects (child elements) or arrays of child elements
    if (typeof value === 'object' && value !== null) {
      return true;
    }
  }
  return false;
}

/**
 * Get all child element names
 * @param element - XML element
 * @returns Array of child element names
 */
export function getChildElementNames(element: Record<string, unknown>): string[] {
  const names: string[] = [];
  
  for (const key of Object.keys(element)) {
    // Skip attributes and text content
    if (key.startsWith('@_') || key === '#text') continue;
    names.push(key);
  }
  
  return names;
}

/**
 * Merge multiple property objects with proper undefined handling
 * @param target - Target object to merge into
 * @param sources - Source objects to merge from
 * @returns Merged object
 */
export function mergeProperties<T extends Record<string, unknown>>(
  target: Partial<T>,
  ...sources: Array<Partial<T> | undefined>
): Partial<T> {
  const result = { ...target };

  for (const source of sources) {
    if (!source) continue;

    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
  }

  return result;
} 