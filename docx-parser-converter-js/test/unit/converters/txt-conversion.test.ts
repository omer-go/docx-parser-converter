/**
 * TXT Conversion Tests
 * 
 * Tests for the complete TXT conversion system
 */

import { describe, it, expect } from 'vitest';
import { DocxToTxtConverter } from '../../../src/converters/txt/docx-to-txt-converter.js';
import { ParagraphConverter } from '../../../src/converters/txt/converters/paragraph-converter.js';
import { RunConverter } from '../../../src/converters/txt/converters/run-converter.js';
import { TableConverter } from '../../../src/converters/txt/converters/table-converter.js';
import { TxtGenerator } from '../../../src/converters/txt/txt-generator.js';
import type { DocumentSchema } from '../../../src/models/document-models.js';
import type { Paragraph, Run } from '../../../src/models/paragraph-models.js';
import type { Table } from '../../../src/models/table-models.js';

describe('TXT Conversion System', () => {
  describe('DocxToTxtConverter', () => {
    it('should convert simple paragraph document', async () => {
      const simpleDoc: DocumentSchema = {
        elements: [
          {
            properties: {},
            runs: [
              {
                contents: [
                  { run: { text: 'Hello, World!' } }
                ],
                properties: {}
              }
            ],
            numbering: null
          } as Paragraph
        ],
        doc_margins: null
      };

      const converter = new DocxToTxtConverter({
        preserveFormatting: true,
        indentSize: 4
      });

      const result = await converter.convert(simpleDoc);
      
      expect(result.text).toContain('Hello, World!');
      expect(result.warnings).toHaveLength(0);
      expect(result.metadata.paragraphCount).toBe(1);
      expect(result.metadata.tableCount).toBe(0);
    });

    it('should convert document with multiple paragraphs', async () => {
      const multiParagraphDoc: DocumentSchema = {
        elements: [
          {
            properties: {},
            runs: [
              {
                contents: [{ run: { text: 'First paragraph' } }],
                properties: {}
              }
            ],
            numbering: null
          } as Paragraph,
          {
            properties: {},
            runs: [
              {
                contents: [{ run: { text: 'Second paragraph' } }],
                properties: {}
              }
            ],
            numbering: null
          } as Paragraph
        ],
        doc_margins: null
      };

      const converter = new DocxToTxtConverter();
      const result = await converter.convert(multiParagraphDoc);
      
      expect(result.text).toContain('First paragraph');
      expect(result.text).toContain('Second paragraph');
      expect(result.metadata.paragraphCount).toBe(2);
    });

    it('should handle empty document', async () => {
      const emptyDoc: DocumentSchema = {
        elements: [],
        doc_margins: null
      };

      const converter = new DocxToTxtConverter();
      const result = await converter.convert(emptyDoc);
      
      expect(result.text).toBe('');
      expect(result.metadata.paragraphCount).toBe(0);
      expect(result.metadata.tableCount).toBe(0);
    });
  });

  describe('ParagraphConverter', () => {
    it('should convert simple paragraph', () => {
      const paragraph: Paragraph = {
        properties: {},
        runs: [
          {
            contents: [{ run: { text: 'Test content' } }],
            properties: {}
          }
        ],
        numbering: null
      };

      const context = {
        indentLevel: 0,
        indentSize: 4,
        includeDebugComments: false,
        preserveFormatting: true,
        maxLineWidth: 0,
        preserveTableStructure: true,
        includeHeadingMarkers: false,
        warnings: []
      };

      const result = ParagraphConverter.convertParagraph(paragraph, context);
      expect(result.content).toBe('Test content');
      expect(result.lineBreak).toBe(true);
    });

    it('should detect headings', () => {
      const headingParagraph: Paragraph = {
        properties: {
          style_id: 'Heading1',
          spacing: null,
          indent: null,
          outline_level: 0,
          widow_control: null,
          suppress_auto_hyphens: null,
          bidi: null,
          justification: null,
          keep_next: null,
          suppress_line_numbers: null,
          tabs: null
        },
        runs: [
          {
            contents: [{ run: { text: 'Main Title' } }],
            properties: {}
          }
        ],
        numbering: null
      };

      expect(ParagraphConverter.isHeading(headingParagraph)).toBe(true);
      expect(ParagraphConverter.getHeadingLevel(headingParagraph)).toBe(1);
    });
  });

  describe('RunConverter', () => {
    it('should convert run with text content', () => {
      const run: Run = {
        contents: [
          { run: { text: 'Some text' } },
          { run: { text: ' more text' } }
        ],
        properties: {}
      };

      const context = {
        indentLevel: 0,
        indentSize: 4,
        includeDebugComments: false,
        preserveFormatting: true,
        maxLineWidth: 0,
        preserveTableStructure: true,
        includeHeadingMarkers: false,
        warnings: []
      };

      const result = RunConverter.convertRun(run, context);
      expect(result.content).toBe('Some text more text');
    });

    it('should extract text content from run', () => {
      const run: Run = {
        contents: [
          { run: { text: 'Hello' } },
          { run: { type: 'tab' } },
          { run: { text: 'World' } }
        ],
        properties: {}
      };

      const textContent = RunConverter.getTextContent(run);
      expect(textContent).toBe('Hello\tWorld');
    });

    it('should detect empty runs', () => {
      const emptyRun: Run = {
        contents: [
          { run: { text: '   ' } }
        ],
        properties: {}
      };

      expect(RunConverter.isEmpty(emptyRun)).toBe(true);
    });
  });

  describe('TxtGenerator', () => {
    it('should generate text from elements', () => {
      const elements = [
        {
          content: 'First line',
          lineBreak: true,
          spaceAfter: false
        },
        {
          content: 'Second line',
          lineBreak: true,
          spaceAfter: true
        },
        {
          content: 'Third line',
          lineBreak: true,
          spaceAfter: false
        }
      ];

      const result = TxtGenerator.generateText(elements);
      expect(result).toContain('First line');
      expect(result).toContain('Second line');
      expect(result).toContain('Third line');
    });

    it('should apply indentation', () => {
      const elements = [
        {
          content: 'Indented content',
          indent: 4,
          lineBreak: true,
          spaceAfter: false
        }
      ];

      const result = TxtGenerator.generateText(elements);
      expect(result).toBe('    Indented content');
    });

    it('should wrap text to specified width', () => {
      const longText = 'This is a very long line that should be wrapped when it exceeds the maximum width';
      const wrapped = TxtGenerator.wrapText(longText, 20);
      
      const lines = wrapped.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.every(line => line.length <= 20)).toBe(true);
    });
  });

  describe('TableConverter', () => {
    it('should convert simple table', () => {
      const table: Table = {
        properties: null,
        grid: null,
        rows: [
          {
            properties: null,
            cells: [
              {
                properties: null,
                paragraphs: [
                  {
                    properties: {},
                    runs: [
                      {
                        contents: [{ run: { text: 'Cell 1' } }],
                        properties: {}
                      }
                    ],
                    numbering: null
                  } as Paragraph
                ]
              },
              {
                properties: null,
                paragraphs: [
                  {
                    properties: {},
                    runs: [
                      {
                        contents: [{ run: { text: 'Cell 2' } }],
                        properties: {}
                      }
                    ],
                    numbering: null
                  } as Paragraph
                ]
              }
            ]
          }
        ]
      };

      const context = {
        indentLevel: 0,
        indentSize: 4,
        includeDebugComments: false,
        preserveFormatting: true,
        maxLineWidth: 0,
        preserveTableStructure: true,
        includeHeadingMarkers: false,
        warnings: []
      };

      const result = TableConverter.convertTable(table, context);
      expect(result.content).toContain('Cell 1');
      expect(result.content).toContain('Cell 2');
    });

    it('should get table statistics', () => {
      const table: Table = {
        properties: null,
        grid: null,
        rows: [
          {
            properties: null,
            cells: [
              {
                properties: null,
                paragraphs: []
              },
              {
                properties: null,
                paragraphs: []
              }
            ]
          },
          {
            properties: null,
            cells: [
              {
                properties: null,
                paragraphs: []
              },
              {
                properties: null,
                paragraphs: []
              }
            ]
          }
        ]
      };

      const stats = TableConverter.getStatistics(table);
      expect(stats.rowCount).toBe(2);
      expect(stats.columnCount).toBe(2);
      expect(stats.cellCount).toBe(4);
    });
  });
}); 