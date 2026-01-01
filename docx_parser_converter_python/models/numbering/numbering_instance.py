"""Numbering instance model for DOCX documents.

A numbering instance links a numId to an abstract numbering definition.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.numbering.level_override import LevelOverride


class NumberingInstance(BaseModel):
    """A numbering instance.

    XML Element: <w:num>

    Links a numId (referenced by paragraphs) to an abstract numbering,
    optionally with level overrides.

    XML Example:
        <w:num w:numId="1">
            <w:abstractNumId w:val="0"/>
            <w:lvlOverride w:ilvl="0">
                <w:startOverride w:val="5"/>
            </w:lvlOverride>
        </w:num>

    Attributes:
        num_id: Instance ID (required, referenced by paragraphs)
        abstract_num_id: Reference to abstract numbering
        lvl_override: Level overrides
    """

    num_id: int
    abstract_num_id: int | None = None
    lvl_override: list[LevelOverride] | None = None

    model_config = {"extra": "ignore"}
