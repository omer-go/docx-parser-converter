"""Table cell models for DOCX documents.

Table cells contain paragraphs and nested tables.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.border import TableBorders
from models.common.shading import Shading
from models.common.width import Width


class TableCellMargins(BaseModel):
    """Margins for a table cell.

    XML Element: <w:tcMar> or <w:tblCellMar>

    XML Example:
        <w:tcMar>
            <w:top w:w="72" w:type="dxa"/>
            <w:left w:w="115" w:type="dxa"/>
            <w:bottom w:w="72" w:type="dxa"/>
            <w:right w:w="115" w:type="dxa"/>
        </w:tcMar>

    Attributes:
        top: Top margin
        left: Left margin
        bottom: Bottom margin
        right: Right margin
    """

    top: Width | None = None
    left: Width | None = None
    bottom: Width | None = None
    right: Width | None = None

    model_config = {"extra": "ignore"}


class TableCellProperties(BaseModel):
    """Properties for a table cell.

    XML Element: <w:tcPr>

    Attributes:
        tc_w: Cell width
        tc_borders: Cell borders
        shd: Cell shading
        tc_mar: Cell margins (overrides table default)
        text_direction: Text direction in cell
        v_align: Vertical alignment of content
        grid_span: Number of grid columns spanned
        v_merge: Vertical merge (restart or continue)
        h_merge: Horizontal merge (deprecated, use gridSpan)
        no_wrap: Disable text wrapping
        tc_fit_text: Shrink text to fit cell
        hide_mark: Hide cell marker
    """

    tc_w: Width | None = None
    tc_borders: TableBorders | None = None
    shd: Shading | None = None
    tc_mar: TableCellMargins | None = None
    text_direction: str | None = None
    v_align: str | None = None
    grid_span: int | None = None
    v_merge: str | None = None
    h_merge: str | None = None  # Deprecated
    no_wrap: bool | None = None
    tc_fit_text: bool | None = None
    hide_mark: bool | None = None

    model_config = {"extra": "ignore"}


class TableCell(BaseModel):
    """A cell in a table row.

    XML Element: <w:tc>

    A table cell contains paragraphs and optionally nested tables.

    XML Example:
        <w:tc>
            <w:tcPr>
                <w:tcW w:w="2880" w:type="dxa"/>
            </w:tcPr>
            <w:p>
                <w:r><w:t>Cell content</w:t></w:r>
            </w:p>
        </w:tc>

    Attributes:
        tc_pr: Cell properties
        content: List of paragraphs and nested tables
    """

    tc_pr: TableCellProperties | None = None
    content: list = []  # List of Paragraph | Table, avoiding circular import

    model_config = {"extra": "ignore"}
