import type { ParagraphStyleProperties, RunStyleProperties } from './stylesModels';

/**
 * Represents the numbering properties of a paragraph.
 * 
 * @example
 * The following is an example of a numbering element in a paragraph properties element:
 * ```xml
 * <w:numPr>
 *     <w:ilvl w:val="0"/>
 *     <w:numId w:val="1"/>
 * </w:numPr>
 * ```
 */
export interface Numbering {
  /** The indent level of the numbering. */
  ilvl: number;
  /** The ID of the numbering definition. */
  numId: number;
}

/**
 * Represents text content in a run.
 * 
 * @example
 * The following is an example of a text element in a run:
 * ```xml
 * <w:r>
 *     <w:t>Example text</w:t>
 * </w:r>
 * ```
 */
export interface TextContent {
  /** The text content. */
  text: string;
  /** Content type discriminator. */
  type: 'text';
}

/**
 * Represents a tab character in a run.
 * 
 * @example
 * The following is an example of a tab element in a run:
 * ```xml
 * <w:r>
 *     <w:tab/>
 * </w:r>
 * ```
 */
export interface TabContent {
  /** The type of content, default is 'tab'. */
  type: 'tab';
}

/**
 * Represents the content of a run, which can be either text or a tab.
 * 
 * @example
 * The following is an example of run contents in a run element:
 * ```xml
 * <w:r>
 *     <w:t>Example text</w:t>
 *     <w:tab/>
 * </w:r>
 * ```
 */
export type RunContent = TextContent | TabContent;

/**
 * Represents a run within a paragraph, containing text and formatting properties.
 * 
 * @example
 * The following is an example of a run element in a paragraph:
 * ```xml
 * <w:r>
 *     <w:rPr>
 *         <w:b/>
 *         <w:color w:val="FF0000"/>
 *     </w:rPr>
 *     <w:t>Example text</w:t>
 * </w:r>
 * ```
 */
export interface Run {
  /** The list of run contents (text or tabs). */
  contents: RunContent[];
  /** The style properties of the run. */
  properties?: RunStyleProperties;
}

/**
 * Represents a paragraph in the document, containing text runs and optional numbering.
 * 
 * @example
 * The following is an example of a paragraph element in a document:
 * ```xml
 * <w:p>
 *     <w:pPr>
 *         <w:pStyle w:val="Heading1"/>
 *         <w:numPr>
 *             <w:ilvl w:val="0"/>
 *             <w:numId w:val="1"/>
 *         </w:numPr>
 *     </w:pPr>
 *     <w:r>
 *         <w:t>Example text</w:t>
 *     </w:r>
 * </w:p>
 * ```
 */
export interface Paragraph {
  /** The style properties of the paragraph. */
  properties: ParagraphStyleProperties;
  /** The list of text runs within the paragraph. */
  runs: Run[];
  /** The numbering properties, if the paragraph is part of a list. */
  numbering?: Numbering;
} 