"""Width model for DOCX tables and cells.

Represents width elements like <w:tblW>, <w:tcW>, <w:tblInd>.
"""

from pydantic import BaseModel


class Width(BaseModel):
    """Width specification for tables and cells.

    XML Examples:
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tcW w:w="2880" w:type="dxa"/>
        <w:tblInd w:w="720" w:type="dxa"/>

    Note on types:
        - "dxa": Width in twips (1/20 of a point)
        - "pct": Width as percentage (in 1/50ths of a percent, so 5000 = 100%)
        - "auto": Automatic width
        - "nil": No width (zero)

    Attributes:
        w: Width value (interpretation depends on type)
        type: How to interpret the width value ("dxa", "pct", "auto", "nil")
    """

    w: int | None = None
    type: str | None = None

    model_config = {"extra": "ignore"}
