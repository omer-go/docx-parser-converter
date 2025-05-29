// src/parsers/styles/styles-parser.ts
import {
  StyleDefinition,
  StyleTypeEnum,
  ParagraphProperties, // For typing
  RunProperties,       // For typing
  // TableProperties, TableRowProperties, TableCellProperties // For future use
} from '../../models/styles-models';
import { parseParagraphProperties } from './paragraph-properties-parser';
import { parseRunProperties } from './run-properties-parser';
// import { parseTableProperties } from '../tables/table-properties-parser'; // Future
// import { parseTableRowProperties } from '../tables/table-row-properties-parser'; // Future
// import { parseTableCellProperties } from '../tables/table-cell-properties-parser'; // Future
import { getElement, getAttribute, getElements, parseXmlString, getElementBooleanAttribute } from '../../utils/xml-utils';
import { parseValAttribute, parseOnOffProperty } from '../helpers/common-helpers';

export function parseStyle(styleNode: any): StyleDefinition | null {
  if (!styleNode || typeof styleNode !== 'object') {
    return null;
  }

  const typeAttr = getAttribute(styleNode, 'w:type');
  const styleIdAttr = getAttribute(styleNode, 'w:styleId');

  if (!typeAttr || !StyleTypeEnum.safeParse(typeAttr).success || !styleIdAttr) {
    // Essential attributes missing or invalid type
    return null;
  }

  const styleDef: Partial<StyleDefinition> = {
    id: styleIdAttr,
    type: typeAttr as StyleTypeEnum,
  };

  // Corrected parsing for w:default
  const isDefaultVal = getElementBooleanAttribute(styleNode, 'w:default');
  if (isDefaultVal !== undefined) {
    styleDef.isDefault = isDefaultVal;
  }
  
  styleDef.name = parseValAttribute(styleNode, 'w:name');
  styleDef.basedOn = parseValAttribute(styleNode, 'w:basedOn');
  styleDef.next = parseValAttribute(styleNode, 'w:next');
  styleDef.link = parseValAttribute(styleNode, 'w:link');
  
  const uiPriority = parseValAttribute(styleNode, 'w:uiPriority');
  if (uiPriority) styleDef.uiPriority = parseInt(uiPriority, 10);

  const pPrNode = getElement(styleNode, 'w:pPr');
  if (pPrNode) styleDef.paragraphProperties = parseParagraphProperties(pPrNode);

  const rPrNode = getElement(styleNode, 'w:rPr');
  if (rPrNode) styleDef.runProperties = parseRunProperties(rPrNode);

  // Placeholders for table style properties - parsers to be implemented later
  const tblPrNode = getElement(styleNode, 'w:tblPr');
  if (tblPrNode) styleDef.tableProperties = {}; // TODO: Replace with actual parseTableProperties(tblPrNode)

  const trPrNode = getElement(styleNode, 'w:trPr');
  if (trPrNode) styleDef.tableRowProperties = {}; // TODO: Replace with actual parseTableRowProperties(trPrNode)

  const tcPrNode = getElement(styleNode, 'w:tcPr');
  if (tcPrNode) styleDef.tableCellProperties = {}; // TODO: Replace with actual parseTableCellProperties(tcPrNode)

  // Other boolean flags for style visibility/locking
  // These should use getElementBooleanAttribute if they can appear as valueless attributes e.g. <w:locked/>
  // or parseOnOffProperty if they consistently use w:val="true/false/0/1"
  // parseOnOffProperty is more flexible as it handles both scenarios for child elements.
  // For attributes on the styleNode itself, getElementBooleanAttribute is more direct.
  styleDef.locked = getElementBooleanAttribute(styleNode, 'w:locked');
  styleDef.hidden = getElementBooleanAttribute(styleNode, 'w:hidden'); 
  styleDef.unhideWhenUsed = getElementBooleanAttribute(styleNode, 'w:unhideWhenUsed');
  styleDef.semiHidden = getElementBooleanAttribute(styleNode, 'w:semiHidden'); 


  return styleDef as StyleDefinition; 
}

export function parseStylesFile(stylesXmlString: string): StyleDefinition[] {
  if (!stylesXmlString) return [];
  
  let parsedXml;
  try {
    // Ensure styles are parsed with ALWAYS_ARRAY_ELEMENTS for <w:style>
    // This is handled by the default XMLParser in xml-utils if w:style is in ALWAYS_ARRAY_ELEMENTS
    // The provided code for xml-utils has w:style in ALWAYS_ARRAY_ELEMENTS.
    parsedXml = parseXmlString(stylesXmlString);
  } catch (e) {
    // console.error("Failed to parse styles.xml:", e);
    return []; // Return empty array on XML parsing error
  }

  const stylesNode = parsedXml['w:styles'];
  if (!stylesNode) return [];

  // getElements ensures that 'w:style' is treated as an array.
  const styleNodes = getElements(stylesNode, 'w:style');
  return styleNodes.map(node => parseStyle(node)).filter(style => style !== null) as StyleDefinition[];
}
