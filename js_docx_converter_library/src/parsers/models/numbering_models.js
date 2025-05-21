import { z } from 'zod';
import { ParagraphPropertiesSchema, RunPropertiesSchema, defaultParagraphProperties, defaultRunProperties } from './properties_models.js';

/**
 * Zod schema for a single numbering level definition (<w:lvl>).
 */
export const NumberingLevelSchema = z.object({
  level: z.number().int().describe("The level index (w:ilvl attribute)."),
  start: z.number().int().optional().describe("Starting value for this level (<w:start w:val='...'/>)."),
  format: z.string().optional().describe("Numbering format (e.g., 'bullet', 'decimal', 'lowerLetter') (<w:numFmt w:val='...'/>)."),
  text: z.string().optional().describe("Level text string (e.g., '%1.') (<w:lvlText w:val='...'/>)."),
  jc: z.string().optional().describe("Level justification (<w:lvlJc w:val='...'/>)."),
  paragraphProperties: ParagraphPropertiesSchema.optional().default(defaultParagraphProperties)
    .describe("Paragraph properties for this level (<w:pPr>)."),
  runProperties: RunPropertiesSchema.optional().default(defaultRunProperties)
    .describe("Run properties for the numbering symbol itself (<w:rPr>)."),
  // Add other relevant level properties like pStyle, isLgl, etc. if needed
}).strict().describe("Schema for a numbering level definition.");

/**
 * Zod schema for an abstract numbering definition (<w:abstractNum>).
 */
export const AbstractNumberingSchema = z.object({
  abstractNumId: z.number().int().describe("The abstract numbering definition ID (w:abstractNumId attribute)."),
  name: z.string().optional().describe("Name of the abstract numbering definition (<w:name w:val='...'/>)."),
  multiLevelType: z.string().optional().describe("Type of multi-level numbering (<w:multiLevelType w:val='...'/>)."),
  levels: z.array(NumberingLevelSchema).describe("Array of numbering level definitions for this abstract numbering."),
  // TODO: Consider adding other <w:abstractNum> children like <w:numStyleLink>, <w:styleLink>
}).strict().describe("Schema for an abstract numbering definition.");

/**
 * Zod schema for a numbering instance (<w:num>).
 * This links a concrete numbering ID (numId) to an abstract definition.
 */
export const NumberingInstanceSchema = z.object({
  numId: z.number().int().describe("The concrete numbering ID (w:numId attribute)."),
  abstractNumId: z.number().int()
    .describe("The ID of the abstract numbering definition this instance refers to (<w:abstractNumId w:val='...'/>)."),
  // Optional: <w:lvlOverride> elements can be parsed here if needed for full fidelity.
  // For now, keeping it simple by just linking to the abstract definition.
  levelOverrides: z.array(z.object({ // Placeholder for level overrides
    level: z.number().int(),
    startOverride: z.number().int().optional(),
    // Potentially include full NumberingLevelSchema for overridden level definition
  })).optional().describe("Level overrides for this instance (placeholder)."),
}).strict().describe("Schema for a numbering instance, linking to an abstract numbering definition.");

/**
 * Zod schema for the entire numbering.xml content.
 */
export const NumberingDefinitionsSchema = z.object({
  abstractNums: z.array(AbstractNumberingSchema).describe("List of all abstract numbering definitions."),
  numInstances: z.array(NumberingInstanceSchema).describe("List of all numbering instances."),
}).strict().describe("Schema for the parsed content of numbering.xml.");


// Example Usage (Illustrative)
// const exampleLevel = {
//   level: 0,
//   start: 1,
//   format: "decimal",
//   text: "%1.",
//   jc: "left",
//   paragraphProperties: { ind: { left: {val: 720}, hanging: {val: 360} } },
//   runProperties: { rFonts: { ascii: "Symbol", hAnsi: "Symbol" } }
// };

// const exampleAbstractNum = {
//   abstractNumId: 0,
//   name: "MyList",
//   multiLevelType: "multilevel",
//   levels: [exampleLevel]
// };

// const exampleNumInstance = {
//   numId: 1,
//   abstractNumId: 0
// };

// const exampleNumberingFile = {
//   abstractNums: [exampleAbstractNum],
//   numInstances: [exampleNumInstance]
// };

// try {
//   const validatedLevel = NumberingLevelSchema.parse(exampleLevel);
//   // console.log("Validated Level:", validatedLevel);
//   const validatedAbstractNum = AbstractNumberingSchema.parse(exampleAbstractNum);
//   // console.log("Validated AbstractNum:", validatedAbstractNum);
//   const validatedNumInstance = NumberingInstanceSchema.parse(exampleNumInstance);
//   // console.log("Validated NumInstance:", validatedNumInstance);
//   const validatedNumberingFile = NumberingDefinitionsSchema.parse(exampleNumberingFile);
//   // console.log("Validated Numbering File:", validatedNumberingFile);
// } catch (error) {
//   console.error("Numbering models validation failed:", error.errors);
// }
