import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals } from '../test-utils';
import { StylesMerger } from '../../src/docx_parsers/styles/stylesMerger';
import type { DocumentSchema } from '../../src/docx_parsers/models/documentModels';
import type { StylesSchema } from '../../src/docx_parsers/models/stylesModels';
import type { NumberingSchema } from '../../src/docx_parsers/models/numberingModels';

export function registerStylesMergerTests() {
  describe('StylesMerger Tests', () => {
    const tests: TestResult[] = [];

    // Case 1: No styles, no defaults, no numbering
    const docSchema1: DocumentSchema = {
      elements: [
        {
          properties: {},
          runs: [ { contents: [ { text: 'Hello', type: 'text' as 'text' } ] } ]
        }
      ]
    };
    const stylesSchema1: StylesSchema = {
      styles: [],
      styleTypeDefaults: {},
      docDefaultsRpr: {},
      docDefaultsPpr: {}
    };
    const numberingSchema1: NumberingSchema = { instances: [] };
    const expected1 = {
      elements: [
        {
          properties: {},
          runs: [ { contents: [ { text: 'Hello', type: 'text' as 'text' } ] } ]
        }
      ]
    };
    tests.push(assertEquals(
      new StylesMerger(
        JSON.parse(JSON.stringify(docSchema1)),
        stylesSchema1,
        numberingSchema1
      ).documentSchema,
      expected1,
      'No styles, no defaults, no numbering',
      { docSchema1, stylesSchema1, numberingSchema1 }
    ));

    // Case 2: With styles, no defaults
    const docSchema2: DocumentSchema = {
      elements: [
        {
          properties: { styleId: 'Heading1' },
          runs: [ { contents: [ { text: 'Styled', type: 'text' as 'text' } ] } ]
        }
      ]
    };
    const stylesSchema2: StylesSchema = {
      styles: [
        {
          styleId: 'Heading1',
          name: 'Heading 1',
          paragraphProperties: { justification: 'center' },
          runProperties: { bold: true }
        }
      ],
      styleTypeDefaults: {},
      docDefaultsRpr: {},
      docDefaultsPpr: {}
    };
    const numberingSchema2: NumberingSchema = { instances: [] };
    const expected2 = {
      elements: [
        {
          properties: { styleId: 'Heading1', justification: 'center' },
          runs: [ { contents: [ { text: 'Styled', type: 'text' as 'text' } ], properties: { bold: true } } ]
        }
      ]
    };
    tests.push(assertEquals(
      new StylesMerger(
        JSON.parse(JSON.stringify(docSchema2)),
        stylesSchema2,
        numberingSchema2
      ).documentSchema,
      expected2,
      'With styles, no defaults',
      { docSchema2, stylesSchema2, numberingSchema2 }
    ));

    // Case 3: With style defaults
    const docSchema3: DocumentSchema = {
      elements: [
        {
          properties: {},
          runs: [ { contents: [ { text: 'Defaulted', type: 'text' as 'text' } ] } ]
        }
      ]
    };
    const stylesSchema3: StylesSchema = {
      styles: [
        {
          styleId: 'Normal',
          name: 'Normal',
          paragraphProperties: { justification: 'left' },
          runProperties: { italic: true }
        }
      ],
      styleTypeDefaults: { paragraph: 'Normal' },
      docDefaultsRpr: { color: '000000' },
      docDefaultsPpr: { spacing: { beforePt: 10 } }
    };
    const numberingSchema3: NumberingSchema = { instances: [] };
    const expected3 = {
      elements: [
        {
          properties: { justification: 'left', spacing: { beforePt: 10 } },
          runs: [ { contents: [ { text: 'Defaulted', type: 'text' as 'text' } ], properties: { italic: true, color: '000000' } } ]
        }
      ]
    };
    tests.push(assertEquals(
      new StylesMerger(
        JSON.parse(JSON.stringify(docSchema3)),
        stylesSchema3,
        numberingSchema3
      ).documentSchema,
      expected3,
      'With style defaults',
      { docSchema3, stylesSchema3, numberingSchema3 }
    ));

    // Case 4: With numbering
    const docSchema4: DocumentSchema = {
      elements: [
        {
          properties: {},
          runs: [ { contents: [ { text: 'Numbered', type: 'text' as 'text' } ] } ],
          numbering: { numId: 1, ilvl: 0 }
        }
      ]
    };
    const stylesSchema4: StylesSchema = {
      styles: [],
      styleTypeDefaults: {},
      docDefaultsRpr: {},
      docDefaultsPpr: {}
    };
    const numberingSchema4: NumberingSchema = {
      instances: [
        {
          numId: 1,
          levels: [
            { numId: 1, ilvl: 0, start: 1, numFmt: 'decimal', lvlText: '%1.', lvlJc: 'left', indent: { leftPt: 20 } }
          ]
        }
      ]
    };
    const expected4 = {
      elements: [
        {
          properties: { indent: { leftPt: 20 } },
          runs: [ { contents: [ { text: 'Numbered', type: 'text' as 'text' } ] } ],
          numbering: { numId: 1, ilvl: 0 }
        }
      ]
    };
    tests.push(assertEquals(
      new StylesMerger(
        JSON.parse(JSON.stringify(docSchema4)),
        stylesSchema4,
        numberingSchema4
      ).documentSchema,
      expected4,
      'With numbering',
      { docSchema4, stylesSchema4, numberingSchema4 }
    ));

    return tests;
  });
} 