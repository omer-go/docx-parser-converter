import {
  extractAttribute,
  safeInt,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import { convertTwipsToPoints } from '../../utils';
import { DocMarginsModel } from '../../models/index';

/**
 * Parses the <w:pgMar> (Page Margins) element usually found within <w:sectPr> from DOCX XML.
 * @param sectPrElement The <w:sectPr> XML element object that contains <w:pgMar>, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A DocMarginsModel object or undefined if no margin properties are found or input is invalid.
 */
export function parseMargins(
  sectPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): DocMarginsModel | undefined {
  if (!sectPrElement) {
    return undefined;
  }

  const pgMarElement = sectPrElement['w:pgMar'];
  if (!pgMarElement) {
    // console.debug("No <w:pgMar> element found in <w:sectPr>.");
    return undefined;
  }

  const props: Partial<DocMarginsModel> = {};

  /**
   * Helper to extract a margin attribute, convert its value to points.
   * @param attrName The name of the attribute (e.g., 'w:top', 'w:left').
   * @returns The margin value in points, or undefined if not found or invalid.
   */
  const getMarginValue = (attrName: string): number | undefined => {
    const valStr = extractAttribute(pgMarElement, attrName, attributesGroupName);
    const valTwips = safeInt(valStr);
    if (valTwips !== undefined) {
      return convertTwipsToPoints(valTwips);
    }
    return undefined;
  };

  props.top_pt = getMarginValue('w:top');

  // For left/right, 'start'/'end' can be used in LTR/RTL contexts.
  // 'right' or 'end' for the right margin.
  // 'left' or 'start' for the left margin.
  // Assuming LTR context primarily, where 'left'/'right' are preferred if present.
  const rightMargin = getMarginValue('w:right');
  const endMargin = getMarginValue('w:end'); // Typically for RTL "right"
  props.right_pt = rightMargin ?? endMargin;

  props.bottom_pt = getMarginValue('w:bottom');

  const leftMargin = getMarginValue('w:left');
  const startMargin = getMarginValue('w:start'); // Typically for RTL "left"
  props.left_pt = leftMargin ?? startMargin;

  props.header_pt = getMarginValue('w:header');
  props.footer_pt = getMarginValue('w:footer');
  props.gutter_pt = getMarginValue('w:gutter');

  // Filter out undefined properties before checking if the object is empty
  const filteredProps = Object.fromEntries(
    Object.entries(props).filter(([_, v]) => v !== undefined)
  ) as Partial<DocMarginsModel>;


  if (Object.keys(filteredProps).length > 0) {
    try {
      return DocMarginsModel.parse(filteredProps);
    } catch (error) {
      console.error(
        "Error parsing DocMarginsModel:",
        error,
        "Input props:", filteredProps,
        "Original pgMarElement:", pgMarElement
      );
      return undefined;
    }
  }

  // console.debug("No valid margin attributes found in <w:pgMar>.");
  return undefined;
}
