import { z } from 'zod';
import { ParagraphPropertiesSchema, RunPropertiesSchema, defaultParagraphProperties, defaultRunProperties } from './properties_models.js';

/**
 * Zod schema for an individual style definition.
 * Corresponds to a <w:style> element in styles.xml.
 */
export const StyleSchema = z.object({
  styleId: z.string().describe("The unique ID of the style (w:styleId attribute)."),
  type: z.enum(['paragraph', 'character', 'table', 'numbering'])
    .describe("The type of style (e.g., 'paragraph', 'character')."),
  name: z.string().optional().describe("The primary name of the style (<w:name w:val='...'/>)."),
  basedOn: z.string().optional().describe("The style ID of the style this style is based on (<w:basedOn w:val='...'/>)."),
  isDefault: z.boolean().optional().default(false)
    .describe("Specifies if this style is the default for its type (<w:default w:val='1'/>)."),

  paragraphProperties: ParagraphPropertiesSchema.optional()
    .describe("Paragraph properties defined by this style (<w:pPr>)."),
  runProperties: RunPropertiesSchema.optional()
    .describe("Run properties defined by this style (<w:rPr>)."),

  // Placeholders for table-related properties
  tableProperties: z.any().optional()
    .describe("Properties for table styles (placeholder)."), // <w:tblPr>
  tableCellProperties: z.any().optional()
    .describe("Properties for table cell styles within a table style (placeholder)."), // <w:tcPr>
  // TODO: Add more specific schemas for tableProperties, tableRowProperties (<w:trPr>), tableCellProperties (<w:tcPr>)
  // when table style parsing is fully implemented.
}).describe("Schema for a single style definition.");

/**
 * Zod schema for default style IDs for different types.
 * This is not directly from a single XML element, but rather derived from
 * <w:style w:type="..." w:default="1"> elements.
 */
export const StyleTypeDefaultsSchema = z.object({
  paragraph: z.string().optional().describe("Default style ID for paragraphs."),
  character: z.string().optional().describe("Default style ID for characters/runs."),
  table: z.string().optional().describe("Default style ID for tables."),
  numbering: z.string().optional().describe("Default style ID for numbering (less common as direct default)."),
}).strict().describe("Schema for mapping style types to their default style IDs.");

/**
 * Zod schema for document-wide default properties.
 * Parsed from <w:docDefaults>.
 */
export const DocDefaultsSchema = z.object({
  paragraphProperties: ParagraphPropertiesSchema.optional().default(defaultParagraphProperties)
    .describe("Default paragraph properties for the document (<w:docDefaults><w:pPrDefault><w:pPr>)."),
  runProperties: RunPropertiesSchema.optional().default(defaultRunProperties)
    .describe("Default run properties for the document (<w:docDefaults><w:rPrDefault><w:rPr>)."),
}).strict().describe("Schema for document default paragraph and run properties.");

/**
 * Zod schema for the entire styles.xml content.
 */
export const StylesSchema = z.object({
  docDefaults: DocDefaultsSchema.describe("Document-wide default properties."),
  styles: z.array(StyleSchema).describe("List of all style definitions found in styles.xml."),
  styleTypeDefaults: StyleTypeDefaultsSchema.optional()
    .describe("Derived mapping of default styles for each type (paragraph, character, etc.).")
}).strict().describe("Schema for the parsed content of styles.xml.");

// Example Usage (Illustrative)
// const exampleStyle = {
//   styleId: "Normal",
//   type: "paragraph",
//   name: "Normal",
//   isDefault: true,
//   paragraphProperties: { jc: 'left' }, // Simplified
//   runProperties: { sz: { val: 22 } } // Simplified
// };

// const exampleDocDefaults = {
//   paragraphProperties: { spacing: { after: {val: 160} } },
//   runProperties: { rFonts: { ascii: "Calibri" } }
// };

// const exampleStylesFile = {
//   docDefaults: exampleDocDefaults,
//   styles: [exampleStyle],
//   styleTypeDefaults: { paragraph: "Normal" }
// };

// try {
//   const validatedStyle = StyleSchema.parse(exampleStyle);
//   // console.log("Validated Style:", validatedStyle);
//   const validatedStylesFile = StylesSchema.parse(exampleStylesFile);
//   // console.log("Validated Styles File:", validatedStylesFile);
// } catch (error) {
//   console.error("Styles models validation failed:", error.errors);
// }
