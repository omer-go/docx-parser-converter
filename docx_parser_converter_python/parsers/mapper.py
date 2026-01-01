"""Centralized mapper for routing XML tags to parsers.

This module provides a ParserMapper class that routes XML elements to their
appropriate parser functions. This is especially useful for parsing mixed
content where multiple element types can appear (e.g., run children, body children).

Usage:
    from parsers.mapper import create_run_content_mapper

    mapper = create_run_content_mapper()
    for child in run_element:
        parsed = mapper.parse(child)
        if parsed is not None:
            content.append(parsed)
"""

from collections.abc import Callable
from typing import Any, TypeVar

from lxml.etree import _Element as Element

from core.constants import WORD_NS

# Type alias for parser functions
T = TypeVar("T")
ParserFunc = Callable[[Element], T | None]


class ParserMapper:
    """Maps XML tag names to their parser functions.

    Use for mixed content parsing where multiple element types
    can appear (e.g., run children, body children).

    Attributes:
        _parsers: Internal dictionary mapping full tag names to parser functions.
    """

    def __init__(self) -> None:
        """Initialize an empty parser mapper."""
        self._parsers: dict[str, ParserFunc[Any]] = {}

    def register(self, tag_name: str, parser: ParserFunc[Any]) -> None:
        """Register a parser for a tag name.

        Args:
            tag_name: Tag name without namespace prefix (e.g., "t", "br", "tab").
            parser: Parser function that takes Element and returns model or None.
        """
        full_tag = f"{WORD_NS}{tag_name}"
        self._parsers[full_tag] = parser

    def register_with_namespace(
        self, namespace: str, tag_name: str, parser: ParserFunc[Any]
    ) -> None:
        """Register a parser with a custom namespace.

        Args:
            namespace: Full namespace with curly braces (e.g., "{http://...}").
            tag_name: Tag name without namespace prefix.
            parser: Parser function that takes Element and returns model or None.
        """
        full_tag = f"{namespace}{tag_name}"
        self._parsers[full_tag] = parser

    def get_parser(self, element: Element) -> ParserFunc[Any] | None:
        """Get parser for an element.

        Args:
            element: XML element to find parser for.

        Returns:
            Parser function or None if not registered.
        """
        return self._parsers.get(element.tag)

    def parse(self, element: Element) -> Any:
        """Parse element using registered parser.

        Args:
            element: XML element to parse.

        Returns:
            Parsed model or None if no parser registered.
        """
        parser = self.get_parser(element)
        if parser is None:
            return None
        return parser(element)

    def is_registered(self, tag_name: str) -> bool:
        """Check if a tag has a registered parser.

        Args:
            tag_name: Tag name without namespace prefix.

        Returns:
            True if the tag has a registered parser.
        """
        full_tag = f"{WORD_NS}{tag_name}"
        return full_tag in self._parsers

    @property
    def registered_tags(self) -> list[str]:
        """Get list of registered tag names (without namespace).

        Returns:
            List of tag names that have registered parsers.
        """
        prefix_len = len(WORD_NS)
        return [
            tag[prefix_len:] if tag.startswith(WORD_NS) else tag for tag in self._parsers.keys()
        ]

    def __len__(self) -> int:
        """Return the number of registered parsers."""
        return len(self._parsers)

    def __contains__(self, tag_name: str) -> bool:
        """Check if a tag is registered (supports 'in' operator)."""
        return self.is_registered(tag_name)


# =============================================================================
# Pre-configured Mapper Factory Functions
# =============================================================================
# These functions create mappers with parsers pre-registered for common use cases.
# They use lazy imports to avoid circular dependencies.


def create_run_content_mapper() -> ParserMapper:
    """Create mapper for run content elements (<w:r> children).

    Maps elements that can appear inside a run:
    - w:t (text)
    - w:br (break)
    - w:tab (tab character)
    - w:cr (carriage return)
    - w:softHyphen
    - w:noBreakHyphen
    - w:sym (symbol)
    - w:fldChar (field character)
    - w:instrText (field instruction)
    - w:footnoteReference
    - w:endnoteReference

    Returns:
        ParserMapper configured for run content elements.
    """
    from parsers.document.run_content_parser import (
        parse_break,
        parse_carriage_return,
        parse_endnote_reference,
        parse_field_char,
        parse_footnote_reference,
        parse_instr_text,
        parse_no_break_hyphen,
        parse_soft_hyphen,
        parse_symbol,
        parse_tab_char,
        parse_text,
    )

    mapper = ParserMapper()
    mapper.register("t", parse_text)
    mapper.register("br", parse_break)
    mapper.register("tab", parse_tab_char)
    mapper.register("cr", parse_carriage_return)
    mapper.register("softHyphen", parse_soft_hyphen)
    mapper.register("noBreakHyphen", parse_no_break_hyphen)
    mapper.register("sym", parse_symbol)
    mapper.register("fldChar", parse_field_char)
    mapper.register("instrText", parse_instr_text)
    mapper.register("footnoteReference", parse_footnote_reference)
    mapper.register("endnoteReference", parse_endnote_reference)
    return mapper


def create_body_content_mapper() -> ParserMapper:
    """Create mapper for body content elements (<w:body> children).

    Maps elements that can appear in the document body:
    - w:p (paragraph)
    - w:tbl (table)
    - w:sectPr (section properties)

    Returns:
        ParserMapper configured for body content elements.
    """
    from parsers.document.paragraph_parser import parse_paragraph
    from parsers.document.section_parser import parse_section_properties
    from parsers.document.table_parser import parse_table

    mapper = ParserMapper()
    mapper.register("p", parse_paragraph)
    mapper.register("tbl", parse_table)
    mapper.register("sectPr", parse_section_properties)
    return mapper


def create_paragraph_content_mapper() -> ParserMapper:
    """Create mapper for paragraph content elements (<w:p> children).

    Maps elements that can appear inside a paragraph:
    - w:r (run)
    - w:hyperlink
    - w:bookmarkStart
    - w:bookmarkEnd

    Returns:
        ParserMapper configured for paragraph content elements.
    """
    from parsers.document.hyperlink_parser import (
        parse_bookmark_end,
        parse_bookmark_start,
        parse_hyperlink,
    )
    from parsers.document.run_parser import parse_run

    mapper = ParserMapper()
    mapper.register("r", parse_run)
    mapper.register("hyperlink", parse_hyperlink)
    mapper.register("bookmarkStart", parse_bookmark_start)
    mapper.register("bookmarkEnd", parse_bookmark_end)
    return mapper


def create_table_cell_content_mapper() -> ParserMapper:
    """Create mapper for table cell content elements (<w:tc> children).

    Maps elements that can appear inside a table cell:
    - w:p (paragraph)
    - w:tbl (nested table)

    Returns:
        ParserMapper configured for table cell content elements.
    """
    from parsers.document.paragraph_parser import parse_paragraph
    from parsers.document.table_parser import parse_table

    mapper = ParserMapper()
    mapper.register("p", parse_paragraph)
    mapper.register("tbl", parse_table)
    return mapper
