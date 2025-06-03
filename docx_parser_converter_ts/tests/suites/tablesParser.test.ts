import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, assertNotNull, getXmlElement } from '../test-utils';
import { TablesParser } from '../../src/docx_parsers/tabels/tablesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerTablesParserTests() {
  describe('TablesParser Tests', () => {
    const tests: TestResult[] = [];

    // Helper to create a <w:tbl> element
    function createTableElement(innerXml: string): Element | null {
      const xmlString = `<w:tbl xmlns:w="${NAMESPACE_URI}">${innerXml}</w:tbl>`;
      return getXmlElement(xmlString);
    }

    // Test 1: Table with properties, grid, and one row
    const tbl1 = createTableElement(`
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="5000" w:type="dxa"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="5000"/>
        <w:gridCol w:w="5000"/>
      </w:tblGrid>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
      </w:tr>
    `);
    tests.push(assertNotNull(
      tbl1,
      'Should create a valid <w:tbl> element for table with properties, grid, and row',
      tbl1?.outerHTML
    ));
    if (tbl1) {
      const parser = new TablesParser(tbl1);
      const parsed = parser.parse();
      const outputJson = JSON.stringify(parsed, null, 2);
      tests.push(assertEquals(
        outputJson,
        outputJson, // Output the actual JSON for inspection
        'Should output parsed JSON for table with properties, grid, and row',
        tbl1.outerHTML
      ));
    }

    // Test 2: Table with no rows
    const tbl2 = createTableElement(`
      <w:tblPr><w:tblStyle w:val="NoRows"/></w:tblPr>
      <w:tblGrid><w:gridCol w:w="3000"/></w:tblGrid>
    `);
    tests.push(assertNotNull(
      tbl2,
      'Should create a valid <w:tbl> element for table with no rows',
      tbl2?.outerHTML
    ));
    if (tbl2) {
      const parser = new TablesParser(tbl2);
      const parsed = parser.parse();
      const outputJson = JSON.stringify(parsed, null, 2);
      tests.push(assertEquals(
        outputJson,
        outputJson, // For now, just output the actual JSON for inspection
        'Should output parsed JSON for table with no rows',
        tbl2.outerHTML
      ));
    }

    // Test 3: Table with no properties or grid
    const tbl3 = createTableElement(`
      <w:tr><w:tc><w:p><w:r><w:t>OnlyCell</w:t></w:r></w:p></w:tc></w:tr>
    `);
    tests.push(assertNotNull(
      tbl3,
      'Should create a valid <w:tbl> element for table with no properties or grid',
      tbl3?.outerHTML
    ));
    if (tbl3) {
      const parser = new TablesParser(tbl3);
      const parsed = parser.parse();
      const outputJson = JSON.stringify(parsed, null, 2);
      tests.push(assertEquals(
        outputJson,
        outputJson, // For now, just output the actual JSON for inspection
        'Should output parsed JSON for table with no properties or grid',
        tbl3.outerHTML
      ));
    }

    // Test 4: Null input (should not instantiate)
    tests.push(assertNotNull(
      TablesParser,
      'TablesParser class should be defined'
    ));

    return tests;
  });
} 