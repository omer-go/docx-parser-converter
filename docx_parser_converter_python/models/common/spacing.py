"""Spacing model for DOCX paragraphs.

Represents the <w:spacing> element used in paragraph properties.
"""

from pydantic import BaseModel


class Spacing(BaseModel):
    """Paragraph spacing specification.

    Controls space before/after paragraphs and line spacing.

    XML Example:
        <w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto"/>

    Note on units:
        - before/after: Stored in twips (1/20 of a point), parser should convert to points
        - line: Value depends on lineRule:
            - "auto": Stored as 240ths of a line (e.g., 276 = 1.15 lines)
            - "exact"/"atLeast": Stored in twips

    Attributes:
        before: Space before paragraph (in points after conversion)
        after: Space after paragraph (in points after conversion)
        line: Line spacing value
        line_rule: How to interpret line value ("auto", "exact", "atLeast")
        before_lines: Space before in 1/100ths of a line
        after_lines: Space after in 1/100ths of a line
        before_autospacing: Use automatic spacing before
        after_autospacing: Use automatic spacing after
    """

    before: int | None = None
    after: int | None = None
    line: int | None = None
    line_rule: str | None = None
    before_lines: int | None = None
    after_lines: int | None = None
    before_autospacing: bool | None = None
    after_autospacing: bool | None = None

    model_config = {"extra": "ignore"}
