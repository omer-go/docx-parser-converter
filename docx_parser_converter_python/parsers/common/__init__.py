"""Common parsers for shared elements."""

from parsers.common.border_parser import (
    parse_border,
    parse_paragraph_borders,
    parse_table_borders,
)
from parsers.common.color_parser import parse_color
from parsers.common.indentation_parser import parse_indentation
from parsers.common.shading_parser import parse_shading
from parsers.common.spacing_parser import parse_spacing
from parsers.common.width_parser import parse_width

__all__ = [
    "parse_border",
    "parse_color",
    "parse_indentation",
    "parse_paragraph_borders",
    "parse_shading",
    "parse_spacing",
    "parse_table_borders",
    "parse_width",
]
