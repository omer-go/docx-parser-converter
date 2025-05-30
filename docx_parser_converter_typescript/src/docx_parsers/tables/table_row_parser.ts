import {
  TableRowModel,
  TableCellModel,
  // TableRowPropertiesModel, // Type inferred
} from '../../models/index';
import { parseTableRowProperties } from './table_row_properties_parser';
import { parseTableCell } from './table_cell_parser';
import { DEFAULT_ATTRIBUTES_GROUP_NAME } from '../../helpers/common_helpers';

/**
 * Helper to ensure an element is an array for easier iteration.
 * @param item The item to ensure is an array.
 * @returns An array, either the item itself if it's an array, a new array containing the item, or an empty array if the item is null/undefined.
 */
const ensureArray = (item: any): any[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  return [item];
};

/**
 * Parses a <w:tr> (Table Row) element from DOCX XML.
 * @param trElement The <w:tr> XML element object.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @param preserveOrderElementName The key for the array of ordered child elements (e.g., "$$").
 * @returns A TableRowModel object or undefined if parsing fails or input is invalid.
 */
export function parseTableRow(
  trElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME,
  preserveOrderElementName: string = "$$"
): TableRowModel | undefined {
  if (!trElement) {
    return undefined;
  }

  // Parse Row Properties (<w:trPr>)
  const trPrElement = trElement['w:trPr'];
  const properties = parseTableRowProperties(trPrElement, attributesGroupName);

  // Parse Table Cells (<w:tc>)
  const cells: TableCellModel[] = [];
  const orderedChildren = trElement[preserveOrderElementName];

  if (Array.isArray(orderedChildren)) {
    for (const childWrapper of orderedChildren) {
      const tagName = Object.keys(childWrapper)[0];
      const childElement = childWrapper[tagName];

      if (tagName === 'w:tc') {
        const cell = parseTableCell(childElement, attributesGroupName, preserveOrderElementName);
        if (cell) {
          cells.push(cell);
        }
      }
      // TODO: Handle other elements like <w:sdt> (Structured Document Tag) which can wrap a <w:tc>
      // or other elements that might appear within a row but are not cells (e.g. custom XML, comments).
      // Example for <w:sdt> wrapping a <w:tc>:
      // else if (tagName === 'w:sdt') {
      //   const sdtContent = childElement['w:sdtContent'];
      //   if (sdtContent && sdtContent['w:tc']) {
      //     const cell = parseTableCell(sdtContent['w:tc'], attributesGroupName, preserveOrderElementName);
      //     if (cell) cells.push(cell);
      //   }
      // }
    }
  } else {
    // Fallback if order is not preserved (less ideal)
    console.warn("Table row children order not preserved or no children array found. Parsing 'w:tc' by direct access (order may be lost). Element:", trElement);
    const cellElements = ensureArray(trElement['w:tc']);
    for (const tcElement of cellElements) {
      const cell = parseTableCell(tcElement, attributesGroupName, preserveOrderElementName);
      if (cell) {
        cells.push(cell);
      }
    }
  }

  // A row must contain at least one cell.
  // ECMA-376 Part 1 - 17.4.79 tr (Table Row)
  // "This element should contain at least one tc element."
  // If `cells` is empty, Zod validation for TableRowModel might fail if it enforces cells.min(1).
  // Current TableRowModel: cells: z.array(TableCellModel) - allows empty.
  // If this is not desired, add .min(1) to the Zod schema.

  try {
    return TableRowModel.parse({ properties, cells });
  } catch (error) {
    console.error("Error parsing TableRowModel:", error, "Input trElement:", trElement, "Parsed properties:", properties, "Parsed cells:", cells);
    return undefined;
  }
}
