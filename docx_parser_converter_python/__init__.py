"""DOCX Parser Converter - Convert DOCX files to HTML and plain text.

This library provides high-level functions for converting Microsoft Word
DOCX files to HTML and plain text formats.

Example:
    >>> from docx_parser_converter import docx_to_html, docx_to_text
    >>> html = docx_to_html("document.docx")
    >>> text = docx_to_text("document.docx")
"""
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
    # Exceptions
    "DocxParserError",
    "DocxValidationError",
    "DocxNotFoundError",
    "DocxReadError",
    "DocxEncryptedError",
    "DocxMissingPartError",
    "XmlParseError",
    # Main functions (to be implemented)
    # "docx_to_html",
    # "docx_to_text",
]
