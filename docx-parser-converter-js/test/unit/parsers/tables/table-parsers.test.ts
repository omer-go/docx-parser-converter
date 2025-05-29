/**
 * Table parsers tests
 * Tests for all table-related parsers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TableCellPropertiesParser,
  TableCellParser,
  TableRowPropertiesParser,
  TableRowParser,
  TablePropertiesParser,
  TableGridParser,
  TablesParser,
} from '@/parsers/tables/index.js';

describe('Table Parsers', () => {
  beforeEach(() => {
    console.log('Setting up test environment...');
  });

  afterEach(() => {
    console.log('Cleaning up test environment...');
  });

  describe('TableCellPropertiesParser', () => {
    it('should create parser instance', () => {
      const parser = new TableCellPropertiesParser();
      expect(parser).toBeDefined();
    });

    it('should parse basic cell properties', async () => {
      const parser = new TableCellPropertiesParser();
      const xml = `
        <w:tcPr>
          <w:tcW w:type="dxa" w:w="2400"/>
          <w:vAlign w:val="center"/>
        </w:tcPr>
      `;

      const result = await parser.parse(xml);
      expect(result.data).toBeDefined();
      expect(result.data.vAlign).toBe('center');
    });
  });

  describe('TableCellParser', () => {
    it('should create parser instance', () => {
      const parser = new TableCellParser();
      expect(parser).toBeDefined();
    });
  });

  describe('TableRowPropertiesParser', () => {
    it('should create parser instance', () => {
      const parser = new TableRowPropertiesParser();
      expect(parser).toBeDefined();
    });

    it('should parse basic row properties', async () => {
      const parser = new TableRowPropertiesParser();
      const xml = `
        <w:trPr>
          <w:trHeight w:val="240"/>
          <w:tblHeader/>
        </w:trPr>
      `;

      const result = await parser.parse(xml);
      expect(result.data).toBeDefined();
      expect(result.data.trHeight).toBe('240');
      
      // Debug: Let's see what we actually get
      console.log('Parsed result:', JSON.stringify(result.data, null, 2));
      
      // The tblHeader should be true when the element exists
      expect(result.data.tblHeader).toBe(true);
    });
  });

  describe('TableRowParser', () => {
    it('should create parser instance', () => {
      const parser = new TableRowParser();
      expect(parser).toBeDefined();
    });
  });

  describe('TablePropertiesParser', () => {
    it('should create parser instance', () => {
      const parser = new TablePropertiesParser();
      expect(parser).toBeDefined();
    });

    it('should parse basic table properties', async () => {
      const parser = new TablePropertiesParser();
      const xml = `
        <w:tblPr>
          <w:tblStyle w:val="TableGrid"/>
          <w:jc w:val="center"/>
        </w:tblPr>
      `;

      const result = await parser.parse(xml);
      expect(result.data).toBeDefined();
      expect(result.data.tblStyle).toBe('TableGrid');
      expect(result.data.justification).toBe('center');
    });
  });

  describe('TableGridParser', () => {
    it('should create parser instance', () => {
      const parser = new TableGridParser();
      expect(parser).toBeDefined();
    });

    it('should parse table grid', async () => {
      const parser = new TableGridParser();
      const xml = `
        <w:tblGrid>
          <w:gridCol w:w="2400"/>
          <w:gridCol w:w="2400"/>
        </w:tblGrid>
      `;

      const result = await parser.parse(xml);
      expect(result.data).toBeDefined();
      expect(result.data.columns).toHaveLength(2);
    });
  });

  describe('TablesParser', () => {
    it('should create parser instance', () => {
      const parser = new TablesParser();
      expect(parser).toBeDefined();
    });
  });
}); 