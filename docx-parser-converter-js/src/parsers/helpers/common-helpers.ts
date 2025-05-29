// src/parsers/helpers/common-helpers.ts
import { getElement, getAttribute, getElementBooleanAttribute } from '../../utils/xml-utils';
import { IndividualBorderProperties, BorderStyleEnum } from '../../models/styles-models'; // Added for parseIndividualBorder

/**
 * Parses a common DOCX property element that usually has a 'w:val' attribute.
 * Example: <w:sz w:val="24"/> -> "24"
 * @param parentNode The parent XML node object.
 * @param propertyTagName The tag name of the property element (e.g., "w:sz").
 * @param attributeName The name of the attribute to retrieve (e.g., "w:val"). Defaults to "w:val".
 * @returns The string value of the attribute, or undefined if not found.
 */
export function parseValAttribute(
  parentNode: any,
  propertyTagName: string,
  attributeName: string = 'w:val'
): string | undefined {
  const propertyElement = getElement(parentNode, propertyTagName);
  if (!propertyElement) {
    return undefined;
  }
  return getAttribute(propertyElement, attributeName);
}

/**
 * Parses an "on/off" or boolean-like property element.
 * These elements can exist as:
 * - <w:b/> (implies true)
 * - <w:b w:val="true"/> or <w:b w:val="1"/> (implies true)
 * - <w:b w:val="false"/> or <w:b w:val="0"/> (implies false)
 * - Absent (implies undefined/inherit)
 * @param parentNode The parent XML node object.
 * @param propertyTagName The tag name of the on/off property element (e.g., "w:b").
 * @returns True, false, or undefined.
 */
export function parseOnOffProperty(
  parentNode: any,
  propertyTagName: string
): boolean | undefined {
  const propertyElement = getElement(parentNode, propertyTagName);
  if (!propertyElement) {
    return undefined; // Not present, so inherit or default
  }

  // Check for explicit w:val attribute first
  const val = getAttribute(propertyElement, 'w:val');
  if (val !== undefined) {
    // If w:val exists, its boolean interpretation is definitive
    const boolVal = getElementBooleanAttribute(propertyElement, 'w:val');
    return boolVal;
  }

  if (propertyElement === true) {
      return true;
  }

  if (typeof propertyElement === 'object' && Object.keys(propertyElement).length === 0) {
      return true;
  }
  
  return undefined;
}

/**
 * Helper to parse individual border elements like <w:top>, <w:left> etc.
 * Moved from paragraph-properties-parser.ts
 */
export function parseIndividualBorder(borderNode: any): IndividualBorderProperties | undefined {
  if (!borderNode || typeof borderNode !== 'object') return undefined;

  const props: IndividualBorderProperties = {};
  const type = getAttribute(borderNode, 'w:val');
  if (type && BorderStyleEnum.safeParse(type).success) {
    props.type = type as BorderStyleEnum;
  } else if (type === 'none' || type === 'nil') {
    props.type = 'none';
  } else if (type) { 
    // Invalid type, model default will apply if props.type remains undefined
  }


  const color = getAttribute(borderNode, 'w:color');
  if (color) props.color = color;

  const size = getAttribute(borderNode, 'w:sz');
  if (size) props.size = parseInt(size, 10);

  const space = getAttribute(borderNode, 'w:space');
  if (space) props.space = parseInt(space, 10);

  const shadowAttr = getAttribute(borderNode, 'w:shadow');
  if (shadowAttr !== undefined) props.shadow = getElementBooleanAttribute(borderNode, 'w:shadow');

  const frameAttr = getAttribute(borderNode, 'w:frame');
  if (frameAttr !== undefined) props.frame = getElementBooleanAttribute(borderNode, 'w:frame');

  return Object.keys(props).length > 0 ? props : undefined;
}
