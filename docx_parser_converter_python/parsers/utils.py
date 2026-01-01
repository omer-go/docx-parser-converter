"""Shared parsing utilities.

This module provides common utility functions used across all parsers,
including attribute extraction, child element finding, and type conversion.
"""

from lxml.etree import _Element as Element

from core.constants import WORD_NS


def get_attribute(element: Element | None, attr_name: str) -> str | None:
    """Get attribute value from element.

    Args:
        element: XML element or None.
        attr_name: Attribute name without namespace prefix (e.g., "val", "type").

    Returns:
        Attribute value or None if element is None or attribute doesn't exist.

    Example:
        >>> # For <w:jc w:val="center"/>
        >>> get_attribute(element, "val")
        'center'
    """
    if element is None:
        return None
    return element.get(f"{WORD_NS}{attr_name}")


def get_attribute_any_ns(element: Element | None, attr_name: str) -> str | None:
    """Get attribute value from element, trying with and without namespace.

    Some attributes don't have a namespace prefix. This function tries
    the namespaced version first, then falls back to no namespace.

    Args:
        element: XML element or None.
        attr_name: Attribute name without namespace prefix.

    Returns:
        Attribute value or None if not found.
    """
    if element is None:
        return None

    # Try with namespace first
    val = element.get(f"{WORD_NS}{attr_name}")
    if val is not None:
        return val

    # Try without namespace
    return element.get(attr_name)


def get_int_attribute(element: Element | None, attr_name: str) -> int | None:
    """Get integer attribute value from element.

    Args:
        element: XML element or None.
        attr_name: Attribute name without namespace prefix.

    Returns:
        Integer value or None if element is None, attribute doesn't exist,
        or value cannot be parsed as integer.

    Example:
        >>> # For <w:spacing w:before="240"/>
        >>> get_int_attribute(element, "before")
        240
    """
    val = get_attribute(element, attr_name)
    if val is None:
        return None
    try:
        return int(val)
    except ValueError:
        return None


def get_bool_attribute(element: Element | None, attr_name: str) -> bool | None:
    """Get boolean attribute value from element.

    OOXML uses "0", "1", "true", "false", "on", "off" for boolean values.

    Args:
        element: XML element or None.
        attr_name: Attribute name without namespace prefix.

    Returns:
        Boolean value or None if element is None or attribute doesn't exist.

    Example:
        >>> # For <w:b w:val="1"/>
        >>> get_bool_attribute(element, "val")
        True
    """
    val = get_attribute(element, attr_name)
    if val is None:
        return None
    return val.lower() not in ("0", "false", "off")


def parse_toggle(element: Element | None) -> bool | None:
    """Parse boolean toggle element.

    In OOXML, toggle properties work as follows:
    - Element absent: property is not set (None)
    - Element present with no val attribute: property is True
    - Element present with val="0" or val="false": property is False
    - Element present with val="1" or val="true": property is True

    Args:
        element: The toggle element or None.

    Returns:
        True, False, or None if element is absent.

    Example:
        >>> # For <w:b/> (bold with no value)
        >>> parse_toggle(element)
        True
        >>> # For <w:b w:val="0"/>
        >>> parse_toggle(element)
        False
    """
    if element is None:
        return None

    val = element.get(f"{WORD_NS}val")
    if val is None:
        return True  # Presence without val means True

    return val.lower() not in ("0", "false", "off")


def find_child(element: Element, tag_name: str) -> Element | None:
    """Find first child element with given tag.

    Args:
        element: Parent element.
        tag_name: Tag name without namespace prefix (e.g., "pPr", "rPr").

    Returns:
        Child element or None if not found.

    Example:
        >>> # Find <w:pPr> inside <w:p>
        >>> pPr = find_child(paragraph, "pPr")
    """
    return element.find(f"{WORD_NS}{tag_name}")


def find_all_children(element: Element, tag_name: str) -> list[Element]:
    """Find all child elements with given tag.

    Args:
        element: Parent element.
        tag_name: Tag name without namespace prefix.

    Returns:
        List of child elements (empty list if none found).

    Example:
        >>> # Find all <w:tr> inside <w:tbl>
        >>> rows = find_all_children(table, "tr")
    """
    return element.findall(f"{WORD_NS}{tag_name}")


def get_text_content(element: Element | None) -> str:
    """Get text content from element, preserving whitespace.

    Args:
        element: XML element or None.

    Returns:
        Text content or empty string if element is None or has no text.

    Example:
        >>> # For <w:t>Hello World</w:t>
        >>> get_text_content(element)
        'Hello World'
    """
    if element is None:
        return ""
    return element.text or ""


def has_child(element: Element, tag_name: str) -> bool:
    """Check if element has a child with the given tag.

    Args:
        element: Parent element.
        tag_name: Tag name without namespace prefix.

    Returns:
        True if child exists, False otherwise.
    """
    return find_child(element, tag_name) is not None


def get_local_name(element: Element) -> str:
    """Get the local name of an element (tag name without namespace).

    Args:
        element: XML element.

    Returns:
        Tag name without namespace prefix, or empty string for non-element nodes.

    Example:
        >>> # For element with tag "{http://...}pPr"
        >>> get_local_name(element)
        'pPr'
    """
    tag = element.tag
    # Handle comments and processing instructions where tag is callable
    if not isinstance(tag, str):
        return ""
    if "}" in tag:
        return tag.split("}")[1]
    return tag


def iter_children(element: Element, *tag_names: str) -> list[Element]:
    """Iterate over children matching any of the given tag names.

    Args:
        element: Parent element.
        *tag_names: Tag names without namespace prefix.

    Returns:
        List of matching child elements in document order.

    Example:
        >>> # Find all <w:p> and <w:tbl> children
        >>> content = iter_children(body, "p", "tbl")
    """
    full_tags = {f"{WORD_NS}{name}" for name in tag_names}
    return [child for child in element if child.tag in full_tags]
