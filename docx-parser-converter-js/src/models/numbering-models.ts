import { z } from 'zod';
import { BaseModel, createModel, nullableOptional } from './base-model';
import { FontPropertiesSchema, IndentationPropertiesSchema } from './styles-models';

/**
 * Represents a specific level in a numbering scheme.
 *
 * Example:
 *   The following is an example of a numbering level element in a numbering.xml file:
 *   ```xml
 *   <w:lvl w:ilvl="0">
 *     <w:start w:val="1"/>
 *     <w:numFmt w:val="decimal"/>
 *     <w:lvlText w:val="%1."/>
 *     <w:lvlJc w:val="left"/>
 *     <w:pPr>
 *       <w:ind w:left="720" w:hanging="360"/>
 *     </w:pPr>
 *     <w:rPr>
 *       <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *     </w:rPr>
 *   </w:lvl>
 *   ```
 */
export const NumberingLevelSchema = z.object({
  /** The ID of the numbering definition */
  numId: z.number(),
  /** The indent level of the numbering */
  ilvl: z.number(),
  /** The start value for the numbering level */
  start: z.number(),
  /** The format of the numbering (e.g., decimal, bullet) */
  numFmt: z.string(),
  /** The text to be displayed for the level */
  lvlText: z.string(),
  /** The justification of the level text */
  lvlJc: z.string(),
  /** A counter for the level */
  counter: nullableOptional(z.number()),
  /** The indentation properties for the level */
  indent: nullableOptional(IndentationPropertiesSchema),
  /** The tab position in points */
  tab_pt: nullableOptional(z.number()),
  /** The font properties for the level */
  fonts: nullableOptional(FontPropertiesSchema),
});

export type NumberingLevel = z.infer<typeof NumberingLevelSchema> & BaseModel;
export const NumberingLevelModel = createModel(NumberingLevelSchema);

/**
 * Represents an instance of a numbering definition.
 *
 * Example:
 *   The following is an example of a numbering instance element in a numbering.xml file:
 *   ```xml
 *   <w:num w:numId="1">
 *     <w:abstractNumId w:val="0"/>
 *     <w:lvlOverride w:ilvl="0">
 *       <w:startOverride w:val="1"/>
 *     </w:lvlOverride>
 *   </w:num>
 *   ```
 */
export const NumberingInstanceSchema = z.object({
  /** The ID of the numbering definition */
  numId: z.number(),
  /** The abstract number ID this instance refers to */
  abstractNumId: z.number(),
});

export type NumberingInstance = z.infer<typeof NumberingInstanceSchema> & BaseModel;
export const NumberingInstanceModel = createModel(NumberingInstanceSchema);

/**
 * Represents the overall numbering schema for the document.
 *
 * Example:
 *   The following is an example of a numbering schema structure:
 *   ```xml
 *   <w:numbering>
 *     <w:abstractNum w:abstractNumId="0">
 *       <w:lvl w:ilvl="0">
 *         <w:start w:val="1"/>
 *         <w:numFmt w:val="decimal"/>
 *         <w:lvlText w:val="%1."/>
 *         <w:lvlJc w:val="left"/>
 *         <w:pPr>
 *           <w:ind w:left="720" w:hanging="360"/>
 *         </w:pPr>
 *         <w:rPr>
 *           <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *         </w:rPr>
 *       </w:lvl>
 *     </w:abstractNum>
 *     <w:num w:numId="1">
 *       <w:abstractNumId w:val="0"/>
 *     </w:num>
 *   </w:numbering>
 *   ```
 */
export const NumberingSchemaSchema = z.object({
  /** The list of numbering levels in the document */
  levels: z.array(NumberingLevelSchema),
  /** The list of numbering instances in the document */
  instances: z.array(NumberingInstanceSchema),
});

export type NumberingSchema = z.infer<typeof NumberingSchemaSchema> & BaseModel;
export const NumberingSchemaModel = createModel(NumberingSchemaSchema);
