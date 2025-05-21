import { TableCellParser } from './table_cell_parser.js';
import { TableRowSchema, defaultTableRowProperties } from './models/table_models.js'; // Import default
import { getElement } from './xml_utils.js'; // Required for getting trPr
import { TableRowPropertiesParser } from './table_row_properties_parser.js';

/**
 * Parses a <w:tr> (table row) XML node into a TableRow object.
 */
export class TableRowParser {
  /**
   * @param {ParagraphParser} paragraphParser - An instance of ParagraphParser, to be passed to TableCellParser.
   * @param {Function} getTableParser - A function that returns an instance of TableParser,
   *                                   to be passed to TableCellParser for nested tables.
   */
  constructor(paragraphParser, getTableParser) {
    this.tableCellParser = new TableCellParser(paragraphParser, getTableParser);
    this.tableRowPropertiesParser = new TableRowPropertiesParser();
  }

  /**
   * Parses a WordprocessingML <w:tr> (table row) element.
   *
   * @param {Element} trNode - The <w:tr> XML element.
   * @returns {object} An object conforming to the TableRowSchema.
   * @throws {Error} If parsing fails or validation fails.
   */
  parse(trNode) {
    if (!trNode || trNode.nodeName !== 'w:tr') {
      // console.warn('TableRowParser.parse called with an invalid node:', trNode);
    }

    const cells = [];
    if (trNode && trNode.childNodes && trNode.childNodes.length > 0) {
      for (let i = 0; i < trNode.childNodes.length; i++) {
        const childNode = trNode.childNodes[i];
        // Check if the node is an Element node and if its name is 'w:tc'
        if (childNode.nodeType === 1 && childNode.nodeName === 'w:tc') { // nodeType 1 is ELEMENT_NODE
          try {
            const parsedCell = this.tableCellParser.parse(childNode);
            cells.push(parsedCell);
          } catch (e) {
            console.error("Error parsing a table cell within a row:", childNode, e);
            // Decide how to handle cell parsing errors: skip, add placeholder, or re-throw
          }
        }
        // Other child elements of <w:tr> like <w:trPr> (row properties)
        // will be handled in a future task for property parsing.
      }
    }

    const trPrNode = getElement(trNode, 'w:trPr');
    const rowProperties = trPrNode
      ? this.tableRowPropertiesParser.parse(trPrNode)
      : defaultTableRowProperties; // Use default if no <w:trPr>

    const rowData = {
      cells: cells,
      properties: rowProperties || defaultTableRowProperties, // Ensure properties always exist
      type: 'table_row',
    };

    try {
      return TableRowSchema.parse(rowData);
    } catch (error) {
      console.error('TableRow schema validation failed for trNode:', trNode, error.errors);
      throw new Error('Invalid table row data after parsing.');
    }
  }
}

// Example Usage (Illustrative - would be part of TableParser)
// import { DOMParser } from 'xmldom-qsa';
// import { ParagraphParser } from './paragraph_parser.js'; // Assuming path
// import { TableParser } from './table_parser.js'; // Assuming path

// const pParser = new ParagraphParser();
// let tParserInstance;
// const getTParser = () => tParserInstance;

// const rowParser = new TableRowParser(pParser, getTParser);

// // Mock TableParser for testing
// class MockTableParser {
//   parse(tblNode) { return { type: 'table', rows: [], grid: [], properties: {} }; }
// }
// tParserInstance = new MockTableParser();

// const xmlString = `
//   <w:tr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//     <w:trPr><w:trHeight w:val="300"/></w:trPr>
//     <w:tc>
//       <w:p><w:r><w:t>Cell 1</w:t></w:r></w:p>
//     </w:tc>
//     <w:tc>
//       <w:p><w:r><w:t>Cell 2</w:t></w:r></w:p>
//     </w:tc>
//   </w:tr>
// `;
// const doc = new DOMParser().parseFromString(xmlString, "application/xml");
// const trNode = doc.documentElement;

// try {
//   const parsedRow = rowParser.parse(trNode);
//   console.log("Parsed Table Row:", JSON.stringify(parsedRow, null, 2));
//   // Expected: A row object with two cells.
// } catch (e) {
//   console.error("Error parsing table row:", e);
// }
