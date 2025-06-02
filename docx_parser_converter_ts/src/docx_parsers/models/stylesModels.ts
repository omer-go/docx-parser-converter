/**
 * Represents the spacing properties for a paragraph.
 * 
 * @example
 * The following is an example of spacing properties in a paragraph properties element:
 * ```xml
 * <w:spacing w:before="240" w:after="240" w:line="360"/>
 * ```
 */
export interface SpacingProperties {
  /** The space before the paragraph in points. */
  beforePt?: number;
  /** The space after the paragraph in points. */
  afterPt?: number;
  /** The line spacing in points. */
  linePt?: number;
}

/**
 * Represents the indentation properties for a paragraph.
 * 
 * @example
 * The following is an example of indentation properties in a paragraph properties element:
 * ```xml
 * <w:ind w:left="720" w:right="720" w:firstLine="720"/>
 * ```
 */
export interface IndentationProperties {
  /** The left indentation in points. */
  leftPt?: number;
  /** The right indentation in points. */
  rightPt?: number;
  /** The first line indentation in points. */
  firstLinePt?: number;
}

/**
 * Represents the font properties for text.
 * 
 * @example
 * The following is an example of font properties in a run properties element:
 * ```xml
 * <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 * ```
 */
export interface FontProperties {
  /** The ASCII font. */
  ascii?: string;
  /** The high ANSI font. */
  hAnsi?: string;
  /** The East Asian font. */
  eastAsia?: string;
  /** The complex script font. */
  cs?: string;
}

/**
 * Represents the language properties for text.
 * 
 * @example
 * The following is an example of language properties in a run properties element:
 * ```xml
 * <w:lang w:val="en-US"/>
 * ```
 */
export interface LanguageProperties {
  /** The language value. */
  val?: string;
  /** The East Asian language. */
  eastAsia?: string;
  /** The bidirectional language. */
  bidi?: string;
}

/**
 * Represents a tab stop within a paragraph.
 * 
 * @example
 * The following is an example of a tab stop in a tabs element:
 * ```xml
 * <w:tab w:val="left" w:pos="720"/>
 * ```
 */
export interface TabStop {
  /** The type of tab stop. */
  val: string;
  /** The position of the tab stop in points. */
  pos: number;
}

/**
 * Represents the style properties for a paragraph.
 * 
 * @example
 * The following is an example of paragraph style properties in a style element:
 * ```xml
 * <w:pPr>
 *     <w:spacing w:before="240" w:after="240" w:line="360"/>
 *     <w:ind w:left="720" w:right="720" w:firstLine="720"/>
 *     ...
 * </w:pPr>
 * ```
 */
export interface ParagraphStyleProperties {
  /** The style ID of the paragraph. */
  styleId?: string;
  /** The spacing properties. */
  spacing?: SpacingProperties;
  /** The indentation properties. */
  indent?: IndentationProperties;
  /** The outline level. */
  outlineLevel?: number;
  /** The widow control setting. */
  widowControl?: boolean;
  /** The suppress auto hyphens setting. */
  suppressAutoHyphens?: boolean;
  /** The bidirectional setting. */
  bidi?: boolean;
  /** The justification setting. */
  justification?: string;
  /** The keep next setting. */
  keepNext?: boolean;
  /** The suppress line numbers setting. */
  suppressLineNumbers?: boolean;
  /** The list of tab stops. */
  tabs?: TabStop[];
}

/**
 * Represents the style properties for a text run.
 * 
 * @example
 * The following is an example of run style properties in a style element:
 * ```xml
 * <w:rPr>
 *     <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
 *     <w:sz w:val="24"/>
 *     <w:color w:val="FF0000"/>
 *     ...
 * </w:rPr>
 * ```
 */
export interface RunStyleProperties {
  /** The font properties. */
  font?: FontProperties;
  /** The font size in points. */
  sizePt?: number;
  /** The font color. */
  color?: string;
  /** The bold setting. */
  bold?: boolean;
  /** The italic setting. */
  italic?: boolean;
  /** The underline setting. */
  underline?: string;
  /** The strikethrough setting. */
  strikethrough?: boolean;
  /** The hidden setting. */
  hidden?: boolean;
  /** The language properties. */
  lang?: LanguageProperties;
  /** The highlight color. */
  highlight?: string;
  /** The shading color. */
  shading?: string;
  /** The text position in points. */
  textPositionPt?: number;
  /** The kerning value. */
  kerning?: number;
  /** The character spacing in points. */
  characterSpacingPt?: number;
  /** The emboss setting. */
  emboss?: boolean;
  /** The outline setting. */
  outline?: boolean;
  /** The shadow setting. */
  shadow?: boolean;
  /** The all caps setting. */
  allCaps?: boolean;
  /** The small caps setting. */
  smallCaps?: boolean;
}

/**
 * Represents a style definition in the document.
 * 
 * @example
 * The following is an example of a style definition in a styles.xml file:
 * ```xml
 * <w:style w:styleId="Heading1" w:type="paragraph">
 *     ...
 * </w:style>
 * ```
 */
export interface Style {
  /** The ID of the style. */
  styleId: string;
  /** The name of the style. */
  name: string;
  /** The style this style is based on. */
  basedOn?: string;
  /** The paragraph style properties. */
  paragraphProperties?: ParagraphStyleProperties;
  /** The run style properties. */
  runProperties?: RunStyleProperties;
}

/**
 * Represents the default styles for various elements in the document.
 * 
 * @example
 * The following is an example of style defaults in a styles.xml file:
 * ```xml
 * <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
 *     ...
 * </w:style>
 * ```
 */
export interface StyleDefaults {
  /** The default paragraph style. */
  paragraph?: string;
  /** The default character style. */
  character?: string;
  /** The default numbering style. */
  numbering?: string;
  /** The default table style. */
  table?: string;
}

/**
 * Represents the overall styles schema for the document.
 * 
 * @example
 * The following is an example of a styles schema structure:
 * ```xml
 * <w:styles>
 *     <w:style w:styleId="Heading1" w:type="paragraph">
 *         ...
 *     </w:style>
 *     <w:docDefaults>
 *         <w:rPrDefault>
 *             ...
 *         </w:rPrDefault>
 *         <w:pPrDefault>
 *             ...
 *         </w:pPrDefault>
 *     </w:docDefaults>
 * </w:styles>
 * ```
 */
export interface StylesSchema {
  /** The list of styles in the document. */
  styles: Style[];
  /** The default styles for different elements. */
  styleTypeDefaults: StyleDefaults;
  /** The default run properties. */
  docDefaultsRpr?: RunStyleProperties;
  /** The default paragraph properties. */
  docDefaultsPpr?: ParagraphStyleProperties;
} 