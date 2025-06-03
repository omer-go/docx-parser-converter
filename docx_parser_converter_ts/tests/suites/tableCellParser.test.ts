import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNotNull, getXmlElement } from '../test-utils';
import { TableCellParser } from '../../src/docx_parsers/tabels/tableCellParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTableCellParserTests() {
    describe('TableCellParser Tests', () => {
        const tests: TestResult[] = [];

        // Helper to create a <w:tc> element
        function createTcElement(innerXml: string): Element | null {
            const xmlString = `<w:tc xmlns:w="${NAMESPACE_URI}">${innerXml}</w:tc>`;
            return getXmlElement(xmlString);
        }

        // Test 1: Table cell with properties and a paragraph
        const tc1 = createTcElement(`
            <w:tcPr>
                <w:tcW w:w="5000" w:type="dxa"/>
                <w:tcBorders>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                </w:tcBorders>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                <w:tcMar>
                    <w:top w:w="100" w:type="dxa"/>
                    <w:left w:w="100" w:type="dxa"/>
                    <w:bottom w:w="100" w:type="dxa"/>
                    <w:right w:w="100" w:type="dxa"/>
                </w:tcMar>
                <w:textDirection w:val="btLr"/>
                <w:vAlign w:val="center"/>
                <w:gridSpan w:val="2"/>
            </w:tcPr>
            <w:p>
                <w:r><w:t>Cell text</w:t></w:r>
            </w:p>
        `);
        tests.push(assertNotNull(tc1, 'Should create a valid <w:tc> element for test 1'));
        if (tc1) {
            const parsed = TableCellParser.parse(tc1);
            const firstRunContent = parsed.paragraphs[0].runs[0].contents[0];
            tests.push(assertEquals(
                firstRunContent.type === 'text' ? firstRunContent.text : undefined,
                'Cell text',
                'Should parse paragraph text content in table cell',
                tc1.outerHTML
            ));
            tests.push(assertNotNull(parsed.properties, 'Should parse properties for table cell', tc1.outerHTML));
        }

        // Test 2: Table cell with no <w:tcPr> (properties should be undefined or empty)
        const tc2 = createTcElement(`
            <w:p>
                <w:r><w:t>Only text</w:t></w:r>
            </w:p>
        `);
        tests.push(assertNotNull(tc2, 'Should create a valid <w:tc> element for test 2'));
        if (tc2) {
            const parsed = TableCellParser.parse(tc2);
            const firstRunContent = parsed.paragraphs[0].runs[0].contents[0];
            tests.push(assertEquals(
                firstRunContent.type === 'text' ? firstRunContent.text : undefined,
                'Only text',
                'Should parse paragraph text content in table cell with no properties',
                tc2.outerHTML
            ));
        }

        // Test 3: Table cell with no paragraphs (should return empty paragraphs array)
        const tc3 = createTcElement(`
            <w:tcPr>
                <w:tcW w:w="1000" w:type="dxa"/>
            </w:tcPr>
        `);
        tests.push(assertNotNull(tc3, 'Should create a valid <w:tc> element for test 3'));
        if (tc3) {
            const parsed = TableCellParser.parse(tc3);
            tests.push(assertEquals(
                parsed.paragraphs.length,
                0,
                'Should return empty paragraphs array if no <w:p> present',
                tc3.outerHTML
            ));
        }

        // Test 4: Table cell with multiple paragraphs
        const tc4 = createTcElement(`
            <w:tcPr>
                <w:tcW w:w="2000" w:type="dxa"/>
            </w:tcPr>
            <w:p><w:r><w:t>First</w:t></w:r></w:p>
            <w:p><w:r><w:t>Second</w:t></w:r></w:p>
        `);
        tests.push(assertNotNull(tc4, 'Should create a valid <w:tc> element for test 4'));
        if (tc4) {
            const parsed = TableCellParser.parse(tc4);
            tests.push(assertEquals(
                parsed.paragraphs.length,
                2,
                'Should parse multiple paragraphs in table cell',
                tc4.outerHTML
            ));
            const firstRunContent = parsed.paragraphs[0].runs[0].contents[0];
            const secondRunContent = parsed.paragraphs[1].runs[0].contents[0];
            tests.push(assertEquals(
                firstRunContent.type === 'text' ? firstRunContent.text : undefined,
                'First',
                'Should parse first paragraph text',
                tc4.outerHTML
            ));
            tests.push(assertEquals(
                secondRunContent.type === 'text' ? secondRunContent.text : undefined,
                'Second',
                'Should parse second paragraph text',
                tc4.outerHTML
            ));
        }

        return tests;
    });
} 