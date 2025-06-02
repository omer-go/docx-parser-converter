import type { FontProperties, IndentationProperties } from './stylesModels';

/**
 * Represents a specific level in a numbering scheme.
 * 
 * @example
 * The following is an example of a numbering level element in a numbering.xml file:
 * ```xml
 * <w:lvl w:ilvl="0">
 *     <w:start w:val="1"/>
 *     <w:numFmt w:val="decimal"/>
 *     <w:lvlText w:val="%1."/>
 *     <w:lvlJc w:val="left"/>
 *     <w:pPr>
 *         <w:ind w:left="720" w:hanging="360"/>
 *     </w:pPr>
 *     <w:rPr>
 *         <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *     </w:rPr>
 * </w:lvl>
 * ```
 */
export interface NumberingLevel {
  /** The ID of the numbering definition. */
  numId: number;
  /** The indent level of the numbering. */
  ilvl: number;
  /** The start value for the numbering level. */
  start: number;
  /** The format of the numbering (e.g., decimal, bullet). */
  numFmt: string;
  /** The text to be displayed for the level. */
  lvlText: string;
  /** The justification of the level text. */
  lvlJc: string;
  /** A counter for the level. */
  counter?: number;
  /** The indentation properties for the level. */
  indent?: IndentationProperties;
  /** The tab position in points. */
  tabPt?: number;
  /** The font properties for the level. */
  fonts?: FontProperties;
}

/**
 * Represents an instance of a numbering definition.
 * 
 * @example
 * The following is an example of a numbering instance element in a numbering.xml file:
 * ```xml
 * <w:num w:numId="1">
 *     <w:abstractNumId w:val="0"/>
 *     <w:lvlOverride w:ilvl="0">
 *         <w:startOverride w:val="1"/>
 *     </w:lvlOverride>
 * </w:num>
 * ```
 */
export interface NumberingInstance {
  /** The ID of the numbering definition. */
  numId: number;
  /** The list of levels in the numbering definition. */
  levels: NumberingLevel[];
}

/**
 * Represents the overall numbering schema for the document.
 * 
 * @example
 * The following is an example of a numbering schema structure:
 * ```xml
 * <w:numbering>
 *     <w:abstractNum w:abstractNumId="0">
 *         <w:lvl w:ilvl="0">
 *             <w:start w:val="1"/>
 *             <w:numFmt w:val="decimal"/>
 *             <w:lvlText w:val="%1."/>
 *             <w:lvlJc w:val="left"/>
 *             <w:pPr>
 *                 <w:ind w:left="720" w:hanging="360"/>
 *             </w:pPr>
 *             <w:rPr>
 *                 <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *             </w:rPr>
 *         </w:lvl>
 *     </w:abstractNum>
 *     <w:num w:numId="1">
 *         <w:abstractNumId w:val="0"/>
 *     </w:num>
 * </w:numbering>
 * ```
 */
export interface NumberingSchema {
  /** The list of numbering instances in the document. */
  instances: NumberingInstance[];
} 