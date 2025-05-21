import { z } from 'zod';

/**
 * General purpose schema for "on/off" or boolean-like properties.
 * DOCX uses "1", "0", "true", "false", "on", "off", or presence of element for true.
 * This schema will parse these to boolean.
 * If 'val' attribute is present, its value is checked.
 * If 'val' is not present, the property is considered 'true' (e.g. <w:b/>).
 * If the element itself is null/undefined, it's considered 'false'.
 */
export const OnOffSchema = z.preprocess(
  (val) => {
    if (typeof val === 'object' && val !== null) {
      // Element exists, check its 'w:val' attribute or assume true if no attribute
      const attrVal = val.getAttribute('w:val');
      if (attrVal === null) return true; // e.g. <w:b/>
      return ['1', 'true', 'on'].includes(attrVal.toLowerCase());
    }
    // Element does not exist, or it's a direct boolean/string value (for testing/defaults)
    if (typeof val === 'string') return ['1', 'true', 'on'].includes(val.toLowerCase());
    if (typeof val === 'boolean') return val;
    return false; // Default to false if element is not present or value is not recognized
  },
  z.boolean()
).describe("Schema for boolean-like 'on/off' properties, converting various XML forms to true/false.");


/**
 * Schema for color values (e.g., "auto", "FF0000").
 * Corresponds to <w:color w:val="..."/>.
 */
export const ColorSchema = z.object({
  val: z.string().describe("Color value (e.g., 'FF0000', 'auto')."),
  themeColor: z.string().optional().describe("Theme color reference."),
  themeTint: z.string().optional().describe("Theme color tint value."),
  themeShade: z.string().optional().describe("Theme color shade value."),
}).describe("Schema for color properties.");

/**
 * Schema for measurements, typically in twentieths of a point (twips) or points.
 * Includes attributes for value and unit (e.g., size, spacing, indentation).
 * The raw value is stored; conversion (e.g., to points) happens in utility functions.
 */
export const MeasurementSchema = z.object({
  val: z.number().int().describe("The measurement value, often in twips."),
  // Additional attributes like w:type (for width) or units could be added if needed.
}).describe("Schema for measurement properties like size, spacing, etc.");


// --- Run Properties ---

/**
 * Schema for run fonts (e.g., <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>).
 */
export const RunFontsSchema = z.object({
  ascii: z.string().optional(),
  hAnsi: z.string().optional(),
  eastAsia: z.string().optional(),
  cs: z.string().optional(),
  hint: z.string().optional(),
}).describe("Schema for run font settings.");

/**
 * Schema for run properties (<w:rPr>).
 */
export const RunPropertiesSchema = z.object({
  b: OnOffSchema.optional().describe("Bold."), // <w:b/> or <w:b w:val="true"/>
  i: OnOffSchema.optional().describe("Italic."), // <w:i/>
  u: z.string().optional().describe("Underline style (e.g., 'single', 'double')."), // <w:u w:val="..."/>
  strike: OnOffSchema.optional().describe("Strikethrough."), // <w:strike/>
  dstrike: OnOffSchema.optional().describe("Double strikethrough."), // <w:dstrike/>
  color: ColorSchema.optional().describe("Text color."), // <w:color .../>
  sz: MeasurementSchema.optional().describe("Font size (in half-points, effectively twips for value)."), // <w:sz w:val="24"/> (means 12pt)
  rFonts: RunFontsSchema.optional().describe("Font types."), // <w:rFonts .../>
  vertAlign: z.string().optional().describe("Vertical alignment (e.g., 'superscript', 'subscript')."), // <w:vertAlign w:val="..."/>
  highlight: z.string().optional().describe("Text highlight color."), // <w:highlight w:val="yellow"/>
  rStyle: z.string().optional().describe("Character style ID (<w:rStyle w:val='...'/>)."),
  // TODO: Add other run properties as needed (e.g., caps, smallCaps, spacing, position, kern, etc.)
}).strict().describe("Schema for run properties."); // .strict() helps catch unhandled properties during development

// --- Paragraph Properties ---

/**
 * Schema for paragraph indentation (<w:ind>).
 * Values are typically in twips.
 */
export const IndentationSchema = z.object({
  left: MeasurementSchema.optional().describe("Left indentation."), // w:left or w:start
  right: MeasurementSchema.optional().describe("Right indentation."), // w:right or w:end
  firstLine: MeasurementSchema.optional().describe("First line indentation."),
  hanging: MeasurementSchema.optional().describe("Hanging indentation."),
}).describe("Schema for paragraph indentation properties.");

/**
 * Schema for paragraph spacing (<w:spacing>).
 * Values are typically in twips or line units.
 */
export const SpacingSchema = z.object({
  before: MeasurementSchema.optional().describe("Spacing before the paragraph."),
  after: MeasurementSchema.optional().describe("Spacing after the paragraph."),
  line: MeasurementSchema.optional().describe("Line spacing value."),
  lineRule: z.enum(['auto', 'exact', 'atLeast']).optional().describe("Line spacing rule."),
}).describe("Schema for paragraph spacing properties.");

/**
 * Schema for paragraph justification (<w:jc>).
 */
export const JustificationSchema = z.enum([
  'left', 'center', 'right', 'both', 'distribute', 'start', 'end'
]).describe("Schema for paragraph justification (alignment)."); // <w:jc w:val="center"/>

/**
 * Schema for numbering reference within a paragraph (<w:numPr>).
 */
export const NumberingReferenceSchema = z.object({
  numId: z.string().describe("Numbering definition ID."), // <w:numId w:val="..."/>
  ilvl: z.string().describe("Numbering level."),      // <w:ilvl w:val="..."/>
  // Potentially more complex structure if tracking specific list instances is needed
}).describe("Schema for numbering reference in a paragraph.");

/**
 * Schema for paragraph borders (<w:pBdr>).
 * Placeholder for now, can be detailed later.
 */
export const ParagraphBordersSchema = z.object({
  // top: BorderTypeSchema, etc.
}).passthrough().describe("Schema for paragraph borders (placeholder).");

/**
 * Schema for paragraph shading (<w:shd>).
 */
export const ShadingSchema = z.object({
  fill: z.string().optional().describe("Fill color (e.g., 'auto', 'FF0000')."), // <w:shd w:fill="..."/>
  color: z.string().optional().describe("Pattern color (foreground)."),      // <w:shd w:color="..."/>
  val: z.string().optional().describe("Shading pattern type."),           // <w:shd w:val="..."/> (e.g. 'clear', 'solid')
  // themeFill, themeColor, themeTint, themeShade attributes can also exist
}).describe("Schema for shading properties.");

/**
 * Schema for paragraph properties (<w:pPr>).
 */
export const ParagraphPropertiesSchema = z.object({
  jc: JustificationSchema.optional().describe("Justification/Alignment."), // <w:jc w:val="..."/>
  ind: IndentationSchema.optional().describe("Indentation."),             // <w:ind .../>
  spacing: SpacingSchema.optional().describe("Spacing."),                 // <w:spacing .../>
  numPr: NumberingReferenceSchema.optional().describe("Numbering info."), // <w:numPr .../>
  pBdr: ParagraphBordersSchema.optional().describe("Paragraph borders."), // <w:pBdr .../>
  shd: ShadingSchema.optional().describe("Paragraph shading."),           // <w:shd .../>
  pStyle: z.string().optional().describe("Paragraph style ID (<w:pStyle w:val='...'/>)."),
  // TODO: Add other paragraph properties as needed (e.g., keepNext, keepLines, pageBreakBefore, tabs, etc.)
  rPr: RunPropertiesSchema.optional().describe("Default run properties for the paragraph (pPr/rPr)."), // <w:rPr> within <w:pPr>
}).strict().describe("Schema for paragraph properties."); // .strict() helps catch unhandled properties

// Default empty objects for convenience, ensuring they conform to the schemas
export const defaultRunProperties = RunPropertiesSchema.parse({});
export const defaultParagraphProperties = ParagraphPropertiesSchema.parse({});
