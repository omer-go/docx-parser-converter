import {
  TableModel,
  // TablePropertiesModel, // Type inferred
  // TableGridModel, // Type inferred
  TableRowModel,
} from '../../models/index';
import { parseTableProperties } from './table_properties_parser';
import { parseTableGrid } from './table_grid_parser';
import { parseTableRow } from './table_row_parser';
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
 * Parses a <w:tbl> (Table) element from DOCX XML.
 * @param tblElement The <w:tbl> XML element object.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @param preserveOrderElementName The key for the array of ordered child elements (e.g., "$$").
 * @returns A TableModel object or undefined if parsing fails or input is invalid.
 */
export function parseTable(
  tblElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME,
  preserveOrderElementName: string = "$$"
): TableModel | undefined {
  if (!tblElement) {
    return undefined;
  }

  // Parse Table Properties (<w:tblPr>)
  const tblPrElement = tblElement['w:tblPr'];
  const properties = parseTableProperties(tblPrElement, attributesGroupName);

  // Parse Table Grid (<w:tblGrid>)
  const tblGridElement = tblElement['w:tblGrid'];
  const grid = parseTableGrid(tblGridElement, attributesGroupName);

  // A table grid is essential for defining the structure.
  if (!grid) {
    console.warn("Table parsing failed: <w:tblGrid> is missing or invalid.", tblElement);
    return undefined;
  }

  // Parse Table Rows (<w:tr>)
  const rows: TableRowModel[] = [];
  const orderedChildren = tblElement[preserveOrderElementName];

  if (Array.isArray(orderedChildren)) {
    for (const childWrapper of orderedChildren) {
      const tagName = Object.keys(childWrapper)[0];
      const childElement = childWrapper[tagName];

      if (tagName === 'w:tr') {
        const row = parseTableRow(childElement, attributesGroupName, preserveOrderElementName);
        if (row) {
          rows.push(row);
        }
      }
      // TODO: Handle other direct children of <w:tbl> like <w:bookmarkStart/End>,
      // <w:customXml>, <w:sdt> (wrapping a row), etc.
    }
  } else {
    // Fallback if order is not preserved (less ideal)
    console.warn("Table children order not preserved or no children array found. Parsing 'w:tr' by direct access (order may be lost). Element:", tblElement);
    const rowElements = ensureArray(tblElement['w:tr']);
    for (const trElement of rowElements) {
      const row = parseTableRow(trElement, attributesGroupName, preserveOrderElementName);
      if (row) {
        rows.push(row);
      }
    }
  }

  // ECMA-376 Part 1 - 17.4.38 tbl (Table)
  // "This element should contain at least one tr element."
  // If `rows` is empty, Zod validation for TableModel might fail if it enforces rows.min(1).
  // Current TableModel: rows: z.array(TableRowModel) - allows empty.
  // If this is not desired, add .min(1) to the Zod schema.

  try {
    return TableModel.parse({ properties, grid, rows });
  } catch (error) {
    console.error("Error parsing TableModel:", error, "Input tblElement:", tblElement, "Parsed properties:", properties, "Parsed grid:", grid, "Parsed rows:", rows);
    return undefined;
  }
}
