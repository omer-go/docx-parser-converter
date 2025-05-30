import {
  extractAttribute,
  safeInt,
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import { convertTwipsToPoints } from '../../utils';
import { TableGridModel } from '../../models/index';

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
 * Parses the <w:tblGrid> element from DOCX XML, extracting column widths.
 * @param tblGridElement The <w:tblGrid> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A TableGridModel object containing column widths in points, or undefined if no valid columns are found.
 */
export function parseTableGrid(
  tblGridElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): TableGridModel | undefined {
  if (!tblGridElement) {
    return undefined;
  }

  const columnsInPoints: number[] = [];
  const gridColElements = ensureArray(tblGridElement['w:gridCol']);

  for (const gridColElement of gridColElements) {
    const widthStr = extractAttribute(gridColElement, 'w:w', attributesGroupName);
    const widthTwips = safeInt(widthStr);

    if (widthTwips !== undefined) {
      // Assuming TableGridModel stores widths in points. The model has 'columns: z.array(z.number())'
      // The original Python code stored them as DXA (twips).
      // The subtask specified "columns.push(convertTwipsToPoints(widthTwips));"
      // So, converting to points here.
      columnsInPoints.push(convertTwipsToPoints(widthTwips));
    } else {
      // Optional: Handle missing or invalid width. Could add a default, log, or skip.
      // For now, skipping invalid/missing widths as per instruction "skipping invalid ones is fine".
      console.warn("Invalid or missing w:w attribute for w:gridCol:", gridColElement);
    }
  }

  if (columnsInPoints.length > 0) {
    try {
      return TableGridModel.parse({ columns: columnsInPoints });
    } catch (error) {
      console.error(
        "Error parsing TableGridModel:",
        error,
        "Input columns (points):", columnsInPoints,
        "Original tblGridElement:", tblGridElement
      );
      return undefined;
    }
  }

  // If no columns were successfully parsed, it might mean the grid is invalid or empty.
  // Depending on requirements, an empty grid { columns: [] } might be valid.
  // For now, returning undefined if no columns are parsed.
  return undefined;
}
