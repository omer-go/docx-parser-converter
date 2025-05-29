// test/unit/parsers/tables/table-grid-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTableGrid } from '../../../../src/parsers/tables/table-grid-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { TableGridColumn } from '../../../../src/models/table-models';

describe('parseTableGrid', () => {
  const parseTblGridXml = (xmlSnippet: string): TableGridColumn[] => {
    const xml = `<w:tblGrid>${xmlSnippet}</w:tblGrid>`;
    const gridNode = parseXmlString(xml)['w:tblGrid'];
    return parseTableGrid(gridNode);
  };

  it('should return empty array for null, undefined, or non-object input', () => {
    expect(parseTableGrid(null)).toEqual([]);
    expect(parseTableGrid(undefined)).toEqual([]);
    // Test with a boolean true, which can happen if <w:tblGrid/> is parsed with allowBooleanAttributes
    expect(parseTableGrid(true)).toEqual([]);
    // Test with an empty object if <w:tblGrid></w:tblGrid> is parsed and results in {}
    expect(parseTableGrid({})).toEqual([]);
  });
  
  it('should return empty array if <w:tblGrid/> is truly empty (parsed as boolean true)', () => {
    const gridNode = parseXmlString('<w:tblGrid/>')['w:tblGrid'];
    expect(parseTableGrid(gridNode)).toEqual([]);
  });

  it('should parse multiple w:gridCol elements', () => {
    const snippet = '<w:gridCol w:w="2000"/><w:gridCol w:w="3000"/><w:gridCol w:w="1500"/>';
    const columns = parseTblGridXml(snippet);
    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual({ width: 2000 });
    expect(columns[1]).toEqual({ width: 3000 });
    expect(columns[2]).toEqual({ width: 1500 });
  });

  it('should return empty array if no w:gridCol elements are present', () => {
    const columns = parseTblGridXml('');
    expect(columns).toEqual([]);
  });

  it('should skip w:gridCol elements with missing w:w attribute', () => {
    const snippet = '<w:gridCol/><w:gridCol w:w="2500"/>';
    const columns = parseTblGridXml(snippet);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toEqual({ width: 2500 });
  });

  it('should skip w:gridCol elements with invalid (non-numeric) w:w attribute', () => {
    const snippet = '<w:gridCol w:w="invalid"/><w:gridCol w:w="3500"/>';
    const columns = parseTblGridXml(snippet);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toEqual({ width: 3500 });
  });
  
  it('should handle mixed valid and invalid w:gridCol elements', () => {
    const snippet = 
      '<w:gridCol w:w="1000"/>' +
      '<w:gridCol/>' + // Missing w:w
      '<w:gridCol w:w="NaN"/>' + // Invalid w:w
      '<w:gridCol w:w="2000"/>';
    const columns = parseTblGridXml(snippet);
    expect(columns).toHaveLength(2);
    expect(columns[0]).toEqual({ width: 1000 });
    expect(columns[1]).toEqual({ width: 2000 });
  });
});
