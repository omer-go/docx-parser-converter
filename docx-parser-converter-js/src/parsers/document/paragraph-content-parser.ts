// src/parsers/document/paragraph-content-parser.ts
import { ParagraphContentElement, TextRun, Hyperlink } from '../../models/paragraph-models';
import { parseTextRun } from './run-parser';
import { getElements, getAttribute } from '../../utils/xml-utils';

/**
 * Parses the child elements of a <w:p> node into an array of ParagraphContentElements.
 * @param pChildren An array of child node objects from a <w:p> element, in document order.
 *                  Each object in the array is expected to be a parsed XML element
 *                  like { 'w:r': { ... } } or { 'w:hyperlink': { ... } }.
 * @param relationships An optional map or lookup function to resolve hyperlink URLs from r:id.
 *                      For now, we'll just store the r:id.
 *                      `relationships.getTargetById(rId: string): string | undefined`
 * @returns An array of ParagraphContentElement models.
 */
export function parseParagraphContent(
  pChildren: any[],
  relationships?: { getTargetById: (id: string) => string | undefined }
): ParagraphContentElement[] {
  const contentElements: ParagraphContentElement[] = [];
  if (!pChildren || !Array.isArray(pChildren)) {
    return contentElements;
  }

  for (const childWrapper of pChildren) {
    // Each childWrapper is expected to be an object with a single key, e.g., { 'w:r': ... } or { 'w:hyperlink': ... }
    // This structure results from fast-xml-parser when preserveOrder:true is used.
    if (typeof childWrapper !== 'object' || childWrapper === null) continue;

    const elementTag = Object.keys(childWrapper)[0];
    const elementNode = childWrapper[elementTag];

    if (!elementNode) continue;

    switch (elementTag) {
      case 'w:r':
        const textRun = parseTextRun(elementNode);
        if (textRun) {
          contentElements.push(textRun);
        }
        break;
      case 'w:hyperlink':
        // A hyperlink node itself might be an array if isArray is true for it,
        // but here 'elementNode' is the content of the <w:hyperlink> tag.
        const rId = getAttribute(elementNode, 'r:id');
        const anchor = getAttribute(elementNode, 'w:anchor'); // For internal bookmarks

        // Hyperlink content is typically one or more w:r elements
        const hyperlinkRuns: TextRun[] = [];
        const rNodesInHyperlink = getElements(elementNode, 'w:r');
        for (const rNode of rNodesInHyperlink) {
          const run = parseTextRun(rNode);
          if (run) {
            hyperlinkRuns.push(run);
          }
        }
        
        if (hyperlinkRuns.length > 0 && (rId || anchor)) {
          const hyperlink: Hyperlink = {
            type: 'hyperlink',
            children: hyperlinkRuns,
            // url will be resolved later using rId and relationships part
            // For now, store rId and/or anchor. If both, rId usually takes precedence for external links.
            ...(rId && { relationshipId: rId }),
            ...(anchor && { anchor: anchor }),
            // Hyperlinks can also have their own rPr for tooltip styling, not handled yet.
          };
          contentElements.push(hyperlink);
        }
        break;
      // TODO: Handle other paragraph content elements like w:br, w:tab, w:sdt, w:drawing, etc.
      // e.g., case 'w:br': contentElements.push({ type: 'break', breakType: getAttribute(elementNode, 'w:type') || 'textWrapping' });
      // e.g., case 'w:tab': contentElements.push({ type: 'tab' });
    }
  }
  return contentElements;
}
