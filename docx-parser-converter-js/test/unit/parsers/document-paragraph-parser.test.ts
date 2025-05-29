import { describe, expect, it } from 'vitest';
import { DocumentParagraphParser } from '../../../src/parsers/document/paragraph-parser.js';

describe('DocumentParagraphParser', () => {
  it('should create parser instance', () => {
    const parser = new DocumentParagraphParser();
    expect(parser).toBeDefined();
  });

  it('should parse simple paragraph with text', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:r>
    <w:t>Hello World</w:t>
  </w:r>
</w:p>`;

    const parser = new DocumentParagraphParser();
    const result = await parser.parse(xmlContent);

    expect(result.data).toBeDefined();
    expect(result.data.runs).toHaveLength(1);
    expect(result.data.runs[0]?.contents).toHaveLength(1);
    const firstRun = result.data.runs[0];
    const firstContent = firstRun?.contents?.[0];
    if (firstContent && 'run' in firstContent && 'text' in firstContent.run) {
      expect(firstContent.run.text).toBe('Hello World');
    }
    expect(result.warnings).toEqual([]);
    expect(result.metadata.parserType).toBe('DocumentParagraphParser');
  });

  it('should parse paragraph with formatting', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="FF0000"/>
    </w:rPr>
    <w:t>Formatted Text</w:t>
  </w:r>
</w:p>`;

    const parser = new DocumentParagraphParser();
    const result = await parser.parse(xmlContent);

    expect(result.data.properties.style_id).toBe('Heading1');
    expect(result.data.properties.justification).toBe('center');
    // Note: DocumentParagraphParser delegates run parsing to RunParser.
    // These specific run property tests might need adjustment if RunParser handles them differently
    // or if the structure of run properties changes.
    // For now, assuming the direct properties are still accessible or correctly parsed by the delegated parser.
    expect(result.data.runs[0]?.properties?.bold).toBe(true);
    expect(result.data.runs[0]?.properties?.size_pt).toBe(12); // 24 half-points = 12 points
    expect(result.data.runs[0]?.properties?.color).toBe('FF0000');
  });

  it('should handle parsing errors gracefully', async () => {
    const invalidXml = 'This is not valid XML';

    const parser = new DocumentParagraphParser();

    await expect(parser.parse(invalidXml)).rejects.toThrow();
  });

  it('should parse paragraph with numbering', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:pPr>
    <w:numPr>
      <w:ilvl w:val="0"/>
      <w:numId w:val="1"/>
    </w:numPr>
  </w:pPr>
  <w:r>
    <w:t>List item text</w:t>
  </w:r>
</w:p>`;

    const parser = new DocumentParagraphParser();
    const result = await parser.parse(xmlContent);

    expect(result.data.numbering).toBeDefined();
    expect(result.data.numbering?.ilvl).toBe(0);
    expect(result.data.numbering?.numId).toBe(1);
  });
}); 