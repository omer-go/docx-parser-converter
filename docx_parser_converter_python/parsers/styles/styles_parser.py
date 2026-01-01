"""Parser for styles root element."""

from lxml.etree import _Element as Element

from models.styles.styles import Styles
from parsers.styles.document_defaults_parser import parse_document_defaults
from parsers.styles.latent_styles_parser import parse_latent_styles
from parsers.styles.style_parser import parse_style
from parsers.utils import find_all_children, find_child


def parse_styles(element: Element | None) -> Styles | None:
    """Parse <w:styles> root element.

    XML Example:
        <w:styles xmlns:w="...">
            <w:docDefaults>...</w:docDefaults>
            <w:latentStyles>...</w:latentStyles>
            <w:style w:type="paragraph" w:styleId="Normal">...</w:style>
            <w:style w:type="paragraph" w:styleId="Heading1">...</w:style>
        </w:styles>

    Args:
        element: The <w:styles> element or None

    Returns:
        Styles model or None if element is None
    """
    if element is None:
        return None

    # Parse document defaults
    doc_defaults = parse_document_defaults(find_child(element, "docDefaults"))

    # Parse latent styles
    latent_styles = parse_latent_styles(find_child(element, "latentStyles"))

    # Parse style definitions
    styles = []
    for style_elem in find_all_children(element, "style"):
        style = parse_style(style_elem)
        if style is not None:
            styles.append(style)

    return Styles(
        doc_defaults=doc_defaults,
        latent_styles=latent_styles,
        style=styles,
    )
