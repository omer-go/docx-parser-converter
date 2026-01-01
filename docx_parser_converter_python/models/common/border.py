"""Border models for DOCX elements.

Represents border elements used in paragraphs, tables, and cells.
"""

from pydantic import BaseModel


class Border(BaseModel):
    """Single border specification.

    Represents a single border edge (top, bottom, left, right, etc.).

    XML Example:
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>

    Attributes:
        val: Border style (e.g., "single", "double", "dashed")
        sz: Border width in eighths of a point (e.g., 4 = 0.5pt)
        space: Spacing in points between border and content
        color: RGB color value (e.g., "000000" for black, "auto")
        theme_color: Theme color identifier (e.g., "accent1", "dark1")
        theme_tint: Tint applied to theme color
        theme_shade: Shade applied to theme color
        frame: Whether border has 3D frame effect
        shadow: Whether border has shadow effect
    """

    val: str | None = None
    sz: int | None = None
    space: int | None = None
    color: str | None = None
    theme_color: str | None = None
    theme_tint: str | None = None
    theme_shade: str | None = None
    frame: bool | None = None
    shadow: bool | None = None

    model_config = {"extra": "ignore"}


class ParagraphBorders(BaseModel):
    """Borders for a paragraph.

    XML Element: <w:pBdr>

    Attributes:
        top: Top border
        left: Left border
        bottom: Bottom border
        right: Right border
        between: Border between paragraphs with same properties
        bar: Vertical bar border (drawn to side of paragraph)
    """

    top: Border | None = None
    left: Border | None = None
    bottom: Border | None = None
    right: Border | None = None
    between: Border | None = None
    bar: Border | None = None

    model_config = {"extra": "ignore"}


class TableBorders(BaseModel):
    """Borders for a table or table cell.

    XML Elements: <w:tblBorders>, <w:tcBorders>

    Attributes:
        top: Top border
        left: Left border (or 'start' in RTL)
        bottom: Bottom border
        right: Right border (or 'end' in RTL)
        inside_h: Inside horizontal borders (between rows)
        inside_v: Inside vertical borders (between columns)
        tl2br: Top-left to bottom-right diagonal
        tr2bl: Top-right to bottom-left diagonal
    """

    top: Border | None = None
    left: Border | None = None
    bottom: Border | None = None
    right: Border | None = None
    inside_h: Border | None = None
    inside_v: Border | None = None
    tl2br: Border | None = None
    tr2bl: Border | None = None

    model_config = {"extra": "ignore"}
