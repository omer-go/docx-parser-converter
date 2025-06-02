import type { Paragraph } from './paragraphModels';
import type { Table } from './tableModels';

/**
 * Represents the margins of a document section.
 * 
 * @example
 * The following is an example of a section properties element with margins:
 * ```xml
 * <w:sectPr>
 *     <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" 
 *              w:header="720" w:footer="720" w:gutter="0"/>
 * </w:sectPr>
 * ```
 */
export interface DocMargins {
  /** The top margin in points. */
  topPt?: number;
  /** The right margin in points. */
  rightPt?: number;
  /** The bottom margin in points. */
  bottomPt?: number;
  /** The left margin in points. */
  leftPt?: number;
  /** The header margin in points. */
  headerPt?: number;
  /** The footer margin in points. */
  footerPt?: number;
  /** The gutter margin in points. */
  gutterPt?: number;
}

/**
 * Represents a document element that can be either a paragraph or a table.
 */
export type DocumentElement = Paragraph | Table;

/**
 * Represents the overall structure of a document, including paragraphs and tables.
 * 
 * @example
 * The following is an example of a document schema structure:
 * ```xml
 * <w:document>
 *     <w:body>
 *         <w:p>
 *             <w:pPr>
 *                 <w:pStyle w:val="Heading1"/>
 *             </w:pPr>
 *             <w:r>
 *                 <w:t>Example text</w:t>
 *             </w:r>
 *         </w:p>
 *         <w:tbl>
 *             <!-- Table elements here -->
 *         </w:tbl>
 *         <w:sectPr>
 *             <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" 
 *                      w:header="720" w:footer="720" w:gutter="0"/>
 *         </w:sectPr>
 *     </w:body>
 * </w:document>
 * ```
 */
export interface DocumentSchema {
  /** The list of document elements (paragraphs and tables). */
  elements: DocumentElement[];
  /** The margins of the document. */
  docMargins?: DocMargins;
} 