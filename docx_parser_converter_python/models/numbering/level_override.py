"""Level override model for DOCX numbering.

Level overrides allow a numbering instance to modify specific levels.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.numbering.level import Level


class LevelOverride(BaseModel):
    """Override for a specific level within a numbering instance.

    XML Element: <w:lvlOverride>

    XML Example:
        <w:lvlOverride w:ilvl="0">
            <w:startOverride w:val="5"/>
        </w:lvlOverride>

    Attributes:
        ilvl: Level to override (0-8, required)
        start_override: Override the start number
        lvl: Complete level replacement
    """

    ilvl: int
    start_override: int | None = None
    lvl: Level | None = None

    model_config = {"extra": "ignore"}
