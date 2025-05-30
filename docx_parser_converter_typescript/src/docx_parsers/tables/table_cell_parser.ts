import {
  TableCellModel,
  ParagraphModel,
  TableModel,
  // TableCellPropertiesModel, // Type inferred
} from '../../models/index';
import { parseTableCellProperties } from './table_cell_properties_parser';
import { parseParagraph } from '../document/paragraph_parser';
// Forward declaration for recursive parsing - parseTable will be in tables_parser.ts
import { parseTable } from './tables_parser';
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
 * Parses a <w:tc> (Table Cell) element from DOCX XML.
 * @param tcElement The <w:tc> XML element object.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @param preserveOrderElementName The key for the array of ordered child elements (e.g., "$$").
 * @returns A TableCellModel object or undefined if parsing fails or input is invalid.
 */
export function parseTableCell(
  tcElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME,
  preserveOrderElementName: string = "$$"
): TableCellModel | undefined {
  if (!tcElement) {
    return undefined;
  }

  // Parse Cell Properties (<w:tcPr>)
  const tcPrElement = tcElement['w:tcPr'];
  const properties = parseTableCellProperties(tcPrElement, attributesGroupName);

  // Parse Cell Content (Paragraphs and Nested Tables)
  const elements: (ParagraphModel | TableModel)[] = [];
  const orderedChildren = tcElement[preserveOrderElementName];

  if (Array.isArray(orderedChildren)) {
    for (const childWrapper of orderedChildren) {
      const tagName = Object.keys(childWrapper)[0];
      const childElement = childWrapper[tagName];

      if (tagName === 'w:p') {
        const paragraph = parseParagraph(childElement, attributesGroupName, preserveOrderElementName);
        if (paragraph) {
          elements.push(paragraph);
        }
      } else if (tagName === 'w:tbl') {
        const table = parseTable(childElement, attributesGroupName, preserveOrderElementName);
        if (table) {
          elements.push(table);
        }
      }
      // Other possible child elements of <w:tc> like <w:sdt> (Structured Document Tag)
      // could be handled here if needed.
    }
  } else {
    // Fallback if order is not preserved (less ideal)
    console.warn("Table cell children order not preserved or no children array found. Parsing 'w:p' and 'w:tbl' by direct access (order may be lost). Element:", tcElement);
    const paragraphElements = ensureArray(tcElement['w:p']);
    for (const pEl of paragraphElements) {
      const paragraph = parseParagraph(pEl, attributesGroupName, preserveOrderElementName);
      if (paragraph) {
        elements.push(paragraph);
      }
    }
    const tableElements = ensureArray(tcElement['w:tbl']);
    for (const tblEl of tableElements) {
      const table = parseTable(tblEl, attributesGroupName, preserveOrderElementName);
      if (table) {
        elements.push(table);
      }
    }
  }

  // A cell must contain at least one block-level element (e.g. a paragraph).
  // ECMA-376 Part 1 - 17.4.37 tc (Table Cell)
  // "This element shall contain at least one block-level element."
  // However, some malformed documents might have empty cells.
  // Zod validation for TableCellModel might enforce elements not to be empty.
  // Current TableCellModel: elements: z.array(z.union([ParagraphModel, z.lazy(() => TableModel)])))
  // This allows elements to be an empty array. If it should not be empty, add .min(1)

  try {
    return TableCellModel.parse({ properties, elements });
  } catch (error) {
    console.error("Error parsing TableCellModel:", error, "Input tcElement:", tcElement, "Parsed properties:", properties, "Parsed elements:", elements);
    return undefined;
  }
}
