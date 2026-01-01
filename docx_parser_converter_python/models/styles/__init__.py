"""Style models for DOCX documents.

These models represent elements from styles.xml.
"""

from models.styles.document_defaults import (
    DocumentDefaults,
    ParagraphPropertiesDefault,
    RunPropertiesDefault,
)
from models.styles.latent_styles import (
    LatentStyleException,
    LatentStyles,
)
from models.styles.style import Style
from models.styles.styles import Styles
from models.styles.table_style import TableStyleProperties

__all__ = [
    # Root
    "Styles",
    # Style
    "Style",
    # Document Defaults
    "DocumentDefaults",
    "RunPropertiesDefault",
    "ParagraphPropertiesDefault",
    # Latent Styles
    "LatentStyles",
    "LatentStyleException",
    # Table Style
    "TableStyleProperties",
]
