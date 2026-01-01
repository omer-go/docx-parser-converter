"""Table style properties models for DOCX styles.

Table style properties define conditional formatting for different parts of a table.
"""

from __future__ import annotations

from pydantic import BaseModel


class TableStyleProperties(BaseModel):
    """Conditional formatting for a part of a table.

    XML Element: <w:tblStylePr>

    XML Example:
        <w:tblStylePr w:type="firstRow">
            <w:rPr>
                <w:b/>
            </w:rPr>
            <w:tcPr>
                <w:shd w:val="clear" w:fill="4472C4"/>
            </w:tcPr>
        </w:tblStylePr>

    Attributes:
        type: Condition type (firstRow, lastRow, firstCol, etc.)
        p_pr: Paragraph properties for this condition
        r_pr: Run properties for this condition
        tbl_pr: Table properties for this condition
        tr_pr: Table row properties for this condition
        tc_pr: Table cell properties for this condition
    """

    type: str
    p_pr: dict | None = None  # ParagraphProperties
    r_pr: dict | None = None  # RunProperties
    tbl_pr: dict | None = None  # TableProperties
    tr_pr: dict | None = None  # TableRowProperties
    tc_pr: dict | None = None  # TableCellProperties

    model_config = {"extra": "ignore"}
