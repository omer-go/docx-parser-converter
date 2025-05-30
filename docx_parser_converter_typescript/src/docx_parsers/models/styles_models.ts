import { z } from 'zod';

// 1. SpacingProperties
export const SpacingPropertiesSchema = z.object({
  before_pt: z.number().optional(),
  after_pt: z.number().optional(),
  line_pt: z.number().optional(),
});
export type SpacingProperties = z.infer<typeof SpacingPropertiesSchema>;

// 2. IndentationProperties
export const IndentationPropertiesSchema = z.object({
  left_pt: z.number().optional(),
  right_pt: z.number().optional(),
  firstline_pt: z.number().optional(),
});
export type IndentationProperties = z.infer<typeof IndentationPropertiesSchema>;

// 3. FontProperties
export const FontPropertiesSchema = z.object({
  ascii: z.string().optional(),
  hAnsi: z.string().optional(),
  eastAsia: z.string().optional(),
  cs: z.string().optional(),
});
export type FontProperties = z.infer<typeof FontPropertiesSchema>;

// 4. LanguageProperties
export const LanguagePropertiesSchema = z.object({
  val: z.string().optional(),
  eastAsia: z.string().optional(),
  bidi: z.string().optional(),
});
export type LanguageProperties = z.infer<typeof LanguagePropertiesSchema>;

// 5. TabStop
export const TabStopSchema = z.object({
  val: z.string(),
  pos: z.number(),
});
export type TabStop = z.infer<typeof TabStopSchema>;

// 6. ParagraphStyleProperties
export const ParagraphStylePropertiesSchema = z.object({
  style_id: z.string().optional(),
  spacing: SpacingPropertiesSchema.optional(),
  indentation: IndentationPropertiesSchema.optional(),
  tabs: z.array(TabStopSchema).optional(),
  alignment: z.string().optional(), // Assuming string for alignment values like 'left', 'center'
  keep_next: z.boolean().optional(),
  keep_lines: z.boolean().optional(),
  page_break_before: z.boolean().optional(),
  widow_control: z.boolean().optional(),
  outline_level: z.number().optional(),
  border_between: z.string().optional(), // Assuming string, could be more complex
  border_bottom: z.string().optional(), // Assuming string, could be more complex
  border_left: z.string().optional(), // Assuming string, could be more complex
  border_right: z.string().optional(), // Assuming string, could be more complex
  border_top: z.string().optional(), // Assuming string, could be more complex
});
export type ParagraphStyleProperties = z.infer<typeof ParagraphStylePropertiesSchema>;

// 7. RunStyleProperties
export const RunStylePropertiesSchema = z.object({
  style_id: z.string().optional(),
  fonts: FontPropertiesSchema.optional(),
  language: LanguagePropertiesSchema.optional(),
  size_pt: z.number().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.string().optional(), // Assuming string for underline type, e.g., 'single', 'double'
  strike: z.boolean().optional(),
  color: z.string().optional(),
  highlight: z.string().optional(),
  vert_align: z.string().optional(), // Assuming string, e.g., 'superscript', 'subscript'
  east_asian_emphasis_mark: z.string().optional(),
  east_asian_emphasis_style: z.string().optional(),
  shading_fill: z.string().optional(),
  shading_color: z.string().optional(),
  character_spacing_twips: z.number().optional(),
  position_twips: z.number().optional(),
  kerning_pt: z.number().optional(),
});
export type RunStyleProperties = z.infer<typeof RunStylePropertiesSchema>;

// 8. Style
export const StyleSchema = z.object({
  style_id: z.string(),
  name: z.string(),
  based_on: z.string().optional(),
  paragraph_properties: ParagraphStylePropertiesSchema.optional(),
  run_properties: RunStylePropertiesSchema.optional(),
  type: z.string().optional(), // Added type based on typical style definitions
});
export type Style = z.infer<typeof StyleSchema>;

// 9. StyleDefaults
export const StyleDefaultsSchema = z.object({
  paragraph: z.string().optional(),
  character: z.string().optional(),
  numbering: z.string().optional(),
  table: z.string().optional(),
});
export type StyleDefaults = z.infer<typeof StyleDefaultsSchema>;

// 10. StylesSchema (overall schema for styles.xml)
export const StylesSchemaSchema = z.object({
  styles: z.array(StyleSchema),
  style_type_defaults: StyleDefaultsSchema, // Assuming this is required based on typical structure
  doc_defaults_rpr: RunStylePropertiesSchema.optional(),
  doc_defaults_ppr: ParagraphStylePropertiesSchema.optional(),
});
export type StylesSchema = z.infer<typeof StylesSchemaSchema>;
