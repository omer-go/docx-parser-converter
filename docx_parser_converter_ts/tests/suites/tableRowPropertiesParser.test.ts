import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNotNull, getXmlElement } from '../test-utils';
import { TableRowPropertiesParser } from '../../src/docx_parsers/tabels/tableRowPropertiesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTableRowPropertiesParserTests() {
    describe('TableRowPropertiesParser Tests', () => {
        const tests: TestResult[] = [];

        // Helper to create a <w:trPr> element
        function createTrPrElement(innerXml: string): Element | null {
            const xmlString = `<w:trPr xmlns:w="${NAMESPACE_URI}">${innerXml}</w:trPr>`;
            return getXmlElement(xmlString);
        }

        // Test 1: All properties present
        const trPr1 = createTrPrElement(`
            <w:trHeight w:val="300" w:hRule="exact"/>
            <w:tblHeader/>
            <w:jc w:val="center"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tblBorders>
            <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
        `);
        tests.push(assertNotNull(trPr1, 'Should create a valid <w:trPr> element for test 1'));
        if (trPr1) {
            const parsed = TableRowPropertiesParser.parse(trPr1);
            tests.push(assertEquals(parsed.trHeight, '15', 'Should parse row height (300 twips = 15 points)', trPr1.outerHTML));
            tests.push(assertEquals(parsed.trHeightHRule, 'exact', 'Should parse row height hRule', trPr1.outerHTML));
            tests.push(assertEquals(parsed.tblHeader, true, 'Should parse table header as true', trPr1.outerHTML));
            tests.push(assertEquals(parsed.justification, 'center', 'Should parse justification', trPr1.outerHTML));
            tests.push(assertNotNull(parsed.tblBorders, 'Should parse tblBorders', trPr1.outerHTML));
            tests.push(assertNotNull(parsed.shd, 'Should parse shading (shd)', trPr1.outerHTML));
        }

        // Test 2: Only row height
        const trPr2 = createTrPrElement(`<w:trHeight w:val="480"/>`);
        tests.push(assertNotNull(trPr2, 'Should create a valid <w:trPr> element for test 2'));
        if (trPr2) {
            const parsed = TableRowPropertiesParser.parse(trPr2);
            tests.push(assertEquals(parsed.trHeight, '24', 'Should parse row height (480 twips = 24 points)', trPr2.outerHTML));
            tests.push(assertEquals(parsed.trHeightHRule, undefined, 'Should not find hRule if not present', trPr2.outerHTML));
            tests.push(assertEquals(parsed.tblHeader, undefined, 'Should not find tblHeader if not present', trPr2.outerHTML));
            tests.push(assertEquals(parsed.justification, undefined, 'Should not find justification if not present', trPr2.outerHTML));
            tests.push(assertEquals(parsed.tblBorders, undefined, 'Should not find tblBorders if not present', trPr2.outerHTML));
            tests.push(assertEquals(parsed.shd, undefined, 'Should not find shading if not present', trPr2.outerHTML));
        }

        // Test 3: No properties at all
        const trPr3 = createTrPrElement("");
        tests.push(assertNotNull(trPr3, 'Should create a valid <w:trPr> element for test 3'));
        if (trPr3) {
            const parsed = TableRowPropertiesParser.parse(trPr3);
            tests.push(assertEquals(parsed.trHeight, undefined, 'Should not find row height if not present', trPr3.outerHTML));
            tests.push(assertEquals(parsed.trHeightHRule, undefined, 'Should not find hRule if not present', trPr3.outerHTML));
            tests.push(assertEquals(parsed.tblHeader, undefined, 'Should not find tblHeader if not present', trPr3.outerHTML));
            tests.push(assertEquals(parsed.justification, undefined, 'Should not find justification if not present', trPr3.outerHTML));
            tests.push(assertEquals(parsed.tblBorders, undefined, 'Should not find tblBorders if not present', trPr3.outerHTML));
            tests.push(assertEquals(parsed.shd, undefined, 'Should not find shading if not present', trPr3.outerHTML));
        }

        // Test 4: Null input
        const parsedNull = TableRowPropertiesParser.parse(null);
        tests.push(assertEquals(parsedNull.trHeight, undefined, 'Should not find row height for null input', null));
        tests.push(assertEquals(parsedNull.trHeightHRule, undefined, 'Should not find hRule for null input', null));
        tests.push(assertEquals(parsedNull.tblHeader, undefined, 'Should not find tblHeader for null input', null));
        tests.push(assertEquals(parsedNull.justification, undefined, 'Should not find justification for null input', null));
        tests.push(assertEquals(parsedNull.tblBorders, undefined, 'Should not find tblBorders for null input', null));
        tests.push(assertEquals(parsedNull.shd, undefined, 'Should not find shading for null input', null));

        return tests;
    });
} 