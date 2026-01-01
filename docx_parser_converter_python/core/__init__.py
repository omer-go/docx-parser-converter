"""Core utilities for reading and extracting DOCX files.

This module provides the foundational utilities for working with DOCX files:
- Opening and validating DOCX files from various sources
- Extracting XML parts from the archive
- Handling errors with custom exceptions
"""

from core.constants import (
    DOCUMENT_XML_PATH,
    LOGGER_NAME,
    NSMAP,
    NUMBERING_XML_PATH,
    STYLES_XML_PATH,
    WORD_NS,
)
from core.docx_reader import (
    has_part,
    is_valid_docx,
    list_docx_parts,
    open_docx,
    validate_docx,
)
from core.exceptions import (
    DocxEncryptedError,
    DocxMissingPartError,
    DocxNotFoundError,
    DocxParserError,
    DocxReadError,
    DocxValidationError,
    XmlParseError,
)
from core.xml_extractor import (
    extract_document_xml,
    extract_external_hyperlinks,
    extract_numbering_xml,
    extract_relationships,
    extract_styles_xml,
    extract_xml,
    extract_xml_safe,
    get_body_element,
    iter_paragraphs,
    iter_tables,
)

__all__ = [
    # Constants
    "WORD_NS",
    "NSMAP",
    "LOGGER_NAME",
    "DOCUMENT_XML_PATH",
    "STYLES_XML_PATH",
    "NUMBERING_XML_PATH",
    # Reader functions
    "open_docx",
    "validate_docx",
    "is_valid_docx",
    "list_docx_parts",
    "has_part",
    # Extractor functions
    "extract_xml",
    "extract_xml_safe",
    "extract_document_xml",
    "extract_styles_xml",
    "extract_numbering_xml",
    "extract_relationships",
    "extract_external_hyperlinks",
    "get_body_element",
    "iter_paragraphs",
    "iter_tables",
    # Exceptions
    "DocxParserError",
    "DocxValidationError",
    "DocxNotFoundError",
    "DocxReadError",
    "DocxEncryptedError",
    "DocxMissingPartError",
    "XmlParseError",
]
