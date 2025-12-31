"""Text converters for DOCX to plain text conversion."""

from converters.text.numbering_to_text import (
    NumberingToTextConverter,
    apply_level_text,
    format_number,
    get_suffix,
    to_cardinal_text,
    to_letter,
    to_ordinal,
    to_ordinal_text,
    to_roman,
)
from converters.text.paragraph_to_text import (
    ParagraphToTextConverter,
    paragraph_to_text,
)
from converters.text.run_to_text import (
    RunToTextConverter,
    break_to_text,
    run_content_to_text,
    run_to_text,
    tab_to_text,
    text_to_text,
)
from converters.text.table_to_text import (
    TableToTextConverter,
    cell_to_text,
    row_to_text,
    table_to_text,
)
from converters.text.text_converter import (
    TextConverter,
    TextConverterConfig,
    document_to_text,
)

__all__ = [
    # Main converter
    "TextConverter",
    "TextConverterConfig",
    "document_to_text",
    # Paragraph converter
    "ParagraphToTextConverter",
    "paragraph_to_text",
    # Run converter
    "RunToTextConverter",
    "run_to_text",
    "run_content_to_text",
    "text_to_text",
    "break_to_text",
    "tab_to_text",
    # Table converter
    "TableToTextConverter",
    "table_to_text",
    "cell_to_text",
    "row_to_text",
    # Numbering converter
    "NumberingToTextConverter",
    "format_number",
    "apply_level_text",
    "get_suffix",
    "to_roman",
    "to_letter",
    "to_ordinal",
    "to_ordinal_text",
    "to_cardinal_text",
]
