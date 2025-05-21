import {
  TableCellPropertiesSchema,
  TableCellBordersSchema,
  CellMarginValuesSchema,
  // defaultTableCellProperties // If you define defaults
} from './models/table_models.js';
import { ShadingSchema } from './models/properties_models.js';
import { getElement, getAttribute, getChildAttribute } from './xml_utils.js';

/**
 * Parses a <w:tcPr> (table cell properties) XML node.
 */
export class TableCellPropertiesParser {
  /**
   * Parses the <w:tcPr> XML element.
   * @param {Element | null} tcPrNode - The <w:tcPr> XML element.
   * @returns {object} An object conforming to TableCellPropertiesSchema.
   */
  parse(tcPrNode) {
    if (!tcPrNode) {
      return TableCellPropertiesSchema.parse({});
    }

    const props = {};

    // Cell Width <w:tcW w:w="..." w:type="dxa|pct|auto"/>
    const tcWNode = getElement(tcPrNode, 'w:tcW');
    if (tcWNode) {
      const widthVal = getAttribute(tcWNode, 'w:w');
      // const widthType = getAttribute(tcWNode, 'w:type'); // type is important
      if (widthVal) props.tcW = { val: parseInt(widthVal, 10) }; // Store type if schema supports
    }

    // Grid Span <w:gridSpan w:val="..."/>
    const gridSpanVal = getChildAttribute(tcPrNode, 'w:gridSpan', 'w:val');
    if (gridSpanVal) {
      const span = parseInt(gridSpanVal, 10);
      if (!isNaN(span) && span > 0) {
        props.gridSpan = span;
      }
    }

    // Vertical Alignment <w:vAlign w:val="top|center|bottom"/>
    const vAlignVal = getChildAttribute(tcPrNode, 'w:vAlign', 'w:val');
    if (vAlignVal) props.vAlign = vAlignVal;
    
    // Text Direction <w:textDirection w:val="..."/>
    const textDirectionVal = getChildAttribute(tcPrNode, 'w:textDirection', 'w:val');
    if (textDirectionVal) props.textDirection = textDirectionVal;

    // Cell Borders <w:tcBorders>
    const tcBordersNode = getElement(tcPrNode, 'w:tcBorders');
    if (tcBordersNode) {
      const borders = {};
      ['top', 'left', 'bottom', 'right', 'insideH', 'insideV', 'tl2br', 'tr2bl'].forEach(borderName => {
        const borderNode = getElement(tcBordersNode, `w:${borderName}`);
        if (borderNode) {
          borders[borderName] = {
            val: getAttribute(borderNode, 'w:val'),
          };
          const szVal = getAttribute(borderNode, 'w:sz');
          if (szVal) borders[borderName].sz = { val: parseInt(szVal, 10) };
          
          const spaceVal = getAttribute(borderNode, 'w:space');
          if (spaceVal) borders[borderName].space = { val: parseInt(spaceVal, 10) };

          const colorVal = getAttribute(borderNode, 'w:color');
          if (colorVal) borders[borderName].color = { val: colorVal };
          // TODO: themeColor, themeTint, themeShade for color
        }
      });
      if (Object.keys(borders).length > 0) {
        props.tcBorders = TableCellBordersSchema.parse(borders);
      }
    }

    // Cell Shading <w:shd w:val="..." w:color="..." w:fill="..."/>
    const shdNode = getElement(tcPrNode, 'w:shd');
    if (shdNode) {
        const shading = {
            val: getAttribute(shdNode, 'w:val'),
            color: getAttribute(shdNode, 'w:color'),
            fill: getAttribute(shdNode, 'w:fill'),
        };
        props.shd = ShadingSchema.parse(shading);
    }

    // Cell Margins <w:tcMar>
    const tcMarNode = getElement(tcPrNode, 'w:tcMar');
    if (tcMarNode) {
        const cellMargins = {};
        ['top', 'left', 'bottom', 'right', 'start', 'end'].forEach(marginName => {
            const actualMarginName = (marginName === 'start') ? 'left' : (marginName === 'end') ? 'right' : marginName;
            const marginNode = getElement(tcMarNode, `w:${marginName}`);
            if (marginNode) {
                const widthVal = getAttribute(marginNode, 'w:w');
                if (widthVal) {
                    cellMargins[actualMarginName] = { val: parseInt(widthVal, 10) };
                }
            }
        });
        if (Object.keys(cellMargins).length > 0) {
             try {
                props.tcMar = CellMarginValuesSchema.parse(cellMargins);
            } catch (e) {
                console.error("Error parsing tcMar:", e.errors, cellMargins);
            }
        }
    }
    
    // Other properties like noWrap, hideMark can be added here.

    try {
      return TableCellPropertiesSchema.parse(props);
    } catch (error) {
      console.error('TableCellProperties schema validation failed for tcPrNode:', tcPrNode, error.errors, props);
      return TableCellPropertiesSchema.parse({}); // Fallback to default
    }
  }
}
