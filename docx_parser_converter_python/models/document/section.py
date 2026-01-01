"""Section properties models for DOCX documents.

Section properties define page layout, margins, headers/footers, and other
section-level formatting.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.border import Border


class PageSize(BaseModel):
    """Page size specification.

    XML Element: <w:pgSz>

    XML Example:
        <w:pgSz w:w="12240" w:h="15840" w:orient="portrait"/>

    Attributes:
        w: Page width in twips (12240 = 8.5 inches)
        h: Page height in twips (15840 = 11 inches)
        orient: Page orientation (portrait or landscape)
    """

    w: int | None = None
    h: int | None = None
    orient: str | None = None

    model_config = {"extra": "ignore"}


class PageMargins(BaseModel):
    """Page margin specification.

    XML Element: <w:pgMar>

    XML Example:
        <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"
                 w:header="720" w:footer="720" w:gutter="0"/>

    All values are in twips (1440 twips = 1 inch).

    Attributes:
        top: Top margin
        right: Right margin
        bottom: Bottom margin
        left: Left margin
        header: Header distance from top edge
        footer: Footer distance from bottom edge
        gutter: Gutter margin (for binding)
    """

    top: int | None = None
    right: int | None = None
    bottom: int | None = None
    left: int | None = None
    header: int | None = None
    footer: int | None = None
    gutter: int | None = None

    model_config = {"extra": "ignore"}


class Column(BaseModel):
    """A column definition within columns.

    XML Element: <w:col>

    Attributes:
        w: Column width in twips
        space: Space after this column
    """

    w: int | None = None
    space: int | None = None

    model_config = {"extra": "ignore"}


class Columns(BaseModel):
    """Column layout specification.

    XML Element: <w:cols>

    XML Example:
        <w:cols w:num="2" w:space="720" w:equalWidth="1"/>

    Attributes:
        num: Number of columns
        space: Space between columns (if equal width)
        equal_width: Whether columns are equal width
        sep: Draw separator line between columns
        col: Individual column definitions (if not equal width)
    """

    num: int | None = None
    space: int | None = None
    equal_width: bool | None = None
    sep: bool | None = None
    col: list[Column] | None = None

    model_config = {"extra": "ignore"}


class DocumentGrid(BaseModel):
    """Document grid specification.

    XML Element: <w:docGrid>

    Controls the document grid for Asian typography.

    Attributes:
        type: Grid type
        line_pitch: Line pitch in twips
        char_space: Character spacing
    """

    type: str | None = None
    line_pitch: int | None = None
    char_space: int | None = None

    model_config = {"extra": "ignore"}


class HeaderFooterReference(BaseModel):
    """Reference to a header or footer part.

    XML Element: <w:headerReference> or <w:footerReference>

    XML Example:
        <w:headerReference w:type="default" r:id="rId1"/>

    Attributes:
        type: Header/footer type (default, first, even)
        r_id: Relationship ID to header/footer part
    """

    type: str | None = None
    r_id: str | None = None

    model_config = {"extra": "ignore"}


class PageBorders(BaseModel):
    """Page border specification.

    XML Element: <w:pgBorders>

    Attributes:
        top: Top border
        left: Left border
        bottom: Bottom border
        right: Right border
        offset_from: Border offset reference (page or text)
        z_order: Z-order (front or back)
        display: Display option
    """

    top: Border | None = None
    left: Border | None = None
    bottom: Border | None = None
    right: Border | None = None
    offset_from: str | None = None
    z_order: str | None = None
    display: str | None = None

    model_config = {"extra": "ignore"}


class PageNumberType(BaseModel):
    """Page numbering specification.

    XML Element: <w:pgNumType>

    XML Example:
        <w:pgNumType w:fmt="decimal" w:start="1"/>

    Attributes:
        fmt: Number format (decimal, upperRoman, lowerRoman, etc.)
        start: Starting page number
        chapter_style: Style for chapter numbers
        chapter_sep: Separator between chapter and page number
    """

    fmt: str | None = None
    start: int | None = None
    chapter_style: str | None = None
    chapter_sep: str | None = None

    model_config = {"extra": "ignore"}


class LineNumberType(BaseModel):
    """Line numbering specification.

    XML Element: <w:lnNumType>

    Attributes:
        count_by: Count by increment
        start: Starting line number
        restart: Restart option (newPage, newSection, continuous)
        distance: Distance from text
    """

    count_by: int | None = None
    start: int | None = None
    restart: str | None = None
    distance: int | None = None

    model_config = {"extra": "ignore"}


class SectionProperties(BaseModel):
    """Section properties for the document.

    XML Element: <w:sectPr>

    Section properties define page layout, margins, headers/footers,
    columns, and other section-level formatting.

    Attributes:
        pg_sz: Page size
        pg_mar: Page margins
        cols: Column layout
        doc_grid: Document grid
        header_refs: Header references
        footer_refs: Footer references
        pg_borders: Page borders
        pg_num_type: Page numbering
        type: Section break type
        title_pg: Different first page header/footer
        ln_num_type: Line numbering
        bidi: Right-to-left section
        rtl_gutter: Right-to-left gutter
        form_prot: Form protection
        v_align: Vertical alignment of text on page
    """

    pg_sz: PageSize | None = None
    pg_mar: PageMargins | None = None
    cols: Columns | None = None
    doc_grid: DocumentGrid | None = None
    header_refs: list[HeaderFooterReference] | None = None
    footer_refs: list[HeaderFooterReference] | None = None
    pg_borders: PageBorders | None = None
    pg_num_type: PageNumberType | None = None
    type: str | None = None
    title_pg: bool | None = None
    ln_num_type: LineNumberType | None = None
    bidi: bool | None = None
    rtl_gutter: bool | None = None
    form_prot: bool | None = None
    v_align: str | None = None

    model_config = {"extra": "ignore"}
