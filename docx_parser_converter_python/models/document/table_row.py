"""Table row models for DOCX documents.

Table rows contain table cells.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.width import Width
from models.document.table_cell import TableCell


class TableRowHeight(BaseModel):
    """Height specification for a table row.

    XML Element: <w:trHeight>

    XML Example:
        <w:trHeight w:val="720" w:hRule="exact"/>

    Attributes:
        val: Height value in twips
        h_rule: Height rule (auto, exact, atLeast)
    """

    val: int | None = None
    h_rule: str | None = None

    model_config = {"extra": "ignore"}


class TableRowProperties(BaseModel):
    """Properties for a table row.

    XML Element: <w:trPr>

    Attributes:
        tr_height: Row height specification
        tbl_header: Row is a header row (repeats on each page)
        jc: Row justification
        cant_split: Row cannot be split across pages
        tbl_cell_spacing: Cell spacing for this row
    """

    tr_height: TableRowHeight | None = None
    tbl_header: bool | None = None
    jc: str | None = None
    cant_split: bool | None = None
    tbl_cell_spacing: Width | None = None

    model_config = {"extra": "ignore"}


class TableRow(BaseModel):
    """A row in a table.

    XML Element: <w:tr>

    A table row contains one or more table cells.

    XML Example:
        <w:tr>
            <w:trPr>
                <w:tblHeader/>
            </w:trPr>
            <w:tc>...</w:tc>
            <w:tc>...</w:tc>
        </w:tr>

    Attributes:
        tr_pr: Row properties
        tc: List of table cells
    """

    tr_pr: TableRowProperties | None = None
    tc: list[TableCell] = []

    model_config = {"extra": "ignore"}
