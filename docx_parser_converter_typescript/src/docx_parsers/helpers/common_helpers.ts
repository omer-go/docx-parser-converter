/**
 * Namespace URI for WordprocessingML.
 */
export const NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/**
 * Default prefix for WordprocessingML namespace.
 * Note: fast-xml-parser might be configured to remove prefixes or handle them differently.
 * This constant is provided for reference but might not be directly used in object traversal
 * if prefixes are stripped or altered by the parser.
 */
export const WORDML_NAMESPACE_PREFIX = "w";

/**
 * Default key for attribute group object in fast-xml-parser.
 */
export const DEFAULT_ATTRIBUTES_GROUP_NAME = "$attributes";

/**
 * Extracts a nested element from a parent JavaScript object (from fast-xml-parser) based on a path.
 * @param parent The parent object.
 * @param path The path string (e.g., "w:body.w:p[0].w:r") or an array of path segments.
 * @returns The extracted element or undefined if not found.
 */
export function extractElement(parent: any, path: string | string[]): any | undefined {
  console.debug(`extractElement: path='${JSON.stringify(path)}', parent type='${typeof parent}'`);
  if (parent === null || parent === undefined) {
    console.debug(`extractElement: result type='undefined' (parent is null/undefined)`);
    return undefined;
  }

  const segments = Array.isArray(path) ? path : path.split('.');
  let current = parent;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      console.debug(`extractElement: result type='undefined' (intermediate segment null/undefined)`);
      return undefined;
    }

    const arrayMatch = segment.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      if (current[key] && Array.isArray(current[key]) && current[key].length > index) {
        current = current[key][index];
      } else {
        console.debug(`extractElement: result type='undefined' (array path segment not found or out of bounds: ${segment})`);
        return undefined;
      }
    } else {
      if (typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        console.debug(`extractElement: result type='undefined' (path segment not found: ${segment})`);
        return undefined;
      }
    }
  }
  console.debug(`extractElement: result type='${typeof current}'`);
  return current;
}

/**
 * Extracts an attribute from a parsed XML element.
 * @param element The element object.
 * @param attributeName The name of the attribute (e.g., "w:val" or "val").
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group. Defaults to "$attributes".
 * @returns The attribute value string or undefined if not found.
 */
export function extractAttribute(
  element: any,
  attributeName: string,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): string | undefined {
  console.debug(`extractAttribute: attributeName='${attributeName}', element type='${typeof element}'`);
  if (element === null || element === undefined || typeof element !== 'object' || !element[attributesGroupName]) {
    console.debug(`extractAttribute: result='undefined' (element null/undefined, not an object, or no attribute object)`);
    return undefined;
  }
  const result = element[attributesGroupName][attributeName];
  console.debug(`extractAttribute: result='${result}'`);
  return result;
}

/**
 * Safely converts a string value to an integer.
 * @param value The string value to convert.
 * @returns The integer if conversion is successful, otherwise undefined.
 */
export function safeInt(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Extracts a boolean attribute from an element.
 * Handles cases where the presence of the element itself implies true,
 * unless a "val" attribute explicitly states "false" or "0".
 * @param element The element object.
 * @param valAttributeName The name of the attribute that might contain "false" or "0" (e.g., "w:val"). Defaults to "w:val".
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group. Defaults to "$attributes".
 * @returns True, false, or undefined if the element itself is null/undefined.
 */
export function extractBooleanAttribute(
  element: any,
  valAttributeName: string = "w:val",
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): boolean | undefined {
  console.debug(`extractBooleanAttribute: valAttributeName='${valAttributeName}', element type='${typeof element}'`);
  if (element === null || element === undefined) {
    console.debug(`extractBooleanAttribute: result='undefined' (element is null/undefined)`);
    return undefined;
  }

  // If the element exists, it's considered true by default,
  // unless its valAttributeName specifically indicates false.
  let result = true;

  const attributes = element[attributesGroupName];
  if (attributes && attributes[valAttributeName] !== undefined) {
    const attrValue = attributes[valAttributeName];
    if (attrValue === "false" || attrValue === "0" || attrValue === false) { // also check boolean false
      result = false;
    }
    // Any other value for valAttributeName (e.g., "true", "1", or even random strings)
    // does not change the interpretation from the element's presence (true),
    // or if it's an empty element like <w:b/> vs <w:b w:val="true"/>.
    // However, if the attribute is present and explicitly "true" or "1", it's still true.
    // If the attribute is present and not "false" or "0", it is also true.
    // This means only "false" or "0" makes it false.
  }
  // If attributes object or valAttributeName is not present, but the element itself is, it's true.

  console.debug(`extractBooleanAttribute: result='${result}'`);
  return result;
}
