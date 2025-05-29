// src/parsers/tables/table-row-properties-parser.ts
import { TableRowProperties } from '../../models/table-models'; // HeightRuleEnum is implicitly part of this via Zod schema
import { parseOnOffProperty } from '../helpers/common-helpers';
import { getElement, getAttribute } from '../../utils/xml-utils';

export function parseTableRowProperties(trPrNode: any): TableRowProperties | undefined {
  if (!trPrNode || typeof trPrNode !== 'object' || Object.keys(trPrNode).length === 0) {
    return undefined;
  }

  const props: Partial<TableRowProperties> = {}; // Use Partial for building

  // Row Height: <w:trHeight w:val="1000" w:hRule="atLeast"/>
  const trHeightNode = getElement(trPrNode, 'w:trHeight');
  if (trHeightNode) {
    const heightVal = getAttribute(trHeightNode, 'w:val');
    const hRuleVal = getAttribute(trHeightNode, 'w:hRule');

    if (heightVal !== undefined) {
      const value = parseInt(heightVal, 10);
      if (!isNaN(value)) {
        const rule = (hRuleVal === 'exact' || hRuleVal === 'atLeast') ? hRuleVal : 'auto'; // Default to 'auto'
        props.height = { value, rule };
      }
    }
  }

  // Table Header Row: <w:tblHeader/> or <w:tblHeader w:val="true"/>
  const isHeader = parseOnOffProperty(trPrNode, 'w:tblHeader');
  if (isHeader !== undefined) {
    props.isHeader = isHeader;
  }

  // Cannot Split Row: <w:cantSplit/> or <w:cantSplit w:val="false"/>
  const cantSplit = parseOnOffProperty(trPrNode, 'w:cantSplit');
  if (cantSplit !== undefined) {
    props.cantSplit = cantSplit;
  }
  
  // TODO: Add parsing for other row properties like w:tblCellSpacing (if needed at row level),
  // w:cnfStyle (conditional formatting), etc.

  return Object.keys(props).length > 0 ? (props as TableRowProperties) : undefined;
}
