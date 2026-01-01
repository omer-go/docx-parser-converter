"""Numbering root model for DOCX documents.

The Numbering model is the root container for all numbering definitions.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.numbering.abstract_numbering import AbstractNumbering
from models.numbering.numbering_instance import NumberingInstance


class Numbering(BaseModel):
    """Root container for all numbering definitions.

    XML Element: <w:numbering>

    XML Example:
        <w:numbering xmlns:w="...">
            <w:abstractNum w:abstractNumId="0">...</w:abstractNum>
            <w:abstractNum w:abstractNumId="1">...</w:abstractNum>
            <w:num w:numId="1">...</w:num>
            <w:num w:numId="2">...</w:num>
        </w:numbering>

    Attributes:
        abstract_num: Abstract numbering definitions
        num: Numbering instances
    """

    abstract_num: list[AbstractNumbering] = []
    num: list[NumberingInstance] = []

    model_config = {"extra": "ignore"}
