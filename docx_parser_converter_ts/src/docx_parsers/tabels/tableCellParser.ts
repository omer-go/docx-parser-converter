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

