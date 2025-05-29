// test/unit/parsers/tables/table-row-properties-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTableRowProperties } from '../../../../src/parsers/tables/table-row-properties-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { TableRowProperties } from '../../../../src/models/table-models';

describe('parseTableRowProperties', () => {
  const parseTrPrXml = (xmlSnippet: string): TableRowProperties | undefined => {
    const xml = `<w:trPr>${xmlSnippet}</w:trPr>`;
    const trPrNode = parseXmlString(xml)['w:trPr'];
    return parseTableRowProperties(trPrNode);
  };

  it('should return undefined for empty or no trPrNode', () => {
    expect(parseTableRowProperties(null)).toBeUndefined();
    expect(parseTableRowProperties({})).toBeUndefined();
    expect(parseTrPrXml('')).toBeUndefined();
  });

  it('should parse row height (w:trHeight)', () => {
    const props1 = parseTrPrXml('<w:trHeight w:val="1200"/>');
    expect(props1?.height).toEqual({ value: 1200, rule: 'auto' });

    const props2 = parseTrPrXml('<w:trHeight w:val="800" w:hRule="exact"/>');
    expect(props2?.height).toEqual({ value: 800, rule: 'exact' });
    
    const props3 = parseTrPrXml('<w:trHeight w:val="950" w:hRule="atLeast"/>');
    expect(props3?.height).toEqual({ value: 950, rule: 'atLeast' });

    const props4 = parseTrPrXml('<w:trHeight w:val="invalid"/>'); // Invalid height value
    expect(props4?.height).toBeUndefined();
    
    const props5 = parseTrPrXml('<w:trHeight w:hRule="invalidRule"/>'); // No w:val
    expect(props5?.height).toBeUndefined();
  });

  it('should parse table header flag (w:tblHeader)', () => {
    expect(parseTrPrXml('<w:tblHeader/>')?.isHeader).toBe(true);
    expect(parseTrPrXml('<w:tblHeader w:val="true"/>')?.isHeader).toBe(true);
    expect(parseTrPrXml('<w:tblHeader w:val="1"/>')?.isHeader).toBe(true);
    expect(parseTrPrXml('<w:tblHeader w:val="false"/>')?.isHeader).toBe(false);
    expect(parseTrPrXml('<w:tblHeader w:val="0"/>')?.isHeader).toBe(false);
  });

  it('should parse cantSplit flag (w:cantSplit)', () => {
    expect(parseTrPrXml('<w:cantSplit/>')?.cantSplit).toBe(true);
    expect(parseTrPrXml('<w:cantSplit w:val="true"/>')?.cantSplit).toBe(true);
    expect(parseTrPrXml('<w:cantSplit w:val="false"/>')?.cantSplit).toBe(false);
  });

  it('should parse multiple properties', () => {
    const xml = 
      '<w:trHeight w:val="750" w:hRule="atLeast"/>' +
      '<w:tblHeader w:val="1"/>' +
      '<w:cantSplit w:val="0"/>';
    const props = parseTrPrXml(xml);
    expect(props?.height).toEqual({ value: 750, rule: 'atLeast' });
    expect(props?.isHeader).toBe(true);
    expect(props?.cantSplit).toBe(false);
  });
});
