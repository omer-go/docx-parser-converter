import { z } from 'zod';
import { BaseModel, createModel, nullableOptional } from './base-model';

// Internal forward declarations for circular dependency resolution
const DocumentParagraphSchemaRef = z.lazy(() => {
  try {
    // Import here to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const paragraphModels = require('./paragraph-models');
    return paragraphModels.ParagraphSchema;
  } catch (error) {
    // Fallback schema if circular dependency can't be resolved
    return z.object({
      properties: z.any(),
      runs: z.array(z.any()),
      numbering: z.any().optional(),
    });
  }
});

const DocumentTableSchemaRef = z.lazy(() => {
  try {
    // Import here to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tableModels = require('./table-models');
    return tableModels.TableSchema;
  } catch (error) {
    // Fallback schema if circular dependency can't be resolved
    return z.object({
      properties: z.any().optional(),
      grid: z.any().optional(),
      rows: z.array(z.any()),
    });
  }
});

/**
 * Represents the margins of a document section.
 *
 * Example:
 *   The following is an example of a section properties element with margins:
 *   ```xml
 *   <w:sectPr>
 *     <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"
 *              w:header="720" w:footer="720" w:gutter="0"/>
 *   </w:sectPr>
 *   ```
 */
export const DocMarginsSchema = z.object({
  /** The top margin in points */
  top_pt: nullableOptional(z.number()),
  /** The right margin in points */
  right_pt: nullableOptional(z.number()),
  /** The bottom margin in points */
  bottom_pt: nullableOptional(z.number()),
  /** The left margin in points */
  left_pt: nullableOptional(z.number()),
  /** The header margin in points */
  header_pt: nullableOptional(z.number()),
  /** The footer margin in points */
  footer_pt: nullableOptional(z.number()),
  /** The gutter margin in points */
  gutter_pt: nullableOptional(z.number()),
});

export type DocMargins = z.infer<typeof DocMarginsSchema> & BaseModel;
export const DocMarginsModel = createModel(DocMarginsSchema);

/**
 * Represents the overall structure of a document, including paragraphs and tables.
 *
 * Example:
 *   The following is an example of a document schema structure:
 *   ```xml
 *   <w:document>
 *     <w:body>
 *       <w:p>
 *         <w:pPr>
 *           <w:pStyle w:val="Heading1"/>
 *         </w:pPr>
 *         <w:r>
 *           <w:t>Example text</w:t>
 *         </w:r>
 *       </w:p>
 *       <w:tbl>
 *         <!-- Table elements here -->
 *       </w:tbl>
 *       <w:sectPr>
 *         <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"
 *                  w:header="720" w:footer="720" w:gutter="0"/>
 *       </w:sectPr>
 *     </w:body>
 *   </w:document>
 *   ```
 */
export const DocumentSchemaSchema = z.object({
  /** The list of document elements (paragraphs and tables) */
  elements: z.array(z.union([DocumentParagraphSchemaRef, DocumentTableSchemaRef])),
  /** The margins of the document */
  doc_margins: nullableOptional(DocMarginsSchema),
});

export type DocumentSchema = z.infer<typeof DocumentSchemaSchema> & BaseModel;
export const DocumentSchemaModel = createModel(DocumentSchemaSchema);
