import {
  TablePropertiesSchema,
  TableBordersSchema,
  CellMarginValuesSchema,
  defaultTableProperties // Assuming you might add this to table_models.js
} from './models/table_models.js';
import { ShadingSchema } from './models/properties_models.js'; // For <w:shd>
import { getElement, getAttribute, getChildAttribute } from './xml_utils.js';

/**
 * Parses a <w:tblPr> (table properties) XML node.
 */
export class TablePropertiesParser {
  /**
   * Parses the <w:tblPr> XML element.
   * @param {Element | null} tblPrNode - The <w:tblPr> XML element.
   * @returns {object} An object conforming to TablePropertiesSchema.
   */
  parse(tblPrNode) {
    if (!tblPrNode) {
      // Consider returning a default properties object if you define one.
      // For now, parse({}) will rely on Zod defaults or make fields optional.
      return TablePropertiesSchema.parse({});
    }

    const props = {};

    // Table Width <w:tblW w:w="..." w:type="dxa|pct|auto"/>
    const tblWNode = getElement(tblPrNode, 'w:tblW');
    if (tblWNode) {
      const widthVal = getAttribute(tblWNode, 'w:w');
      // const widthType = getAttribute(tblWNode, 'w:type'); // type is also important
      if (widthVal) props.tblW = { val: parseInt(widthVal, 10) }; // Store type if schema supports
    }

    // Table Alignment <w:jc w:val="left|center|right"/>
    const jcVal = getChildAttribute(tblPrNode, 'w:jc', 'w:val');
    if (jcVal) props.jc = jcVal;

    // Table Cell Spacing <w:tblCellSpacing w:w="..." w:type="dxa"/>
    const tblCellSpacingNode = getElement(tblPrNode, 'w:tblCellSpacing');
    if (tblCellSpacingNode) {
      const spacingVal = getAttribute(tblCellSpacingNode, 'w:w');
      if (spacingVal) props.tblCellSpacing = { val: parseInt(spacingVal, 10) };
    }

    // Table Indentation <w:tblInd w:w="..." w:type="dxa"/>
    const tblIndNode = getElement(tblPrNode, 'w:tblInd');
    if (tblIndNode) {
      const indentVal = getAttribute(tblIndNode, 'w:w');
      if (indentVal) props.tblInd = { val: parseInt(indentVal, 10) };
    }

    // Table Borders <w:tblBorders>
    const tblBordersNode = getElement(tblPrNode, 'w:tblBorders');
    if (tblBordersNode) {
      const borders = {};
      ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(borderName => {
        const borderNode = getElement(tblBordersNode, `w:${borderName}`);
        if (borderNode) {
          borders[borderName] = {
            val: getAttribute(borderNode, 'w:val'),
            // sz, space, color are objects in BorderTypeSchema
            // sz: { val: parseInt(getAttribute(borderNode, 'w:sz') || '0', 10) },
            // color: { val: getAttribute(borderNode, 'w:color') || 'auto' }
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
        props.tblBorders = TableBordersSchema.parse(borders); // Validate sub-schema
      }
    }
    
    // Table Shading <w:shd w:val="..." w:color="..." w:fill="..."/>
    const shdNode = getElement(tblPrNode, 'w:shd');
    if (shdNode) {
        const shading = {
            val: getAttribute(shdNode, 'w:val'),
            color: getAttribute(shdNode, 'w:color'),
            fill: getAttribute(shdNode, 'w:fill'),
        };
        props.shd = ShadingSchema.parse(shading);
    }

    // Table Layout <w:tblLayout w:type="fixed|auto"/>
    const tblLayoutNode = getElement(tblPrNode, 'w:tblLayout');
    if (tblLayoutNode) {
        props.tblLayout = getAttribute(tblLayoutNode, 'w:type');
    }

    // Table Cell Margins (Default) <w:tblCellMar>
    const tblCellMarNode = getElement(tblPrNode, 'w:tblCellMar');
    if (tblCellMarNode) {
        const cellMargins = {};
        ['top', 'left', 'bottom', 'right', 'start', 'end'].forEach(marginName => {
            // Note: OOXML uses <w:start> and <w:end> for logical left/right,
            // but our CellMarginValuesSchema uses 'left' and 'right'.
            // Parser needs to map this if strict LTR/RTL handling is desired.
            // For simplicity, directly map 'left' to 'left', 'right' to 'right'.
            const actualMarginName = (marginName === 'start') ? 'left' : (marginName === 'end') ? 'right' : marginName;
            
            const marginNode = getElement(tblCellMarNode, `w:${marginName}`);
            if (marginNode) {
                const widthVal = getAttribute(marginNode, 'w:w');
                // const typeVal = getAttribute(marginNode, 'w:type'); // usually 'dxa'
                if (widthVal) {
                    cellMargins[actualMarginName] = { val: parseInt(widthVal, 10) };
                }
            }
        });
         if (Object.keys(cellMargins).length > 0) {
            try {
                props.tblCellMar = CellMarginValuesSchema.parse(cellMargins);
            } catch (e) {
                console.error("Error parsing tblCellMar:", e.errors, cellMargins);
            }
        }
    }

    try {
      return TablePropertiesSchema.parse(props);
    } catch (error) {
      console.error('TableProperties schema validation failed for tblPrNode:', tblPrNode, error.errors, props);
      return TablePropertiesSchema.parse({}); // Fallback to default
    }
  }
}
