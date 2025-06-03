import type { TableCell } from '../models/tableModels';
import { extractElement, extractElements } from '../helpers/commonHelpers';
import { TableCellPropertiesParser } from './tableCellPropertiesParser';
import { ParagraphParser } from '../document/paragraphParser';

/**
 * A parser for extracting table cells from an XML element.
 */
export class TableCellParser {
  /**
   * Parses a table cell from the given XML element.
   *
   * @param cellElement - The cell XML element.
   * @returns The parsed table cell.
   *
   * @example
   * ```xml
   * <w:tc>
   *   <w:tcPr>
   *     <w:tcW w:w="5000" w:type="dxa"/>
   *     <w:tcBorders>...</w:tcBorders>
   *     <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
   *     <w:tcMar>...</w:tcMar>
   *     <w:textDirection w:val="btLr"/>
   *     <w:vAlign w:val="center"/>
   *     <w:gridSpan w:val="2"/>
   *   </w:tcPr>
   *   <w:p>...</w:p>
   * </w:tc>
   * ```
   */
  public static parse(cellElement: Element): TableCell {
    const propertiesElement = extractElement(cellElement, './/w:tcPr');
    const properties = TableCellPropertiesParser.parse(propertiesElement);
    const paragraphParser = new ParagraphParser();
    const paragraphs = extractElements(cellElement, './/w:p').map(p => paragraphParser.parse(p));
    return { properties, paragraphs };
  }
}

// --- Example Usage Block (similar to if __name__ == "__main__") ---
if (typeof require !== 'undefined' && require.main === module) {
  // Example: parse a sample tc XML string
  const { extractXmlRootFromString } = require('../utils');
  const sampleTcXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:tc xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\n  <w:tcPr>\n    <w:tcW w:w=\"5000\" w:type=\"dxa\"/>\n    <w:tcBorders>\n      <w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n      <w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n      <w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n      <w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n    </w:tcBorders>\n    <w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"FFFF00\"/>\n    <w:tcMar>\n      <w:top w:w=\"100\" w:type=\"dxa\"/>\n      <w:left w:w=\"100\" w:type=\"dxa\"/>\n      <w:bottom w:w=\"100\" w:type=\"dxa\"/>\n      <w:right w:w=\"100\" w:type=\"dxa\"/>\n    </w:tcMar>\n    <w:textDirection w:val=\"btLr\"/>\n    <w:vAlign w:val=\"center\"/>\n    <w:gridSpan w:val=\"2\"/>\n  </w:tcPr>\n  <w:p>\n    <w:r>\n      <w:t>Example text</w:t>\n    </w:r>\n  </w:p>\n</w:tc>`;
  const tcElement = extractXmlRootFromString(sampleTcXml);
  const parsed = TableCellParser.parse(tcElement);
  console.log('Parsed TableCell:', JSON.stringify(parsed, null, 2));
} 