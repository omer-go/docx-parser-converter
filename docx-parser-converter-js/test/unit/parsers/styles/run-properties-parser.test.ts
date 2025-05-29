// test/unit/parsers/styles/run-properties-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseRunProperties } from '../../../../src/parsers/styles/run-properties-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { RunProperties } from '../../../../src/models/styles-models';

describe('parseRunProperties', () => {
  const parseRprXml = (xmlSnippet: string): RunProperties | undefined => {
    const xml = `<w:rPr>${xmlSnippet}</w:rPr>`;
    const rPrNode = parseXmlString(xml)['w:rPr'];
    return parseRunProperties(rPrNode);
  };

  it('should return undefined for empty or no rPrNode', () => {
    expect(parseRunProperties(null)).toBeUndefined();
    expect(parseRunProperties({})).toBeUndefined();
    expect(parseRprXml('')).toBeUndefined();
  });

  it('should parse font name (w:rFonts)', () => {
    expect(parseRprXml('<w:rFonts w:ascii="Arial"/>')?.name).toBe('Arial');
    expect(parseRprXml('<w:rFonts w:hAnsi="Times New Roman"/>')?.name).toBe('Times New Roman');
    expect(parseRprXml('<w:rFonts w:cs="David"/>')?.name).toBe('David');
    expect(parseRprXml('<w:rFonts w:eastAsia=" पीएमएस-साधना"/>')?.name).toBe(' पीएमएस-साधना');
    expect(parseRprXml('<w:rFonts w:ascii="Arial" w:hAnsi="TNR"/>')?.name).toBe('Arial'); // Ascii priority
  });

  it('should parse font size (w:sz)', () => {
    expect(parseRprXml('<w:sz w:val="28"/>')?.size).toBe(28);
  });

  it('should parse color (w:color)', () => {
    expect(parseRprXml('<w:color w:val="FF0000"/>')?.color).toBe('FF0000');
  });

  it('should parse bold (w:b)', () => {
    expect(parseRprXml('<w:b/>')?.bold).toBe(true);
    expect(parseRprXml('<w:b w:val="true"/>')?.bold).toBe(true);
    expect(parseRprXml('<w:b w:val="1"/>')?.bold).toBe(true);
    expect(parseRprXml('<w:b w:val="false"/>')?.bold).toBe(false);
    expect(parseRprXml('<w:b w:val="0"/>')?.bold).toBe(false);
  });

  it('should parse italic (w:i)', () => {
    expect(parseRprXml('<w:i/>')?.italic).toBe(true);
    expect(parseRprXml('<w:i w:val="false"/>')?.italic).toBe(false);
  });

  it('should parse underline (w:u)', () => {
    expect(parseRprXml('<w:u w:val="single"/>')?.underline).toBe('single');
    expect(parseRprXml('<w:u w:val="double"/>')?.underline).toBe('double');
    expect(parseRprXml('<w:u w:val="none"/>')?.underline).toBe('none');
    expect(parseRprXml('<w:u w:val="nonExistentType"/>')?.underline).toBeUndefined();
  });

  it('should parse strikethrough (w:strike) and doubleStrikethrough (w:dstrike)', () => {
    expect(parseRprXml('<w:strike/>')?.strikethrough).toBe(true);
    expect(parseRprXml('<w:strike w:val="0"/>')?.strikethrough).toBe(false);
    expect(parseRprXml('<w:dstrike/>')?.doubleStrikethrough).toBe(true);
  });
  
  it('should parse smallCaps (w:smallCaps) and caps (w:caps)', () => {
    expect(parseRprXml('<w:smallCaps/>')?.smallCaps).toBe(true);
    expect(parseRprXml('<w:caps w:val="false"/>')?.capitalized).toBe(false);
  });

  it('should parse highlight (w:highlight)', () => {
    expect(parseRprXml('<w:highlight w:val="yellow"/>')?.highlight).toBe('yellow');
  });
  
  it('should parse verticalAlign (w:vertAlign)', () => {
    expect(parseRprXml('<w:vertAlign w:val="superscript"/>')?.verticalAlign).toBe('superscript');
    expect(parseRprXml('<w:vertAlign w:val="subscript"/>')?.verticalAlign).toBe('subscript');
    expect(parseRprXml('<w:vertAlign w:val="baseline"/>')?.verticalAlign).toBe('baseline');
     expect(parseRprXml('<w:vertAlign w:val="invalid"/>')?.verticalAlign).toBeUndefined();
  });

  it('should parse kerning (w:kern)', () => {
    expect(parseRprXml('<w:kern w:val="28"/>')?.kerning).toBe(28);
  });
  
  it('should parse character spacing (w:spacing)', () => {
    expect(parseRprXml('<w:spacing w:val="-20"/>')?.spacing).toBe(-20); // Can be negative
  });

  it('should parse language (w:lang)', () => {
    expect(parseRprXml('<w:lang w:val="en-US"/>')?.language).toBe('en-US');
    expect(parseRprXml('<w:lang w:eastAsia="ja-JP"/>')?.language).toBe('ja-JP');
    expect(parseRprXml('<w:lang w:bidi="he-IL"/>')?.language).toBe('he-IL');
    expect(parseRprXml('<w:lang w:val="en-US" w:eastAsia="ja-JP"/>')?.language).toBe('en-US'); // val priority
  });
  
  it('should parse emphasisMark (w:em)', () => {
    expect(parseRprXml('<w:em w:val="dot"/>')?.emphasisMark).toBe('dot');
    expect(parseRprXml('<w:em w:val="none"/>')?.emphasisMark).toBe('none');
    expect(parseRprXml('<w:em w:val="invalid"/>')?.emphasisMark).toBeUndefined();
  });

  it('should parse multiple properties correctly', () => {
    const xml = `
      <w:rFonts w:ascii="Calibri"/>
      <w:b/>
      <w:i w:val="false"/>
      <w:sz w:val="32"/>
      <w:color w:val="00FF00"/>
      <w:u w:val="double"/>
    `;
    const props = parseRprXml(xml);
    expect(props?.name).toBe('Calibri');
    expect(props?.bold).toBe(true);
    expect(props?.italic).toBe(false);
    expect(props?.size).toBe(32);
    expect(props?.color).toBe('00FF00');
    expect(props?.underline).toBe('double');
  });
  
  it('should return undefined if only unknown properties are present', () => {
    expect(parseRprXml('<w:someUnknownTag w:val="test"/>')).toBeUndefined();
  });
});
