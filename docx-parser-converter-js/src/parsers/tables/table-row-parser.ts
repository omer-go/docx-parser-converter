// src/parsers/tables/table-row-parser.ts
import { TableRow, TableCell } from '../../models/table-models';
import { parseTableRowProperties } from './table-row-properties-parser';
import { parseTableCell } from './table-cell-parser';
import { getElement, getElements } from '../../utils/xml-utils';

export function parseTableRow(trNode: any): TableRow | null {
  if (!trNode || (typeof trNode !== 'object' && trNode !== true)) { // trNode can be true for <w:tr/>
    return null;
  }
  
  // Handle <w:tr/> which parses as `true` or an empty object for <w:tr></w:tr>
  if (trNode === true || (typeof trNode === 'object' && Object.keys(trNode).length === 0 && trNode.constructor === Object)) {
    return { type: 'tableRow', children: [], properties: undefined };
  }

  const trPrNode = getElement(trNode, 'w:trPr');
  const parsedTrProperties = trPrNode ? parseTableRowProperties(trPrNode) : undefined;

  const tcNodes = getElements(trNode, 'w:tc');
  const parsedCells: TableCell[] = [];
  for (const tcNode of tcNodes) {
    const cell = parseTableCell(tcNode);
    if (cell) {
      parsedCells.push(cell);
    }
  }

  // A row might technically be empty of cells in malformed XML,
  // but usually it should have at least one. The model allows empty children.
  return {
    type: 'tableRow',
    children: parsedCells,
    properties: parsedTrProperties,
  };
}
