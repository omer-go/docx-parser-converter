import type { StylesSchema, Style, StyleDefaults, RunStyleProperties, ParagraphStyleProperties } from '../models/stylesModels';

/**
 * Returns a default StylesSchema, allowing user overrides.
 * @param overrides Optional partial overrides for the default schema.
 */
export function getDefaultStylesSchema(overrides?: Partial<StylesSchema>): StylesSchema {
  const defaultRunProperties: RunStyleProperties = {
    font: { ascii: 'Times New Roman', hAnsi: 'Times New Roman' },
    sizePt: 11,
    color: '000000',
  };

  const defaultParagraphProperties: ParagraphStyleProperties = {
    styleId: 'Normal',
    spacing: { beforePt: 0, afterPt: 0, linePt: 13.8 },
    indent: { leftPt: 0, rightPt: 0, firstLinePt: 0 },
    justification: 'left',
  };

  const defaultStyle: Style = {
    styleId: 'Normal',
    name: 'Normal',
    basedOn: undefined,
    paragraphProperties: defaultParagraphProperties,
    runProperties: defaultRunProperties,
  };

  const styleTypeDefaults: StyleDefaults = {
    paragraph: 'Normal',
    character: 'DefaultParagraphFont',
    numbering: undefined,
    table: undefined,
  };

  const schema: StylesSchema = {
    styles: [defaultStyle],
    styleTypeDefaults,
    docDefaultsRpr: defaultRunProperties,
    docDefaultsPpr: defaultParagraphProperties,
  };

  return { ...schema, ...overrides };
} 