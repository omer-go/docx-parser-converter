import JSZip from 'jszip';

/**
 * Checks if an item is an object (and not an array or null).
 * @param item The item to check.
 * @returns True if the item is an object, false otherwise.
 */
const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Asynchronously reads an XML file from a DOCX archive.
 * @param docxFileBuffer The DOCX file content as an ArrayBuffer.
 * @param internalPath The path to the XML file within the DOCX archive (e.g., "word/document.xml").
 * @returns A Promise that resolves with the string content of the XML file, or undefined if not found.
 */
export async function getXmlFileContent(
  docxFileBuffer: ArrayBuffer,
  internalPath: string
): Promise<string | undefined> {
  try {
    const zip = await JSZip.loadAsync(docxFileBuffer);
    const file = zip.file(internalPath);
    if (file) {
      return file.async('string');
    }
    console.warn(`File not found in archive: ${internalPath}`);
    return undefined;
  } catch (error) {
    console.error(`Error reading DOCX archive or file ${internalPath}:`, error);
    return undefined;
  }
}

/**
 * Converts a value in twips (twentieths of a point) to points.
 * @param twips The value in twips.
 * @returns The value in points.
 */
export function convertTwipsToPoints(twips: number): number {
  return twips / 20;
}

/**
 * Converts a value in half-points to points.
 * @param halfPoints The value in half-points.
 * @returns The value in points.
 */
export function convertHalfPointsToPoints(halfPoints: number): number {
  return halfPoints / 2;
}

/**
 * Deeply merges two objects. Derived properties take precedence.
 * Arrays in derivedProps replace arrays in baseProps.
 * @param baseProps The base object.
 * @param derivedProps The derived object whose properties will override baseProps.
 * @returns A new object representing the merged properties, or undefined if both inputs are undefined/null.
 */
export function mergeProperties<T extends Record<string, any>>(
  baseProps?: T | null,
  derivedProps?: T | null
): T | undefined {
  if (!baseProps && !derivedProps) {
    return undefined;
  }
  // Clone if only one is present or if they are not mergeable
  if (!derivedProps) {
    return baseProps ? { ...baseProps } as T : undefined;
  }
  if (!baseProps) {
    return { ...derivedProps } as T;
  }

  const output = { ...baseProps } as T;

  for (const key in derivedProps) {
    // eslint-disable-next-line no-prototype-builtins
    if (derivedProps.hasOwnProperty(key)) {
      const baseValue = baseProps[key];
      const derivedValue = derivedProps[key];

      if (isObject(derivedValue)) {
        if (isObject(baseValue)) {
          output[key as keyof T] = mergeProperties(baseValue, derivedValue) as T[keyof T];
        } else {
          // Derived value is an object, base is not (or doesn't exist)
          output[key as keyof T] = { ...(derivedValue as Record<string, any>) } as T[keyof T];
        }
      } else {
        // Primitives or arrays from derivedProps replace whatever was in baseProps
        output[key as keyof T] = derivedValue;
      }
    }
  }
  return output;
}
