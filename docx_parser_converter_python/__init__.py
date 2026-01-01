"""DOCX Parser Converter - Convert DOCX files to HTML and plain text.

This library provides high-level functions for converting Microsoft Word
DOCX files to HTML and plain text formats.

Example:
    >>> from docx_parser_converter_python import docx_to_html, docx_to_text
    >>> html = docx_to_html("document.docx")
    >>> text = docx_to_text("document.docx")

    >>> from docx_parser_converter_python import ConversionConfig
    >>> config = ConversionConfig(title="My Document", text_formatting="markdown")
    >>> html = docx_to_html("document.docx", config=config)
    >>> text = docx_to_text("document.docx", config=config)
"""

from api import ConversionConfig, docx_to_html, docx_to_text
from core import (
    DocxEncryptedError,
    DocxMissingPartError,
    DocxNotFoundError,
    DocxParserError,
    DocxReadError,
    DocxValidationError,
    XmlParseError,
)

__version__ = "0.1.0"

__all__ = [
    # Version
    "__version__",
    # Main API
    "docx_to_html",
    "docx_to_text",
    "ConversionConfig",
    # Exceptions
    "DocxParserError",
    "DocxValidationError",
    "DocxNotFoundError",
    "DocxReadError",
    "DocxEncryptedError",
    "DocxMissingPartError",
    "XmlParseError",
]
