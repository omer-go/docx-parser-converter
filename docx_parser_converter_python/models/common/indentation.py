"""Indentation model for DOCX paragraphs.

Represents the <w:ind> element used in paragraph properties.
"""

from pydantic import BaseModel


class Indentation(BaseModel):
    """Paragraph indentation specification.

    Controls left, right, and first line indentation.

    XML Example:
        <w:ind w:left="720" w:right="0" w:hanging="360"/>
        <w:ind w:start="720" w:firstLine="720"/>

    Note on units:
        - All values are stored in twips (1/20 of a point)
        - Parser should convert to points for consistency

    Note on start/end vs left/right:
        - start/end are locale-aware (swap in RTL languages)
        - left/right are absolute
        - If both are specified, start/end take precedence

    Attributes:
        left: Left indentation in twips (or points after conversion)
        right: Right indentation in twips (or points after conversion)
        start: Start indentation (left in LTR, right in RTL)
        end: End indentation (right in LTR, left in RTL)
        first_line: First line additional indent (positive value)
        hanging: First line hanging indent (negative indent, as positive value)
        start_chars: Start indent in character units (1/100th of char width)
        end_chars: End indent in character units
        first_line_chars: First line indent in character units
        hanging_chars: Hanging indent in character units
    """

    left: int | None = None
    right: int | None = None
    start: int | None = None
    end: int | None = None
    first_line: int | None = None
    hanging: int | None = None
    start_chars: int | None = None
    end_chars: int | None = None
    first_line_chars: int | None = None
    hanging_chars: int | None = None

    model_config = {"extra": "ignore"}
