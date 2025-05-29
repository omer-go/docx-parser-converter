// test/unit/utils/xml-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseXmlString,
  getElement,
  getElements,
  getAttribute,
  getChildElementText,
  getElementBooleanAttribute
} from '../../../src/utils/xml-utils'; // Adjust path as needed

describe('XML Utilities', () => {
  describe('parseXmlString', () => {
    it('should parse a simple XML string', () => {
      const xml = '<root><element attr="value">Text</element></root>';
      const result = parseXmlString(xml);
      expect(result).toBeDefined();
      expect(result.root.element['#text']).toBe('Text');
      expect(result.root.element.attr).toBe('value');
    });

    it('should handle elements defined in ALWAYS_ARRAY_ELEMENTS as arrays', () => {
      // Using 'w:p' which is in ALWAYS_ARRAY_ELEMENTS
      const xmlSingle = '<document><w:p><w:r><w:t>Para 1</w:t></w:r></w:p></document>';
      const resultSingle = parseXmlString(xmlSingle);
      expect(Array.isArray(resultSingle.document['w:p'])).toBe(true);
      expect(resultSingle.document['w:p']).toHaveLength(1);

      const xmlMultiple = '<document><w:p>1</w:p><w:p>2</w:p></document>';
      const resultMultiple = parseXmlString(xmlMultiple);
      expect(Array.isArray(resultMultiple.document['w:p'])).toBe(true);
      expect(resultMultiple.document['w:p']).toHaveLength(2);
    });
    
    it('should throw error for invalid XML', () => {
        const xml = '<unclosedTag'; // Corrected: More robustly invalid XML
        expect(() => parseXmlString(xml)).toThrow(/XML parsing failed/);
    });
  });

  // Corrected: Define parsedTestXml once using the corrected xml constant from above if needed, or a new valid one.
  // Using a new valid XML string for subsequent tests to avoid dependency on the error test's string.
  const validTestXmlString = '<root><item key="val1">Text1</item><item key="val2" bool="true" num="123"/><flag/> <w:p><w:r><w:t>Para</w:t></w:r></w:p><w:p><w:r><w:t>Graph</w:t></w:r></w:p></root>';
  const parsedTestXml = parseXmlString(validTestXmlString).root;


  describe('getElement', () => {
    it('should get a single element if it exists (first if array)', () => {
      const el = getElement(parsedTestXml, 'item'); 
      expect(el).toBeDefined();
      expect(el.key).toBe('val1'); 
    });
    it('should get a w:p element (which is always an array)', () => {
      const el = getElement(parsedTestXml, 'w:p');
      expect(el).toBeDefined();
      // Corrected access: w:r and w:t are also in ALWAYS_ARRAY_ELEMENTS per xml-utils.ts
      expect(el['w:r'][0]['w:t'][0]['#text']).toBe('Para'); 
    });
    it('should return undefined if element does not exist', () => {
      expect(getElement(parsedTestXml, 'nonexistent')).toBeUndefined();
    });
  });

  describe('getElements', () => {
    it('should get all elements by tag name as an array', () => {
      const els = getElements(parsedTestXml, 'item'); 
      expect(els).toBeInstanceOf(Array);
      expect(els).toHaveLength(2);
      expect(els[0].key).toBe('val1');
      expect(els[1].key).toBe('val2');
    });
    it('should get all w:p elements (which are already an array)', () => {
      const els = getElements(parsedTestXml, 'w:p');
      expect(els).toBeInstanceOf(Array);
      expect(els).toHaveLength(2);
    });
    it('should return an empty array if elements do not exist', () => {
      expect(getElements(parsedTestXml, 'nonexistent')).toEqual([]);
    });
  });

  describe('getAttribute', () => {
    const firstItem = getElements(parsedTestXml, 'item')[0];
    const secondItem = getElements(parsedTestXml, 'item')[1];
    it('should get an attribute value if it exists', () => {
      expect(getAttribute(firstItem, 'key')).toBe('val1');
    });
    it('should return undefined if attribute does not exist', () => {
      expect(getAttribute(firstItem, 'nonexistentAttr')).toBeUndefined();
    });
     it('should handle numeric attribute values as strings', () => {
      expect(getAttribute(secondItem, 'num')).toBe('123'); 
    });
  });

  describe('getChildElementText', () => {
    const firstItem = getElements(parsedTestXml, 'item')[0];
    it('should get text content of a child element with #text node', () => {
      expect(firstItem['#text']).toBe('Text1'); 
    });
     it('should get text from w:t inside w:r inside w:p', () => {
      const p_element = getElement(parsedTestXml, 'w:p'); 
      const r_element = getElement(p_element, 'w:r'); 
      expect(getChildElementText(r_element, 'w:t')).toBe('Para');
    });
    it('should return undefined if child element or text does not exist', () => {
      expect(getChildElementText(parsedTestXml, 'nonexistentChild')).toBeUndefined();
      const flagElement = getElement(parsedTestXml, 'flag'); 
      expect(getChildElementText(flagElement, '#text')).toBeUndefined(); 
    });
  });
  
  describe('getElementBooleanAttribute', () => {
    const itemWithBool = getElements(parsedTestXml, 'item')[1];
    const itemWithoutBool = getElements(parsedTestXml, 'item')[0];
    
    it('should return true for "true" string', () => {
      expect(getElementBooleanAttribute(itemWithBool, 'bool')).toBe(true);
    });
    it('should return true for boolean true (from allowBooleanAttributes)', () => {
      const parsedFlag = parseXmlString('<root><el b/></root>').root.el;
      expect(getElementBooleanAttribute(parsedFlag, 'b')).toBe(true);

      const parsedFlagFalse = parseXmlString('<root><el b="false"/></root>').root.el;
      expect(getElementBooleanAttribute(parsedFlagFalse, 'b')).toBe(false);
    });
    it('should return false for "0" string', () => {
        const xml = '<root elval="0"></root>';
        const node = parseXmlString(xml).root;
        expect(getElementBooleanAttribute(node, 'elval')).toBe(false);
    });
    it('should return true for "1" string', () => {
        const xml = '<root elval="1"></root>';
        const node = parseXmlString(xml).root;
        expect(getElementBooleanAttribute(node, 'elval')).toBe(true);
    });
    it('should return undefined for non-boolean string', () => {
        expect(getElementBooleanAttribute(itemWithoutBool, 'key')).toBeUndefined(); 
    });
    it('should return undefined if attribute does not exist', () => {
      expect(getElementBooleanAttribute(itemWithBool, 'nonexistentAttr')).toBeUndefined();
    });
  });
});
