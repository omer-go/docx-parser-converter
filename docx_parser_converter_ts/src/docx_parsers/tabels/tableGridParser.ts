import { NAMESPACE, extractAttribute } from '../helpers/commonHelpers';
import type { TableGrid } from '../models/tableModels';
import { convertTwipsToPoints } from '../utils';

/**
 * A parser for extracting the table grid from an XML element.
 */
export class TableGridParser {
  /**
   * Parses the table grid from the given XML element.
   *
   * @param tableElement The table XML element.
   * @returns The parsed TableGrid, or null if not found.
   *
   * @example
   * // Example XML:
   * // <w:tblGrid>
   * //   <w:gridCol w:w="5000"/>
   * //   <w:gridCol w:w="5000"/>
   * // </w:tblGrid>
   * // Usage:
   * // const grid = TableGridParser.parse(tblElement);
   */
  static parse(tableElement: Element): TableGrid | null {
    if (!tableElement) return null;
    // Use XPath to find all gridCol elements with namespace resolver
    const xpath = './/w:gridCol';
    const nsResolver = (prefix: string | null) => {
      if (prefix === 'w') return NAMESPACE.w;
      return null;
    };
    let gridElements: Element[] = [];
    // document.evaluate is available in browser and xmldom
    const doc = tableElement.ownerDocument || (tableElement as any).document;
    if (doc && typeof doc.evaluate === 'function') {
      const result = doc.evaluate(
        xpath,
        tableElement,
        nsResolver,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i) as Element;
        if (node) gridElements.push(node);
      }
    }
    if (gridElements.length > 0) {
      const columns: number[] = [];
      gridElements.forEach(col => {
        const wAttr = extractAttribute(col, 'w');
        if (wAttr !== null) {
          const widthTwips = parseInt(wAttr, 10);
          if (!isNaN(widthTwips)) {
            columns.push(convertTwipsToPoints(widthTwips));
          }
        }
      });
      return { columns };
    }
    return null;
  }
}

