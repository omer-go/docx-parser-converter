// test/unit/parsers/helpers/common-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { parseValAttribute, parseOnOffProperty } from '../../../../src/parsers/helpers/common-helpers';
import { parseXmlString } from '../../../../src/utils/xml-utils';

describe('Parser Common Helpers', () => {
  describe('parseValAttribute', () => {
    it('should get attribute value from a child element', () => {
      const xml = '<root><w:sz w:val="24"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseValAttribute(node, 'w:sz', 'w:val')).toBe('24');
    });

    it('should use default attribute name "w:val"', () => {
      const xml = '<root><w:color w:val="FF0000"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseValAttribute(node, 'w:color')).toBe('FF0000');
    });

    it('should return undefined if property element is missing', () => {
      const xml = '<root></root>';
      const node = parseXmlString(xml).root;
      expect(parseValAttribute(node, 'w:sz')).toBeUndefined();
    });

    it('should return undefined if attribute is missing from property element', () => {
      const xml = '<root><w:sz w:otherAttr="abc"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseValAttribute(node, 'w:sz', 'w:val')).toBeUndefined();
    });
    
    it('should return undefined if parent node is not an object', () => {
      expect(parseValAttribute(null, 'w:sz')).toBeUndefined();
      expect(parseValAttribute(undefined, 'w:sz')).toBeUndefined();
      expect(parseValAttribute("string", 'w:sz')).toBeUndefined();
    });
  });

  describe('parseOnOffProperty', () => {
    it('should return true for simple tag presence <w:b/>', () => {
      // allowBooleanAttributes in fast-xml-parser makes <w:b/> parse to { 'w:b': true }
      const xml = '<root><w:b/></root>'; 
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(true);
    });
    
    it('should return true for empty tag <w:i></w:i>', () => {
      // <w:i></w:i> parses to { 'w:i': {} } if no textNodeName is hit
      const xml = '<root><w:i></w:i></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:i')).toBe(true);
    });

    it('should return true for w:val="true"', () => {
      const xml = '<root><w:b w:val="true"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(true);
    });

    it('should return true for w:val="1"', () => {
      const xml = '<root><w:b w:val="1"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(true);
    });
    
    it('should return true for w:val="on"', () => {
      const xml = '<root><w:b w:val="on"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(true);
    });

    it('should return false for w:val="false"', () => {
      const xml = '<root><w:b w:val="false"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(false);
    });

    it('should return false for w:val="0"', () => {
      const xml = '<root><w:b w:val="0"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(false);
    });

    it('should return false for w:val="off"', () => {
      const xml = '<root><w:b w:val="off"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBe(false);
    });

    it('should return undefined if property element is missing', () => {
      const xml = '<root></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBeUndefined();
    });

    it('should return undefined for w:val with non-boolean string', () => {
      const xml = '<root><w:b w:val="other"/></root>';
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBeUndefined();
    });
    
    it('should return undefined if property element has other attributes but not w:val', () => {
      const xml = '<root><w:b customAttr="value"/></root>';
      // This parses to { 'w:b': { customAttr: 'value' } }
      const node = parseXmlString(xml).root;
      expect(parseOnOffProperty(node, 'w:b')).toBeUndefined();
    });

    it('should return undefined if parent node is not an object', () => {
      expect(parseOnOffProperty(null, 'w:b')).toBeUndefined();
      expect(parseOnOffProperty(undefined, 'w:b')).toBeUndefined();
      expect(parseOnOffProperty("string", 'w:b')).toBeUndefined();
    });
  });
});
