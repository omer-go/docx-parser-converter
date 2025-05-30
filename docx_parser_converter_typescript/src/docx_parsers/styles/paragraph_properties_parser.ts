import {
  extractElement,
  extractAttribute,
  extractBooleanAttribute,
  safeInt,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import {
  convertTwipsToPoints,
} from '../../utils';
import {
  ParagraphStylePropertiesModel,
  SpacingPropertiesModel,
  IndentationPropertiesModel,
  TabStopModel,
} from '../../models/styles_models';

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
 * Parses the <w:pPr> (Paragraph Properties) element from DOCX XML.
 * @param pPrElement The <w:pPr> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A ParagraphStylePropertiesModel object or undefined if no properties are found or input is invalid.
 */
export function parseParagraphProperties(
  pPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): ParagraphStylePropertiesModel | undefined {
  if (!pPrElement) {
    return undefined;
  }

  const props: Partial<ParagraphStylePropertiesModel> = {};

  // Spacing (w:spacing)
  const spacingElement = extractElement(pPrElement, 'w:spacing');
  if (spacingElement) {
    const spacingProps: Partial<SpacingPropertiesModel> = {};
    const before = extractAttribute(spacingElement, 'w:before', attributesGroupName);
    const after = extractAttribute(spacingElement, 'w:after', attributesGroupName);
    const line = extractAttribute(spacingElement, 'w:line', attributesGroupName);
    // const lineRule = extractAttribute(spacingElement, 'w:lineRule', attributesGroupName); // TODO: Handle lineRule if necessary

    const beforeTwips = safeInt(before);
    if (beforeTwips !== undefined) spacingProps.before_pt = convertTwipsToPoints(beforeTwips);
    const afterTwips = safeInt(after);
    if (afterTwips !== undefined) spacingProps.after_pt = convertTwipsToPoints(afterTwips);
    const lineTwips = safeInt(line);
    if (lineTwips !== undefined) spacingProps.line_pt = convertTwipsToPoints(lineTwips);
    // if (lineRule) spacingProps.line_rule = lineRule; // Add to SpacingPropertiesModel if needed

    if (Object.keys(spacingProps).length > 0) {
      props.spacing = SpacingPropertiesModel.parse(spacingProps);
    }
  }

  // Indentation (w:ind)
  const indElement = extractElement(pPrElement, 'w:ind');
  if (indElement) {
    const indentProps: Partial<IndentationPropertiesModel> = {};
    const left = extractAttribute(indElement, 'w:left', attributesGroupName);
    const right = extractAttribute(indElement, 'w:right', attributesGroupName);
    const firstLine = extractAttribute(indElement, 'w:firstLine', attributesGroupName);
    const hanging = extractAttribute(indElement, 'w:hanging', attributesGroupName);
    const start = extractAttribute(indElement, 'w:start', attributesGroupName); // LTR: left, RTL: right
    const end = extractAttribute(indElement, 'w:end', attributesGroupName);     // LTR: right, RTL: left

    // For simplicity, assuming LTR. start maps to left, end to right.
    const leftTwips = safeInt(left || start);
    if (leftTwips !== undefined) indentProps.left_pt = convertTwipsToPoints(leftTwips);

    const rightTwips = safeInt(right || end);
    if (rightTwips !== undefined) indentProps.right_pt = convertTwipsToPoints(rightTwips);

    const firstLineTwipsVal = safeInt(firstLine);
    const hangingTwipsVal = safeInt(hanging);

    if (firstLineTwipsVal !== undefined) {
      indentProps.firstline_pt = convertTwipsToPoints(firstLineTwipsVal);
    } else if (hangingTwipsVal !== undefined) {
      indentProps.firstline_pt = -convertTwipsToPoints(hangingTwipsVal); // Hanging is negative firstLine
    }

    if (Object.keys(indentProps).length > 0) {
      props.indentation = IndentationPropertiesModel.parse(indentProps);
    }
  }

  // Outline Level (w:outlineLvl)
  const outlineLvlElement = extractElement(pPrElement, 'w:outlineLvl');
  if (outlineLvlElement) {
    const val = extractAttribute(outlineLvlElement, 'w:val', attributesGroupName);
    const level = safeInt(val);
    if (level !== undefined) props.outline_level = level;
  }

  // Widow Control (w:widowControl)
  const widowControlElement = extractElement(pPrElement, 'w:widowControl');
  if (widowControlElement !== undefined) {
    props.widow_control = extractBooleanAttribute(widowControlElement, 'w:val', attributesGroupName);
  }

  // Suppress Auto Hyphens (w:suppressAutoHyphens)
  const suppressAutoHyphensElement = extractElement(pPrElement, 'w:suppressAutoHyphens');
  if (suppressAutoHyphensElement !== undefined) {
    props.suppress_auto_hyphens = extractBooleanAttribute(suppressAutoHyphensElement, 'w:val', attributesGroupName);
  }

  // BiDi (w:bidi)
  const bidiElement = extractElement(pPrElement, 'w:bidi');
  if (bidiElement !== undefined) {
    props.bidi = extractBooleanAttribute(bidiElement, 'w:val', attributesGroupName);
  }

  // Justification / Alignment (w:jc)
  const jcElement = extractElement(pPrElement, 'w:jc');
  if (jcElement) {
    const val = extractAttribute(jcElement, 'w:val', attributesGroupName);
    if (val) props.alignment = val; // Maps to alignment in ParagraphStylePropertiesModel
  }

  // Keep Next (w:keepNext)
  const keepNextElement = extractElement(pPrElement, 'w:keepNext');
  if (keepNextElement !== undefined) {
    props.keep_next = extractBooleanAttribute(keepNextElement, 'w:val', attributesGroupName);
  }

  // Keep Lines (w:keepLines)
  const keepLinesElement = extractElement(pPrElement, 'w:keepLines');
  if (keepLinesElement !== undefined) {
    props.keep_lines = extractBooleanAttribute(keepLinesElement, 'w:val', attributesGroupName);
  }

  // Page Break Before (w:pageBreakBefore)
  const pageBreakBeforeElement = extractElement(pPrElement, 'w:pageBreakBefore');
  if (pageBreakBeforeElement !== undefined) {
    props.page_break_before = extractBooleanAttribute(pageBreakBeforeElement, 'w:val', attributesGroupName);
  }

  // Suppress Line Numbers (w:suppressLineNumbers)
  const suppressLineNumbersElement = extractElement(pPrElement, 'w:suppressLineNumbers');
  if (suppressLineNumbersElement !== undefined) {
    props.suppress_line_numbers = extractBooleanAttribute(suppressLineNumbersElement, 'w:val', attributesGroupName);
  }

  // Tabs (w:tabs)
  const tabsElement = extractElement(pPrElement, 'w:tabs');
  if (tabsElement) {
    const tabElements = ensureArray(tabsElement['w:tab']);
    const parsedTabs: TabStopModel[] = [];
    for (const tabEl of tabElements) {
      const type = extractAttribute(tabEl, 'w:val', attributesGroupName);
      const pos = extractAttribute(tabEl, 'w:pos', attributesGroupName);
      const posTwips = safeInt(pos);

      if (type && posTwips !== undefined) {
        try {
            parsedTabs.push(TabStopModel.parse({ val: type, pos: convertTwipsToPoints(posTwips) }));
        } catch(tabError) {
            console.error("Error parsing TabStopModel:", tabError, "Input tabEl:", tabEl);
        }
      }
    }
    if (parsedTabs.length > 0) {
      props.tabs = parsedTabs;
    }
  }

  // TODO: Add parsing for w:pBdr (paragraph borders) if needed.
  // const pBdrElement = extractElement(pPrElement, 'w:pBdr');
  // if (pBdrElement) { ... }

  if (Object.keys(props).length > 0) {
    try {
      return ParagraphStylePropertiesModel.parse(props);
    } catch (error) {
      console.error("Error parsing ParagraphStylePropertiesModel:", error, "Input props:", props, "Original pPrElement:", pPrElement);
      return undefined;
    }
  }
  return undefined;
}
