import { XMLParser } from 'fast-xml-parser';
import {
  extractElement,
  extractAttribute,
  safeInt,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
// import { convertTwipsToPoints } from '../../utils'; // Not directly used here, but by property parsers
import {
  NumberingModel,
  NumberingInstanceModel,
  NumberingLevelModel,
  IndentationPropertiesModel, // For typing if needed, though props are partial
  FontPropertiesModel,      // For typing if needed
} from '../../models/index'; // Assuming models are exported via an index.ts
import { parseParagraphProperties } from '../styles/paragraph_properties_parser';
import { parseRunProperties } from '../styles/run_properties_parser';

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
 * Parses properties from a <w:lvl> element.
 * @param lvlElement The <w:lvl> XML element object.
 * @param numId The numId of the parent numbering instance.
 * @param ilvl The ilvl of this level.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A partial NumberingLevelModel object.
 */
function parseLevelProperties(
  lvlElement: any,
  numId: number,
  ilvl: number,
  attributesGroupName: string
): Partial<NumberingLevelModel> {
  const props: Partial<NumberingLevelModel> = { numId, ilvl };

  const start = extractAttribute(extractElement(lvlElement, 'w:start'), 'w:val', attributesGroupName);
  props.start = safeInt(start) ?? 1; // Default start to 1 if not specified

  const numFmt = extractAttribute(extractElement(lvlElement, 'w:numFmt'), 'w:val', attributesGroupName);
  if (numFmt) props.numFmt = numFmt;

  const lvlText = extractAttribute(extractElement(lvlElement, 'w:lvlText'), 'w:val', attributesGroupName);
  if (lvlText) props.lvlText = lvlText;

  const lvlJc = extractAttribute(extractElement(lvlElement, 'w:lvlJc'), 'w:val', attributesGroupName);
  if (lvlJc) props.lvlJc = lvlJc;

  const pPrElement = lvlElement['w:pPr'];
  if (pPrElement) {
    const pStyleProps = parseParagraphProperties(pPrElement, attributesGroupName);
    if (pStyleProps?.indentation) {
      props.indent = pStyleProps.indentation;
    }
    // Extract tab position from pStyleProps.tabs if needed for numbering
    if (pStyleProps?.tabs && pStyleProps.tabs.length > 0) {
        // Assuming the relevant tab for numbering is the first one, or specific logic is needed.
        // For example, Word often uses a tab stop for the number text.
        // This simplistic approach takes the first tab. More sophisticated logic might be needed.
        // props.tab_pt = pStyleProps.tabs[0].pos; // 'pos' is already in points
    }
  }

  const rPrElement = lvlElement['w:rPr'];
  if (rPrElement) {
    const rStyleProps = parseRunProperties(rPrElement, attributesGroupName);
    if (rStyleProps?.fonts) { // Assuming fonts are the primary run property for numbering levels
      props.fonts = rStyleProps.fonts;
    }
    // Add other relevant rPr properties if needed, e.g. size, color directly to NumberingLevelModel
  }

  return props;
}

/**
 * Parses the numbering.xml file content from a DOCX document.
 * @param xmlString The string content of numbering.xml.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group (e.g., "$attributes").
 * @returns A NumberingModel object or undefined if parsing fails or input is invalid.
 */
export function parseNumberingXml(
  xmlString: string,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): NumberingModel | undefined {
  if (!xmlString) {
    return undefined;
  }

  const parser = new XMLParser({
    attributesGroupName: attributesGroupName, // Use the provided group name
    ignoreAttributes: false,
    parseTagValue: false,
    parseAttributeValue: false,
    allowBooleanAttributes: true,
    trimValues: true,
    removeNSPrefix: false,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      if (!isAttribute) {
        return jpath === "w:numbering.w:abstractNum" ||
               jpath === "w:numbering.w:num" ||
               jpath === "w:numbering.w:num.w:lvlOverride" ||
               jpath === "w:numbering.w:abstractNum.w:lvl";
      }
      return false;
    }
  });

  let numberingRoot: any;
  try {
    const parsedXml = parser.parse(xmlString);
    numberingRoot = parsedXml['w:numbering'];
  } catch (error) {
    console.error("Error parsing numbering XML:", error);
    return undefined;
  }

  if (!numberingRoot) {
    console.warn("No <w:numbering> root element found in XML.");
    return undefined;
  }

  const abstractNumMap: Map<number, any> = new Map();
  const abstractNums = ensureArray(numberingRoot['w:abstractNum']);
  for (const abstractNumElement of abstractNums) {
    const abstractNumId = safeInt(extractAttribute(abstractNumElement, 'w:abstractNumId', attributesGroupName));
    if (abstractNumId !== undefined) {
      abstractNumMap.set(abstractNumId, abstractNumElement);
    }
  }

  const instances: NumberingInstanceModel[] = [];
  const nums = ensureArray(numberingRoot['w:num']);

  for (const numElement of nums) {
    const numId = safeInt(extractAttribute(numElement, 'w:numId', attributesGroupName));
    if (numId === undefined) continue;

    const abstractNumIdVal = extractAttribute(extractElement(numElement, 'w:abstractNumId'), 'w:val', attributesGroupName);
    const abstractNumId = safeInt(abstractNumIdVal);
    if (abstractNumId === undefined) continue;

    const abstractNumElement = abstractNumMap.get(abstractNumId);
    if (!abstractNumElement) {
      console.warn(`Abstract numbering definition ID ${abstractNumId} not found for numId ${numId}.`);
      continue;
    }

    const levelDefinitions: Map<number, Partial<NumberingLevelModel>> = new Map();
    const abstractLvls = ensureArray(abstractNumElement['w:lvl']);
    for (const lvlElement of abstractLvls) {
      const ilvl = safeInt(extractAttribute(lvlElement, 'w:ilvl', attributesGroupName));
      if (ilvl !== undefined) {
        levelDefinitions.set(ilvl, parseLevelProperties(lvlElement, numId, ilvl, attributesGroupName));
      }
    }

    const lvlOverrides = ensureArray(numElement['w:lvlOverride']);
    for (const overrideElement of lvlOverrides) {
        const overrideIlvl = safeInt(extractAttribute(overrideElement, 'w:ilvl', attributesGroupName));
        if (overrideIlvl === undefined) continue;

        const startOverrideVal = extractAttribute(extractElement(overrideElement, 'w:startOverride'), 'w:val', attributesGroupName);
        if (startOverrideVal !== undefined) {
            const existingLevel = levelDefinitions.get(overrideIlvl);
            if (existingLevel) {
                existingLevel.start = safeInt(startOverrideVal); // Override start
            } else {
                 // This case should ideally not happen if abstractNum is well-formed and has this ilvl
                console.warn(`lvlOverride for numId ${numId}, ilvl ${overrideIlvl} found startOverride but no base level definition.`);
            }
        }

        const lvlElementOverride = overrideElement['w:lvl']; // Check for a full w:lvl override
        if (lvlElementOverride) {
            // Full override of the level
            levelDefinitions.set(overrideIlvl, parseLevelProperties(lvlElementOverride, numId, overrideIlvl, attributesGroupName));
        }
    }


    const levels: NumberingLevelModel[] = [];
    for (const partialLevel of levelDefinitions.values()) {
      try {
        // Ensure all required fields are present before parsing, or handle defaults in parseLevelProperties
        if (partialLevel.numFmt && partialLevel.lvlText && partialLevel.lvlJc && partialLevel.start !== undefined) {
             levels.push(NumberingLevelModel.parse(partialLevel));
        } else {
            console.warn(`Skipping level for numId ${numId}, ilvl ${partialLevel.ilvl} due to missing essential fields.`, partialLevel);
        }
      } catch (error) {
        console.error(`Error parsing NumberingLevelModel for numId ${numId}, ilvl ${partialLevel.ilvl}:`, error, partialLevel);
      }
    }

    levels.sort((a, b) => a.ilvl - b.ilvl); // Ensure levels are sorted by ilvl

    if (levels.length > 0) {
      try {
        instances.push(NumberingInstanceModel.parse({ numId, levels }));
      } catch (error) {
        console.error(`Error parsing NumberingInstanceModel for numId ${numId}:`, error);
      }
    }
  }

  try {
    return NumberingModel.parse({ instances });
  } catch (error) {
    console.error("Error parsing final NumberingModel:", error);
    return undefined;
  }
}
