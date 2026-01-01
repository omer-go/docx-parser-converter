"""Common models shared across document, styles, and numbering.

These models represent XML elements that appear in multiple contexts.
"""

from models.common.border import Border, ParagraphBorders, TableBorders
from models.common.color import Color
from models.common.indentation import Indentation
from models.common.shading import Shading
from models.common.spacing import Spacing
from models.common.width import Width

__all__ = [
    # Border
    "Border",
    "ParagraphBorders",
    "TableBorders",
    # Color
    "Color",
    # Indentation
    "Indentation",
    # Shading
    "Shading",
    # Spacing
    "Spacing",
    # Width
    "Width",
]
