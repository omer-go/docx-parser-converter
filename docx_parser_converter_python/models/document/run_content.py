"""Run content models for DOCX documents.

These models represent elements that can appear inside a run (<w:r>).
"""
from pydantic import BaseModel

from models.types import BreakClearType, BreakType


class Text(BaseModel):
    """Text content within a run.

    XML Element: <w:t>

    XML Examples:
        <w:t>Hello World</w:t>
        <w:t xml:space="preserve"> with spaces </w:t>

    Attributes:
        value: The text content
        space: If "preserve", whitespace is preserved
    """

    value: str = ""
    space: str | None = None

    model_config = {"extra": "ignore"}


class Break(BaseModel):
    """Break element within a run.

    XML Element: <w:br>

    XML Examples:
        <w:br/>                           (line break)
        <w:br w:type="page"/>             (page break)
        <w:br w:type="column"/>           (column break)
        <w:br w:type="textWrapping" w:clear="all"/>

    Attributes:
        type: Break type (None for line break, "page", "column", "textWrapping")
        clear: For textWrapping breaks, where to restart text
    """

    type: BreakType | None = None
    clear: BreakClearType | None = None

    model_config = {"extra": "ignore"}


class TabChar(BaseModel):
    """Tab character within a run.

    XML Element: <w:tab/>

    Note: Named TabChar to avoid conflict with TabStop model.
    """

    model_config = {"extra": "ignore"}


class CarriageReturn(BaseModel):
    """Carriage return (hard line break) within a run.

    XML Element: <w:cr/>
    """

    model_config = {"extra": "ignore"}


class SoftHyphen(BaseModel):
    """Optional hyphen (soft hyphen) within a run.

    XML Element: <w:softHyphen/>

    Displays a hyphen only if the word breaks at this point.
    """

    model_config = {"extra": "ignore"}


class NoBreakHyphen(BaseModel):
    """Non-breaking hyphen within a run.

    XML Element: <w:noBreakHyphen/>

    A hyphen that doesn't allow line breaking at that point.
    """

    model_config = {"extra": "ignore"}


class Symbol(BaseModel):
    """Symbol character within a run.

    XML Element: <w:sym>

    XML Example:
        <w:sym w:font="Wingdings" w:char="F0FC"/>

    Attributes:
        font: Font containing the symbol
        char: Character code (hex)
    """

    font: str | None = None
    char: str | None = None

    model_config = {"extra": "ignore"}


class FieldChar(BaseModel):
    """Field character marker within a run.

    XML Element: <w:fldChar>

    Used for complex fields (TOC, page numbers, etc.).

    Attributes:
        fld_char_type: "begin", "separate", or "end"
        dirty: Whether field needs recalculation
    """

    fld_char_type: str | None = None
    dirty: bool | None = None

    model_config = {"extra": "ignore"}


class InstrText(BaseModel):
    """Field instruction text within a run.

    XML Element: <w:instrText>

    Contains the field code (e.g., "PAGE", "TOC", "HYPERLINK").

    Attributes:
        value: The field instruction text
        space: Whitespace preservation
    """

    value: str = ""
    space: str | None = None

    model_config = {"extra": "ignore"}


class FootnoteReference(BaseModel):
    """Reference to a footnote.

    XML Element: <w:footnoteReference>

    Attributes:
        id: Footnote ID
    """

    id: int | None = None

    model_config = {"extra": "ignore"}


class EndnoteReference(BaseModel):
    """Reference to an endnote.

    XML Element: <w:endnoteReference>

    Attributes:
        id: Endnote ID
    """

    id: int | None = None

    model_config = {"extra": "ignore"}


# Type alias for all possible run content items
RunContentItem = (
    Text
    | Break
    | TabChar
    | CarriageReturn
    | SoftHyphen
    | NoBreakHyphen
    | Symbol
    | FieldChar
    | InstrText
    | FootnoteReference
    | EndnoteReference
)
