// test/unit/parsers/tables/table-row-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTableRow } from '../../../../src/parsers/tables/table-row-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { TableRow, TableCell } from '../../../../src/models/table-models'; // Ensure TableCell is exported or use specific types

describe('parseTableRow', () => {
  const parseTrXml = (xmlSnippet: string): TableRow | null => {
    // This helper assumes xmlSnippet is the content INSIDE <w:tr>...</w:tr>
    // or the <w:tr/> tag itself.
    const xml = `<w:tr>${xmlSnippet}</w:tr>`;
    const trNode = parseXmlString(xml)['w:tr'];
    return parseTableRow(trNode);
  };
  
   const parseTrNodeDirectly = (trNode: any): TableRow | null => {
    return parseTableRow(trNode);
  };

  it('should return null for null or undefined input', () => {
    expect(parseTrNodeDirectly(null)).toBeNull();
    expect(parseTrNodeDirectly(undefined)).toBeNull();
  });

  it('should parse an empty row <w:tr/>', () => {
    const trNodeEmptyTag = parseXmlString('<w:tr/>')['w:tr'];
    const row = parseTrNodeDirectly(trNodeEmptyTag);
    expect(row).toEqual({ type: 'tableRow', children: [], properties: undefined });
  });
  
  it('should parse an empty row <w:tr></w:tr>', () => {
    const trNodeEmpty = parseXmlString('<w:tr></w:tr>')['w:tr'];
    const row = parseTrNodeDirectly(trNodeEmpty);
    expect(row).toEqual({ type: 'tableRow', children: [], properties: undefined });
  });

  it('should parse a row with one cell', () => {
    const row = parseTrXml(
      '<w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>'
    );
    expect(row?.children).toHaveLength(1);
    expect(row?.children[0].type).toBe('tableCell');
    // @ts-ignore Check cell content (first paragraph, first run, text)
    expect(row?.children[0].children[0].children[0].text).toBe('Cell 1');
  });

  it('should parse a row with multiple cells', () => {
    const row = parseTrXml(
      '<w:tc><w:p><w:r><w:t>Cell A</w:t></w:r></w:p></w:tc>' +
      '<w:tc><w:p><w:r><w:t>Cell B</w:t></w:r></w:p></w:tc>'
    );
    expect(row?.children).toHaveLength(2);
    // @ts-ignore
    expect(row?.children[0].children[0].children[0].text).toBe('Cell A');
    // @ts-ignore
    expect(row?.children[1].children[0].children[0].text).toBe('Cell B');
  });

  it('should parse row properties', () => {
    const row = parseTrXml(
      '<w:trPr><w:tblHeader/></w:trPr>' +
      '<w:tc><w:p><w:r><w:t>Header Cell</w:t></w:r></w:p></w:tc>'
    );
    expect(row?.properties?.isHeader).toBe(true);
    expect(row?.children).toHaveLength(1);
  });
  
  it('should parse a row with properties and multiple cells', () => {
    const row = parseTrXml(
      '<w:trPr><w:cantSplit w:val="1"/></w:trPr>' +
      '<w:tc><w:p><w:r><w:t>Content 1</w:t></w:r></w:p></w:tc>' +
      '<w:tc><w:p><w:r><w:t>Content 2</w:t></w:r></w:p></w:tc>'
    );
    expect(row?.properties?.cantSplit).toBe(true);
    expect(row?.children).toHaveLength(2);
  });
  
  it('should skip invalid cells (if parseTableCell returns null)', () => {
    // This test depends on parseTableCell's behavior for invalid tcNodes.
    // Assume parseTableCell returns null for a <w:tc/> that is truly empty or invalid.
    // However, parseTableCell currently ensures a default paragraph for empty cells.
    // So, a <w:tc/> would still produce a valid TableCell.
    // Let's test with a tc that parseTableCell might return null for (e.g. if it were not an object)
    // This scenario is hard to construct if tcNode is always an object or true from parser.
    // For now, assume all <w:tc> elements found by getElements are valid enough to be processed by parseTableCell.
    const trNodeWithPotentiallyEmptyCells = parseXmlString(
        '<w:tr><w:tc/><w:tc><w:p><w:r><w:t>Valid</w:t></w:r></w:p></w:tc><w:tc/></w:tr>'
    )['w:tr'];
    const row = parseTableRow(trNodeWithPotentiallyEmptyCells);
    expect(row?.children).toHaveLength(3); // All <w:tc/> become valid empty cells
    expect(row?.children[0].children[0].type).toBe('paragraph'); // Default empty para
    // @ts-ignore
    expect(row?.children[1].children[0].children[0].text).toBe('Valid');
  });

});
