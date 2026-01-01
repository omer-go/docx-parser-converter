"""Document parsers - parse document.xml elements."""

from parsers.document.body_parser import parse_body
from parsers.document.document_parser import parse_document
from parsers.document.hyperlink_parser import (
    parse_bookmark_end,
    parse_bookmark_start,
    parse_hyperlink,
)
from parsers.document.paragraph_parser import parse_paragraph
from parsers.document.paragraph_properties_parser import (
    parse_numbering_properties,
    parse_paragraph_properties,
    parse_tab_stop,
)
from parsers.document.run_content_parser import (
    parse_break,
    parse_carriage_return,
    parse_endnote_reference,
    parse_field_char,
    parse_footnote_reference,
    parse_instr_text,
    parse_no_break_hyphen,
    parse_run_content_item,
    parse_soft_hyphen,
    parse_symbol,
    parse_tab_char,
    parse_text,
)
from parsers.document.run_parser import parse_run
from parsers.document.run_properties_parser import (
    parse_language,
    parse_run_fonts,
    parse_run_properties,
    parse_underline,
)
from parsers.document.section_parser import (
    parse_columns,
    parse_document_grid,
    parse_header_footer_reference,
    parse_line_number_type,
    parse_page_borders,
    parse_page_margins,
    parse_page_number_type,
    parse_page_size,
    parse_section_properties,
)
from parsers.document.table_cell_parser import parse_table_cell
from parsers.document.table_cell_properties_parser import (
    parse_table_cell_margins,
    parse_table_cell_properties,
)
from parsers.document.table_grid_parser import parse_table_grid, parse_table_grid_column
from parsers.document.table_parser import parse_table
from parsers.document.table_properties_parser import (
    parse_table_look,
    parse_table_properties,
)
from parsers.document.table_row_parser import parse_table_row
from parsers.document.table_row_properties_parser import (
    parse_table_row_height,
    parse_table_row_properties,
)

__all__ = [
    # Document & Body
    "parse_document",
    "parse_body",
    # Paragraph
    "parse_paragraph",
    "parse_paragraph_properties",
    "parse_numbering_properties",
    "parse_tab_stop",
    # Hyperlinks & Bookmarks
    "parse_hyperlink",
    "parse_bookmark_start",
    "parse_bookmark_end",
    # Run
    "parse_run",
    "parse_run_properties",
    "parse_run_fonts",
    "parse_language",
    "parse_underline",
    # Run Content
    "parse_text",
    "parse_break",
    "parse_tab_char",
    "parse_carriage_return",
    "parse_soft_hyphen",
    "parse_no_break_hyphen",
    "parse_symbol",
    "parse_field_char",
    "parse_instr_text",
    "parse_footnote_reference",
    "parse_endnote_reference",
    "parse_run_content_item",
    # Table
    "parse_table",
    "parse_table_properties",
    "parse_table_look",
    "parse_table_grid",
    "parse_table_grid_column",
    # Table Row
    "parse_table_row",
    "parse_table_row_properties",
    "parse_table_row_height",
    # Table Cell
    "parse_table_cell",
    "parse_table_cell_properties",
    "parse_table_cell_margins",
    # Section
    "parse_section_properties",
    "parse_page_size",
    "parse_page_margins",
    "parse_columns",
    "parse_document_grid",
    "parse_header_footer_reference",
    "parse_page_borders",
    "parse_page_number_type",
    "parse_line_number_type",
]
