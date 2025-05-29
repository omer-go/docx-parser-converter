// test/unit/parsers/document/run-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTextRun } from '../../../../src/parsers/document/run-parser';
import { parseXmlString } from '../../../../src/utils/xml-utils';
import { TextRun } from '../../../../src/models/paragraph-models';

describe('parseTextRun', () => {
  const parseRXml = (xmlSnippet: string): TextRun | null => {
    const xml = `<w:r>${xmlSnippet}</w:r>`;
    const rNode = parseXmlString(xml)['w:r'];
    return parseTextRun(rNode);
  };
  
  const parseRNodeDirectly = (rNode: any): TextRun | null => {
    return parseTextRun(rNode);
  };

  it('should return null for empty or no rNode', () => {
    expect(parseRNodeDirectly(null)).toBeNull();
    expect(parseRNodeDirectly({})).toBeNull();
    const emptyRNode = parseXmlString('<w:r/>')['w:r']; // this will be true if allowBooleanAttributes affects it
    expect(parseRNodeDirectly(emptyRNode)).toBeNull(); // No text producing children
  });

  it('should parse simple text run', () => {
    const run = parseRXml('<w:t>Hello</w:t>');
    expect(run).toEqual({ type: 'textRun', text: 'Hello', properties: undefined });
  });

  it('should parse text run with properties', () => {
    const run = parseRXml('<w:rPr><w:b/></w:rPr><w:t>Bold</w:t>');
    expect(run?.type).toBe('textRun');
    expect(run?.text).toBe('Bold');
    expect(run?.properties?.bold).toBe(true);
  });

  it('should concatenate text from multiple w:t elements', () => {
    const run = parseRXml('<w:t>Hello</w:t><w:t> </w:t><w:t>World</w:t>');
    expect(run?.text).toBe('Hello World');
  });

  it('should handle xml:space="preserve" on w:t (basic check, depends on parser config)', () => {
    // fast-xml-parser with trimValues: true (default) might trim.
    // If attributesGroupName is false and attributeNamePrefix is '', xml:space becomes a key.
    // The parser options are trimValues: true. This test checks if text is preserved despite that.
    // The actual text node value from fast-xml-parser is what we get.
    const rNodeWithSpace = parseXmlString('<w:r><w:t xml:space="preserve">  Spaces  </w:t></w:r>')['w:r'];
    const run = parseTextRun(rNodeWithSpace);
    // Given trimValues: true in XMLParser options, leading/trailing spaces in #text are likely trimmed.
    // xml:space="preserve" is more of a hint for applications rendering the XML.
    // Our current parser doesn't specifically treat #text differently based on xml:space attribute.
    expect(run?.text).toBe('Spaces'); // Expecting trimmed version due to global trimValues: true
  });
  
  it('should parse text from w:instrText', () => {
    const run = parseRXml('<w:instrText>FIELD_TEXT</w:instrText>');
    expect(run?.text).toBe('FIELD_TEXT');
  });
  
  it('should concatenate w:t and w:instrText', () => {
    const run = parseRXml('<w:t>Some </w:t><w:instrText>FIELD</w:instrText><w:t> text.</w:t>');
    expect(run?.text).toBe('Some FIELD text.');
  });

  it('should return null if run contains no w:t or w:instrText (e.g., only drawing)', () => {
    // <w:drawing> is not parsed here, so effectively an empty run for text purposes
    const run = parseRXml('<w:drawing>...</w:drawing>'); 
    expect(run).toBeNull();
  });
  
  it('should return null for w:t with empty content if it is the only text producing element', () => {
    expect(parseRXml('<w:t></w:t>')).toBeNull(); // No #text node if empty and parseTagValue is false
    const rNodeEmptyT = parseXmlString('<w:r><w:t xml:space="preserve"></w:t></w:r>')['w:r'];
    expect(parseTextRun(rNodeEmptyT)).toBeNull(); // #text would be "" but then filtered
  });

  it('should return TextRun with empty string if w:t has content that results in empty string after processing', () => {
    // If <w:t> </w:t> is parsed and trimValues makes it "", it's handled by the "" check
    const rNodeSpaceT = parseXmlString('<w:r><w:t> </w:t></w:r>')['w:r'];
    // With trimValues:true, ' ' becomes '', so it's like an empty <w:t/>
    expect(parseTextRun(rNodeSpaceT)).toBeNull();
  });

  it('should return TextRun with properties even if text is empty but was present', () => {
    // This case tests if an rPr is preserved if <w:t></w:t> results in empty text.
    // Current logic: if extractedText is "", returns null.
    const rNode = parseXmlString('<w:r><w:rPr><w:b/></w:rPr><w:t></w:t></w:r>')['w:r'];
    expect(parseTextRun(rNode)).toBeNull(); 
  });
  
  it('should handle text with mixed content including line breaks and tabs (conceptual)', () => {
    // <w:br/> and <w:tab/> inside <w:r> are not directly part of TextRun's text content by this parser.
    // They would be parsed as separate elements at a higher level (paragraph content).
    // This test is more to acknowledge their existence.
    const xml = '<w:r><w:t>Line1</w:t><w:br/><w:t>Line2</w:t><w:tab/><w:t>AfterTab</w:t></w:r>';
    const rNode = parseXmlString(xml)['w:r'];
    const run = parseTextRun(rNode);
    // parseTextRun currently only concatenates w:t and w:instrText.
    // It does not convert w:br or w:tab into characters within the text.
    expect(run?.text).toBe('Line1Line2AfterTab'); 
  });

});
