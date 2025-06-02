import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNull, getXmlElement } from '../test-utils';
import { MarginsParser } from '../../src/docx_parsers/document/marginsParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';
import type { DocMargins } from '../../src/docx_parsers/models/documentModels';

export function registerMarginsParserTests() {
    describe("MarginsParser Tests", () => {
        const tests: TestResult[] = [];

        function createSectPrElementWithPgMar(attributes: Record<string, string | null>): Element | null {
            let pgMarAttributes = '';
            for (const key in attributes) {
                if (attributes[key] !== null) {
                    pgMarAttributes += ` w:${key}="${attributes[key]}"`;
                }
            }
            const xmlString = pgMarAttributes
                ? `<w:sectPr xmlns:w="${NAMESPACE_URI}"><w:pgMar${pgMarAttributes}/></w:sectPr>`
                : `<w:sectPr xmlns:w="${NAMESPACE_URI}"><w:pgMar/></w:sectPr>`; // Case for empty pgMar
            return getXmlElement(xmlString);
        }

        function createSectPrElementWithoutPgMar(content: string = ''): Element | null {
            const xmlString = `<w:sectPr xmlns:w="${NAMESPACE_URI}">${content}</w:sectPr>`;
            return getXmlElement(xmlString);
        }

        // Test Case 1: Valid full margins
        const sectPr1Attrs = { top: "720", right: "1440", bottom: "720", left: "1440", header: "360", footer: "360", gutter: "20" };
        const sectPr1 = createSectPrElementWithPgMar(sectPr1Attrs);
        const expected1: DocMargins = { topPt: 36, rightPt: 72, bottomPt: 36, leftPt: 72, headerPt: 18, footerPt: 18, gutterPt: 1 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr1),
            expected1,
            "Parse valid full margins",
            sectPr1?.outerHTML
        ));

        // Test Case 2: Partial margins (only top and left)
        const sectPr2Attrs = { top: "1000", left: "1200" };
        const sectPr2 = createSectPrElementWithPgMar(sectPr2Attrs);
        const expected2: DocMargins = { topPt: 50, leftPt: 60 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr2),
            expected2,
            "Parse partial margins (top and left only)",
            sectPr2?.outerHTML
        ));

        // Test Case 3: Using end and start attributes for right/left
        const sectPr3Attrs = { top: "800", end: "1000", bottom: "800", start: "1200" }; // end for right, start for left
        const sectPr3 = createSectPrElementWithPgMar(sectPr3Attrs);
        const expected3: DocMargins = { topPt: 40, rightPt: 50, bottomPt: 40, leftPt: 60 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr3),
            expected3,
            "Parse margins using 'end' for right and 'start' for left",
            sectPr3?.outerHTML
        ));

        // Test Case 4: 'right' attribute takes precedence over 'end'
        const sectPr4Attrs = { right: "900", end: "1000" };
        const sectPr4 = createSectPrElementWithPgMar(sectPr4Attrs);
        const expected4: DocMargins = { rightPt: 45 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr4),
            expected4,
            "Parse margins: 'right' attribute takes precedence over 'end'",
            sectPr4?.outerHTML
        ));

        // Test Case 5: 'left' attribute takes precedence over 'start'
        const sectPr5Attrs = { left: "1100", start: "1200" };
        const sectPr5 = createSectPrElementWithPgMar(sectPr5Attrs);
        const expected5: DocMargins = { leftPt: 55 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr5),
            expected5,
            "Parse margins: 'left' attribute takes precedence over 'start'",
            sectPr5?.outerHTML
        ));
        
        // Test Case 6: No w:pgMar element
        const sectPr6 = createSectPrElementWithoutPgMar("<w:otherProp w:val=\"test\"/>");
        tests.push(assertNull(
            MarginsParser.parse(sectPr6),
            "Parse sectPr without w:pgMar element (should return null)",
            sectPr6?.outerHTML
        ));

        // Test Case 7: Empty w:pgMar element (no attributes)
        const sectPr7 = createSectPrElementWithPgMar({}); // pgMar with no attributes
        tests.push(assertNull(
            MarginsParser.parse(sectPr7),
            "Parse sectPr with empty w:pgMar (no attributes) (should return null)",
            sectPr7?.outerHTML
        ));

        // Test Case 8: Null sectPr input
        tests.push(assertNull(
            MarginsParser.parse(null),
            "Parse null sectPr element (should return null)",
            "null"
        ));

        // Test Case 9: Non-numeric margin values, some valid
        const sectPr9Attrs = { top: "abc", right: "720", left: "xyz", bottom: "360" };
        const sectPr9 = createSectPrElementWithPgMar(sectPr9Attrs);
        const expected9: DocMargins = { rightPt: 36, bottomPt: 18 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr9),
            expected9,
            "Parse margins with some non-numeric values (valid ones should be parsed)",
            sectPr9?.outerHTML
        ));

        // Test Case 10: All non-numeric margin values
        const sectPr10Attrs = { top: "abc", right: "xyz", header: "---" };
        const sectPr10 = createSectPrElementWithPgMar(sectPr10Attrs);
        tests.push(assertNull(
            MarginsParser.parse(sectPr10),
            "Parse margins with all non-numeric values (should return null)",
            sectPr10?.outerHTML
        ));
        
        // Test Case 11: Only 'end' attribute present (for right margin)
        const sectPr11Attrs = { end: "1500" };
        const sectPr11 = createSectPrElementWithPgMar(sectPr11Attrs);
        const expected11: DocMargins = { rightPt: 75 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr11),
            expected11,
            "Parse margins with only 'end' attribute for right margin",
            sectPr11?.outerHTML
        ));

        // Test Case 12: Only 'start' attribute present (for left margin)
        const sectPr12Attrs = { start: "1600" };
        const sectPr12 = createSectPrElementWithPgMar(sectPr12Attrs);
        const expected12: DocMargins = { leftPt: 80 };
        tests.push(assertEquals(
            MarginsParser.parse(sectPr12),
            expected12,
            "Parse margins with only 'start' attribute for left margin",
            sectPr12?.outerHTML
        ));

        return tests;
    });
} 