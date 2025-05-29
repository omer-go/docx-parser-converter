import { z } from 'zod';
import { BaseModel, createModel, nullableOptional } from './base-model';

/**
 * Represents the spacing properties for a paragraph.
 *
 * Example:
 *   The following is an example of spacing properties in a paragraph properties element:
 *   ```xml
 *   <w:spacing w:before="240" w:after="240" w:line="360"/>
 *   ```
 */
export const SpacingPropertiesSchema = z.object({
  /** The space before the paragraph in points */
  before_pt: nullableOptional(z.number()),
  /** The space after the paragraph in points */
  after_pt: nullableOptional(z.number()),
  /** The line spacing in points */
  line_pt: nullableOptional(z.number()),
});

export type SpacingProperties = z.infer<typeof SpacingPropertiesSchema> & BaseModel;
export const SpacingPropertiesModel = createModel(SpacingPropertiesSchema);

/**
 * Represents the indentation properties for a paragraph.
 *
 * Example:
 *   The following is an example of indentation properties in a paragraph properties element:
 *   ```xml
 *   <w:ind w:left="720" w:right="720" w:firstLine="720"/>
 *   ```
 */
export const IndentationPropertiesSchema = z.object({
  /** The left indentation in points */
  left_pt: nullableOptional(z.number()),
  /** The right indentation in points */
  right_pt: nullableOptional(z.number()),
  /** The first line indentation in points */
  firstline_pt: nullableOptional(z.number()),
});

export type IndentationProperties = z.infer<typeof IndentationPropertiesSchema> & BaseModel;
export const IndentationPropertiesModel = createModel(IndentationPropertiesSchema);

/**
 * Represents the font properties for text.
 *
 * Example:
 *   The following is an example of font properties in a run properties element:
 *   ```xml
 *   <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *   ```
 */
export const FontPropertiesSchema = z.object({
  /** The ASCII font */
  ascii: nullableOptional(z.string()),
  /** The high ANSI font */
  hAnsi: nullableOptional(z.string()),
  /** The East Asian font */
  eastAsia: nullableOptional(z.string()),
  /** The complex script font */
  cs: nullableOptional(z.string()),
});

export type FontProperties = z.infer<typeof FontPropertiesSchema> & BaseModel;
export const FontPropertiesModel = createModel(FontPropertiesSchema);

/**
 * Represents the language properties for text.
 *
 * Example:
 *   The following is an example of language properties in a run properties element:
 *   ```xml
 *   <w:lang w:val="en-US"/>
 *   ```
 */
export const LanguagePropertiesSchema = z.object({
  /** The language value */
  val: nullableOptional(z.string()),
  /** The East Asian language */
  eastAsia: nullableOptional(z.string()),
  /** The bidirectional language */
  bidi: nullableOptional(z.string()),
});

export type LanguageProperties = z.infer<typeof LanguagePropertiesSchema> & BaseModel;
export const LanguagePropertiesModel = createModel(LanguagePropertiesSchema);

/**
 * Represents a tab stop within a paragraph.
 *
 * Example:
 *   The following is an example of a tab stop in a tabs element:
 *   ```xml
 *   <w:tab w:val="left" w:pos="720"/>
 *   ```
 */
export const TabStopSchema = z.object({
  /** The type of tab stop */
  val: z.string(),
  /** The position of the tab stop in points */
  pos: z.number(),
});

export type TabStop = z.infer<typeof TabStopSchema> & BaseModel;
export const TabStopModel = createModel(TabStopSchema);

/**
 * Represents the style properties for a paragraph.
 *
 * Example:
 *   The following is an example of paragraph style properties in a style element:
 *   ```xml
 *   <w:pPr>
 *     <w:spacing w:before="240" w:after="240" w:line="360"/>
 *     <w:ind w:left="720" w:right="720" w:firstLine="720"/>
 *     ...
 *   </w:pPr>
 *   ```
 */
export const ParagraphStylePropertiesSchema = z.object({
  /** The style ID of the paragraph */
  style_id: nullableOptional(z.string()),
  /** The spacing properties */
  spacing: nullableOptional(SpacingPropertiesSchema),
  /** The indentation properties */
  indent: nullableOptional(IndentationPropertiesSchema),
  /** The outline level */
  outline_level: nullableOptional(z.number()),
  /** The widow control setting */
  widow_control: nullableOptional(z.boolean()),
  /** The suppress auto hyphens setting */
  suppress_auto_hyphens: nullableOptional(z.boolean()),
  /** The bidirectional setting */
  bidi: nullableOptional(z.boolean()),
  /** The justification setting */
  justification: nullableOptional(z.string()),
  /** The keep next setting */
  keep_next: nullableOptional(z.boolean()),
  /** The suppress line numbers setting */
  suppress_line_numbers: nullableOptional(z.boolean()),
  /** The list of tab stops */
  tabs: nullableOptional(z.array(TabStopSchema)),
});

export type ParagraphStyleProperties = z.infer<typeof ParagraphStylePropertiesSchema> & BaseModel;
export const ParagraphStylePropertiesModel = createModel(ParagraphStylePropertiesSchema);

/**
 * Represents the style properties for a text run.
 *
 * Example:
 *   The following is an example of run style properties in a style element:
 *   ```xml
 *   <w:rPr>
 *     <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *     <w:sz w:val="24"/>
 *     <w:color w:val="FF0000"/>
 *     ...
 *   </w:rPr>
 *   ```
 */
export const RunStylePropertiesSchema = z.object({
  /** The font properties */
  font: nullableOptional(FontPropertiesSchema),
  /** The font size in points */
  size_pt: nullableOptional(z.number()),
  /** The font color */
  color: nullableOptional(z.string()),
  /** The bold setting */
  bold: nullableOptional(z.boolean()),
  /** The italic setting */
  italic: nullableOptional(z.boolean()),
  /** The underline setting */
  underline: nullableOptional(z.string()),
  /** The strikethrough setting */
  strikethrough: nullableOptional(z.boolean()),
  /** The hidden setting */
  hidden: nullableOptional(z.boolean()),
  /** The language properties */
  lang: nullableOptional(LanguagePropertiesSchema),
  /** The highlight color */
  highlight: nullableOptional(z.string()),
  /** The shading color */
  shading: nullableOptional(z.string()),
  /** The text position in points */
  text_position_pt: nullableOptional(z.number()),
  /** The kerning value */
  kerning: nullableOptional(z.number()),
  /** The character spacing in points */
  character_spacing_pt: nullableOptional(z.number()),
  /** The emboss setting */
  emboss: nullableOptional(z.boolean()),
  /** The outline setting */
  outline: nullableOptional(z.boolean()),
  /** The shadow setting */
  shadow: nullableOptional(z.boolean()),
  /** The all caps setting */
  all_caps: nullableOptional(z.boolean()),
  /** The small caps setting */
  small_caps: nullableOptional(z.boolean()),
});

export type RunStyleProperties = z.infer<typeof RunStylePropertiesSchema> & BaseModel;
export const RunStylePropertiesModel = createModel(RunStylePropertiesSchema);

/**
 * Represents a style definition in the document.
 *
 * Example:
 *   The following is an example of a style definition in a styles.xml file:
 *   ```xml
 *   <w:style w:styleId="Heading1" w:type="paragraph">
 *     ...
 *   </w:style>
 *   ```
 */
export const StyleSchema = z.object({
  /** The ID of the style */
  style_id: z.string(),
  /** The name of the style */
  name: z.string(),
  /** The style this style is based on */
  based_on: nullableOptional(z.string()),
  /** The paragraph style properties */
  paragraph_properties: nullableOptional(ParagraphStylePropertiesSchema),
  /** The run style properties */
  run_properties: nullableOptional(RunStylePropertiesSchema),
});

export type Style = z.infer<typeof StyleSchema> & BaseModel;
export const StyleModel = createModel(StyleSchema);

/**
 * Represents the default styles for various elements in the document.
 *
 * Example:
 *   The following is an example of style defaults in a styles.xml file:
 *   ```xml
 *   <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
 *     ...
 *   </w:style>
 *   ```
 */
export const StyleDefaultsSchema = z.object({
  /** The default paragraph style */
  paragraph: nullableOptional(z.string()),
  /** The default character style */
  character: nullableOptional(z.string()),
  /** The default numbering style */
  numbering: nullableOptional(z.string()),
  /** The default table style */
  table: nullableOptional(z.string()),
});

export type StyleDefaults = z.infer<typeof StyleDefaultsSchema> & BaseModel;
export const StyleDefaultsModel = createModel(StyleDefaultsSchema);

/**
 * Represents the overall styles schema for the document.
 *
 * Example:
 *   The following is an example of a styles schema structure:
 *   ```xml
 *   <w:styles>
 *     <w:style w:styleId="Heading1" w:type="paragraph">
 *       ...
 *     </w:style>
 *     <w:docDefaults>
 *       <w:rPrDefault>
 *         ...
 *       </w:rPrDefault>
 *       <w:pPrDefault>
 *         ...
 *       </w:pPrDefault>
 *     </w:docDefaults>
 *   </w:styles>
 *   ```
 */
export const StylesSchemaSchema = z.object({
  /** The list of styles in the document */
  styles: z.array(StyleSchema),
  /** The default styles for different elements */
  style_type_defaults: StyleDefaultsSchema,
  /** The default run properties */
  doc_defaults_rpr: nullableOptional(RunStylePropertiesSchema),
  /** The default paragraph properties */
  doc_defaults_ppr: nullableOptional(ParagraphStylePropertiesSchema),
});

export type StylesSchema = z.infer<typeof StylesSchemaSchema> & BaseModel;
export const StylesSchemaModel = createModel(StylesSchemaSchema);
