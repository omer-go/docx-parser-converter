import { z } from 'zod';

// 1. SpacingProperties
export const SpacingPropertiesModel = z.object({
  before_pt: z.number().optional(),
  after_pt: z.number().optional(),
  line_pt: z.number().optional(),
});
export type SpacingProperties = z.infer<typeof SpacingPropertiesModel>;

// 2. IndentationProperties
export const IndentationPropertiesModel = z.object({
  left_pt: z.number().optional(),
  right_pt: z.number().optional(),
  firstline_pt: z.number().optional(),
});
export type IndentationProperties = z.infer<typeof IndentationPropertiesModel>;

// 3. FontProperties
export const FontPropertiesModel = z.object({
  ascii: z.string().optional(),
  hAnsi: z.string().optional(),
  eastAsia: z.string().optional(),
  cs: z.string().optional(),
});
export type FontProperties = z.infer<typeof FontPropertiesModel>;

// 4. LanguageProperties
export const LanguagePropertiesModel = z.object({
  val: z.string().optional(),
  eastAsia: z.string().optional(),
  bidi: z.string().optional(),
});
export type LanguageProperties = z.infer<typeof LanguagePropertiesModel>;

// 5. TabStop
export const TabStopModel = z.object({
  val: z.string(),
  pos: z.number(),
});
export type TabStop = z.infer<typeof TabStopModel>;

// 6. ParagraphStyleProperties
export const ParagraphStylePropertiesModel = z.object({
  style_id: z.string().optional(),
  spacing: SpacingPropertiesModel.optional(),
  indentation: IndentationPropertiesModel.optional(),
  tabs: z.array(TabStopModel).optional(),
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
  suppress_auto_hyphens: z.boolean().optional(),
  bidi: z.boolean().optional(),
  suppress_line_numbers: z.boolean().optional(),
});
export type ParagraphStyleProperties = z.infer<typeof ParagraphStylePropertiesModel>;

// 7. RunStyleProperties
export const RunStylePropertiesModel = z.object({
  style_id: z.string().optional(),
  fonts: FontPropertiesModel.optional(),
  language: LanguagePropertiesModel.optional(),
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
  position_pt: z.number().optional(), // Changed from position_twips, represents points offset from w:position
  kerning_pt: z.number().optional(),
  hidden: z.boolean().optional(),
  emboss: z.boolean().optional(),
  outline: z.boolean().optional(),
  shadow: z.boolean().optional(),
  all_caps: z.boolean().optional(),
  small_caps: z.boolean().optional(),
});
export type RunStyleProperties = z.infer<typeof RunStylePropertiesModel>;

// 8. Style
export const StyleModel = z.object({
  style_id: z.string(),
  name: z.string().optional(), // Style names can technically be optional
  based_on: z.string().optional(),
  link: z.string().optional(), // For linked character styles
  paragraph_properties: ParagraphStylePropertiesModel.optional(),
  run_properties: RunStylePropertiesModel.optional(),
  type: z.string().optional(),
});
export type Style = z.infer<typeof StyleModel>;

// 9. StyleDefaults
export const StyleDefaultsModel = z.object({
  paragraph: z.string().optional(),
  character: z.string().optional(),
  numbering: z.string().optional(),
  table: z.string().optional(),
});
export type StyleDefaults = z.infer<typeof StyleDefaultsModel>;

// 10. StylesSchema (overall schema for styles.xml)
export const StylesModel = z.object({
  styles: z.array(StyleModel),
  style_type_defaults: StyleDefaultsModel, // Assuming this is required based on typical structure
  doc_defaults_rpr: RunStylePropertiesModel.optional(),
  doc_defaults_ppr: ParagraphStylePropertiesModel.optional(),
});
export type StylesSchema = z.infer<typeof StylesModel>;
