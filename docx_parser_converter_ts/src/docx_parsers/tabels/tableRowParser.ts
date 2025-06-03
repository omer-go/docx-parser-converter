import type { TableRow } from '../models/tableModels';
import { extractElement, extractElements } from '../helpers/commonHelpers';
import { TableRowPropertiesParser } from './tableRowPropertiesParser';
import { TableCellParser } from './tableCellParser';

/**
 * A parser for extracting table rows from an XML element.
 */
export class TableRowParser {
  /**
   * Parses a table row from the given XML element.
   *
   * @param rowElement - The row XML element.
   * @returns The parsed table row.
   *
   * @example
   * ```xml
   * <w:tr>
   *   <w:trPr>
   *     <w:trHeight w:val="300"/>
   *     <w:tblHeader/>
   *   </w:trPr>
   *   <w:tc>...</w:tc>
   *   <w:tc>...</w:tc>
   * </w:tr>
   * ```
   */
  public static parse(rowElement: Element): TableRow {
    const propertiesElement = extractElement(rowElement, './/w:trPr');
    const properties = TableRowPropertiesParser.parse(propertiesElement);
    const cellElements = extractElements(rowElement, './/w:tc');
    const cells = cellElements.map(cell => TableCellParser.parse(cell));
    return { properties, cells };
  }
}

// --- Example Usage Block (similar to if __name__ == "__main__") ---
if (typeof require !== 'undefined' && require.main === module) {
  // Example: parse a sample tr XML string
  const { extractXmlRootFromString } = require('../utils');
  const sampleTrXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:tr xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\n  <w:trPr>\n    <w:trHeight w:val=\"300\"/>\n    <w:tblHeader/>\n  </w:trPr>\n  <w:tc>\n    <w:tcPr>\n      <w:tcW w:w=\"5000\" w:type=\"dxa\"/>\n    </w:tcPr>\n    <w:p>\n      <w:r>\n        <w:t>Cell 1</w:t>\n      </w:r>\n    </w:p>\n  </w:tc>\n  <w:tc>\n    <w:tcPr>\n      <w:tcW w:w=\"5000\" w:type=\"dxa\"/>\n    </w:tcPr>\n    <w:p>\n      <w:r>\n        <w:t>Cell 2</w:t>\n      </w:r>\n    </w:p>\n  </w:tc>\n</w:tr>`;
  const trElement = extractXmlRootFromString(sampleTrXml);
  const parsed = TableRowParser.parse(trElement);
  console.log('Parsed TableRow:', JSON.stringify(parsed, null, 2));
} 