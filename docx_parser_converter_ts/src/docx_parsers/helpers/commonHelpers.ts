export const NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
export const NAMESPACE = { w: NAMESPACE_URI };

/**
 * Extracts an XML element from the parent element using the given path.
 * 
 * @param parent - The parent XML element.
 * @param path - The XPath to the desired child element.
 * @returns The extracted XML element, or null if not found or if parent is null.
 * 
 * @example
 * The following is an example of extracting a paragraph properties element 
 * from a paragraph element in a document.xml file:
 * ```xml
 * <w:p>
 *     <w:pPr>
 *         <!-- Paragraph properties here -->
 *     </w:pPr>
 * </w:p>
 * ```
 * 
 * Usage:
 * ```typescript
 * const pPr = extractElement(paragraphElement, ".//w:pPr");
 * ```
 */
export function extractElement(parent: Element | null, path: string): Element | null {
  if (parent === null) {
    return null;
  }

  // Create a namespace resolver function
  const nsResolver = (prefix: string | null): string | null => {
    if (prefix === 'w') {
      return NAMESPACE_URI;
    }
    return null;
  };

  // Use XPath evaluation to find the element
  const result = document.evaluate(
    path,
    parent,
    nsResolver,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );

  return result.singleNodeValue as Element | null;
}

/**
 * Extracts an attribute value from an XML element.
 * 
 * @param element - The XML element.
 * @param attr - The attribute name.
 * @returns The attribute value, or null if not found.
 * 
 * @example
 * The following is an example of extracting the 'val' attribute from a style 
 * element in a document.xml file:
 * ```xml
 * <w:pStyle w:val="Heading1"/>
 * ```
 * 
 * Usage:
 * ```typescript
 * const styleVal = extractAttribute(styleElement, 'val');
 * ```
 */
export function extractAttribute(element: Element | null, attr: string): string | null {
  if (element !== null) {
    return element.getAttributeNS(NAMESPACE_URI, attr);
  }
  return null;
}

/**
 * Converts a string value to a number safely.
 * 
 * @param value - The string value to convert.
 * @returns The number value, or null if the input is null or invalid.
 * 
 * @example
 * The following is an example of safely converting a string to a number:
 * ```typescript
 * const intValue = safeInt("123");  // Returns 123
 * const intValue = safeInt(null);   // Returns null
 * const intValue = safeInt("abc");  // Returns null
 * ```
 */
export function safeInt(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Converts a string value to a floating point number safely.
 * 
 * @param value - The string value to convert.
 * @returns The number value, or null if the input is null or invalid.
 * 
 * @example
 * ```typescript
 * const floatValue = safeFloat("123.45");  // Returns 123.45
 * const floatValue = safeFloat(null);      // Returns null
 * const floatValue = safeFloat("abc");     // Returns null
 * ```
 */
export function safeFloat(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts a boolean attribute from an XML element.
 * 
 * @param element - The XML element.
 * @returns True if the element is present and its 'val' attribute is not 'false' or '0',
 *          False if its 'val' attribute is 'false' or '0',
 *          null if the element is not present.
 * 
 * @example
 * The following is an example of extracting a boolean attribute from an element:
 * ```xml
 * <w:b w:val="true"/>
 * ```
 * 
 * Usage:
 * ```typescript
 * const bold = extractBooleanAttribute(boldElement);  // Returns true if w:val is not 'false' or '0'
 * ```
 */
export function extractBooleanAttribute(element: Element | null): boolean | null {
  if (element !== null) {
    const val = element.getAttributeNS(NAMESPACE_URI, 'val');
    if (val !== null) {
      return val.toLowerCase() !== "false" && val !== "0";
    }
    return true;
  }
  return null;
}

/**
 * Extracts all matching elements from the parent element using the given XPath.
 * 
 * @param parent - The parent XML element.
 * @param path - The XPath to the desired child elements.
 * @returns Array of extracted XML elements, or empty array if none found or if parent is null.
 * 
 * @example
 * ```typescript
 * const runs = extractElements(paragraphElement, ".//w:r");
 * ```
 */
export function extractElements(parent: Element | null, path: string): Element[] {
  if (parent === null) {
    return [];
  }

  const nsResolver = (prefix: string | null): string | null => {
    if (prefix === 'w') {
      return NAMESPACE_URI;
    }
    return null;
  };

  const result = document.evaluate(
    path,
    parent,
    nsResolver,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  const elements: Element[] = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i) as Element;
    if (node) {
      elements.push(node);
    }
  }

  return elements;
} 