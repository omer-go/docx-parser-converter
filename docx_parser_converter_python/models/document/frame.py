"""Frame properties model for DOCX documents.

Frame properties define text box and drop cap behavior for paragraphs.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.types import (
    DropCapType,
    FrameAnchorType,
    FrameWrapType,
)


class FrameProperties(BaseModel):
    """Frame properties for a paragraph (text box/drop cap).

    XML Element: <w:framePr>

    XML Example:
        <w:framePr w:w="2880" w:h="1440" w:hAnchor="page" w:vAnchor="text"/>

    Attributes:
        w: Frame width (in twips)
        h: Frame height (in twips)
        h_space: Horizontal spacing from surrounding text
        v_space: Vertical spacing from surrounding text
        wrap: Text wrap mode
        h_anchor: Horizontal anchor (text, margin, page)
        v_anchor: Vertical anchor (text, margin, page)
        x: Horizontal position
        y: Vertical position
        x_align: Horizontal alignment
        y_align: Vertical alignment
        anchor_lock: Whether anchor is locked
        drop_cap: Drop cap type (none, drop, margin)
        lines: Number of lines for drop cap
    """

    w: int | None = None
    h: int | None = None
    h_space: int | None = None
    v_space: int | None = None
    wrap: FrameWrapType | None = None
    h_anchor: FrameAnchorType | None = None
    v_anchor: FrameAnchorType | None = None
    x: int | None = None
    y: int | None = None
    x_align: str | None = None
    y_align: str | None = None
    anchor_lock: bool | None = None
    drop_cap: DropCapType | None = None
    lines: int | None = None

    model_config = {"extra": "ignore"}
