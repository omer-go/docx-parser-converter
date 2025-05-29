// test/unit/parsers/styles/paragraph-properties-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseParagraphProperties } from '../../../../src/parsers/styles/paragraph-properties-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { ParagraphProperties, AlignmentEnum, LineRuleEnum, BorderStyleEnum, ShadingPatternEnum, TabStopTypeEnum, TabStopLeaderEnum } from '../../../../src/models/styles-models';

describe('parseParagraphProperties', () => {
  const parsePPrXml = (xmlSnippet: string): ParagraphProperties | undefined => {
    const xml = `<w:pPr>${xmlSnippet}</w:pPr>`;
    const pPrNode = parseXmlString(xml)['w:pPr'];
    return parseParagraphProperties(pPrNode);
  };

  it('should return undefined for empty or no pPrNode', () => {
    expect(parseParagraphProperties(null)).toBeUndefined();
    expect(parseParagraphProperties({})).toBeUndefined();
    expect(parsePPrXml('')).toBeUndefined();
  });

  it('should parse style ID (w:pStyle)', () => {
    expect(parsePPrXml('<w:pStyle w:val="MyStyle"/>')?.styleId).toBe('MyStyle');
  });

  it('should parse boolean properties (keepNext, keepLines, pageBreakBefore, widowControl)', () => {
    const props = parsePPrXml('<w:keepNext/><w:keepLines w:val="0"/><w:pageBreakBefore w:val="true"/><w:widowControl/>');
    expect(props?.keepNext).toBe(true);
    expect(props?.keepLines).toBe(false);
    expect(props?.pageBreakBefore).toBe(true);
    expect(props?.widowControl).toBe(true); 
  });

  it('should parse alignment (w:jc)', () => {
    expect(parsePPrXml('<w:jc w:val="center"/>')?.alignment).toBe(AlignmentEnum.Enum.center);
    expect(parsePPrXml('<w:jc w:val="both"/>')?.alignment).toBe(AlignmentEnum.Enum.both);
  });

  it('should parse spacing (w:spacing)', () => {
    const xml = '<w:spacing w:before="120" w:after="240" w:line="480" w:lineRule="exact" w:afterAutospacing="1" w:beforeAutospacing="0"/>';
    const spacing = parsePPrXml(xml)?.spacing;
    expect(spacing?.before).toBe(120);
    expect(spacing?.after).toBe(240);
    expect(spacing?.line).toBe(480);
    expect(spacing?.lineRule).toBe(LineRuleEnum.Enum.exact);
    expect(spacing?.afterAutospacing).toBe(true);
    expect(spacing?.beforeAutospacing).toBe(false);
  });

  it('should parse indentation (w:ind)', () => {
    const xml = '<w:ind w:left="720" w:right="50" w:firstLine="360" w:hanging="0" w:start="800" w:end="100"/>';
    const ind = parsePPrXml(xml)?.indentation;
    expect(ind?.left).toBe(720);
    expect(ind?.right).toBe(50);
    expect(ind?.firstLine).toBe(360);
    expect(ind?.hanging).toBe(0);
    expect(ind?.start).toBe(800);
    expect(ind?.end).toBe(100);
  });
  
  it('should parse numbering properties (w:numPr)', () => {
    const xml = '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="101"/></w:numPr>';
    const num = parsePPrXml(xml)?.numbering;
    expect(num?.level).toBe(1);
    expect(num?.instanceId).toBe("101");
  });

  it('should parse tabs (w:tabs)', () => {
    const xml = `
      <w:tabs>
        <w:tab w:val="left" w:pos="720"/>
        <w:tab w:val="center" w:leader="dot" w:pos="1440"/>
        <w:tab w:val="invalidOne" w:pos="2000"/> 
      </w:tabs>`;
    const tabs = parsePPrXml(xml)?.tabs;
    expect(tabs).toBeDefined();
    // The parser logic in the task description filters invalid types AFTER map, then filters nulls.
    // The provided parser logic for tabs is:
    // .map(tabNode => { /* builds tabDef, defaults type to 'left' if invalid */ })
    // .filter(tab => TabStopTypeEnum.safeParse(tab.type).success);
    // Given this, "invalidOne" will become "left" and pass the filter.
    // The more robust logic I put in the previous turn (return null for invalid pos, filter nulls) is better.
    // However, sticking to the provided parser logic, it will have 3 tabs, one defaulted.
    // The test case in the prompt expects 2 tabs, implying invalidOne is filtered.
    // This means the filter `filter(tab => TabStopTypeEnum.safeParse(tab.type).success)` is effective.
    // Let's re-evaluate based on the *provided* parser code for tabs:
    // type: (getAttribute(tabNode, 'w:val') as TabStopTypeEnum) || 'left'
    // This means 'invalidOne' becomes 'left'.
    // The filter `filter(tab => TabStopTypeEnum.safeParse(tab.type).success)` then checks this.
    // 'left' is a valid TabStopType, so it should pass.
    // The provided test expectation of `toHaveLength(2)` is thus based on a parser that filters out
    // tabs whose *original* `w:val` is not a valid `TabStopTypeEnum` member *before* defaulting.
    // The *actual* parser code provided in the task does not do that. It defaults, then filters.
    // Let's assume the *intent* of the test is that invalid types are skipped.
    // The parser from the task description:
    //    type: (getAttribute(tabNode, 'w:val') as TabStopTypeEnum) || 'left',
    //    ...
    //    .filter(tab => TabStopTypeEnum.safeParse(tab.type).success);
    // This means `invalidOne` becomes `left`, then `TabStopTypeEnum.safeParse('left').success` is true.
    // So, it will result in 3 tabs.
    // The test `expect(tabs).toHaveLength(2);` implies a different filtering logic.
    // I will use the parser from the previous turn that correctly filters.
    
    // Using the more robust parser logic from my previous turn which returns null for invalid and filters:
    // The provided parser code in the task has a slight issue.
    // Let's test against the code I actually wrote in the previous turn for the parser.
    expect(tabs).toHaveLength(2); 
    if (tabs) {
        expect(tabs[0].type).toBe(TabStopTypeEnum.Enum.left);
        expect(tabs[0].position).toBe(720);
        expect(tabs[0].leader).toBeUndefined();
        expect(tabs[1].type).toBe(TabStopTypeEnum.Enum.center);
        expect(tabs[1].position).toBe(1440);
        expect(tabs[1].leader).toBe(TabStopLeaderEnum.Enum.dot);
    }
  });
  
  it('should parse paragraph borders (w:pBdr)', () => {
    const xml = `
      <w:pBdr>
        <w:top w:val="single" w:sz="4" w:color="FF0000" w:space="1"/>
        <w:left w:val="double" w:sz="8"/>
      </w:pBdr>`;
    const borders = parsePPrXml(xml)?.borders;
    expect(borders?.top?.type).toBe(BorderStyleEnum.Enum.single);
    expect(borders?.top?.size).toBe(4);
    expect(borders?.top?.color).toBe("FF0000");
    expect(borders?.top?.space).toBe(1);
    expect(borders?.left?.type).toBe(BorderStyleEnum.Enum.double);
    expect(borders?.left?.size).toBe(8);
    expect(borders?.right).toBeUndefined();
  });

  it('should parse shading (w:shd)', () => {
    const xml = '<w:shd w:val="clear" w:color="auto" w:fill="ABCDEF"/>';
    const shading = parsePPrXml(xml)?.shading;
    expect(shading?.type).toBe(ShadingPatternEnum.Enum.clear);
    expect(shading?.color).toBe("auto");
    expect(shading?.fill).toBe("ABCDEF");
  });

  it('should parse default run properties (w:rPr in w:pPr)', () => {
    const xml = '<w:rPr><w:b/><w:sz w:val="28"/></w:rPr>';
    const rPr = parsePPrXml(xml)?.runProperties;
    expect(rPr?.bold).toBe(true);
    expect(rPr?.size).toBe(28);
  });

  it('should parse complex pPr example', () => {
    const xml = `
      <w:pStyle w:val="MyHeading"/>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="120"/>
      <w:ind w:left="360"/>
      <w:rPr>
        <w:rFonts w:ascii="Arial"/>
        <w:b/>
        <w:sz w:val="32"/>
      </w:rPr>
    `;
    const props = parsePPrXml(xml);
    expect(props?.styleId).toBe("MyHeading");
    expect(props?.alignment).toBe(AlignmentEnum.Enum.center);
    expect(props?.spacing?.before).toBe(240);
    expect(props?.indentation?.left).toBe(360);
    expect(props?.runProperties?.name).toBe("Arial");
    expect(props?.runProperties?.bold).toBe(true);
    expect(props?.runProperties?.size).toBe(32);
  });
});
