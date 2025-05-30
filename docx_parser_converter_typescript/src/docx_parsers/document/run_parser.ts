import {
  // extractElement, // Not directly used if accessing rPr via direct key
  DEFAULT_ATTRIBUTE_PREFIX,
} from '../../helpers/common_helpers';
import {
  RunModel,
  RunContentModel,
  TextContentModel,
  TabContentModel,
  // RunStylePropertiesModel, // Type is inferred from parseRunProperties return
} from '../../models/index';
import { parseRunProperties } from '../styles/run_properties_parser';

/**
 * Extracts text from a <w:t> element, considering potential internal structure.
 * Assumes textNodeName is '#text' if tElement is an object.
 * @param tElement The <w:t> element object from fast-xml-parser.
 * @returns The extracted text string.
 */
function extractTextFromTextElement(tElement: any): string {
  if (typeof tElement === 'string') {
    return tElement; // Text directly under <w:t> (no attributes, no children for w:t)
  }
  if (typeof tElement === 'object' && tElement !== null) {
    // Check for xml:space="preserve" attribute if significant whitespace handling is needed
    // const attributes = tElement[DEFAULT_ATTRIBUTE_PREFIX];
    // if (attributes && attributes['xml:space'] === 'preserve') { ... }
    if (typeof tElement['#text'] === 'string') {
      return tElement['#text']; // Text is in #text property
    }
  }
  return ''; // Default to empty string if text cannot be extracted
}

/**
 * Parses a <w:r> (Run) element from DOCX XML.
 * @param rElement The <w:r> XML element object.
 * @param attributeObjectPrefix The prefix used by fast-xml-parser for attribute objects.
 * @param preserveOrderElementName The key for the array of ordered child elements (e.g., "$$").
 * @returns A RunModel object or undefined if parsing fails or input is invalid.
 */
export function parseRun(
  rElement: any | undefined,
  attributeObjectPrefix: string = DEFAULT_ATTRIBUTE_PREFIX,
  preserveOrderElementName: string = "$$" // Default based on common fast-xml-parser usage for order
): RunModel | undefined {
  if (!rElement) {
    return undefined;
  }

  // Parse Run Properties (<w:rPr>)
  const rPrElement = rElement['w:rPr'];
  const properties = parseRunProperties(rPrElement, attributeObjectPrefix);

  // Extract Run Contents
  const contents: RunContentModel[] = [];
  const orderedChildren = rElement[preserveOrderElementName];

  if (Array.isArray(orderedChildren)) {
    for (const childWrapper of orderedChildren) {
      const tagName = Object.keys(childWrapper)[0]; // e.g., "w:t", "w:tab"
      const childElement = childWrapper[tagName];

      if (tagName === 'w:t') {
        const textContent = extractTextFromTextElement(childElement);
        // Text content can sometimes be an empty string from the parser if the tag is empty e.g. <w:t/>
        // or if it only contains attributes. We should still add it if it's a valid w:t tag.
        contents.push({ item: TextContentModel.parse({ text: textContent }) });
      } else if (tagName === 'w:tab') {
        contents.push({ item: TabContentModel.parse({}) }); // type defaults to 'tab' in model
      }
      // TODO: Add cases for <w:br>, <w:drawing>, <w:instrText>, etc.
      // Example for <w:br>:
      // else if (tagName === 'w:br') {
      //   // Assuming BreakContentModel exists and RunContentModel's union includes it
      //   contents.push({ item: BreakContentModel.parse({}) });
      // }
    }
  } else {
    // Fallback or warning if order is not preserved (less ideal)
    // This part might be removed if preserveOrder is strictly enforced for document.xml
    console.warn("Run children order not preserved or no children array found. Parsing 'w:t' and 'w:tab' by direct access (order may be lost). Element:", rElement);
    if (rElement['w:t'] !== undefined) {
        // This needs to handle cases where w:t might be an array or single object
        const textElements = Array.isArray(rElement['w:t']) ? rElement['w:t'] : [rElement['w:t']];
        for (const tEl of textElements) {
            const textContent = extractTextFromTextElement(tEl);
            contents.push({ item: TextContentModel.parse({ text: textContent }) });
        }
    }
    if (rElement['w:tab'] !== undefined) {
         // Similar handling if w:tab can be multiple without order preservation
        const tabElements = Array.isArray(rElement['w:tab']) ? rElement['w:tab'] : [rElement['w:tab']];
        for (const _tabEl of tabElements) { // _tabEl not used if TabContentModel.parse({}) is okay
            contents.push({ item: TabContentModel.parse({}) });
        }
    }
  }

  try {
    // A run must have content unless it's a special run for a field code or similar.
    // For now, we don't strictly require content, but it's typical.
    // If `contents` is empty, and `properties` is also undefined, we might return undefined.
    if (contents.length === 0 && !properties) {
        // This could be a run that only contains, e.g., a <w:lastRenderedPageBreak/>
        // or other non-content marker. For now, return undefined if no standard content/props.
        // Or, return an empty run if that's more appropriate for the consumer.
        // console.debug("Parsed run has no standard content or properties:", rElement);
        return undefined;
    }
    return RunModel.parse({ properties, contents });
  } catch (error) {
    console.error("Error parsing RunModel:", error, "Input rElement:", rElement, "Parsed props:", properties, "Parsed contents:", contents);
    return undefined;
  }
}
