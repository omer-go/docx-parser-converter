"""Hyperlink and bookmark models for DOCX documents.

These models represent hyperlinks and bookmarks within paragraphs.
"""

from __future__ import annotations

from pydantic import BaseModel


class Hyperlink(BaseModel):
    """Hyperlink within a paragraph.

    XML Element: <w:hyperlink>

    XML Example:
        <w:hyperlink r:id="rId1" w:tooltip="Click here">
            <w:r>
                <w:t>Link text</w:t>
            </w:r>
        </w:hyperlink>

    Attributes:
        r_id: Relationship ID (references external URL in relationships)
        anchor: Bookmark name (for internal links)
        tooltip: Tooltip text
        content: List of runs within the hyperlink
    """

    r_id: str | None = None
    anchor: str | None = None
    tooltip: str | None = None
    content: list = []  # List of Run, avoiding circular import

    model_config = {"extra": "ignore"}


class BookmarkStart(BaseModel):
    """Start of a bookmark range.

    XML Element: <w:bookmarkStart>

    XML Example:
        <w:bookmarkStart w:id="0" w:name="MyBookmark"/>

    Attributes:
        id: Unique bookmark ID
        name: Bookmark name
    """

    id: str | None = None
    name: str | None = None

    model_config = {"extra": "ignore"}


class BookmarkEnd(BaseModel):
    """End of a bookmark range.

    XML Element: <w:bookmarkEnd>

    XML Example:
        <w:bookmarkEnd w:id="0"/>

    Attributes:
        id: Bookmark ID (matches bookmarkStart)
    """

    id: str | None = None

    model_config = {"extra": "ignore"}
