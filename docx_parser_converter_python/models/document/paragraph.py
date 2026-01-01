"""Paragraph models for DOCX documents.

A paragraph is a block of text with consistent paragraph-level formatting.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.border import ParagraphBorders
from models.common.indentation import Indentation
from models.common.shading import Shading
from models.common.spacing import Spacing


class TabStop(BaseModel):
    """Tab stop definition.

    XML Element: <w:tab> (within <w:tabs>)

    XML Example:
        <w:tab w:val="left" w:pos="720" w:leader="dot"/>

    Attributes:
        val: Tab stop type (left, center, right, decimal, bar, clear, num)
        pos: Position in twips (or points after conversion)
        leader: Leader character style (none, dot, hyphen, underscore, heavy, middleDot)
    """

    val: str | None = None
    pos: int | None = None
    leader: str | None = None

    model_config = {"extra": "ignore"}


class NumberingProperties(BaseModel):
    """Numbering properties for a paragraph.

    XML Element: <w:numPr>

    XML Example:
        <w:numPr>
            <w:ilvl w:val="0"/>
            <w:numId w:val="1"/>
        </w:numPr>

    Attributes:
        ilvl: Numbering level (0-8)
        num_id: Numbering instance ID (references numbering.xml)
    """

    ilvl: int | None = None
    num_id: int | None = None

    model_config = {"extra": "ignore"}


class ParagraphProperties(BaseModel):
    """Formatting properties for a paragraph.

    XML Element: <w:pPr>

    Attributes:
        p_style: Paragraph style ID reference
        keep_next: Keep with next paragraph (page break control)
        keep_lines: Keep lines together (page break control)
        page_break_before: Force page break before paragraph
        widow_control: Enable widow/orphan control
        suppress_line_numbers: Suppress line numbers
        p_bdr: Paragraph borders
        shd: Paragraph shading
        tabs: Tab stop definitions
        suppress_auto_hyphens: Suppress automatic hyphenation
        spacing: Paragraph spacing (before, after, line)
        ind: Indentation settings
        jc: Justification (left, center, right, both, etc.)
        outline_lvl: Outline level (0-9, used for TOC)
        num_pr: Numbering properties (for lists)
        bidi: Right-to-left paragraph
        r_pr: Default run properties for the paragraph
        text_direction: Text direction
        text_alignment: Vertical text alignment within line
        frame_pr: Frame properties (for text boxes, drop caps)
    """

    # Avoid circular import by using string annotation
    p_style: str | None = None
    keep_next: bool | None = None
    keep_lines: bool | None = None
    page_break_before: bool | None = None
    widow_control: bool | None = None
    suppress_line_numbers: bool | None = None
    p_bdr: ParagraphBorders | None = None
    shd: Shading | None = None
    tabs: list[TabStop] | None = None
    suppress_auto_hyphens: bool | None = None
    spacing: Spacing | None = None
    ind: Indentation | None = None
    jc: str | None = None
    outline_lvl: int | None = None
    num_pr: NumberingProperties | None = None
    bidi: bool | None = None
    # r_pr and frame_pr are imported lazily to avoid circular imports
    r_pr: dict | None = None  # Actually RunProperties, but avoiding circular import
    text_direction: str | None = None
    text_alignment: str | None = None
    frame_pr: dict | None = None  # Actually FrameProperties, but avoiding circular import

    model_config = {"extra": "ignore"}


class Paragraph(BaseModel):
    """A paragraph in the document.

    XML Element: <w:p>

    A paragraph is a block of text with consistent paragraph-level formatting.
    It contains paragraph properties (optional) and content (runs, hyperlinks,
    bookmarks, etc.).

    XML Example:
        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:t>Centered text</w:t>
            </w:r>
        </w:p>

    Attributes:
        p_pr: Paragraph properties (formatting)
        content: List of content items (Run, Hyperlink, BookmarkStart, BookmarkEnd)
    """

    p_pr: ParagraphProperties | None = None
    content: list = []  # List of ParagraphContentItem, avoiding circular import

    model_config = {"extra": "ignore"}
