import * as fs from 'fs';
import * as JSZip from 'jszip';
import { DOMParser as XmldomParser, XMLSerializer as XmldomSerializer } from '@xmldom/xmldom';

/**
 * Extracts the root element from the specified XML file within a DOCX file.
 *
 * @param docxFileContent The binary content (Buffer or Uint8Array) of the DOCX file.
 * @param xmlFilename The name of the XML file to extract (e.g., 'document.xml').
 * @returns Promise<Element> The root element of the extracted XML file (global Element type).
 */
export async function extractXmlRootFromDocx(docxFileContent: Buffer | Uint8Array, xmlFilename: string): Promise<Element> {
    const contentToLoad = docxFileContent instanceof Uint8Array ? docxFileContent.buffer : docxFileContent;
    const zip = await JSZip.loadAsync(contentToLoad);

    // console.log("Files found by JSZip in the archive:");
    // zip.forEach((relativePath, fileEntry) => {
    //     console.log("- ", relativePath, " (is directory: ", fileEntry.dir, ")");
    // });

    const xmlFileInZip = zip.file(`word/${xmlFilename}`);

    if (!xmlFileInZip) {
        throw new Error(`XML file 'word/${xmlFilename}' not found in DOCX archive.`);
    }

    const xmlContent = await xmlFileInZip.async('string');
    const xmldomParser = new XmldomParser();
    const docParsedByXmldom = xmldomParser.parseFromString(xmlContent, 'application/xml');
    
    const parserError = docParsedByXmldom.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
        const errorMessage = parserError[0].textContent || "Unknown XML parsing error";
        throw new Error(`Error parsing XML '${xmlFilename}' with xmldom: ${errorMessage}`);
    }
    if (!docParsedByXmldom.documentElement) {
        throw new Error(`Could not parse XML content from '${xmlFilename}' or no document element found.`);
    }
    
    const rootElementFromXmldom = docParsedByXmldom.documentElement;

    if (typeof window !== 'undefined' && typeof window.DOMParser === 'function') {
        try {
            const serializer = new XmldomSerializer();
            const xmlString = serializer.serializeToString(rootElementFromXmldom);
            const browserDomParser = new window.DOMParser();
            const browserXmlDoc = browserDomParser.parseFromString(xmlString, 'application/xml');
            
            const browserParserError = browserXmlDoc.getElementsByTagName('parsererror');
            if (browserParserError.length > 0) {
                const browserErrorMessage = browserParserError[0].textContent || "Unknown XML parsing error in browser";
                console.warn(`Error re-parsing XML '${xmlFilename}' with browser's DOMParser: ${browserErrorMessage}. Falling back to xmldom result.`);
                return rootElementFromXmldom as unknown as Element;
            } else if (browserXmlDoc.documentElement) {
                console.log(`Successfully re-parsed '${xmlFilename}' with browser's native DOMParser.`);
                return browserXmlDoc.documentElement;
            } else {
                console.warn(`Browser's DOMParser did not return a documentElement for '${xmlFilename}'. Falling back to xmldom result.`);
                return rootElementFromXmldom as unknown as Element;
            }
        } catch (e) {
            console.warn(`Exception during XML re-parsing for '${xmlFilename}' in browser: ${(e as Error).message}. Falling back to xmldom result.`);
            return rootElementFromXmldom as unknown as Element;
        }
    }
    
    return rootElementFromXmldom as unknown as Element;
}

/**
 * Extracts the root element from an XML string.
 *
 * @param xmlContent The XML content as a string.
 * @returns Element The root element of the parsed XML (global Element type).
 */
export function extractXmlRootFromString(xmlContent: string): Element {
    const xmldomParser = new XmldomParser();
    const docParsedByXmldom = xmldomParser.parseFromString(xmlContent, 'application/xml');

    const parserError = docParsedByXmldom.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
        const errorMessage = parserError[0].textContent || "Unknown XML parsing error";
        throw new Error(`Error parsing XML string with xmldom: ${errorMessage}`);
    }
    if (!docParsedByXmldom.documentElement) {
        throw new Error('Could not parse XML content from string or no document element found.');
    }

    const rootElementFromXmldom = docParsedByXmldom.documentElement;

    if (typeof window !== 'undefined' && typeof window.DOMParser === 'function') {
        try {
            const serializer = new XmldomSerializer();
            const xmlString = serializer.serializeToString(rootElementFromXmldom);
            const browserDomParser = new window.DOMParser();
            const browserXmlDoc = browserDomParser.parseFromString(xmlString, 'application/xml');

            const browserParserError = browserXmlDoc.getElementsByTagName('parsererror');
            if (browserParserError.length > 0) {
                const browserErrorMessage = browserParserError[0].textContent || "Unknown XML parsing error in browser";
                console.warn(`Error re-parsing XML string with browser's DOMParser: ${browserErrorMessage}. Falling back to xmldom result.`);
                return rootElementFromXmldom as unknown as Element;
            } else if (browserXmlDoc.documentElement) {
                 console.log("Successfully re-parsed XML string with browser's native DOMParser.");
                return browserXmlDoc.documentElement;
            } else {
                console.warn("Browser's DOMParser did not return a documentElement for XML string. Falling back to xmldom result.");
                return rootElementFromXmldom as unknown as Element;
            }
        } catch (e) {
            console.warn(`Exception during XML string re-parsing in browser: ${(e as Error).message}. Falling back to xmldom result.`);
            return rootElementFromXmldom as unknown as Element;
        }
    }
    return rootElementFromXmldom as unknown as Element;
}

/**
 * Reads the binary content from the specified file path.
 *
 * @param filePath The path to the file to read.
 * @returns Buffer The binary content of the file.
 */
export function readBinaryFromFilePath(filePath: string): Buffer {
    return fs.readFileSync(filePath);
}

/**
 * Converts twips (twentieths of a point) to points.
 *
 * @param twips The value in twips.
 * @returns The value in points.
 *
 * @example
 * \`\`\`typescript
 * const points = convertTwipsToPoints(240);
 * console.log(points); // Output: 12.0
 * \`\`\`
 */
export function convertTwipsToPoints(twips: number): number {
    return twips / 20.0;
}

/**
 * Converts half-points to points.
 *
 * @param halfPoints The value in half-points.
 * @returns The value in points.
 *
 * @example
 * \`\`\`typescript
 * const points = convertHalfPointsToPoints(24);
 * console.log(points); // Output: 12.0
 * \`\`\`
 */
export function convertHalfPointsToPoints(halfPoints: number): number {
    return halfPoints / 2.0;
}

/**
 * Helper function to check if a value is a plain object (and not an array or null).
 */
function isPlainObject(value: any): value is Record<string, any> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Deeply merges two objects. Derived properties overwrite base properties.
 * Arrays are overwritten, not merged.
 */
function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(
    base: T,
    derived: U
): T & U {
    const output = { ...base } as any; // Start with a shallow copy of base

    for (const key in derived) {
        if (Object.prototype.hasOwnProperty.call(derived, key)) {
            const baseValue = base[key];
            const derivedValue = derived[key];

            if (isPlainObject(baseValue) && isPlainObject(derivedValue)) {
                output[key] = deepMerge(baseValue, derivedValue);
            } else {
                // Overwrite with derived value (includes arrays, primitives, or if one is not an object)
                output[key] = derivedValue;
            }
        }
    }
    return output as T & U;
}


/**
 * Merges two sets of properties, with derived properties taking precedence and overwriting base properties in case of conflict.
 * Performs a deep merge for nested objects.
 *
 * @param baseProps The base properties object.
 * @param derivedProps The derived properties object.
 * @returns A new object representing the merged properties, or undefined/null if inputs are such.
 */
export function mergeProperties<T extends Record<string, any>, U extends Record<string, any>>(
    baseProps: T | null | undefined,
    derivedProps: U | null | undefined
): (T & U) | null | undefined {
    if (!baseProps && !derivedProps) {
        return undefined;
    }
    if (!derivedProps) {
        // Return a copy of base if no derived
        return baseProps ? { ...baseProps } as T & U : undefined;
    }
    if (!baseProps) {
        // Return a copy of derived if no base
        return derivedProps ? { ...derivedProps } as T & U : undefined;
    }

    return deepMerge({ ...baseProps }, { ...derivedProps });
}

/**
 * Reads a File object from a browser file input into a Uint8Array using file.arrayBuffer().
 * This function is intended for browser environments.
 *
 * @param file The File object (e.g., from an <input type="file">).
 * @returns A Promise that resolves with a Uint8Array of the file content.
 */
export async function readFileInBrowser(file: File): Promise<Uint8Array> {
    if (typeof window === 'undefined' || !file.arrayBuffer) {
        // Check for window to ensure browser environment and arrayBuffer support
        throw new Error('This function is intended for browser environments with File.arrayBuffer support.');
    }
    try {
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error("Error reading file with arrayBuffer:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

/**
 * Extracts all required XML parts from a DOCX file in one go.
 * @param docxFileContent The binary content (Buffer, Uint8Array, or ArrayBuffer) of the DOCX file.
 * @returns Promise<{ documentXml: string, stylesXml: string, numberingXml: string }>
 */
export async function extractAllXmlPartsFromDocx(docxFileContent: Buffer | Uint8Array | ArrayBuffer): Promise<{ documentXml: string, stylesXml: string, numberingXml: string }> {
    const contentToLoad = docxFileContent instanceof Uint8Array || docxFileContent instanceof Buffer
        ? docxFileContent
        : new Uint8Array(docxFileContent);
    const zip = await JSZip.loadAsync(contentToLoad);

    async function getXml(filename: string): Promise<string> {
        const file = zip.file(`word/${filename}`);
        if (!file) throw new Error(`XML file 'word/${filename}' not found in DOCX archive.`);
        return await file.async('string');
    }

    const [documentXml, stylesXml, numberingXml] = await Promise.all([
        getXml('document.xml'),
        getXml('styles.xml'),
        getXml('numbering.xml'),
    ]);

    return { documentXml, stylesXml, numberingXml };
}

/**
 * Deeply merges two objects, but only fills in missing or undefined/null values from the base (parent) into the derived (child).
 * Child (derived) properties always take precedence. This is used for style inheritance, so that more specific styles override less specific ones (e.g., docDefaults only fill in missing values).
 */
export function deepMergeBasePreserves<T extends Record<string, any>, U extends Record<string, any>>(
  base: T | undefined | null,
  derived: U | undefined | null
): T & U {
  if (!base) {
    const result = (derived ? { ...derived } : {}) as T & U;
    return result;
  }
  if (!derived) {
    const result = { ...base } as T & U;
    return result;
  }
  const output: any = { ...derived };

  for (const key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      const baseValue = base[key];
      const derivedValue = derived[key];
      // Only use baseValue if the property is truly missing (undefined) in derived.
      // An explicit null in derived is considered an intentional value and should be preserved.
      if (derivedValue === undefined) {
        output[key] = baseValue;
      } else if (isPlainObject(baseValue) && isPlainObject(derivedValue)) {
        // If both are objects, and derivedValue is not undefined (it could be null or an object here),
        // recurse. The recursive call will correctly handle nulls in derived sub-objects.
        output[key] = deepMergeBasePreserves(baseValue, derivedValue);
      } // else, derivedValue exists (and is not undefined) and is not an object for deep merge, so it's kept.
    }
  }
  return output as T & U;
}

// --- Example Usage Block (similar to if __name__ == "__main__") ---
async function runExamples() {
    console.log("--- Running utils.ts examples ---");

    // Example: convertTwipsToPoints
    const twips = 240;
    const pointsFromTwips = convertTwipsToPoints(twips);
    console.log(`${twips} twips is ${pointsFromTwips} points`);

    // Example: convertHalfPointsToPoints
    const halfPoints = 24;
    const pointsFromHalf = convertHalfPointsToPoints(halfPoints);
    console.log(`${halfPoints} half-points is ${pointsFromHalf} points`);

    // Example: mergeProperties (simplified)
    interface TestStyle {
        font?: string;
        size?: number;
        color?: string;
        details?: {
            bold?: boolean;
            italic?: boolean;
            more?: {
                underline?: boolean;
            }
        };
        tags?: string[];
    }

    const baseStyle: TestStyle = {
        font: "Arial",
        size: 12,
        color: "black",
        details: {
            bold: true,
            more: {
                underline: false
            }
        },
        tags: ["base"]
    };

    const derivedStyle: Partial<TestStyle> = {
        size: 14, // Overwrites base
        color: "blue", // Overwrites base
        details: { // Deep merge
            italic: true, // Adds to details
            more: { // Deep merge
                underline: true // Overwrites details.more.underline
            }
        },
        tags: ["derived"] // Overwrites base tags array
    };
    
    const mergedStyle = mergeProperties(baseStyle, derivedStyle);
    console.log("Merged Style (derived takes precedence):", JSON.stringify(mergedStyle, null, 2));
    /* Expected mergedStyle:
    {
      "font": "Arial",         // From base
      "size": 14,             // From derived (overwritten)
      "color": "blue",          // From derived (overwritten)
      "details": {
        "bold": true,         // From base
        "italic": true,       // From derived (added)
        "more": {
          "underline": true   // From derived (overwritten)
        }
      },
      "tags": ["derived"]      // From derived (array overwritten)
    }
    */

    // Test with null/undefined inputs
    console.log("Merge (null, obj):", mergeProperties(null, { a: 1 }));
    console.log("Merge (obj, null):", mergeProperties({ b: 2 }, null));
    console.log("Merge (undefined, obj):", mergeProperties(undefined, { a: 1 }));
    console.log("Merge (obj, undefined):", mergeProperties({ b: 2 }, undefined));
    console.log("Merge (null, null):", mergeProperties(null, null));

    // Example: XML parsing (illustrative, needs actual XML string)
    try {
        const sampleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body><w:p><w:r><w:t>Hello World</w:t></w:r></w:p></w:body>
        </w:document>`;
        const rootEl = extractXmlRootFromString(sampleXml);
        console.log(`Extracted XML root tag: ${rootEl.tagName}`);
    } catch (error) {
        console.error("XML parsing example failed:", error);
    }

    // Example: readBinaryFromFilePath (requires a file)
    // Create a dummy file for testing
    const testFilePath = 'test_dummy_file.txt';
    try {
        fs.writeFileSync(testFilePath, 'Hello binary world!');
        const binaryContent = readBinaryFromFilePath(testFilePath);
        console.log(`Read binary content: "${binaryContent.toString()}"`);
        fs.unlinkSync(testFilePath); // Clean up dummy file
    } catch (error) {
        console.error("File reading example failed:", error);
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    }

    // Example: extractXmlRootFromDocx (requires a dummy DOCX)
    // This is harder to quickly test without a valid mini DOCX buffer.
    // console.log("Skipping extractXmlRootFromDocx example in this simple test block.");

    console.log("--- Finished utils.ts examples ---");
}

//This structure is for modules that might be run directly.
//Using `process.argv.includes(__filename)` or similar for ES modules,
//or `if (require.main === module)` for CommonJS.
//For simplicity, we'll just invoke it if not imported, which is tricky to check universally.
//A common pattern is just to run it or export it for test runners.
//If this file is executed directly with Node.js:
if (typeof require !== 'undefined' && require.main === module) {
    runExamples().catch(error => {
        console.error("Error during example execution:", error);
        process.exit(1);
    });
} 