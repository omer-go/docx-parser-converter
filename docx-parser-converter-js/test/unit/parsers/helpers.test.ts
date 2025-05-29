/**
 * Tests for helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  extractTextFromElements,
  extractBooleanProperty,
  extractColorValue,
  extractStyleId,
  hasChildElements,
  mergeProperties,
} from '@/parsers/helpers/common-helpers.js';
import {
  DOCX_ELEMENT_TYPES,
  extractParagraphs,
  extractRuns,
  isParagraph,
  isTable,
  extractNumberingInfo,
} from '@/parsers/helpers/docx-xml-list.js';

describe('Common Helpers', () => {
  describe('extractTextFromElements', () => {
    it('should extract text from w:t elements', () => {
      const parent = {
        'w:t': [
          { '#text': 'Hello' },
          { '#text': ' World' },
        ],
      };
      
      const result = extractTextFromElements(parent, 'w:t');
      expect(result).toBe('Hello World');
    });

    it('should return empty string when no text elements found', () => {
      const parent = {};
      const result = extractTextFromElements(parent, 'w:t');
      expect(result).toBe('');
    });
  });

  describe('extractBooleanProperty', () => {
    it('should return true when element exists without w:val', () => {
      const parent = {
        'w:b': {},
      };
      
      const result = extractBooleanProperty(parent, 'w:b');
      expect(result).toBe(true);
    });

    it('should return true for truthy w:val values', () => {
      const parent = {
        'w:b': { '@_w:val': '1' },
      };
      
      const result = extractBooleanProperty(parent, 'w:b');
      expect(result).toBe(true);
    });

    it('should return false for falsy w:val values', () => {
      const parent = {
        'w:b': { '@_w:val': '0' },
      };
      
      const result = extractBooleanProperty(parent, 'w:b');
      expect(result).toBe(false);
    });

    it('should return false when element does not exist', () => {
      const parent = {};
      const result = extractBooleanProperty(parent, 'w:b');
      expect(result).toBe(false);
    });
  });

  describe('extractColorValue', () => {
    it('should format hex color values', () => {
      const element = { '@_w:val': 'FF0000' };
      const result = extractColorValue(element, 'w:val');
      expect(result).toBe('#FF0000');
    });

    it('should return named colors as-is', () => {
      const element = { '@_w:val': 'red' };
      const result = extractColorValue(element, 'w:val');
      expect(result).toBe('red');
    });

    it('should return undefined for missing values', () => {
      const element = {};
      const result = extractColorValue(element, 'w:val');
      expect(result).toBeUndefined();
    });
  });

  describe('extractStyleId', () => {
    it('should extract style ID from style element', () => {
      const element = {
        'w:pStyle': { '@_w:val': 'Heading1' },
      };
      
      const result = extractStyleId(element, 'w:pStyle');
      expect(result).toBe('Heading1');
    });

    it('should return undefined when style element not found', () => {
      const element = {};
      const result = extractStyleId(element, 'w:pStyle');
      expect(result).toBeUndefined();
    });
  });

  describe('hasChildElements', () => {
    it('should return true when element has children', () => {
      const element = {
        'w:r': {},
        '@_attr': 'value',
      };
      
      const result = hasChildElements(element);
      expect(result).toBe(true);
    });

    it('should return false when element has no children', () => {
      const element = {
        '@_attr': 'value',
        '#text': 'text',
      };
      
      const result = hasChildElements(element);
      expect(result).toBe(false);
    });
  });

  describe('mergeProperties', () => {
    it('should merge properties correctly', () => {
      const target: Record<string, unknown> = { a: 1 };
      const source1: Record<string, unknown> = { b: 2 };
      const source2: Record<string, unknown> = { c: 3 };
      
      const result = mergeProperties(target, source1, source2);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle undefined sources', () => {
      const target: Record<string, unknown> = { a: 1 };
      const result = mergeProperties(target, undefined, { b: 2 } as Record<string, unknown>);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});

describe('DOCX XML List Helpers', () => {
  describe('DOCX_ELEMENT_TYPES', () => {
    it('should have correct element type constants', () => {
      expect(DOCX_ELEMENT_TYPES.PARAGRAPH).toBe('w:p');
      expect(DOCX_ELEMENT_TYPES.RUN).toBe('w:r');
      expect(DOCX_ELEMENT_TYPES.TEXT).toBe('w:t');
      expect(DOCX_ELEMENT_TYPES.TABLE).toBe('w:tbl');
    });
  });

  describe('extractParagraphs', () => {
    it('should extract paragraph elements from document body', () => {
      const documentBody = {
        'w:p': [
          { 'w:r': {} },
          { 'w:r': {} },
        ],
      };
      
      const result = extractParagraphs(documentBody);
      expect(result).toHaveLength(2);
    });
  });

  describe('extractRuns', () => {
    it('should extract run elements from paragraph', () => {
      const paragraph = {
        'w:r': [
          { 'w:t': { '#text': 'Hello' } },
          { 'w:t': { '#text': 'World' } },
        ],
      };
      
      const result = extractRuns(paragraph);
      expect(result).toHaveLength(2);
    });
  });

  describe('isParagraph', () => {
    it('should return true for paragraph elements', () => {
      const element = { 'w:p': {} };
      expect(isParagraph(element)).toBe(true);
    });

    it('should return false for non-paragraph elements', () => {
      const element = { 'w:r': {} };
      expect(isParagraph(element)).toBe(false);
    });
  });

  describe('isTable', () => {
    it('should return true for table elements', () => {
      const element = { 'w:tbl': {} };
      expect(isTable(element)).toBe(true);
    });

    it('should return false for non-table elements', () => {
      const element = { 'w:p': {} };
      expect(isTable(element)).toBe(false);
    });
  });

  describe('extractNumberingInfo', () => {
    it('should extract numbering information from paragraph', () => {
      const paragraph = {
        'w:pPr': {
          'w:numPr': {
            'w:ilvl': { '@_w:val': '0' },
            'w:numId': { '@_w:val': '1' },
          },
        },
      };
      
      const result = extractNumberingInfo(paragraph);
      expect(result).toEqual({
        ilvl: 0,
        numId: 1,
      });
    });

    it('should return undefined when no numbering found', () => {
      const paragraph = { 'w:pPr': {} };
      const result = extractNumberingInfo(paragraph);
      expect(result).toBeUndefined();
    });
  });
}); 