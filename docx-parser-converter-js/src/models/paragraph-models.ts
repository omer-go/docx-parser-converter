import { z } from 'zod';
import { BaseModel, createModel, nullableOptional } from './base-model';
import { ParagraphStylePropertiesSchema, RunStylePropertiesSchema } from './styles-models';

/**
 * Represents the numbering properties of a paragraph.
 *
 * Example:
 *   The following is an example of a numbering element in a paragraph properties element:
 *   ```xml
 *   <w:numPr>
 *     <w:ilvl w:val="0"/>
 *     <w:numId w:val="1"/>
 *   </w:numPr>
 *   ```
 */
export const ParagraphNumberingSchema = z.object({
  /** The indent level of the numbering */
  ilvl: z.number(),
  /** The ID of the numbering definition */
  numId: z.number(),
});

export type ParagraphNumbering = z.infer<typeof ParagraphNumberingSchema> & BaseModel;
export const ParagraphNumberingModel = createModel(ParagraphNumberingSchema);

// Keep the old export for backward compatibility
export const NumberingSchema = ParagraphNumberingSchema;
export type Numbering = ParagraphNumbering;
export const NumberingModel = ParagraphNumberingModel;

/**
 * Represents text content in a run.
 *
 * Example:
 *   The following is an example of a text element in a run:
 *   ```xml
 *   <w:r>
 *     <w:t>Example text</w:t>
 *   </w:r>
 *   ```
 */
export const TextContentSchema = z.object({
  /** The text content */
  text: z.string(),
});

export type TextContent = z.infer<typeof TextContentSchema> & BaseModel;
export const TextContentModel = createModel(TextContentSchema);

/**
 * Represents a tab character in a run.
 *
 * Example:
 *   The following is an example of a tab element in a run:
 *   ```xml
 *   <w:r>
 *     <w:tab/>
 *   </w:r>
 *   ```
 */
export const TabContentSchema = z.object({
  /** The type of content, always 'tab' for tab elements */
  type: z.string(),
});

export type TabContent = z.infer<typeof TabContentSchema> & BaseModel;
export const TabContentModel = createModel(TabContentSchema);

/**
 * Represents the content of a run, which can be either text or a tab.
 *
 * Example:
 *   The following is an example of run contents in a run element:
 *   ```xml
 *   <w:r>
 *     <w:t>Example text</w:t>
 *     <w:tab/>
 *   </w:r>
 *   ```
 */
export const RunContentSchema = z.object({
  /** The content of the run */
  run: z.union([TextContentSchema, TabContentSchema]),
});

export type RunContent = z.infer<typeof RunContentSchema> & BaseModel;
export const RunContentModel = createModel(RunContentSchema);

/**
 * Represents a run within a paragraph, containing text and formatting properties.
 *
 * Example:
 *   The following is an example of a run element in a paragraph:
 *   ```xml
 *   <w:r>
 *     <w:rPr>
 *       <w:b/>
 *       <w:color w:val="FF0000"/>
 *     </w:rPr>
 *     <w:t>Example text</w:t>
 *   </w:r>
 *   ```
 */
export const RunSchema = z.object({
  /** The list of run contents (text or tabs) */
  contents: z.array(RunContentSchema),
  /** The style properties of the run */
  properties: nullableOptional(RunStylePropertiesSchema),
});

export type Run = z.infer<typeof RunSchema> & BaseModel;
export const RunModel = createModel(RunSchema);

/**
 * Represents a paragraph in the document, containing text runs and optional numbering.
 *
 * Example:
 *   The following is an example of a paragraph element in a document:
 *   ```xml
 *   <w:p>
 *     <w:pPr>
 *       <w:pStyle w:val="Heading1"/>
 *       <w:numPr>
 *         <w:ilvl w:val="0"/>
 *         <w:numId w:val="1"/>
 *       </w:numPr>
 *     </w:pPr>
 *     <w:r>
 *       <w:t>Example text</w:t>
 *     </w:r>
 *   </w:p>
 *   ```
 */
export const ParagraphSchema = z.object({
  /** The style properties of the paragraph */
  properties: ParagraphStylePropertiesSchema,
  /** The list of text runs within the paragraph */
  runs: z.array(RunSchema),
  /** The numbering properties, if the paragraph is part of a list */
  numbering: nullableOptional(ParagraphNumberingSchema),
});

export type Paragraph = z.infer<typeof ParagraphSchema> & BaseModel;
export const ParagraphModel = createModel(ParagraphSchema);
