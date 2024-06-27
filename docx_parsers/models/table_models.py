from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from docx_parsers.models.document_models import Paragraph

class BorderProperties(BaseModel):
    """
    Represents the border properties for a table cell.

    Attributes:
        color (Optional[str]): The color of the border.
        size (Optional[int]): The size of the border.
        space (Optional[int]): The space between the border and the text.
        val (Optional[str]): The style of the border.

    Example:
        The following is an example of border properties in a table cell properties element:

        .. code-block:: xml

            <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tcBorders>
    """
    color: Optional[str]
    size: Optional[int]
    space: Optional[int]
    val: Optional[str]

class ShadingProperties(BaseModel):
    """
    Represents the shading properties for a table cell.

    Attributes:
        fill (Optional[str]): The fill color.
        val (Optional[str]): The shading pattern.
        color (Optional[str]): The color of the shading.

    Example:
        The following is an example of shading properties in a table cell properties element:

        .. code-block:: xml

            <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
    """
    fill: Optional[str]
    val: Optional[str]
    color: Optional[str]

class MarginProperties(BaseModel):
    """
    Represents the margin properties for a table cell.

    Attributes:
        top (Optional[float]): The top margin in points.
        left (Optional[float]): The left margin in points.
        bottom (Optional[float]): The bottom margin in points.
        right (Optional[float]): The right margin in points.

    Example:
        The following is an example of margin properties in a table cell properties element:

        .. code-block:: xml

            <w:tcMar>
                <w:top w:w="100" w:type="dxa"/>
                <w:left w:w="100" w:type="dxa"/>
                <w:bottom w:w="100" w:type="dxa"/>
                <w:right w:w="100" w:type="dxa"/>
            </w:tcMar>
    """
    top: Optional[float]
    left: Optional[float]
    bottom: Optional[float]
    right: Optional[float]

class TableWidth(BaseModel):
    """
    Represents the width of a table or table cell.

    Attributes:
        type (Optional[str]): The type of width (e.g., "dxa").
        width (Optional[float]): The width in points.

    Example:
        The following is an example of a table width element in a table properties element:

        .. code-block:: xml

            <w:tblW w:type="dxa" w:w="5000"/>
    """
    type: Optional[str]
    width: Optional[float]

class TableIndent(BaseModel):
    """
    Represents the indent of a table.

    Attributes:
        type (Optional[str]): The type of indent (e.g., "dxa").
        width (Optional[float]): The indent width in points.

    Example:
        The following is an example of a table indent element in a table properties element:

        .. code-block:: xml

            <w:tblInd w:type="dxa" w:w="200"/>
    """
    type: Optional[str]
    width: Optional[float]

class TableLook(BaseModel):
    """
    Represents the look settings for a table.

    Attributes:
        firstRow (Optional[bool]): Indicates if the first row has special formatting.
        lastRow (Optional[bool]): Indicates if the last row has special formatting.
        firstColumn (Optional[bool]): Indicates if the first column has special formatting.
        lastColumn (Optional[bool]): Indicates if the last column has special formatting.
        noHBand (Optional[bool]): Indicates if horizontal banding is disabled.
        noVBand (Optional[bool]): Indicates if vertical banding is disabled.

    Example:
        The following is an example of a table look element in a table properties element:

        .. code-block:: xml

            <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
    """
    firstRow: Optional[bool]
    lastRow: Optional[bool]
    firstColumn: Optional[bool]
    lastColumn: Optional[bool]
    noHBand: Optional[bool]
    noVBand: Optional[bool]

class TableCellBorders(BaseModel):
    """
    Represents the border properties for a table cell.

    Attributes:
        top (Optional[BorderProperties]): The top border properties.
        left (Optional[BorderProperties]): The left border properties.
        bottom (Optional[BorderProperties]): The bottom border properties.
        right (Optional[BorderProperties]): The right border properties.
        insideH (Optional[BorderProperties]): The inside horizontal border properties.
        insideV (Optional[BorderProperties]): The inside vertical border properties.

    Example:
        The following is an example of table cell borders in a table cell properties element:

        .. code-block:: xml

            <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tcBorders>
    """
    top: Optional[BorderProperties]
    left: Optional[BorderProperties]
    bottom: Optional[BorderProperties]
    right: Optional[BorderProperties]
    insideH: Optional[BorderProperties]
    insideV: Optional[BorderProperties]

class TableCellProperties(BaseModel):
    """
    Represents the properties of a table cell.

    Attributes:
        tcW (Optional[TableWidth]): The width of the table cell.
        tcBorders (Optional[TableCellBorders]): The borders of the table cell.
        shd (Optional[ShadingProperties]): The shading properties of the table cell.
        tcMar (Optional[MarginProperties]): The margin properties of the table cell.
        textDirection (Optional[str]): The text direction of the table cell.
        vAlign (Optional[str]): The vertical alignment of the table cell.
        hideMark (Optional[bool]): Indicates if the cell contains hidden marks.
        cellMerge (Optional[str]): The cell merge properties.
        gridSpan (Optional[int]): The number of grid columns spanned by the table cell.

    Example:
        The following is an example of table cell properties in a table cell element:

        .. code-block:: xml

            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="5000" w:type="dxa"/>
                    <w:tcBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tcBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    <w:tcMar>
                        <w:top w:w="100" w:type="dxa"/>
                        <w:left w:w="100" w:type="dxa"/>
                        <w:bottom w:w="100" w:type="dxa"/>
                        <w:right w:w="100" w:type="dxa"/>
                    </w:tcMar>
                    <w:textDirection w:val="btLr"/>
                    <w:vAlign w:val="center"/>
                    <w:gridSpan w:val="2"/>
                </w:tcPr>
                <w:p>
                    <!-- Paragraph content here -->
                </w:p>
            </w:tc>
    """
    tcW: Optional[TableWidth]
    tcBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]
    tcMar: Optional[MarginProperties]
    textDirection: Optional[str]
    vAlign: Optional[str]
    hideMark: Optional[bool]
    cellMerge: Optional[str]
    gridSpan: Optional[int]

class TableCell(BaseModel):
    """
    Represents a table cell in a table row.

    Attributes:
        properties (Optional[TableCellProperties]): The properties of the table cell.
        paragraphs (List['Paragraph']): The list of paragraphs within the table cell.

    Example:
        The following is an example of a table cell element:

        .. code-block:: xml

            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="5000" w:type="dxa"/>
                    <w:tcBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tcBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    <w:tcMar>
                        <w:top w:w="100" w:type="dxa"/>
                        <w:left w:w="100" w:type="dxa"/>
                        <w:bottom w:w="100" w:type="dxa"/>
                        <w:right w:w="100" w:type="dxa"/>
                    </w:tcMar>
                    <w:textDirection w:val="btLr"/>
                    <w:vAlign w:val="center"/>
                    <w:gridSpan w:val="2"/>
                </w:tcPr>
                <w:p>
                    <!-- Paragraph content here -->
                </w:p>
            </w:tc>
    """
    properties: Optional[TableCellProperties]
    paragraphs: List['Paragraph']

class TableRowProperties(BaseModel):
    """
    Represents the properties of a table row.

    Attributes:
        trHeight (Optional[str]): The height of the table row.
        trHeight_hRule (Optional[str]): The height rule for the table row.
        tblHeader (Optional[bool]): Indicates if the row is a table header.
        justification (Optional[str]): The justification for the row content.
        tblBorders (Optional[TableCellBorders]): The borders for the table row.
        shd (Optional[ShadingProperties]): The shading properties for the table row.

    Example:
        The following is an example of table row properties in a table row element:

        .. code-block:: xml

            <w:trPr>
                <w:trHeight w:val="240"/>
                <w:tblHeader/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                </w:tblBorders>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:trPr>
    """
    trHeight: Optional[str]
    trHeight_hRule: Optional[str]
    tblHeader: Optional[bool]
    justification: Optional[str]
    tblBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]

class TableRow(BaseModel):
    """
    Represents a row within a table.

    Attributes:
        properties (Optional[TableRowProperties]): The properties of the table row.
        cells (List[TableCell]): The list of cells in the table row.

    Example:
        The following is an example of a table row element:

        .. code-block:: xml

            <w:tr>
                <w:trPr>
                    <w:trHeight w:val="240"/>
                    <w:tblHeader/>
                </w:trPr>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="5000" w:type="dxa"/>
                        <w:tcBorders>
                            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        </w:tcBorders>
                        <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                        <w:tcMar>
                            <w:top w:w="100" w:type="dxa"/>
                            <w:left w:w="100" w:type="dxa"/>
                            <w:bottom w:w="100" w:type="dxa"/>
                            <w:right w:w="100" w:type="dxa"/>
                        </w:tcMar>
                        <w:textDirection w:val="btLr"/>
                        <w:vAlign w:val="center"/>
                        <w:gridSpan w:val="2"/>
                    </w:tcPr>
                    <w:p>
                        <!-- Paragraph content here -->
                    </w:p>
                </w:tc>
            </w:tr>
    """
    properties: Optional[TableRowProperties]
    cells: List[TableCell]

class TableProperties(BaseModel):
    """
    Represents the properties of a table.

    Attributes:
        tblStyle (Optional[str]): The style of the table.
        tblW (Optional[TableWidth]): The width of the table.
        justification (Optional[str]): The justification for the table.
        tblInd (Optional[TableIndent]): The indent of the table.
        tblCellMar (Optional[MarginProperties]): The cell margins of the table.
        tblBorders (Optional[TableCellBorders]): The borders of the table.
        shd (Optional[ShadingProperties]): The shading properties of the table.
        tblLayout (Optional[str]): The layout of the table.
        tblLook (Optional[TableLook]): The look settings of the table.

    Example:
        The following is an example of table properties in a table element:

        .. code-block:: xml

            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="5000" w:type="dxa"/>
                <w:tblInd w:w="200" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                </w:tblBorders>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                <w:tblLayout w:type="fixed"/>
                <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
            </w:tblPr>
    """
    tblStyle: Optional[str]
    tblW: Optional[TableWidth]
    justification: Optional[str]
    tblInd: Optional[TableIndent]
    tblCellMar: Optional[MarginProperties]
    tblBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]
    tblLayout: Optional[str]
    tblLook: Optional[TableLook]

class TableGrid(BaseModel):
    """
    Represents the grid structure of a table.

    Attributes:
        columns (List[float]): The list of column widths in points.

    Example:
        The following is an example of a table grid element:

        .. code-block:: xml

            <w:tblGrid>
                <w:gridCol w:w="5000"/>
                <w:gridCol w:w="5000"/>
            </w:tblGrid>
    """
    columns: List[float]

class Table(BaseModel):
    """
    Represents a table in the document.

    Attributes:
        properties (Optional[TableProperties]): The properties of the table.
        grid (Optional[TableGrid]): The grid structure of the table.
        rows (List[TableRow]): The list of rows in the table.

    Example:
        The following is an example of a table element in a document:

        .. code-block:: xml

            <w:tbl>
                <w:tblPr>
                    <w:tblStyle w:val="TableGrid"/>
                    <w:tblW w:w="5000" w:type="dxa"/>
                    <w:tblInd w:w="200" w:type="dxa"/>
                    <w:tblBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tblBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    <w:tblLayout w:type="fixed"/>
                    <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
                </w:tblPr>
                <w:tblGrid>
                    <w:gridCol w:w="5000"/>
                    <w:gridCol w:w="5000"/>
                </w:tblGrid>
                <w:tr>
                    <w:trPr>
                        <w:trHeight w:val="240"/>
                        <w:tblHeader/>
                    </w:trPr>
                    <w:tc>
                        <w:tcPr>
                            <w:tcW w:w="5000" w:type="dxa"/>
                            <w:tcBorders>
                                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                            </w:tcBorders>
                            <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                            <w:tcMar>
                                <w:top w:w="100" w:type="dxa"/>
                                <w:left w:w="100" w:type="dxa"/>
                                <w:bottom w:w="100" w:type="dxa"/>
                                <w:right w:w="100" w:type="dxa"/>
                            </w:tcMar>
                            <w:textDirection w:val="btLr"/>
                            <w:vAlign w:val="center"/>
                            <w:gridSpan w:val="2"/>
                        </w:tcPr>
                        <w:p>
                            <!-- Paragraph content here -->
                        </w:p>
                    </w:tc>
                </w:tr>
            </w:tbl>
    """
    properties: Optional[TableProperties]
    grid: Optional[TableGrid]
    rows: List[TableRow]
