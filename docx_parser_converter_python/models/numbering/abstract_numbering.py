"""Abstract numbering model for DOCX documents.

Abstract numbering defines the template for a numbering scheme.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.numbering.level import Level


class AbstractNumbering(BaseModel):
    """Abstract numbering definition.

    XML Element: <w:abstractNum>

    An abstract numbering defines the format and behavior of each level (0-8).
    Multiple numbering instances can reference the same abstract numbering.

    XML Example:
        <w:abstractNum w:abstractNumId="0">
            <w:multiLevelType w:val="multilevel"/>
            <w:lvl w:ilvl="0">...</w:lvl>
            <w:lvl w:ilvl="1">...</w:lvl>
        </w:abstractNum>

    Attributes:
        abstract_num_id: Unique identifier (required)
        nsid: Number scheme ID (random hex)
        multi_level_type: Type of multilevel list
        tmpl: Template ID
        name: Name
        style_link: Link to numbering style
        num_style_link: Link from style
        lvl: Level definitions (0-8)
    """

    abstract_num_id: int
    nsid: str | None = None
    multi_level_type: str | None = None
    tmpl: str | None = None
    name: str | None = None
    style_link: str | None = None
    num_style_link: str | None = None
    lvl: list[Level] = []

    model_config = {"extra": "ignore"}
