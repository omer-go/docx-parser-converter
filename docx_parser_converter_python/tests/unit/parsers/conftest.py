"""Shared fixtures and utilities for parser tests.

This module provides:
- XML element creation helper
- Common test fixtures
- OOXML namespace constants
"""

import pytest
from lxml import etree

# Namespace for WordprocessingML
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NSMAP = {"w": W_NS, "r": R_NS}


def make_element(xml_string: str) -> etree._Element:
    """Parse XML string into an lxml element.

    The XML string should use 'w:' prefix for WordprocessingML elements.

    Args:
        xml_string: XML string with w: namespace prefix.

    Returns:
        Parsed lxml Element.

    Example:
        >>> elem = make_element('<w:color w:val="FF0000"/>')
        >>> elem.get('{http://...}val')
        'FF0000'
    """
    # Wrap with namespace declarations
    wrapped = f"""<root xmlns:w="{W_NS}" xmlns:r="{R_NS}">{xml_string}</root>"""
    root = etree.fromstring(wrapped.encode())
    # Return the first child (the actual element we care about)
    return root[0]


def make_element_standalone(xml_string: str) -> etree._Element:
    """Parse a standalone XML string (entire document).

    Use this when the xml_string includes the root element.

    Args:
        xml_string: Complete XML string with namespace declarations.

    Returns:
        Parsed lxml Element.
    """
    return etree.fromstring(xml_string.encode())


@pytest.fixture
def xml_maker():
    """Fixture that provides the make_element function."""
    return make_element
