import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { TablePropertiesParser } from '../../src/docx_parsers/tabels/tablePropertiesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';
import type { TableProperties } from '../../src/docx_parsers/models/tableModels';

export function registerTablePropertiesParserTests() {
  describe('TablePropertiesParser Tests', () => {
    const tests: TestResult[] = [];

    // Helper to create tblPr XML
    function createTblPrXml(content: string): Element | null {
      const xmlString = `<w:tblPr xmlns:w="${NAMESPACE_URI}">${content}</w:tblPr>`;
      return getXmlElement(xmlString);
    }

    // Test 1: Full properties
    const xml1 = createTblPrXml(`
      <w:tblStyle w:val="TableGrid"/>
      <w:tblW w:w="5000" w:type="dxa"/>
      <w:tblInd w:w="200" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
      <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
      <w:tblCellMar>
        <w:top w:w="100" w:type="dxa"/>
        <w:left w:w="100" w:type="dxa"/>
        <w:bottom w:w="100" w:type="dxa"/>
        <w:right w:w="100" w:type="dxa"/>
      </w:tblCellMar>
      <w:tblLayout w:type="fixed"/>
      <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>
    `);
    const expected1: TableProperties = {
      tblStyle: 'TableGrid',
      tblW: { type: 'dxa', width: 250 },
      justification: undefined,
      tblInd: { type: 'dxa', width: 10 },
      tblCellMar: { top: 5, left: 5, bottom: 5, right: 5 },
      tblBorders: {
        top: { color: '000000', size: 4, space: 0, val: 'single' },
        left: { color: '000000', size: 4, space: 0, val: 'single' },
        bottom: { color: '000000', size: 4, space: 0, val: 'single' },
        right: { color: '000000', size: 4, space: 0, val: 'single' },
        insideH: { color: '000000', size: 4, space: 0, val: 'single' },
        insideV: { color: '000000', size: 4, space: 0, val: 'single' },
      },
      shd: { fill: 'FFFF00', val: 'clear', color: 'auto' },
      tblLayout: 'fixed',
      tblLook: {
        firstRow: true,
        lastRow: false,
        firstColumn: true,
        lastColumn: false,
        noHBand: false,
        noVBand: false,
      },
    };
    tests.push(assertEquals(
      TablePropertiesParser.parse(xml1),
      expected1,
      'Parse full table properties',
      xml1?.outerHTML
    ));

    // Test 2: Missing optional properties
    const xml2 = createTblPrXml(`
      <w:tblStyle w:val="SimpleTable"/>
      <w:tblW w:w="3000" w:type="dxa"/>
    `);
    const expected2: TableProperties = {
      tblStyle: 'SimpleTable',
      tblW: { type: 'dxa', width: 150 },
      justification: undefined,
      tblInd: undefined,
      tblCellMar: undefined,
      tblBorders: undefined,
      shd: undefined,
      tblLayout: undefined,
      tblLook: undefined,
    };
    tests.push(assertEquals(
      TablePropertiesParser.parse(xml2),
      expected2,
      'Parse table properties with only style and width',
      xml2?.outerHTML
    ));

    // Test 3: Empty tblPr
    const xml3 = createTblPrXml('');
    const expected3: TableProperties = {
      tblStyle: undefined,
      tblW: undefined,
      justification: undefined,
      tblInd: undefined,
      tblCellMar: undefined,
      tblBorders: undefined,
      shd: undefined,
      tblLayout: undefined,
      tblLook: undefined,
    };
    tests.push(assertEquals(
      TablePropertiesParser.parse(xml3),
      expected3,
      'Parse empty tblPr (all properties undefined)',
      xml3?.outerHTML
    ));

    // Test 4: Justification only
    const xml4 = createTblPrXml('<w:jc w:val="center"/>');
    const expected4: TableProperties = {
      tblStyle: undefined,
      tblW: undefined,
      justification: 'center',
      tblInd: undefined,
      tblCellMar: undefined,
      tblBorders: undefined,
      shd: undefined,
      tblLayout: undefined,
      tblLook: undefined,
    };
    tests.push(assertEquals(
      TablePropertiesParser.parse(xml4),
      expected4,
      'Parse table properties with only justification',
      xml4?.outerHTML
    ));

    return tests;
  });
} 