import {
  extractElement,
  extractAttribute,
  safeInt,
  extractBooleanAttribute,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import { convertTwipsToPoints } from '../../utils';
import {
  TableCellPropertiesModel,
  TableWidthModel,
  TableCellBordersModel,
  ShadingPropertiesModel,
  MarginPropertiesModel,
  BorderPropertiesModel,
} from '../../models/index';

// --- Internal Helper Parsers (specific to TableCellProperties context) ---

/**
 * Parses a cell border element (e.g., <w:top>, <w:left> within <w:tcBorders>).
 * @param borderElement The border XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial BorderPropertiesModel or undefined.
 */
function parseTcBorder(borderElement: any, attrPrefix: string): Partial<BorderPropertiesModel> | undefined {
  if (!borderElement) return undefined;
  const props: Partial<BorderPropertiesModel> = {};
  const color = extractAttribute(borderElement, 'w:color', attrPrefix);
  const size = extractAttribute(borderElement, 'w:sz', attrPrefix); // Eighths of a point
  const space = extractAttribute(borderElement, 'w:space', attrPrefix); // Points
  const val = extractAttribute(borderElement, 'w:val', attrPrefix); // Border style string

  if (color) props.color = color;
  if (size) props.size = safeInt(size);
  if (space) props.space = safeInt(space);
  if (val) props.val = val;

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a <w:tcBorders> element.
 * @param tcBordersElement The <w:tcBorders> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableCellBordersModel or undefined.
 */
function parseTcBorders(tcBordersElement: any, attrPrefix: string): Partial<TableCellBordersModel> | undefined {
  if (!tcBordersElement) return undefined;
  const borders: Partial<TableCellBordersModel> = {};

  borders.top = parseTcBorder(tcBordersElement['w:top'], attrPrefix);
  borders.left = parseTcBorder(tcBordersElement['w:left'], attrPrefix);
  borders.bottom = parseTcBorder(tcBordersElement['w:bottom'], attrPrefix);
  borders.right = parseTcBorder(tcBordersElement['w:right'], attrPrefix);
  // Note: <w:tcBorders> does not typically have <w:insideH> or <w:insideV>. These are table-level.
  // If they were needed, they would be parsed here. For now, sticking to common tcBorders children.

  const filteredBorders = Object.fromEntries(Object.entries(borders).filter(([_, v]) => v !== undefined));
  return Object.keys(filteredBorders).length > 0 ? filteredBorders : undefined;
}

/**
 * Parses a <w:shd> (shading) element within <w:tcPr>.
 * @param shdElement The <w:shd> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial ShadingPropertiesModel or undefined.
 */
function parseTcShading(shdElement: any, attrPrefix: string): Partial<ShadingPropertiesModel> | undefined {
  if (!shdElement) return undefined;
  const props: Partial<ShadingPropertiesModel> = {};
  const fill = extractAttribute(shdElement, 'w:fill', attrPrefix);
  const val = extractAttribute(shdElement, 'w:val', attrPrefix);
  const color = extractAttribute(shdElement, 'w:color', attrPrefix);

  if (fill) props.fill = fill;
  if (val) props.val = val;
  if (color) props.color = color;

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a <w:tcW> (table cell width) element.
 * @param tcWElement The <w:tcW> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableWidthModel or undefined.
 */
function parseTcWidth(tcWElement: any, attrPrefix: string): Partial<TableWidthModel> | undefined {
  if (!tcWElement) return undefined;
  const props: Partial<TableWidthModel> = {};
  const w = extractAttribute(tcWElement, 'w:w', attrPrefix);
  const type = extractAttribute(tcWElement, 'w:type', attrPrefix);

  if (w) props.val = safeInt(w);
  if (type) props.type = type;

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a cell margin property element (e.g., <w:top> within <w:tcMar>).
 * @param marginContainer The parent element <w:tcMar>.
 * @param tagName The specific margin tag name (e.g., "w:top").
 * @param attrPrefix The attribute prefix.
 * @returns The margin value in points or undefined.
 */
function parseTcMarginProperty(marginContainer: any, tagName: string, attrPrefix: string): number | undefined {
  const marginElement = marginContainer ? marginContainer[tagName] : undefined;
  if (!marginElement) return undefined;
  const w = extractAttribute(marginElement, 'w:w', attrPrefix);
  // const type = extractAttribute(marginElement, 'w:type', attrPrefix); // Usually 'dxa'
  const valTwips = safeInt(w);
  return valTwips !== undefined ? convertTwipsToPoints(valTwips) : undefined;
}

/**
 * Parses a <w:tcMar> (table cell margins) element.
 * @param tcMarElement The <w:tcMar> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial MarginPropertiesModel or undefined.
 */
function parseTcCellMargins(tcMarElement: any, attrPrefix: string): Partial<MarginPropertiesModel> | undefined {
  if (!tcMarElement) return undefined;
  const margins: Partial<MarginPropertiesModel> = {};

  margins.top_pt = parseTcMarginProperty(tcMarElement, 'w:top', attrPrefix);
  margins.left_pt = parseTcMarginProperty(tcMarElement, 'w:left', attrPrefix);
  margins.bottom_pt = parseTcMarginProperty(tcMarElement, 'w:bottom', attrPrefix);
  margins.right_pt = parseTcMarginProperty(tcMarElement, 'w:right', attrPrefix);

  const filteredMargins = Object.fromEntries(Object.entries(margins).filter(([_, v]) => v !== undefined));
  return Object.keys(filteredMargins).length > 0 ? filteredMargins : undefined;
}


// --- Main Exported Parser ---

/**
 * Parses the <w:tcPr> (Table Cell Properties) element from DOCX XML.
 * @param tcPrElement The <w:tcPr> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A TableCellPropertiesModel object or undefined if no properties are found or input is invalid.
 */
export function parseTableCellProperties(
  tcPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): TableCellPropertiesModel | undefined {
  if (!tcPrElement) {
    return undefined;
  }

  const props: Partial<TableCellPropertiesModel> = {};

  props.width = parseTcWidth(tcPrElement['w:tcW'], attributesGroupName);
  props.borders = parseTcBorders(tcPrElement['w:tcBorders'], attributesGroupName);
  props.shading = parseTcShading(tcPrElement['w:shd'], attributesGroupName);
  props.margins = parseTcCellMargins(tcPrElement['w:tcMar'], attributesGroupName);

  const textDirectionElement = extractElement(tcPrElement, 'w:textDirection');
  if (textDirectionElement) {
    props.textDirection = extractAttribute(textDirectionElement, 'w:val', attributesGroupName);
  }

  const vAlignElement = extractElement(tcPrElement, 'w:vAlign');
  if (vAlignElement) {
    props.vAlign = extractAttribute(vAlignElement, 'w:val', attributesGroupName);
  }

  const hideMarkElement = extractElement(tcPrElement, 'w:hideMark');
  if (hideMarkElement !== undefined) { // Boolean property, presence matters
    props.hideMark = extractBooleanAttribute(hideMarkElement, 'w:val', attributesGroupName);
  }

  const noWrapElement = extractElement(tcPrElement, 'w:noWrap');
  if (noWrapElement !== undefined) {
    props.noWrap = extractBooleanAttribute(noWrapElement, 'w:val', attributesGroupName);
  }

  const vMergeElement = extractElement(tcPrElement, 'w:vMerge');
  if (vMergeElement) {
    // vMerge can be an empty tag (implies 'continue') or have w:val="restart"
    const vMergeVal = extractAttribute(vMergeElement, 'w:val', attributesGroupName);
    props.vMerge = vMergeVal ? vMergeVal : 'continue'; // Default to 'continue' if element present but no val
  }

  const gridSpanElement = extractElement(tcPrElement, 'w:gridSpan');
  if (gridSpanElement) {
    const val = extractAttribute(gridSpanElement, 'w:val', attributesGroupName);
    props.gridSpan = safeInt(val);
  }

  // Filter out undefined properties before final check and parse
  const filteredProps = Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined));

  if (Object.keys(filteredProps).length > 0) {
    try {
      return TableCellPropertiesModel.parse(filteredProps);
    } catch (error) {
      console.error("Error parsing TableCellPropertiesModel:", error, "Input props:", filteredProps, "Original tcPrElement:", tcPrElement);
      return undefined;
    }
  }
  return undefined;
}
