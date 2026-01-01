"""Styles parsers - parse styles.xml elements."""

from parsers.styles.document_defaults_parser import (
    parse_document_defaults,
    parse_paragraph_properties_default,
    parse_run_properties_default,
)
from parsers.styles.latent_styles_parser import (
    parse_latent_style_exception,
    parse_latent_styles,
)
from parsers.styles.style_parser import parse_style, parse_table_style_properties
from parsers.styles.styles_parser import parse_styles

__all__ = [
    "parse_styles",
    "parse_style",
    "parse_table_style_properties",
    "parse_document_defaults",
    "parse_run_properties_default",
    "parse_paragraph_properties_default",
    "parse_latent_styles",
    "parse_latent_style_exception",
]
