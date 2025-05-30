import {
  extractElement,
  extractAttribute,
  safeInt,
  extractBooleanAttribute,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import { convertTwipsToPoints } from '../../utils';
import {
  TableRowPropertiesModel,
  TableCellBordersModel,
  ShadingPropertiesModel,
  BorderPropertiesModel,
} from '../../models/index';

// --- Internal Helper Parsers ---

/**
 * Parses a border element (e.g., <w:top>, <w:left>) within <w:tblBorders> for a row.
 * @param borderElement The border XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial BorderPropertiesModel or undefined.
 */
function parseTrBorder(borderElement: any, attrPrefix: string): Partial<BorderPropertiesModel> | undefined {
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
 * Parses a <w:tblBorders> element within <w:trPr>.
 * These are default cell borders for the row.
 * @param tblBordersElement The <w:tblBorders> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableCellBordersModel or undefined.
 */
function parseTrCellBorders(tblBordersElement: any, attrPrefix: string): Partial<TableCellBordersModel> | undefined {
  if (!tblBordersElement) return undefined;
  const borders: Partial<TableCellBordersModel> = {};

  borders.top = parseTrBorder(tblBordersElement['w:top'], attrPrefix);
  borders.left = parseTrBorder(tblBordersElement['w:left'], attrPrefix);
  borders.bottom = parseTrBorder(tblBordersElement['w:bottom'], attrPrefix);
  borders.right = parseTrBorder(tblBordersElement['w:right'], attrPrefix);
  borders.insideH = parseTrBorder(tblBordersElement['w:insideH'], attrPrefix);
  borders.insideV = parseTrBorder(tblBordersElement['w:insideV'], attrPrefix);

  const filteredBorders = Object.fromEntries(Object.entries(borders).filter(([_, v]) => v !== undefined));
  return Object.keys(filteredBorders).length > 0 ? filteredBorders : undefined;
}

/**
 * Parses a <w:shd> (shading) element within <w:trPr>.
 * @param shdElement The <w:shd> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial ShadingPropertiesModel or undefined.
 */
function parseTrShading(shdElement: any, attrPrefix: string): Partial<ShadingPropertiesModel> | undefined {
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

// --- Main Exported Parser ---

/**
 * Parses the <w:trPr> (Table Row Properties) element from DOCX XML.
 * @param trPrElement The <w:trPr> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A TableRowPropertiesModel object or undefined if no properties are found or input is invalid.
 */
export function parseTableRowProperties(
  trPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): TableRowPropertiesModel | undefined {
  if (!trPrElement) {
    return undefined;
  }

  const props: Partial<TableRowPropertiesModel> = {};

  // Row Height (<w:trHeight>)
  const trHeightElement = extractElement(trPrElement, 'w:trHeight');
  if (trHeightElement) {
    const heightValStr = extractAttribute(trHeightElement, 'w:val', attributesGroupName);
    const heightTwips = safeInt(heightValStr);
    if (heightTwips !== undefined) {
      props.trHeight_val = convertTwipsToPoints(heightTwips);
    }
    const hRule = extractAttribute(trHeightElement, 'w:hRule', attributesGroupName);
    if (hRule) {
      props.trHeight_hRule = hRule;
    }
  }

  // Table Header (<w:tblHeader/>)
  const tblHeaderElement = extractElement(trPrElement, 'w:tblHeader');
  if (tblHeaderElement !== undefined) { // Presence of the element matters
    props.tblHeader = extractBooleanAttribute(tblHeaderElement, 'w:val', attributesGroupName);
  }

  // Justification (<w:jc>) - Table row justification
  const jcElement = extractElement(trPrElement, 'w:jc');
  if (jcElement) {
    props.justification = extractAttribute(jcElement, 'w:val', attributesGroupName);
  }

  // CantSplit (<w:cantSplit/>)
  const cantSplitElement = extractElement(trPrElement, 'w:cantSplit');
  if (cantSplitElement !== undefined) { // Presence of the element matters
    props.cantSplit = extractBooleanAttribute(cantSplitElement, 'w:val', attributesGroupName);
  }

  // Cell Spacing (<w:tblCellSpacing>)
  const tblCellSpacingElement = extractElement(trPrElement, 'w:tblCellSpacing');
  if (tblCellSpacingElement) {
    const spacingValStr = extractAttribute(tblCellSpacingElement, 'w:w', attributesGroupName);
    const spacingTwips = safeInt(spacingValStr);
    if (spacingTwips !== undefined) {
      props.tblCellSpacing_val = convertTwipsToPoints(spacingTwips);
    }
    const spacingType = extractAttribute(tblCellSpacingElement, 'w:type', attributesGroupName);
    if (spacingType) {
      props.tblCellSpacing_type = spacingType;
    }
  }

  // Borders (<w:tblBorders>) - Default cell borders for the row
  props.tblBorders = parseTrCellBorders(extractElement(trPrElement, 'w:tblBorders'), attributesGroupName);

  // Shading (<w:shd>) - Default shading for the row
  props.shd = parseTrShading(extractElement(trPrElement, 'w:shd'), attributesGroupName);


  // Filter out undefined properties before final check and parse
  const filteredProps = Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined));

  if (Object.keys(filteredProps).length > 0) {
    try {
      return TableRowPropertiesModel.parse(filteredProps);
    } catch (error) {
      console.error("Error parsing TableRowPropertiesModel:", error, "Input props:", filteredProps, "Original trPrElement:", trPrElement);
      return undefined;
    }
  }
  return undefined;
}
