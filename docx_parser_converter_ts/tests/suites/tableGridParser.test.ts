import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNull, getXmlElement } from '../test-utils';
import { TableGridParser } from '../../src/docx_parsers/tabels/tableGridParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTableGridParserTests() {
    describe('TableGridParser Tests', () => {
        const tests: TestResult[] = [];

        // Test 1: Normal table grid with two columns
        const xml1 = `<w:tbl xmlns:w="${NAMESPACE_URI}">
            <w:tblGrid>
                <w:gridCol w:w="5000"/>
                <w:gridCol w:w="3000"/>
            </w:tblGrid>
        </w:tbl>`;
        const tbl1 = getXmlElement(xml1);
        const expected1 = { columns: [250, 150] };
        tests.push(assertEquals(
            TableGridParser.parse(tbl1!),
            expected1,
            'Parse table grid with two columns',
            xml1
        ));

        // Test 2: Table grid with no columns
        const xml2 = `<w:tbl xmlns:w="${NAMESPACE_URI}">
            <w:tblGrid></w:tblGrid>
        </w:tbl>`;
        const tbl2 = getXmlElement(xml2);
        tests.push(assertNull(
            TableGridParser.parse(tbl2!),
            'Parse table grid with no columns',
            xml2
        ));

        // Test 3: Table with no tblGrid
        const xml3 = `<w:tbl xmlns:w="${NAMESPACE_URI}"></w:tbl>`;
        const tbl3 = getXmlElement(xml3);
        tests.push(assertNull(
            TableGridParser.parse(tbl3!),
            'Parse table with no tblGrid',
            xml3
        ));

        // Test 4: Malformed w:w attribute (non-numeric)
        const xml4 = `<w:tbl xmlns:w="${NAMESPACE_URI}">
            <w:tblGrid>
                <w:gridCol w:w="abc"/>
            </w:tblGrid>
        </w:tbl>`;
        const tbl4 = getXmlElement(xml4);
        tests.push(assertEquals(
            TableGridParser.parse(tbl4!),
            { columns: [] },
            'Parse table grid with non-numeric w:w attribute',
            xml4
        ));

        // Test 5: Null input
        tests.push(assertNull(
            TableGridParser.parse(null as any),
            'Parse null input',
            'null'
        ));

        return tests;
    });
} 