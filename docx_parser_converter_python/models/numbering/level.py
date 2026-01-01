"""Level model for DOCX numbering.

A level defines formatting and behavior for a single level within a numbering.
"""

from __future__ import annotations

from pydantic import BaseModel


class Level(BaseModel):
    """A level definition within an abstract numbering.

    XML Element: <w:lvl>

    XML Example:
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
        </w:lvl>

    Attributes:
        ilvl: Level index (0-8, required)
        tplc: Template code
        tentative: Tentative level (not yet used)
        start: Starting number
        num_fmt: Number format (decimal, bullet, upperRoman, etc.)
        lvl_restart: Restart counter after this level
        p_style: Associated paragraph style
        is_lgl: Use legal numbering style
        suff: Suffix type (tab, space, nothing)
        lvl_text: Level text template (e.g., "%1.", "%1.%2")
        lvl_pic_bullet_id: Picture bullet ID
        lvl_jc: Justification (left, center, right)
        p_pr: Paragraph properties (indentation, tabs)
        r_pr: Run properties (font for bullet/number)
    """

    ilvl: int
    tplc: str | None = None
    tentative: bool | None = None
    start: int | None = None
    num_fmt: str | None = None
    lvl_restart: int | None = None
    p_style: str | None = None
    is_lgl: bool | None = None
    suff: str | None = None
    lvl_text: str | None = None
    lvl_pic_bullet_id: int | None = None
    lvl_jc: str | None = None
    # Using dict to avoid circular imports
    p_pr: dict | None = None  # ParagraphProperties
    r_pr: dict | None = None  # RunProperties

    model_config = {"extra": "ignore"}
