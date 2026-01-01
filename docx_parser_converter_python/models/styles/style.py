"""Style model for DOCX documents.

Styles define reusable formatting for paragraphs, characters, tables, and numbering.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.styles.table_style import TableStyleProperties


class Style(BaseModel):
    """A style definition.

    XML Element: <w:style>

    XML Example:
        <w:style w:type="paragraph" w:styleId="Heading1">
            <w:name w:val="heading 1"/>
            <w:basedOn w:val="Normal"/>
            <w:next w:val="Normal"/>
            <w:uiPriority w:val="9"/>
            <w:qFormat/>
            <w:pPr>...</w:pPr>
            <w:rPr>...</w:rPr>
        </w:style>

    Attributes:
        type: Style type (paragraph, character, table, numbering)
        style_id: Unique style identifier
        default: Is default style for this type
        custom_style: Is custom (not built-in)
        name: Display name
        aliases: Alternative names
        based_on: Parent style ID
        next: Next paragraph style ID
        link: Linked style ID (paragraph-character link)
        auto_redefine: Auto-redefine on format change
        hidden: Hidden from UI
        ui_priority: UI sort priority
        semi_hidden: Semi-hidden (shown in some UI)
        unhide_when_used: Show when used
        q_format: Show in Quick Styles gallery
        locked: Cannot be modified
        personal: Personal style
        personal_compose: Personal compose style
        personal_reply: Personal reply style
        rsid: Revision save ID
        p_pr: Paragraph properties
        r_pr: Run properties
        tbl_pr: Table properties (for table styles)
        tr_pr: Table row properties
        tc_pr: Table cell properties
        tbl_style_pr: Table style conditional formatting
    """

    type: str
    style_id: str
    default: bool | None = None
    custom_style: bool | None = None
    name: str | None = None
    aliases: str | None = None
    based_on: str | None = None
    next: str | None = None
    link: str | None = None
    auto_redefine: bool | None = None
    hidden: bool | None = None
    ui_priority: int | None = None
    semi_hidden: bool | None = None
    unhide_when_used: bool | None = None
    q_format: bool | None = None
    locked: bool | None = None
    personal: bool | None = None
    personal_compose: bool | None = None
    personal_reply: bool | None = None
    rsid: str | None = None
    # Using dict to avoid circular imports - parsers will use actual types
    p_pr: dict | None = None  # ParagraphProperties
    r_pr: dict | None = None  # RunProperties
    tbl_pr: dict | None = None  # TableProperties
    tr_pr: dict | None = None  # TableRowProperties
    tc_pr: dict | None = None  # TableCellProperties
    tbl_style_pr: list[TableStyleProperties] | None = None

    model_config = {"extra": "ignore"}
