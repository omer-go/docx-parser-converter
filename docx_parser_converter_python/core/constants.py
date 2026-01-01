"""XML namespaces and constants for DOCX parsing.

This module provides centralized constants used throughout the library,
including XML namespaces, file paths within DOCX archives, and logger names.
"""

# =============================================================================
# XML Namespaces (with curly braces for lxml element.find() / element.get())
# =============================================================================

# WordprocessingML namespace - main namespace for document content
WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Relationships namespace
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# Content Types namespace
CONTENT_TYPES_NS = "{http://schemas.openxmlformats.org/package/2006/content-types}"

# DrawingML namespace - for shapes and drawings
DRAWING_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

# WordprocessingDrawing namespace - for positioning drawings in document
WP_NS = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"

# Relationship ID namespace (used in element attributes like r:id)
R_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# VML namespace (legacy vector graphics)
VML_NS = "{urn:schemas-microsoft-com:vml}"

# Office namespace
OFFICE_NS = "{urn:schemas-microsoft-com:office:office}"

# =============================================================================
# Namespace Map (without curly braces, for XPath and etree.Element creation)
# =============================================================================

NSMAP = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "v": "urn:schemas-microsoft-com:vml",
    "o": "urn:schemas-microsoft-com:office:office",
}

# Namespace URIs (without curly braces, for reference)
WORD_NS_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL_NS_URI = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# =============================================================================
# File Paths within DOCX Archive
# =============================================================================

# Main document content
DOCUMENT_XML_PATH = "word/document.xml"

# Style definitions
STYLES_XML_PATH = "word/styles.xml"

# Numbering (lists) definitions
NUMBERING_XML_PATH = "word/numbering.xml"

# Document relationships (for hyperlinks, images, etc.)
RELS_XML_PATH = "word/_rels/document.xml.rels"

# Content types manifest
CONTENT_TYPES_PATH = "[Content_Types].xml"

# Theme definitions (colors, fonts)
THEME_XML_PATH = "word/theme/theme1.xml"

# Footnotes and endnotes
FOOTNOTES_XML_PATH = "word/footnotes.xml"
ENDNOTES_XML_PATH = "word/endnotes.xml"

# Comments
COMMENTS_XML_PATH = "word/comments.xml"

# Headers and footers (numbered, e.g., header1.xml, footer1.xml)
HEADER_XML_PATTERN = "word/header{}.xml"
FOOTER_XML_PATTERN = "word/footer{}.xml"

# =============================================================================
# Logging
# =============================================================================

# Logger name used throughout the library
LOGGER_NAME = "docx_parser_converter"

# =============================================================================
# Content Type Constants
# =============================================================================

# MIME types for validation
DOCX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
)
STYLES_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"
NUMBERING_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"
)
