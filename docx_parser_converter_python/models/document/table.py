"""Table models for DOCX documents.

Tables contain rows, which contain cells.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.border import TableBorders
from models.common.shading import Shading
from models.common.width import Width
from models.document.table_cell import TableCellMargins
from models.document.table_row import TableRow


class TableGridColumn(BaseModel):
    """A column in the table grid.

    XML Element: <w:gridCol>

    XML Example:
        <w:gridCol w:w="2880"/>

    Attributes:
        w: Column width in twips
    """

    w: int | None = None

    model_config = {"extra": "ignore"}


class TableGrid(BaseModel):
    """Grid definition for a table.

    XML Element: <w:tblGrid>

    Defines the column structure of the table.

    XML Example:
        <w:tblGrid>
            <w:gridCol w:w="2880"/>
            <w:gridCol w:w="2880"/>
            <w:gridCol w:w="2880"/>
        </w:tblGrid>

    Attributes:
        grid_col: List of grid columns
    """

    grid_col: list[TableGridColumn] = []

    model_config = {"extra": "ignore"}


class TableLook(BaseModel):
    """Conditional formatting flags for a table.

    XML Element: <w:tblLook>

    These flags control which parts of a table style are applied.

    XML Example:
        <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1"
                   w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>

    Attributes:
        first_row: Apply first row formatting
        last_row: Apply last row formatting
        first_column: Apply first column formatting
        last_column: Apply last column formatting
        no_h_band: Disable horizontal banding
        no_v_band: Disable vertical banding
    """

    first_row: bool | None = None
    last_row: bool | None = None
    first_column: bool | None = None
    last_column: bool | None = None
    no_h_band: bool | None = None
    no_v_band: bool | None = None

    model_config = {"extra": "ignore"}


class TableProperties(BaseModel):
    """Properties for a table.

    XML Element: <w:tblPr>

    Attributes:
        tbl_style: Table style ID reference
        tbl_w: Table width
        jc: Table justification
        tbl_ind: Table indentation from left margin
        tbl_borders: Table borders
        shd: Table shading
        tbl_layout: Table layout (fixed or autofit)
        tbl_cell_mar: Default cell margins
        tbl_look: Conditional formatting flags
        tbl_caption: Table caption (accessibility)
        tbl_description: Table description (accessibility)
    """

    tbl_style: str | None = None
    tbl_w: Width | None = None
    jc: str | None = None
    tbl_ind: Width | None = None
    tbl_borders: TableBorders | None = None
    shd: Shading | None = None
    tbl_layout: str | None = None
    tbl_cell_mar: TableCellMargins | None = None
    tbl_look: TableLook | None = None
    tbl_caption: str | None = None
    tbl_description: str | None = None

    model_config = {"extra": "ignore"}


class Table(BaseModel):
    """A table in the document.

    XML Element: <w:tbl>

    A table contains a grid definition, table properties, and rows.

    XML Example:
        <w:tbl>
            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="5000" w:type="pct"/>
            </w:tblPr>
            <w:tblGrid>
                <w:gridCol w:w="2880"/>
                <w:gridCol w:w="2880"/>
            </w:tblGrid>
            <w:tr>...</w:tr>
            <w:tr>...</w:tr>
        </w:tbl>

    Attributes:
        tbl_pr: Table properties
        tbl_grid: Grid column definitions
        tr: List of table rows
    """

    tbl_pr: TableProperties | None = None
    tbl_grid: TableGrid | None = None
    tr: list[TableRow] = []

    model_config = {"extra": "ignore"}
