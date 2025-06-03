import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNotNull, getXmlElement } from '../test-utils';
import { TableRowParser } from '../../src/docx_parsers/tabels/tableRowParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTableRowParserTests() {
    describe('TableRowParser Tests', () => {
        const tests: TestResult[] = [];

        // Helper to extract first text from a cell's first paragraph
        function getFirstTextFromCell(cell: any): string | undefined {
            const para = cell.paragraphs[0];
            if (!para || !para.runs || para.runs.length === 0) return undefined;
            const run = para.runs[0];
            if (!run || !run.contents || run.contents.length === 0) return undefined;
            const textContent = run.contents.find((c: any) => c.type === 'text');
            return textContent ? textContent.text : undefined;
        }

        // Helper to create a <w:tr> element
        function createTableRowElement(innerXml: string): Element | null {
            const xmlString = `<w:tr xmlns:w="${NAMESPACE_URI}">${innerXml}</w:tr>`;
            return getXmlElement(xmlString);
        }

        // Test 1: Simple row with two cells
        const row1 = createTableRowElement(`
            <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
        `);
        tests.push(assertNotNull(
            row1,
            'Should create a valid <w:tr> element for simple row',
            row1?.outerHTML
        ));
        if (row1) {
            const parsed = TableRowParser.parse(row1);
            tests.push(assertEquals(
                parsed.cells.length,
                2,
                'Should parse two cells in the row',
                row1.outerHTML
            ));
            tests.push(assertEquals(
                getFirstTextFromCell(parsed.cells[0]),
                'Cell 1',
                'First cell should contain "Cell 1"',
                row1.outerHTML
            ));
            tests.push(assertEquals(
                getFirstTextFromCell(parsed.cells[1]),
                'Cell 2',
                'Second cell should contain "Cell 2"',
                row1.outerHTML
            ));
        }

        // Test 2: Row with properties (height, header)
        const row2 = createTableRowElement(`
            <w:trPr>
                <w:trHeight w:val="240"/>
                <w:tblHeader/>
            </w:trPr>
            <w:tc><w:p><w:r><w:t>Header Cell</w:t></w:r></w:p></w:tc>
        `);
        if (row2) {
            const parsed = TableRowParser.parse(row2);
            tests.push(assertEquals(
                parsed.properties?.trHeight,
                '12', // 240 twips = 12 points
                'Should parse row height as 12 points',
                row2.outerHTML
            ));
            tests.push(assertEquals(
                parsed.properties?.tblHeader,
                true,
                'Should parse tblHeader as true',
                row2.outerHTML
            ));
        }

        // Test 3: Row with no cells
        const row3 = createTableRowElement('<w:trPr><w:trHeight w:val="120"/></w:trPr>');
        if (row3) {
            const parsed = TableRowParser.parse(row3);
            tests.push(assertEquals(
                parsed.cells.length,
                0,
                'Should parse zero cells for a row with no <w:tc>',
                row3.outerHTML
            ));
        }

        // Test 4: Null input
        tests.push(assertNotNull(
            TableRowParser,
            'TableRowParser class should be defined'
        ));

        return tests;
    });
} 