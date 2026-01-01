"""Document models for DOCX documents.

These models represent elements from document.xml.
"""

from models.document.document import Body, Document
from models.document.frame import FrameProperties
from models.document.hyperlink import BookmarkEnd, BookmarkStart, Hyperlink
from models.document.paragraph import (
    NumberingProperties,
    Paragraph,
    ParagraphProperties,
    TabStop,
)
from models.document.run import (
    Language,
    Run,
    RunFonts,
    RunProperties,
    Underline,
)
from models.document.run_content import (
    Break,
    CarriageReturn,
    EndnoteReference,
    FieldChar,
    FootnoteReference,
    InstrText,
    NoBreakHyphen,
    RunContentItem,
    SoftHyphen,
    Symbol,
    TabChar,
    Text,
)
from models.document.section import (
    Column,
    Columns,
    DocumentGrid,
    HeaderFooterReference,
    LineNumberType,
    PageBorders,
    PageMargins,
    PageNumberType,
    PageSize,
    SectionProperties,
)
from models.document.table import (
    Table,
    TableGrid,
    TableGridColumn,
    TableLook,
    TableProperties,
)
from models.document.table_cell import (
    TableCell,
    TableCellMargins,
    TableCellProperties,
)
from models.document.table_row import (
    TableRow,
    TableRowHeight,
    TableRowProperties,
)

__all__ = [
    # Document
    "Document",
    "Body",
    # Paragraph
    "Paragraph",
    "ParagraphProperties",
    "NumberingProperties",
    "TabStop",
    # Frame
    "FrameProperties",
    # Hyperlink
    "Hyperlink",
    "BookmarkStart",
    "BookmarkEnd",
    # Run
    "Run",
    "RunProperties",
    "RunFonts",
    "Language",
    "Underline",
    # Run Content
    "Text",
    "Break",
    "TabChar",
    "CarriageReturn",
    "SoftHyphen",
    "NoBreakHyphen",
    "Symbol",
    "FieldChar",
    "InstrText",
    "FootnoteReference",
    "EndnoteReference",
    "RunContentItem",
    # Section
    "SectionProperties",
    "PageSize",
    "PageMargins",
    "Column",
    "Columns",
    "DocumentGrid",
    "HeaderFooterReference",
    "PageBorders",
    "PageNumberType",
    "LineNumberType",
    # Table
    "Table",
    "TableProperties",
    "TableGrid",
    "TableGridColumn",
    "TableLook",
    # Table Row
    "TableRow",
    "TableRowProperties",
    "TableRowHeight",
    # Table Cell
    "TableCell",
    "TableCellProperties",
    "TableCellMargins",
]
