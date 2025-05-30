import {
  // extractElement, // Not directly used as direct key access is common for pPr, numPr etc.
  extractAttribute,
  safeInt,
  DEFAULT_ATTRIBUTE_PREFIX,
} from '../../helpers/common_helpers';
import {
  ParagraphModel,
  RunModel,
  // ParagraphStylePropertiesModel, // Type is inferred
  NumberingModel as ParagraphNumberingModel, // Renaming to avoid clash if a general NumberingModel is imported
} from '../../models/index';
import { parseParagraphProperties } from '../styles/paragraph_properties_parser';
import { parseRun } from './run_parser';

/**
 * Helper to ensure an element is an array for easier iteration.
 * @param item The item to ensure is an array.
 * @returns An array, either the item itself if it's an array, a new array containing the item, or an empty array if the item is null/undefined.
 */
const ensureArray = (item: any): any[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  return [item];
};

/**
 * Parses a <w:p> (Paragraph) element from DOCX XML.
 * @param pElement The <w:p> XML element object.
 * @param attributeObjectPrefix The prefix used by fast-xml-parser for attribute objects.
 * @param preserveOrderElementName The key for the array of ordered child elements (e.g., "$$").
 * @returns A ParagraphModel object or undefined if parsing fails or input is invalid.
 */
export function parseParagraph(
  pElement: any | undefined,
  attributeObjectPrefix: string = DEFAULT_ATTRIBUTE_PREFIX,
  preserveOrderElementName: string = "$$" // Default based on common fast-xml-parser usage
): ParagraphModel | undefined {
  if (!pElement) {
    return undefined;
  }

  // Paragraph Properties (<w:pPr>)
  const pPrElement = pElement['w:pPr'];
  let paragraphProperties = parseParagraphProperties(pPrElement, attributeObjectPrefix);

  let paragraphNumbering: ParagraphNumberingModel | undefined = undefined;

  if (pPrElement) {
    // Style ID
    const pStyleElement = pPrElement['w:pStyle'];
    if (pStyleElement) {
      const styleId = extractAttribute(pStyleElement, 'w:val', attributeObjectPrefix);
      if (styleId) {
        if (!paragraphProperties) {
          // Initialize with a minimal structure if no other pPr were found
          // This ensures style_id can be set.
          // ParagraphStylePropertiesModel.parse({}) would fail if it has required fields.
          // Assuming ParagraphStylePropertiesModel's fields are all optional or have defaults
          // or we rely on Zod's .default() or .optional() for all fields.
          // For now, create a partial object.
          paragraphProperties = { style_id: styleId } as any; // Cast as any if model has required fields
        } else {
          paragraphProperties.style_id = styleId;
        }
      }
    }

    // Numbering Information
    const numPrElement = pPrElement['w:numPr'];
    if (numPrElement) {
      const ilvlElement = numPrElement['w:ilvl'];
      const numIdElement = numPrElement['w:numId'];

      const ilvlVal = ilvlElement ? extractAttribute(ilvlElement, 'w:val', attributeObjectPrefix) : undefined;
      const numIdVal = numIdElement ? extractAttribute(numIdElement, 'w:val', attributeObjectPrefix) : undefined;
      
      const ilvl = safeInt(ilvlVal);
      const numId = safeInt(numIdVal);

      if (ilvl !== undefined && numId !== undefined) {
        try {
          // Using the NumberingModel from paragraph_models.ts which is { ilvl: number, numId: number }
          // This was aliased to ParagraphNumberingModel at import.
          paragraphNumbering = ParagraphNumberingModel.parse({ ilvl, numId });
        } catch (error) {
            console.error("Error parsing paragraph numbering properties:", error, {ilvl, numId});
        }
      }
    }
  }
  
  // Ensure paragraphProperties is at least an empty object if it's still undefined,
  // if ParagraphModel requires `properties` to be defined.
  // Based on current ParagraphModel, `properties` is required.
  // If no pPr element existed at all, parseParagraphProperties would return undefined.
  if (!paragraphProperties) {
      // This will be validated by ParagraphModel.parse later.
      // If ParagraphStylePropertiesModel has required fields, this might need default values.
      // For now, an empty object might fail if style_id is the only thing that could be there
      // and that's also missing.
      // Let's assume that if pPr is totally missing, then an empty properties object is fine
      // and the style resolver will apply defaults.
      paragraphProperties = {} as any; // Cast if it has required fields, let Zod catch it.
  }


  // Extract Runs and other content
  const runs: RunModel[] = [];
  const orderedChildren = pElement[preserveOrderElementName];

  if (Array.isArray(orderedChildren)) {
    for (const childWrapper of orderedChildren) {
      const tagName = Object.keys(childWrapper)[0];
      const childElement = childWrapper[tagName];

      if (tagName === 'w:r') {
        const run = parseRun(childElement, attributeObjectPrefix, preserveOrderElementName);
        if (run) {
          runs.push(run);
        }
      }
      // TODO: Add cases for <w:hyperlink>, <w:smartTag>, <w:bookmarkStart>, <w:commentRangeStart> etc.
      // Example for hyperlink (simplified, actual hyperlinks have r inside):
      // else if (tagName === 'w:hyperlink') {
      //   const hyperlinkRuns = ensureArray(childElement['w:r']);
      //   for (const rEl of hyperlinkRuns) {
      //      const run = parseRun(rEl, attributeObjectPrefix, preserveOrderElementName);
      //      if (run) runs.push(run); // May need to mark these runs as part of a hyperlink
      //   }
      // }
    }
  } else {
    // Fallback if order is not preserved (less ideal)
    console.warn("Paragraph children order not preserved or no children array found. Parsing 'w:r' by direct access (order may be lost). Element:", pElement);
    const runElements = ensureArray(pElement['w:r']);
    for (const rElement of runElements) {
      const run = parseRun(rElement, attributeObjectPrefix, preserveOrderElementName);
      if (run) {
        runs.push(run);
      }
    }
  }

  try {
    const paragraphData: {
        properties: any; // Let Zod infer from ParagraphStylePropertiesModel
        runs: RunModel[];
        numbering?: ParagraphNumberingModel;
    } = {
        properties: paragraphProperties, // This might be an empty object or partially filled
        runs: runs,
    };
    if (paragraphNumbering) {
        paragraphData.numbering = paragraphNumbering;
    }

    return ParagraphModel.parse(paragraphData);
  } catch (error) {
    console.error("Error parsing ParagraphModel:", error, "Input pElement:", pElement, "Parsed properties:", paragraphProperties, "Parsed runs:", runs, "Parsed numbering:", paragraphNumbering);
    return undefined;
  }
}
