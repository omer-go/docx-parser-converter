import {
  extractElement,
  extractAttribute,
  safeInt,
  extractBooleanAttribute,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import { convertTwipsToPoints } from '../../utils';
import {
  TablePropertiesModel,
  TableWidthModel,
  TableIndentModel,
  TableLookModel,
  TableCellBordersModel,
  ShadingPropertiesModel,
  MarginPropertiesModel,
  BorderPropertiesModel,
} from '../../models/index';

// --- Internal Helper Parsers ---

/**
 * Parses a border element (e.g., <w:top>, <w:left>).
 * @param borderElement The border XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial BorderPropertiesModel or undefined.
 */
function parseBorder(borderElement: any, attrPrefix: string): Partial<BorderPropertiesModel> | undefined {
  if (!borderElement) return undefined;
  const props: Partial<BorderPropertiesModel> = {};
  const color = extractAttribute(borderElement, 'w:color', attrPrefix);
  const size = extractAttribute(borderElement, 'w:sz', attrPrefix); // Eighths of a point
  const space = extractAttribute(borderElement, 'w:space', attrPrefix); // Points
  const val = extractAttribute(borderElement, 'w:val', attrPrefix); // Border style string

  if (color) props.color = color;
  if (size) props.size = safeInt(size); // Stored as eighths of a point
  if (space) props.space = safeInt(space); // Stored as points
  if (val) props.val = val;

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a <w:tblBorders> element.
 * @param tblBordersElement The <w:tblBorders> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableCellBordersModel or undefined.
 */
function parseTableCellBorders(tblBordersElement: any, attrPrefix: string): Partial<TableCellBordersModel> | undefined {
  if (!tblBordersElement) return undefined;
  const borders: Partial<TableCellBordersModel> = {};

  borders.top = parseBorder(tblBordersElement['w:top'], attrPrefix);
  borders.left = parseBorder(tblBordersElement['w:left'], attrPrefix);
  borders.bottom = parseBorder(tblBordersElement['w:bottom'], attrPrefix);
  borders.right = parseBorder(tblBordersElement['w:right'], attrPrefix);
  borders.insideH = parseBorder(tblBordersElement['w:insideH'], attrPrefix);
  borders.insideV = parseBorder(tblBordersElement['w:insideV'], attrPrefix);

  // Filter out undefined border properties before checking if the object is empty
  const filteredBorders = Object.fromEntries(Object.entries(borders).filter(([_, v]) => v !== undefined));
  return Object.keys(filteredBorders).length > 0 ? filteredBorders : undefined;
}

/**
 * Parses a <w:shd> (shading) element.
 * @param shdElement The <w:shd> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial ShadingPropertiesModel or undefined.
 */
function parseShadingProperties(shdElement: any, attrPrefix: string): Partial<ShadingPropertiesModel> | undefined {
  if (!shdElement) return undefined;
  const props: Partial<ShadingPropertiesModel> = {};
  const fill = extractAttribute(shdElement, 'w:fill', attrPrefix);
  const val = extractAttribute(shdElement, 'w:val', attrPrefix); // Shading pattern
  const color = extractAttribute(shdElement, 'w:color', attrPrefix); // Foreground color

  if (fill) props.fill = fill;
  if (val) props.val = val;
  if (color) props.color = color;

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a <w:tblW> (table width) or <w:tcW> (cell width) element.
 * @param widthElement The width XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableWidthModel or undefined.
 */
function parseTableWidth(widthElement: any, attrPrefix: string): Partial<TableWidthModel> | undefined {
  if (!widthElement) return undefined;
  const props: Partial<TableWidthModel> = {};
  const w = extractAttribute(widthElement, 'w:w', attrPrefix);
  const type = extractAttribute(widthElement, 'w:type', attrPrefix);

  if (w) props.val = safeInt(w); // Value (dxa or fiftieths of a percent)
  if (type) props.type = type; // Type (dxa, pct, auto, nil)

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a <w:tblInd> (table indent) element.
 * @param tblIndElement The <w:tblInd> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableIndentModel or undefined.
 */
function parseTableIndent(tblIndElement: any, attrPrefix: string): Partial<TableIndentModel> | undefined {
  if (!tblIndElement) return undefined;
  const props: Partial<TableIndentModel> = {};
  const w = extractAttribute(tblIndElement, 'w:w', attrPrefix); // Width in twips
  const type = extractAttribute(tblIndElement, 'w:type', attrPrefix);

  if (w) props.val = convertTwipsToPoints(safeInt(w) ?? 0); // Value in points
  if (type) props.type = type; // Should be 'dxa'

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Parses a margin property element (e.g., <w:top w:w="val" w:type="dxa">).
 * @param marginContainer The parent element containing the margin elements (e.g., <w:tblCellMar>).
 * @param tagName The specific margin tag name (e.g., "w:top", "w:left").
 * @param attrPrefix The attribute prefix.
 * @returns The margin value in points or undefined.
 */
function parseMarginProperty(marginContainer: any, tagName: string, attrPrefix: string): number | undefined {
  const marginElement = marginContainer ? marginContainer[tagName] : undefined;
  if (!marginElement) return undefined;
  const w = extractAttribute(marginElement, 'w:w', attrPrefix);
  // const type = extractAttribute(marginElement, 'w:type', attrPrefix); // Usually 'dxa'
  const valTwips = safeInt(w);
  return valTwips !== undefined ? convertTwipsToPoints(valTwips) : undefined;
}

/**
 * Parses a <w:tblCellMar> (table cell margins) element.
 * @param tblCellMarElement The <w:tblCellMar> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial MarginPropertiesModel or undefined.
 */
function parseCellMargins(tblCellMarElement: any, attrPrefix: string): Partial<MarginPropertiesModel> | undefined {
  if (!tblCellMarElement) return undefined;
  const margins: Partial<MarginPropertiesModel> = {};

  margins.top_pt = parseMarginProperty(tblCellMarElement, 'w:top', attrPrefix);
  margins.left_pt = parseMarginProperty(tblCellMarElement, 'w:left', attrPrefix);
  margins.bottom_pt = parseMarginProperty(tblCellMarElement, 'w:bottom', attrPrefix);
  margins.right_pt = parseMarginProperty(tblCellMarElement, 'w:right', attrPrefix);

  const filteredMargins = Object.fromEntries(Object.entries(margins).filter(([_, v]) => v !== undefined));
  return Object.keys(filteredMargins).length > 0 ? filteredMargins : undefined;
}

/**
 * Parses a <w:tblLook> element.
 * @param tblLookElement The <w:tblLook> XML element object.
 * @param attrPrefix The attribute prefix.
 * @returns A partial TableLookModel or undefined.
 */
function parseTableLook(tblLookElement: any, attrPrefix: string): Partial<TableLookModel> | undefined {
  if (!tblLookElement) return undefined;
  const props: Partial<TableLookModel> = {};

  // Direct boolean attributes (優先)
  const firstRow = extractBooleanAttribute(tblLookElement, 'w:firstRow', attrPrefix);
  const lastRow = extractBooleanAttribute(tblLookElement, 'w:lastRow', attrPrefix);
  const firstColumn = extractBooleanAttribute(tblLookElement, 'w:firstColumn', attrPrefix);
  const lastColumn = extractBooleanAttribute(tblLookElement, 'w:lastColumn', attrPrefix);
  const noHBand = extractBooleanAttribute(tblLookElement, 'w:noHBand', attrPrefix);
  const noVBand = extractBooleanAttribute(tblLookElement, 'w:noVBand', attrPrefix);

  if (firstRow !== undefined) props.firstRow = firstRow;
  if (lastRow !== undefined) props.lastRow = lastRow;
  if (firstColumn !== undefined) props.firstColumn = firstColumn;
  if (lastColumn !== undefined) props.lastColumn = lastColumn;
  if (noHBand !== undefined) props.noHBand = noHBand;
  if (noVBand !== undefined) props.noVBand = noVBand;

  // Fallback to w:val hex value if direct attributes are not conclusive (all undefined)
  if (Object.keys(props).length === 0) {
    const valHex = extractAttribute(tblLookElement, 'w:val', attrPrefix);
    const valInt = valHex ? parseInt(valHex, 16) : 0;
    if (valInt > 0) {
        if ((valInt & 0x0020)) props.firstRow = true;
        if ((valInt & 0x0040)) props.lastRow = true;
        if ((valInt & 0x0080)) props.firstColumn = true;
        if ((valInt & 0x0100)) props.lastColumn = true;
        if ((valInt & 0x0200)) props.noHBand = true;
        if ((valInt & 0x0400)) props.noVBand = true;
    }
  }
  return Object.keys(props).length > 0 ? props : undefined;
}


// --- Main Exported Parser ---

/**
 * Parses the <w:tblPr> (Table Properties) element from DOCX XML.
 * @param tblPrElement The <w:tblPr> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A TablePropertiesModel object or undefined if no properties are found or input is invalid.
 */
export function parseTableProperties(
  tblPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): TablePropertiesModel | undefined {
  if (!tblPrElement) {
    return undefined;
  }

  const props: Partial<TablePropertiesModel> = {};

  const tblStyleElement = extractElement(tblPrElement, 'w:tblStyle');
  if (tblStyleElement) {
    props.style_id = extractAttribute(tblStyleElement, 'w:val', attributesGroupName);
  }

  props.width = parseTableWidth(tblPrElement['w:tblW'], attributesGroupName);

  const jcElement = extractElement(tblPrElement, 'w:jc');
  if (jcElement) {
    props.alignment = extractAttribute(jcElement, 'w:val', attributesGroupName);
  }

  props.indent = parseTableIndent(tblPrElement['w:tblInd'], attributesGroupName);
  props.cell_margins = parseCellMargins(tblPrElement['w:tblCellMar'], attributesGroupName);
  props.borders = parseTableCellBorders(tblPrElement['w:tblBorders'], attributesGroupName);
  props.shading = parseShadingProperties(tblPrElement['w:shd'], attributesGroupName);

  const tblLayoutElement = extractElement(tblPrElement, 'w:tblLayout');
  if (tblLayoutElement) {
    props.layout_type = extractAttribute(tblLayoutElement, 'w:type', attributesGroupName);
  }

  props.look = parseTableLook(tblPrElement['w:tblLook'], attributesGroupName);

  const tblCellSpacingElement = extractElement(tblPrElement, 'w:tblCellSpacing');
  if (tblCellSpacingElement) {
      const spacingVal = extractAttribute(tblCellSpacingElement, 'w:w', attributesGroupName);
      const spacingTwips = safeInt(spacingVal);
      if (spacingTwips !== undefined) {
          props.cell_spacing_dxa = spacingTwips; // Assuming model field is cell_spacing_dxa (twips)
      }
  }


  // Filter out undefined properties before final check and parse
  const filteredProps = Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined));

  if (Object.keys(filteredProps).length > 0) {
    try {
      return TablePropertiesModel.parse(filteredProps);
    } catch (error) {
      console.error("Error parsing TablePropertiesModel:", error, "Input props:", filteredProps, "Original tblPrElement:", tblPrElement);
      return undefined;
    }
  }
  return undefined;
}
