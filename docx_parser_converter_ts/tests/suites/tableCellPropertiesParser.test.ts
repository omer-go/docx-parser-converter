import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { TableCellPropertiesParser } from '../../src/docx_parsers/tabels/tableCellPropertiesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTableCellPropertiesParserTests() {
    describe('TableCellPropertiesParser Tests', () => {
        const tests: TestResult[] = [];

        // Helper to wrap XML in <w:tcPr>
        function wrapTcPr(innerXml: string): Element | null {
            const xml = `<w:tcPr xmlns:w="${NAMESPACE_URI}">${innerXml}</w:tcPr>`;
            return getXmlElement(xml);
        }

        // Test 1: All properties present
        const tcPr1 = wrapTcPr(`
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
            <w:hideMark/>
            <w:cellMerge w:val="restart"/>
            <w:gridSpan w:val="2"/>
        `);
        const expected1 = {
            tcW: { type: 'dxa', width: 250 },
            tcBorders: {
                top: { color: '000000', size: 4, space: 0, val: 'single' },
                left: { color: '000000', size: 4, space: 0, val: 'single' },
                bottom: { color: '000000', size: 4, space: 0, val: 'single' },
                right: { color: '000000', size: 4, space: 0, val: 'single' },
            },
            shd: { fill: 'FFFF00', val: 'clear', color: 'auto' },
            tcMar: { top: 5, left: 5, bottom: 5, right: 5 },
            textDirection: 'btLr',
            vAlign: 'center',
            hideMark: true,
            cellMerge: 'restart',
            gridSpan: 2,
        };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr1),
            expected1,
            'Parse all properties',
            tcPr1?.outerHTML
        ));

        // Test 2: Only width
        const tcPr2 = wrapTcPr('<w:tcW w:w="2000" w:type="dxa"/>');
        const expected2 = {
            tcW: { type: 'dxa', width: 100 },
        };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr2),
            { ...expected2 },
            'Parse only width',
            tcPr2?.outerHTML
        ));

        // Test 3: No properties
        const tcPr3 = wrapTcPr('');
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr3),
            {},
            'Parse empty tcPr (should be empty object)',
            tcPr3?.outerHTML
        ));

        // Test 4: Null input
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(null),
            {},
            'Parse null tcPr (should be empty object)',
            'null'
        ));

        // Test 5: Only gridSpan
        const tcPr5 = wrapTcPr('<w:gridSpan w:val="3"/>');
        const expected5 = { gridSpan: 3 };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr5),
            expected5,
            'Parse only gridSpan',
            tcPr5?.outerHTML
        ));

        // Test 6: Only hideMark
        const tcPr6 = wrapTcPr('<w:hideMark/>');
        const expected6 = { hideMark: true };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr6),
            expected6,
            'Parse only hideMark',
            tcPr6?.outerHTML
        ));

        // Test 7: Only cellMerge
        const tcPr7 = wrapTcPr('<w:cellMerge w:val="continue"/>');
        const expected7 = { cellMerge: 'continue' };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr7),
            expected7,
            'Parse only cellMerge',
            tcPr7?.outerHTML
        ));

        // Test 8: Only textDirection
        const tcPr8 = wrapTcPr('<w:textDirection w:val="tbRl"/>');
        const expected8 = { textDirection: 'tbRl' };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr8),
            expected8,
            'Parse only textDirection',
            tcPr8?.outerHTML
        ));

        // Test 9: Only vAlign
        const tcPr9 = wrapTcPr('<w:vAlign w:val="bottom"/>');
        const expected9 = { vAlign: 'bottom' };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr9),
            expected9,
            'Parse only vAlign',
            tcPr9?.outerHTML
        ));

        // Test 10: Only margins
        const tcPr10 = wrapTcPr('<w:tcMar><w:top w:w="40" w:type="dxa"/></w:tcMar>');
        const expected10 = { tcMar: { top: 2 } };
        tests.push(assertEquals(
            TableCellPropertiesParser.parse(tcPr10),
            expected10,
            'Parse only top margin',
            tcPr10?.outerHTML
        ));

        return tests;
    });
} 