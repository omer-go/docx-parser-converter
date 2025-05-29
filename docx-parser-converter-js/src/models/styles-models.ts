// src/models/styles-models.ts
import { z } from 'zod';
import { NonNegativeIntSchema, NotEmptyStringSchema, Color } from '../types/common'; // Assuming Color is in common.ts
import { BaseModelSchema } from './base-model'; // Assuming a base model schema exists
import * as TableModels from './table-models'; // Import for lazy loading

// --- Enums and Simple Types ---
export const AlignmentEnum = z.enum(['left', 'center', 'right', 'justify', 'both', 'start', 'end', 'distribute']);
export type AlignmentType = z.infer<typeof AlignmentEnum>;

export const LineRuleEnum = z.enum(['auto', 'exact', 'atLeast']);
export type LineRuleType = z.infer<typeof LineRuleEnum>;

export const UnderlineEnum = z.enum([
  'none', 'single', 'double', 'dotted', 'dashed', 'wave', 
  // Add more specific OpenXML underline types if needed
]);
export type UnderlineType = z.infer<typeof UnderlineEnum>;

export const EmphasisMarkEnum = z.enum(['none', 'dot', 'comma', 'circle', 'underDot']);
export type EmphasisMarkType = z.infer<typeof EmphasisMarkEnum>;

export const ScriptEnum = z.enum(['baseline', 'superscript', 'subscript']);
export type ScriptType = z.infer<typeof ScriptEnum>;

export const TabStopTypeEnum = z.enum(['left', 'center', 'right', 'decimal', 'bar', 'clear']);
export type TabStopType = z.infer<typeof TabStopTypeEnum>;

export const TabStopLeaderEnum = z.enum(['none', 'dot', 'hyphen', 'underscore', 'heavy', 'middleDot']);
export type TabStopLeader = z.infer<typeof TabStopLeaderEnum>;

// --- Property Schemas ---

export const FontPropertiesSchema = z.object({
  name: z.string().optional(), // Font name
  size: NonNegativeIntSchema.optional(), // Font size in half-points
  color: NotEmptyStringSchema.optional(), // Color as hex string or theme color
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: UnderlineEnum.optional(),
  strikethrough: z.boolean().optional(),
  doubleStrikethrough: z.boolean().optional(),
  capitalized: z.boolean().optional(),
  smallCaps: z.boolean().optional(),
  highlight: NotEmptyStringSchema.optional(), // Highlight color
  verticalAlign: ScriptEnum.optional(), // Superscript/Subscript
  kerning: NonNegativeIntSchema.optional(),
  spacing: z.number().optional(), // Character spacing in twips
  language: NotEmptyStringSchema.optional(), // e.g., "en-US"
  eastAsianLayout: z.string().optional(), // Complex script font settings
  emphasisMark: EmphasisMarkEnum.optional(),
}).strict();
export type FontProperties = z.infer<typeof FontPropertiesSchema>;

export const SpacingPropertiesSchema = z.object({
  before: NonNegativeIntSchema.optional(), // Space before in twips
  after: NonNegativeIntSchema.optional(),  // Space after in twips
  line: NonNegativeIntSchema.optional(),   // Line spacing value
  lineRule: LineRuleEnum.optional(), // How line spacing is calculated
  afterAutospacing: z.boolean().optional(),
  beforeAutospacing: z.boolean().optional(),
}).strict();
export type SpacingProperties = z.infer<typeof SpacingPropertiesSchema>;

export const IndentationPropertiesSchema = z.object({
  left: NonNegativeIntSchema.optional(),   // Left indent in twips
  right: NonNegativeIntSchema.optional(),  // Right indent in twips
  firstLine: NonNegativeIntSchema.optional(), // First line indent in twips
  hanging: NonNegativeIntSchema.optional(),   // Hanging indent in twips
  start: NonNegativeIntSchema.optional(), // Start indent (for LTR/RTL)
  end: NonNegativeIntSchema.optional(),   // End indent (for LTR/RTL)
}).strict();
export type IndentationProperties = z.infer<typeof IndentationPropertiesSchema>;

export const BorderStyleEnum = z.enum([
  'none', 'single', 'double', 'dashed', 'dotted', 'thick', 
  // Add all OpenXML border styles
]);
export type BorderStyleType = z.infer<typeof BorderStyleEnum>;

export const IndividualBorderPropertiesSchema = z.object({
  type: BorderStyleEnum.optional().default('none'),
  color: NotEmptyStringSchema.optional(), // Default should be 'auto' or inherit
  size: NonNegativeIntSchema.optional(), // Border size in eighths of a point
  space: NonNegativeIntSchema.optional(), // Space between border and text in points
  shadow: z.boolean().optional(),
  frame: z.boolean().optional(),
}).strict();
export type IndividualBorderProperties = z.infer<typeof IndividualBorderPropertiesSchema>;

export const ParagraphBordersSchema = z.object({
  top: IndividualBorderPropertiesSchema.optional(),
  bottom: IndividualBorderPropertiesSchema.optional(),
  left: IndividualBorderPropertiesSchema.optional(),
  right: IndividualBorderPropertiesSchema.optional(),
  between: IndividualBorderPropertiesSchema.optional(), // Border between identical paragraphs
  bar: IndividualBorderPropertiesSchema.optional(),     // Border to the left of text (bar tab)
}).strict();
export type ParagraphBorders = z.infer<typeof ParagraphBordersSchema>;

export const ShadingPatternEnum = z.enum([
    "nil", "clear", "solid", "horzStripe", "vertStripe", 
    // Add all OpenXML shading patterns
]);
export type ShadingPatternType = z.infer<typeof ShadingPatternEnum>;

export const ShadingPropertiesSchema = z.object({
  type: ShadingPatternEnum.optional().default('clear'), // Shading pattern
  fill: NotEmptyStringSchema.optional(), // Background color
  color: NotEmptyStringSchema.optional(), // Foreground color (for patterns)
}).strict();
export type ShadingProperties = z.infer<typeof ShadingPropertiesSchema>;

// --- Run and Paragraph Properties ---

export const RunPropertiesSchema = FontPropertiesSchema.extend({
  // Run-specific properties can be added here if they don't fit FontProperties
  // For example, specific effects or styles applied only to runs
}).strict();
export type RunProperties = z.infer<typeof RunPropertiesSchema>;

export const ParagraphPropertiesSchema = z.object({
  runProperties: RunPropertiesSchema.optional(), // Default run properties for the paragraph (e.g. for paragraph mark)
  spacing: SpacingPropertiesSchema.optional(),
  indentation: IndentationPropertiesSchema.optional(),
  alignment: AlignmentEnum.optional(),
  borders: ParagraphBordersSchema.optional(),
  shading: ShadingPropertiesSchema.optional(),
  keepNext: z.boolean().optional(), // Keep with next paragraph
  keepLines: z.boolean().optional(), // Keep lines together
  pageBreakBefore: z.boolean().optional(),
  widowControl: z.boolean().optional(),
  tabs: z.array(z.object({
    type: TabStopTypeEnum,
    position: NonNegativeIntSchema,
    leader: TabStopLeaderEnum.optional(),
  })).optional(),
  numbering: z.object({
    instanceId: NotEmptyStringSchema, // ID of the NumberingInstance
    level: NonNegativeIntSchema,      // Level index (0-based) in the corresponding AbstractNumberingDefinition
  }).optional(),
  styleId: NotEmptyStringSchema.optional(), // ID of the paragraph style this directly inherits from
}).strict();
export type ParagraphProperties = z.infer<typeof ParagraphPropertiesSchema>;

// --- Style Definition ---
export const StyleTypeEnum = z.enum(['paragraph', 'character', 'table', 'numbering']);
export type StyleType = z.infer<typeof StyleTypeEnum>;

export const StyleDefinitionSchema = BaseModelSchema.extend({
  id: NotEmptyStringSchema,
  name: NotEmptyStringSchema.optional(),
  type: StyleTypeEnum,
  basedOn: NotEmptyStringSchema.optional(), // ID of the style this style is based on
  next: NotEmptyStringSchema.optional(),    // ID of the style to apply to the next paragraph
  link: NotEmptyStringSchema.optional(),    // ID of a linked character or table style
  uiPriority: NonNegativeIntSchema.optional(),
  isDefault: z.boolean().optional(), // Specifies if this is a default style
  paragraphProperties: ParagraphPropertiesSchema.optional(),
  runProperties: RunPropertiesSchema.optional(),
  // Using z.any() for lazy-loaded table properties to break circular dependency issues at runtime
  tableProperties: z.any().optional(), 
  tableRowProperties: z.any().optional(),
  tableCellProperties: z.any().optional(),
}).strict();
export type StyleDefinition = z.infer<typeof StyleDefinitionSchema>;
