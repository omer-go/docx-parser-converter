import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNull, getXmlElement } from '../test-utils';
import { DocumentNumberingParser } from '../../src/docx_parsers/document/documentNumberingParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerDocumentNumberingParserTests() {
    describe("DocumentNumberingParser Tests", () => {
        const tests: TestResult[] = [];

        function createPPrElement(ilvlVal?: string | null, numIdVal?: string | null): Element | null {
            let numPrContent = '';
            if (ilvlVal !== undefined && ilvlVal !== null) {
                numPrContent += `<w:ilvl w:val="${ilvlVal}"/>`;
            }
            if (numIdVal !== undefined && numIdVal !== null) {
                numPrContent += `<w:numId w:val="${numIdVal}"/>`;
            }

            const xmlString = numPrContent 
                ? `<w:pPr xmlns:w="${NAMESPACE_URI}"><w:numPr>${numPrContent}</w:numPr></w:pPr>`
                : `<w:pPr xmlns:w="${NAMESPACE_URI}"></w:pPr>`;
            return getXmlElement(xmlString);
        }

        // Test case 1: Valid numPr with ilvl and numId
        const pPr1 = createPPrElement("1", "2");
        const expected1 = { ilvl: 1, numId: 2 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr1),
            expected1,
            "Parse valid numPr with ilvl and numId",
            pPr1?.outerHTML
        ));

        // Test case 2: numPr with only ilvl (numId should default to 0)
        const pPr2 = createPPrElement("3", null);
        const expected2 = { ilvl: 3, numId: 0 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr2),
            expected2,
            "Parse numPr with only ilvl (numId defaults to 0)",
            pPr2?.outerHTML
        ));

        // Test case 3: numPr with only numId (ilvl should default to 0)
        const pPr3 = createPPrElement(null, "5");
        const expected3 = { ilvl: 0, numId: 5 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr3),
            expected3,
            "Parse numPr with only numId (ilvl defaults to 0)",
            pPr3?.outerHTML
        ));

        // Test case 4: numPr with invalid ilvl (should default to 0)
        const pPr4 = createPPrElement("abc", "7");
        const expected4 = { ilvl: 0, numId: 7 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr4),
            expected4,
            "Parse numPr with invalid ilvl (defaults to 0)",
            pPr4?.outerHTML
        ));

        // Test case 5: numPr with invalid numId (should default to 0)
        const pPr5 = createPPrElement("8", "xyz");
        const expected5 = { ilvl: 8, numId: 0 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr5),
            expected5,
            "Parse numPr with invalid numId (defaults to 0)",
            pPr5?.outerHTML
        ));

        // Test case 6: Empty numPr (both ilvl and numId default to 0)
        const pPr6Xml = `<w:pPr xmlns:w="${NAMESPACE_URI}"><w:numPr/></w:pPr>`;
        const pPr6 = getXmlElement(pPr6Xml);
        const expected6 = { ilvl: 0, numId: 0 };
        tests.push(assertEquals(
            DocumentNumberingParser.parse(pPr6),
            expected6,
            "Parse numPr with no ilvl or numId (both default to 0)",
            pPr6?.outerHTML
        ));
        
        // Test case 7: pPr without numPr element
        const pPr7 = getXmlElement(`<w:pPr xmlns:w="${NAMESPACE_URI}"><w:pStyle w:val="Heading1"/></w:pPr>`);
        tests.push(assertNull(
            DocumentNumberingParser.parse(pPr7),
            "Parse pPr without numPr element (should return null)",
            pPr7?.outerHTML
        ));

        // Test case 8: Null pPr element
        tests.push(assertNull(
            DocumentNumberingParser.parse(null),
            "Parse null pPr element (should return null)",
            "null"
        ));

        return tests;
    });
} 