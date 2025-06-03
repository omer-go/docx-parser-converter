import type { Table } from '../models/tableModels';
import { readBinaryFromFilePath, extractXmlRootFromDocx } from '../utils';
import { NAMESPACE } from '../helpers/commonHelpers';
import { TablePropertiesParser } from './tablePropertiesParser';
import { TableGridParser } from './tableGridParser';
import { TableRowParser } from './tableRowParser';

/**
 * A parser for extracting tables from an XML element.
 */
export class TablesParser {
  root: Element;

  /**
   * Initializes the TablesParser with the given table XML element.
   * @param tableElement The root XML element of the table.
   */
  constructor(tableElement: Element) {
    this.root = tableElement;
  }

  /**
   * Parses the table XML element into a Table object.
   * @returns The parsed Table object.
   */
  parse(): Table {
    const propertiesElement = this.root.querySelector('w\\:tblPr') as Element | null;
    const properties = TablePropertiesParser.parse(propertiesElement);
    const gridRaw = TableGridParser.parse(this.root);
    const grid = gridRaw === null ? undefined : gridRaw;
    // Find all direct child <w:tr> elements (not nested)
    const rows: Table["rows"] = [];
    const trElements = this.root.getElementsByTagNameNS(NAMESPACE.w, 'tr');
    for (let i = 0; i < trElements.length; i++) {
      rows.push(TableRowParser.parse(trElements[i]));
    }
    return { properties, grid, rows };
  }
}

// --- Example Usage Block (similar to if __name__ == "__main__") ---
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const docxPath = 'C:/Users/omerh/Desktop/file-sample_1MB.docx';
    // Read the binary content of the DOCX file
    const docxFile = readBinaryFromFilePath(docxPath);
    // Extract the XML root from the DOCX file for 'document.xml'
    const root = await extractXmlRootFromDocx(docxFile, 'document.xml');
    // Iterate over each table element found in the document
    const tblElements = root.getElementsByTagNameNS(NAMESPACE.w, 'tbl');
    for (let i = 0; i < tblElements.length; i++) {
      // Initialize the TablesParser with the table element
      const tablesParser = new TablesParser(tblElements[i]);
      // Parse the table element into a Table object
      const table = tablesParser.parse();
      // Print the resulting object as a formatted JSON string
      console.log(JSON.stringify(table, null, 2));
    }
  })();
} 