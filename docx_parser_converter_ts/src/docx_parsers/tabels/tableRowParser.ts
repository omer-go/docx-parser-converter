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
