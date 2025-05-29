// src/parsers/tables/table-grid-parser.ts
import { TableGridColumn } from '../../models/table-models';
import { getElements, getAttribute } from '../../utils/xml-utils';

export function parseTableGrid(gridNode: any): TableGridColumn[] {
  if (!gridNode || typeof gridNode !== 'object') {
    return [];
  }

  const gridColElements = getElements(gridNode, 'w:gridCol');
  const columns: TableGridColumn[] = [];

  for (const colNode of gridColElements) {
    if (typeof colNode === 'object' && colNode !== null) {
      const widthAttr = getAttribute(colNode, 'w:w');
      if (widthAttr !== undefined) {
        const width = parseInt(widthAttr, 10);
        if (!isNaN(width)) {
          columns.push({ width });
        }
      }
    }
  }
  return columns;
}
