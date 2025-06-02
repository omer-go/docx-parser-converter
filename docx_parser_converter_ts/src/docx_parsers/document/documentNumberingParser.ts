import type { Numbering } from '../models/paragraphModels';
import { extractElement, extractAttribute, safeInt } from '../helpers/commonHelpers';

/**
 * Parses the numbering properties of a paragraph in a docx document.
 *
 * This class contains methods to parse the numbering properties from the
 * paragraph properties (pPr) element of a docx document. The numbering
 * properties are essential for understanding the ordered or unordered
 * list formatting in the document.
 */
export class DocumentNumberingParser {
  /**
   * Parses numbering from the given paragraph properties XML element.
   *
   * @param pPr - The paragraph properties XML element.
   *   This element can contain numbering properties which define the
   *   list level and list ID for the paragraph.
   * @returns The parsed numbering, or null if not found.
   *
   * @example
   * The following is an example of the numbering properties in a
   * paragraph properties (pPr) element:
   *
   * ```xml
   * <w:pPr>
   *     <w:numPr>
   *         <w:ilvl w:val="1"/>
   *         <w:numId w:val="2"/>
   *     </w:numPr>
   * </w:pPr>
   * ```
   */
  public static parse(pPr: Element | null): Numbering | null {
    if (!pPr) {
      return null;
    }

    const numPr = extractElement(pPr, ".//w:numPr");
    if (!numPr) {
      return null;
    }

    const ilvlElem = extractElement(numPr, ".//w:ilvl");
    const numIdElem = extractElement(numPr, ".//w:numId");

    // Extract the level of the numbering (ilvl)
    const ilvlAttr = extractAttribute(ilvlElem, 'val');
    const ilvl = safeInt(ilvlAttr) ?? 0;

    // Extract the ID of the numbering (numId)
    const numIdAttr = extractAttribute(numIdElem, 'val');
    const numId = safeInt(numIdAttr) ?? 0;
    
    return { ilvl, numId };
  }
} 