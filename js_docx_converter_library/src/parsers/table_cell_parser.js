import { TableCellSchema, defaultTableCellProperties } from './models/table_models.js'; // Import default
import { getElement } from './xml_utils.js'; // Required for getting tcPr
import { TableCellPropertiesParser } from './table_cell_properties_parser.js';
// ParagraphParser is passed in
// getTableParser is passed in

/**
 * Parses a <w:tc> (table cell) XML node into a TableCell object.
 */
export class TableCellParser {
  /**
   * @param {ParagraphParser} paragraphParser - An instance of ParagraphParser.
   * @param {Function} getTableParser - A function that returns an instance of TableParser.
   *                                   Used to parse nested tables and break circular dependencies.
   */
  constructor(paragraphParser, getTableParser) {
    this.paragraphParser = paragraphParser;
    this.getTableParser = getTableParser;
    this.tableCellPropertiesParser = new TableCellPropertiesParser();
  }

  /**
   * Parses a WordprocessingML <w:tc> (table cell) element.
   *
   * @param {Element} tcNode - The <w:tc> XML element.
   * @returns {object} An object conforming to the TableCellSchema.
   * @throws {Error} If parsing fails or validation fails.
   */
  parse(tcNode) {
    if (!tcNode || tcNode.nodeName !== 'w:tc') {
      // console.warn('TableCellParser.parse called with an invalid node:', tcNode);
    }

    const elements = [];
    if (tcNode && tcNode.childNodes && tcNode.childNodes.length > 0) {
      for (let i = 0; i < tcNode.childNodes.length; i++) {
        const childNode = tcNode.childNodes[i];
        if (childNode.nodeType === 1) { // ELEMENT_NODE
          switch (childNode.nodeName) {
            case 'w:p':
              try {
                const paragraph = this.paragraphParser.parse(childNode);
                elements.push(paragraph);
              } catch (e) {
                console.error("Error parsing a paragraph within a table cell:", childNode, e);
              }
              break;
            case 'w:tbl':
              try {
                const tableParser = this.getTableParser(); // Get TableParser instance
                if (tableParser) {
                  const table = tableParser.parse(childNode);
                  elements.push(table);
                } else {
                  console.warn("TableParser not available, skipping nested table.");
                }
              } catch (e) {
                console.error("Error parsing a nested table within a table cell:", childNode, e);
              }
              break;
            // Other elements within a cell like <w:tcPr> (cell properties)
            // will be handled when property parsing is implemented.
          }
        }
      }
    }

    const tcPrNode = getElement(tcNode, 'w:tcPr');
    const cellProperties = tcPrNode
      ? this.tableCellPropertiesParser.parse(tcPrNode)
      : defaultTableCellProperties; // Use default if no <w:tcPr>

    const cellData = {
      elements: elements,
      properties: cellProperties || defaultTableCellProperties, // Ensure properties always exist
      type: 'table_cell',
    };

    try {
      return TableCellSchema.parse(cellData);
    } catch (error) {
      console.error('TableCell schema validation failed for tcNode:', tcNode, error.errors);
      throw new Error('Invalid table cell data after parsing.');
    }
  }
}

// Example Usage (Illustrative - would be part of TableRowParser)
// import { DOMParser } from 'xmldom-qsa';
// import { ParagraphParser } from './paragraph_parser.js'; // Assuming path
// import { TableParser } from './table_parser.js'; // Assuming path

// const pParser = new ParagraphParser();
// let tParserInstance; // To be defined
// const getTParser = () => tParserInstance; // Closure to access tParserInstance

// const cellParser = new TableCellParser(pParser, getTParser);

// // Mock TableParser for testing
// class MockTableParser {
//   parse(tblNode) {
//     console.log("MockTableParser parsing node:", tblNode.nodeName);
//     return { type: 'table', rows: [], grid: [], properties: {} };
//   }
// }
// tParserInstance = new MockTableParser();


// const xmlString = `
//   <w:tc xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
//     <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
//     <w:p>
//       <w:r><w:t>Cell Paragraph 1</w:t></w:r>
//     </w:p>
//     <w:p>
//       <w:r><w:t>Cell Paragraph 2</w:t></w:r>
//     </w:p>
//     <w:tbl>
//       <!-- Minimal nested table for testing -->
//       <w:tblGrid><w:gridCol w:w="1000"/></w:tblGrid>
//       <w:tr><w:tc><w:p><w:r><w:t>Nested</w:t></w:r></w:p></w:tc></w:tr>
//     </w:tbl>
//   </w:tc>
// `;
// const doc = new DOMParser().parseFromString(xmlString, "application/xml");
// const tcNode = doc.documentElement;

// try {
//   const parsedCell = cellParser.parse(tcNode);
//   console.log("Parsed Table Cell:", JSON.stringify(parsedCell, null, 2));
//   // Expected: A cell object with two paragraphs and one nested table.
// } catch (e) {
//   console.error("Error parsing table cell:", e);
// }
