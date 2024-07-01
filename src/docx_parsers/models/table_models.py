from pydantic import BaseModel, Field
from typing import Optional, List, TYPE_CHECKING
from docx_parsers.models.paragraph_models import Paragraph

# if TYPE_CHECKING:
#     from docx_parsers.models.document_models import Paragraph

class BorderProperties(BaseModel):
    """
    Represents the border properties for a table cell.

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
    color: Optional[str] = Field(None, description="The color of the border.")
    size: Optional[int] = Field(None, description="The size of the border.")
    space: Optional[int] = Field(None, description="The space between the border and the text.")
    val: Optional[str] = Field(None, description="The style of the border.")

class ShadingProperties(BaseModel):
    """
    Represents the shading properties for a table cell.

    Example:
        The following is an example of shading properties in a table cell properties element:

        .. code-block:: xml

            <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
    """
    fill: Optional[str] = Field(None, description="The fill color.")
    val: Optional[str] = Field(None, description="The shading pattern.")
    color: Optional[str] = Field(None, description="The color of the shading.")

class MarginProperties(BaseModel):
    """
    Represents the margin properties for a table cell.

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
    top: Optional[float] = Field(None, description="The top margin in points.")
    left: Optional[float] = Field(None, description="The left margin in points.")
    bottom: Optional[float] = Field(None, description="The bottom margin in points.")
    right: Optional[float] = Field(None, description="The right margin in points.")

class TableWidth(BaseModel):
    """
    Represents the width of a table or table cell.

    Example:
        The following is an example of a table width element in a table properties element:

        .. code-block:: xml

            <w:tblW w:type="dxa" w:w="5000"/>
    """
    type: Optional[str] = Field(None, description="The type of width (e.g., 'dxa').")
    width: Optional[float] = Field(None, description="The width in points.")

class TableIndent(BaseModel):
    """
    Represents the indent of a table.

    Example:
        The following is an example of a table indent element in a table properties element:

        .. code-block:: xml

            <w:tblInd w:type="dxa" w:w="200"/>
    """
    type: Optional[str] = Field(None, description="The type of indent (e.g., 'dxa').")
    width: Optional[float] = Field(None, description="The indent width in points.")

class TableLook(BaseModel):
    """
    Represents the look settings for a table.

    Example:
        The following is an example of a table look element in a table properties element:

        .. code-block:: xml

            <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
    """
    firstRow: Optional[bool] = Field(None, description="Indicates if the first row has special formatting.")
    lastRow: Optional[bool] = Field(None, description="Indicates if the last row has special formatting.")
    firstColumn: Optional[bool] = Field(None, description="Indicates if the first column has special formatting.")
    lastColumn: Optional[bool] = Field(None, description="Indicates if the last column has special formatting.")
    noHBand: Optional[bool] = Field(None, description="Indicates if horizontal banding is disabled.")
    noVBand: Optional[bool] = Field(None, description="Indicates if vertical banding is disabled.")

class TableCellBorders(BaseModel):
    """
    Represents the border properties for a table cell.

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
    top: Optional[BorderProperties] = Field(None, description="The top border properties.")
    left: Optional[BorderProperties] = Field(None, description="The left border properties.")
    bottom: Optional[BorderProperties] = Field(None, description="The bottom border properties.")
    right: Optional[BorderProperties] = Field(None, description="The right border properties.")
    insideH: Optional[BorderProperties] = Field(None, description="The inside horizontal border properties.")
    insideV: Optional[BorderProperties] = Field(None, description="The inside vertical border properties.")

class TableCellProperties(BaseModel):
    """
    Represents the properties of a table cell.

    Example:
        The following is an example of table cell properties in a table cell element:

        .. code-block:: xml

            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="5000" w:type="dxa"/>
                    <w:tcBorders>...</w:tcBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    <w:tcMar>...</w:tcMar>
                    <w:textDirection w:val="btLr"/>
                    <w:vAlign w:val="center"/>
                    <w:gridSpan w:val="2"/>
                </w:tcPr>
                <w:p>...</w:p>
            </w:tc>
    """
    tcW: Optional[TableWidth] = Field(None, description="The width of the table cell.")
    tcBorders: Optional[TableCellBorders] = Field(None, description="The borders of the table cell.")
    shd: Optional[ShadingProperties] = Field(None, description="The shading properties of the table cell.")
    tcMar: Optional[MarginProperties] = Field(None, description="The margin properties of the table cell.")
    textDirection: Optional[str] = Field(None, description="The text direction of the table cell.")
    vAlign: Optional[str] = Field(None, description="The vertical alignment of the table cell.")
    hideMark: Optional[bool] = Field(None, description="Indicates if the cell contains hidden marks.")
    cellMerge: Optional[str] = Field(None, description="The cell merge properties.")
    gridSpan: Optional[int] = Field(None, description="The number of grid columns spanned by the table cell.")

class TableCell(BaseModel):
    """
    Represents a table cell in a table row.

    Example:
        The following is an example of a table cell element:

        .. code-block:: xml

            <w:tc>
                <w:tcPr>...</w:tcPr>
                <w:p>...</w:p>
            </w:tc>
    """
    properties: Optional[TableCellProperties] = Field(None, description="The properties of the table cell.")
    paragraphs: List['Paragraph'] = Field(..., description="The list of paragraphs within the table cell.")

class TableRowProperties(BaseModel):
    """
    Represents the properties of a table row.

    Example:
        The following is an example of table row properties in a table row element:

        .. code-block:: xml

            <w:trPr>
                <w:trHeight w:val="240"/>
                <w:tblHeader/>
                <w:jc w:val="center"/>
                <w:tblBorders>...</w:tblBorders>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:trPr>
    """
    trHeight: Optional[str] = Field(None, description="The height of the table row.")
    trHeight_hRule: Optional[str] = Field(None, description="The height rule for the table row.")
    tblHeader: Optional[bool] = Field(None, description="Indicates if the row is a table header.")
    justification: Optional[str] = Field(None, description="The justification for the row content.")
    tblBorders: Optional[TableCellBorders] = Field(None, description="The borders for the table row.")
    shd: Optional[ShadingProperties] = Field(None, description="The shading properties for the table row.")

class TableRow(BaseModel):
    """
    Represents a row within a table.

    Example:
        The following is an example of a table row element:

        .. code-block:: xml

            <w:tr>
                <w:trPr>...</w:trPr>
                <w:tc>...</w:tc>
            </w:tr>
    """
    properties: Optional[TableRowProperties] = Field(None, description="The properties of the table row.")
    cells: List[TableCell] = Field(..., description="The list of cells in the table row.")

class TableProperties(BaseModel):
    """
    Represents the properties of a table.

    Example:
        The following is an example of table properties in a table element:

        .. code-block:: xml

            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="5000" w:type="dxa"/>
                <w:tblInd w:w="200" w:type="dxa"/>
                <w:tblBorders>...</w:tblBorders>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                <w:tblLayout w:type="fixed"/>
                <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
            </w:tblPr>
    """
    tblStyle: Optional[str] = Field(None, description="The style of the table.")
    tblW: Optional[TableWidth] = Field(None, description="The width of the table.")
    justification: Optional[str] = Field(None, description="The justification for the table.")
    tblInd: Optional[TableIndent] = Field(None, description="The indent of the table.")
    tblCellMar: Optional[MarginProperties] = Field(None, description="The cell margins of the table.")
    tblBorders: Optional[TableCellBorders] = Field(None, description="The borders of the table.")
    shd: Optional[ShadingProperties] = Field(None, description="The shading properties of the table.")
    tblLayout: Optional[str] = Field(None, description="The layout of the table.")
    tblLook: Optional[TableLook] = Field(None, description="The look settings of the table.")

class TableGrid(BaseModel):
    """
    Represents the grid structure of a table.

    Example:
        The following is an example of a table grid element:

        .. code-block:: xml

            <w:tblGrid>
                <w:gridCol w:w="5000"/>
                <w:gridCol w:w="5000"/>
            </w:tblGrid>
    """
    columns: List[float] = Field(..., description="The list of column widths in points.")

class Table(BaseModel):
    """
    Represents a table in the document.

    Example:
        The following is an example of a table element in a document:

        .. code-block:: xml

            <w:tbl>
                <w:tblPr>...</w:tblPr>
                <w:tblGrid>...</w:tblGrid>
                <w:tr>...</w:tr>
            </w:tbl>
    """
    properties: Optional[TableProperties] = Field(None, description="The properties of the table.")
    grid: Optional[TableGrid] = Field(None, description="The grid structure of the table.")
    rows: List[TableRow] = Field(..., description="The list of rows in the table.")
