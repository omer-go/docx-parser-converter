import type { DocMargins } from '../models/documentModels';
import { extractElement, extractAttribute, safeInt } from '../helpers/commonHelpers';
import { convertTwipsToPoints } from '../utils';

/**
 * Parses the margin properties of a section in a docx document.
 *
 * This class contains methods to parse the margin properties from the
 * section properties (sectPr) element of a docx document. The margin
 * properties are essential for understanding the layout of the document.
 */
export class MarginsParser {
    /**
     * Parses margins from the given section properties XML element.
     *
     * @param sectPr - The section properties XML element (Element or null).
     *                 This element can contain margin properties which define the
     *                 top, right, bottom, left, header, footer, and gutter margins
     *                 of the section.
     * @returns The parsed margins as a DocMargins object, or null if not found or sectPr is null.
     *
     * @example
     * The following is an example of the section properties with margins
     * in a document.xml file:
     *
     * ```xml
     * <w:sectPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
     *     <w:pgMar w:left="1134" w:right="1134" w:gutter="0" w:header="0"
     *              w:top="1134" w:footer="0" w:bottom="1134"/>
     * </w:sectPr>
     * ```
     */
    public static parse(sectPr: Element | null): DocMargins | null {
        if (!sectPr) {
            return null;
        }

        const pgMar = extractElement(sectPr, ".//w:pgMar");
        if (pgMar) {
            const topStr = extractAttribute(pgMar, 'top');
            const rightStr = extractAttribute(pgMar, 'right') || extractAttribute(pgMar, 'end');
            const bottomStr = extractAttribute(pgMar, 'bottom');
            const leftStr = extractAttribute(pgMar, 'left') || extractAttribute(pgMar, 'start');
            const headerStr = extractAttribute(pgMar, 'header');
            const footerStr = extractAttribute(pgMar, 'footer');
            const gutterStr = extractAttribute(pgMar, 'gutter');

            const topTwips = safeInt(topStr);
            const rightTwips = safeInt(rightStr);
            const bottomTwips = safeInt(bottomStr);
            const leftTwips = safeInt(leftStr);
            const headerTwips = safeInt(headerStr);
            const footerTwips = safeInt(footerStr);
            const gutterTwips = safeInt(gutterStr);

            const margins: DocMargins = {};

            if (topTwips !== null) margins.topPt = convertTwipsToPoints(topTwips);
            if (rightTwips !== null) margins.rightPt = convertTwipsToPoints(rightTwips);
            if (bottomTwips !== null) margins.bottomPt = convertTwipsToPoints(bottomTwips);
            if (leftTwips !== null) margins.leftPt = convertTwipsToPoints(leftTwips);
            if (headerTwips !== null) margins.headerPt = convertTwipsToPoints(headerTwips);
            if (footerTwips !== null) margins.footerPt = convertTwipsToPoints(footerTwips);
            if (gutterTwips !== null) margins.gutterPt = convertTwipsToPoints(gutterTwips);
            
            // Return margins only if at least one property was parsed
            if (Object.keys(margins).length > 0) {
                return margins;
            }
        }
        return null;
    }
}
