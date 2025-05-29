// test/unit/parsers/document/margins-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parsePageMargins } from '../../../../src/parsers/document/margins-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { PageMargins } from '../../../../src/models/document-models';

describe('parsePageMargins', () => {
  const parsePgMarXml = (xmlAttributes: string): PageMargins | undefined => {
    // Construct a w:pgMar element string with provided attributes
    const xml = `<w:pgMar ${xmlAttributes}/>`; 
    const doc = parseXmlString(xml);
    return parsePageMargins(doc['w:pgMar']);
  };

  it('should return undefined for empty or no pgMarNode', () => {
    expect(parsePageMargins(null)).toBeUndefined();
    expect(parsePageMargins({})).toBeUndefined();
    const emptyNode = parseXmlString('<w:pgMar/>')['w:pgMar'];
    expect(parsePageMargins(emptyNode)).toBeUndefined(); // No attributes, so treated as empty
  });

  it('should parse all margin attributes correctly', () => {
    const attrs = 'w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"';
    const margins = parsePgMarXml(attrs);
    expect(margins?.top).toBe(1440);
    expect(margins?.right).toBe(1800);
    expect(margins?.bottom).toBe(1440);
    expect(margins?.left).toBe(1800);
    expect(margins?.header).toBe(720);
    expect(margins?.footer).toBe(720);
    expect(margins?.gutter).toBe(0);
  });

  it('should parse some margin attributes correctly', () => {
    const attrs = 'w:left="1000" w:header="500"';
    const margins = parsePgMarXml(attrs);
    expect(margins?.left).toBe(1000);
    expect(margins?.header).toBe(500);
    expect(margins?.top).toBeUndefined();
    expect(margins?.right).toBeUndefined();
  });
  
  it('should handle zero values correctly', () => {
    const attrs = 'w:top="0" w:gutter="0"';
    const margins = parsePgMarXml(attrs);
    expect(margins?.top).toBe(0);
    expect(margins?.gutter).toBe(0);
  });

  it('should return undefined if all attribute values are invalid and result in NaN (though model validation is primary)', () => {
    // This test depends on how strictly parsePageMargins filters out NaN values before model validation.
    // The current implementation might return an object with NaN values, relying on Zod.
    // For this test, let's assume if all are NaN, it might return undefined or an object full of NaNs.
    // The model (NonNegativeIntSchema) would catch NaNs.
    // The `hasValidMargin` check in parser should make it return undefined.
    const attrs = 'w:top="invalid" w:left="nonsense"';
    const marginsNode = parseXmlString(`<w:pgMar ${attrs}/>`)['w:pgMar'];
    const margins = parsePageMargins(marginsNode);
    expect(margins).toBeUndefined(); 
  });
  
  it('should parse correctly if some attributes are valid and others are not numbers', () => {
    const attrs = 'w:top="100" w:left="not-a-number" w:right="200"';
    const marginsNode = parseXmlString(`<w:pgMar ${attrs}/>`)['w:pgMar'];
    const margins = parsePageMargins(marginsNode);
    expect(margins?.top).toBe(100);
    expect(margins?.left).toBeNaN(); // parseInt("not-a-number") is NaN
    expect(margins?.right).toBe(200);
    // The model validation (NonNegativeIntSchema) would later catch the NaN for 'left'.
    // The parser itself doesn't fully exclude it yet, but hasValidMargin might consider it.
    // The current `hasValidMargin` check: `!isNaN(margins[key as keyof PageMargins] as number)`
    // So, `left: NaN` would make that key invalid for `hasValidMargin`.
    // If top and right are valid, hasValidMargin is true.
    expect(Object.keys(margins || {}).length).toBeGreaterThan(0); // Check if object is not empty
  });

});
