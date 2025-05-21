import { TableRowParser } from './table_row_parser.js';
import { TableSchema, TableGridSchema, defaultTableProperties } from './models/table_models.js'; // Import default
import { getElement, getAttribute } from './xml_utils.js';
import { TablePropertiesParser } from './table_properties_parser.js';

/**
 * Parses a <w:tbl> (table) XML node into a Table object.
 */
export class TableParser {
  /**
   * @param {ParagraphParser} paragraphParser - An instance of ParagraphParser,
   *                                           to be passed down to TableRowParser and TableCellParser.
   */
  constructor(paragraphParser) {
    const getTableParser = () => this;
    this.tableRowParser = new TableRowParser(paragraphParser, getTableParser);
    this.tablePropertiesParser = new TablePropertiesParser();
  }

  /**
   * Parses a WordprocessingML <w:tbl> (table) element.
   *
   * @param {Element} tblNode - The <w:tbl> XML element.
   * @returns {object} An object conforming to the TableSchema.
   * @throws {Error} If parsing fails or validation fails.
   */
  parse(tblNode) {
    if (!tblNode || tblNode.nodeName !== 'w:tbl') {
      // console.warn('TableParser.parse called with an invalid node:', tblNode);
    }

    const rows = [];
    const grid = this.parseGrid(tblNode);

    if (tblNode && tblNode.childNodes && tblNode.childNodes.length > 0) {
      for (let i = 0; i < tblNode.childNodes.length; i++) {
        const childNode = tblNode.childNodes[i];
        // Check if the node is an Element node and if its name is 'w:tr'
        if (childNode.nodeType === 1 && childNode.nodeName === 'w:tr') { // nodeType 1 is ELEMENT_NODE
          try {
            const parsedRow = this.tableRowParser.parse(childNode);
            rows.push(parsedRow);
          } catch (e) {
            console.error("Error parsing a table row within a table:", childNode, e);
          }
        }
        // Other child elements like <w:tblPr> (table properties) or <w:tblGrid>
        // are handled separately or will be in future property parsing tasks.
      }
    }

    const tblPrNode = getElement(tblNode, 'w:tblPr');
    const tableProperties = tblPrNode
      ? this.tablePropertiesParser.parse(tblPrNode)
      : defaultTableProperties; // Use default if no <w:tblPr>

    const tableData = {
      rows: rows,
      properties: tableProperties || defaultTableProperties, // Ensure properties always exist
      grid: grid,
      type: 'table',
    };

    try {
      return TableSchema.parse(tableData);
    } catch (error) {
      console.error('Table schema validation failed for tblNode:', tblNode, error.errors);
      throw new Error('Invalid table data after parsing.');
    }
  }

  /**
   * Parses the <w:tblGrid> element to extract column widths.
   *
   * @param {Element} tblNode - The <w:tbl> XML element.
   * @returns {Array<number>} An array of column widths (in DXA units).
   */
  parseGrid(tblNode) {
    const gridData = [];
    const tblGridElement = getElement(tblNode, 'w:tblGrid');

    if (tblGridElement && tblGridElement.childNodes && tblGridElement.childNodes.length > 0) {
      for (let i = 0; i < tblGridElement.childNodes.length; i++) {
        const gridColNode = tblGridElement.childNodes[i];
        if (gridColNode.nodeType === 1 && gridColNode.nodeName === 'w:gridCol') {
          const widthStr = getAttribute(gridColNode, 'w:w');
          if (widthStr) {
            const width = parseInt(widthStr, 10);
            if (!isNaN(width)) {
              gridData.push(width);
            } else {
              console.warn(`Invalid width for gridCol: ${widthStr}`);
              gridData.push(0); // Default or placeholder for invalid width
            }
          } else {
             gridData.push(0); // Default if w:w is missing
          }
        }
      }
    }
    try {
        // Validate the extracted grid data
        return TableGridSchema.parse(gridData);
    } catch(error) {
        console.error('TableGrid schema validation failed for tblGrid:', tblGridElement, error.errors);
        // Return a default or empty grid in case of validation failure to allow parsing to continue
        return [];
    }
  }
}

// Example Usage (Illustrative - would be part of DocumentParser)
// import { DOMParser } from 'xmldom-qsa';
// import { ParagraphParser } from './paragraph_parser.js'; // Assuming path

// const pParser = new ParagraphParser();
// const tableParser = new TableParser(pParser);

// const xmlString = `
// <w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//   <w:tblPr>
//     <w:tblStyle w:val="TableGrid"/>
//     <w:tblW w:w="0" w:type="auto"/>
//     <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
//   </w:tblPr>
//   <w:tblGrid>
//     <w:gridCol w:w="4567"/>
//     <w:gridCol w:w="4567"/>
//   </w:tblGrid>
//   <w:tr>
//     <w:tc><w:p><w:r><w:t>Row 1, Cell 1</w:t></w:r></w:p></w:tc>
//     <w:tc><w:p><w:r><w:t>Row 1, Cell 2</w:t></w:r></w:p></w:tc>
//   </w:tr>
//   <w:tr>
//     <w:tc><w:p><w:r><w:t>Row 2, Cell 1</w:t></w:r></w:p></w:tc>
//     <w:tc><w:p><w:r><w:t>Row 2, Cell 2</w:t></w:r></w:p></w:tc>
//   </w:tr>
// </w:tbl>
// `;

// const doc = new DOMParser().parseFromString(xmlString, "application/xml");
// const tblNode = doc.documentElement;

// try {
//   const parsedTable = tableParser.parse(tblNode);
//   console.log("Parsed Table:", JSON.stringify(parsedTable, null, 2));
//   // Expected: A table object with grid info and two rows, each with two cells.
// } catch (e) {
//   console.error("Error parsing table:", e);
// }
