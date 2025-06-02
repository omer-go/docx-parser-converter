import type { Paragraph } from './paragraphModels';

/**
 * Represents the border properties for a table cell.
 * 
 * @example
 * The following is an example of border properties in a table cell properties element:
 * ```xml
 * <w:tcBorders>
 *     <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 * </w:tcBorders>
 * ```
 */
export interface BorderProperties {
  /** The color of the border. */
  color?: string;
  /** The size of the border. */
  size?: number;
  /** The space between the border and the text. */
  space?: number;
  /** The style of the border. */
  val?: string;
}

/**
 * Represents the shading properties for a table cell.
 * 
 * @example
 * The following is an example of shading properties in a table cell properties element:
 * ```xml
 * <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
 * ```
 */
export interface ShadingProperties {
  /** The fill color. */
  fill?: string;
  /** The shading pattern. */
  val?: string;
  /** The color of the shading. */
  color?: string;
}

/**
 * Represents the margin properties for a table cell.
 * 
 * @example
 * The following is an example of margin properties in a table cell properties element:
 * ```xml
 * <w:tcMar>
 *     <w:top w:w="100" w:type="dxa"/>
 *     <w:left w:w="100" w:type="dxa"/>
 *     <w:bottom w:w="100" w:type="dxa"/>
 *     <w:right w:w="100" w:type="dxa"/>
 * </w:tcMar>
 * ```
 */
export interface MarginProperties {
  /** The top margin in points. */
  top?: number;
  /** The left margin in points. */
  left?: number;
  /** The bottom margin in points. */
  bottom?: number;
  /** The right margin in points. */
  right?: number;
}

/**
 * Represents the width of a table or table cell.
 * 
 * @example
 * The following is an example of a table width element in a table properties element:
 * ```xml
 * <w:tblW w:type="dxa" w:w="5000"/>
 * ```
 */
export interface TableWidth {
  /** The type of width (e.g., 'dxa'). */
  type?: string;
  /** The width in points. */
  width?: number;
}

/**
 * Represents the indent of a table.
 * 
 * @example
 * The following is an example of a table indent element in a table properties element:
 * ```xml
 * <w:tblInd w:type="dxa" w:w="200"/>
 * ```
 */
export interface TableIndent {
  /** The type of indent (e.g., 'dxa'). */
  type?: string;
  /** The indent width in points. */
  width?: number;
}

/**
 * Represents the look settings for a table.
 * 
 * @example
 * The following is an example of a table look element in a table properties element:
 * ```xml
 * <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
 * ```
 */
export interface TableLook {
  /** Indicates if the first row has special formatting. */
  firstRow?: boolean;
  /** Indicates if the last row has special formatting. */
  lastRow?: boolean;
  /** Indicates if the first column has special formatting. */
  firstColumn?: boolean;
  /** Indicates if the last column has special formatting. */
  lastColumn?: boolean;
  /** Indicates if horizontal banding is disabled. */
  noHBand?: boolean;
  /** Indicates if vertical banding is disabled. */
  noVBand?: boolean;
}

/**
 * Represents the border properties for a table cell.
 * 
 * @example
 * The following is an example of table cell borders in a table cell properties element:
 * ```xml
 * <w:tcBorders>
 *     <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 *     <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
 * </w:tcBorders>
 * ```
 */
export interface TableCellBorders {
  /** The top border properties. */
  top?: BorderProperties;
  /** The left border properties. */
  left?: BorderProperties;
  /** The bottom border properties. */
  bottom?: BorderProperties;
  /** The right border properties. */
  right?: BorderProperties;
  /** The inside horizontal border properties. */
  insideH?: BorderProperties;
  /** The inside vertical border properties. */
  insideV?: BorderProperties;
}

/**
 * Represents the properties of a table cell.
 * 
 * @example
 * The following is an example of table cell properties in a table cell element:
 * ```xml
 * <w:tc>
 *     <w:tcPr>
 *         <w:tcW w:w="5000" w:type="dxa"/>
 *         <w:tcBorders>...</w:tcBorders>
 *         <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
 *         <w:tcMar>...</w:tcMar>
 *         <w:textDirection w:val="btLr"/>
 *         <w:vAlign w:val="center"/>
 *         <w:gridSpan w:val="2"/>
 *     </w:tcPr>
 *     <w:p>...</w:p>
 * </w:tc>
 * ```
 */
export interface TableCellProperties {
  /** The width of the table cell. */
  tcW?: TableWidth;
  /** The borders of the table cell. */
  tcBorders?: TableCellBorders;
  /** The shading properties of the table cell. */
  shd?: ShadingProperties;
  /** The margin properties of the table cell. */
  tcMar?: MarginProperties;
  /** The text direction of the table cell. */
  textDirection?: string;
  /** The vertical alignment of the table cell. */
  vAlign?: string;
  /** Indicates if the cell contains hidden marks. */
  hideMark?: boolean;
  /** The cell merge properties. */
  cellMerge?: string;
  /** The number of grid columns spanned by the table cell. */
  gridSpan?: number;
}

/**
 * Represents a table cell in a table row.
 * 
 * @example
 * The following is an example of a table cell element:
 * ```xml
 * <w:tc>
 *     <w:tcPr>...</w:tcPr>
 *     <w:p>...</w:p>
 * </w:tc>
 * ```
 */
export interface TableCell {
  /** The properties of the table cell. */
  properties?: TableCellProperties;
  /** The list of paragraphs within the table cell. */
  paragraphs: Paragraph[];
}

/**
 * Represents the properties of a table row.
 * 
 * @example
 * The following is an example of table row properties in a table row element:
 * ```xml
 * <w:trPr>
 *     <w:trHeight w:val="240"/>
 *     <w:tblHeader/>
 *     <w:jc w:val="center"/>
 *     <w:tblBorders>...</w:tblBorders>
 *     <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
 * </w:trPr>
 * ```
 */
export interface TableRowProperties {
  /** The height of the table row. */
  trHeight?: string;
  /** The height rule for the table row. */
  trHeightHRule?: string;
  /** Indicates if the row is a table header. */
  tblHeader?: boolean;
  /** The justification for the row content. */
  justification?: string;
  /** The borders for the table row. */
  tblBorders?: TableCellBorders;
  /** The shading properties for the table row. */
  shd?: ShadingProperties;
}

/**
 * Represents a row within a table.
 * 
 * @example
 * The following is an example of a table row element:
 * ```xml
 * <w:tr>
 *     <w:trPr>...</w:trPr>
 *     <w:tc>...</w:tc>
 * </w:tr>
 * ```
 */
export interface TableRow {
  /** The properties of the table row. */
  properties?: TableRowProperties;
  /** The list of cells in the table row. */
  cells: TableCell[];
}

/**
 * Represents the properties of a table.
 * 
 * @example
 * The following is an example of table properties in a table element:
 * ```xml
 * <w:tblPr>
 *     <w:tblStyle w:val="TableGrid"/>
 *     <w:tblW w:w="5000" w:type="dxa"/>
 *     <w:tblInd w:w="200" w:type="dxa"/>
 *     <w:tblBorders>...</w:tblBorders>
 *     <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
 *     <w:tblLayout w:type="fixed"/>
 *     <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
 * </w:tblPr>
 * ```
 */
export interface TableProperties {
  /** The style of the table. */
  tblStyle?: string;
  /** The width of the table. */
  tblW?: TableWidth;
  /** The justification for the table. */
  justification?: string;
  /** The indent of the table. */
  tblInd?: TableIndent;
  /** The cell margins of the table. */
  tblCellMar?: MarginProperties;
  /** The borders of the table. */
  tblBorders?: TableCellBorders;
  /** The shading properties of the table. */
  shd?: ShadingProperties;
  /** The layout of the table. */
  tblLayout?: string;
  /** The look settings of the table. */
  tblLook?: TableLook;
}

/**
 * Represents the grid structure of a table.
 * 
 * @example
 * The following is an example of a table grid element:
 * ```xml
 * <w:tblGrid>
 *     <w:gridCol w:w="5000"/>
 *     <w:gridCol w:w="5000"/>
 * </w:tblGrid>
 * ```
 */
export interface TableGrid {
  /** The list of column widths in points. */
  columns: number[];
}

/**
 * Represents a table in the document.
 * 
 * @example
 * The following is an example of a table element in a document:
 * ```xml
 * <w:tbl>
 *     <w:tblPr>...</w:tblPr>
 *     <w:tblGrid>...</w:tblGrid>
 *     <w:tr>...</w:tr>
 * </w:tbl>
 * ```
 */
export interface Table {
  /** The properties of the table. */
  properties?: TableProperties;
  /** The grid structure of the table. */
  grid?: TableGrid;
  /** The list of rows in the table. */
  rows: TableRow[];
} 