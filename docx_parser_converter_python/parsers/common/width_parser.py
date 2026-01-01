"""Parser for width elements."""

from lxml.etree import _Element as Element

from models.common.width import Width
from parsers.utils import get_attribute, get_int_attribute


def parse_width(element: Element | None) -> Width | None:
    """Parse width elements like <w:tcW>, <w:tblW>, <w:tblInd>.

    XML Example:
        <w:tcW w:w="2880" w:type="dxa"/>
        <w:tblW w:w="5000" w:type="pct"/>

    Args:
        element: The width element or None

    Returns:
        Width model or None if element is None
    """
    if element is None:
        return None

    return Width(
        w=get_int_attribute(element, "w"),
        type=get_attribute(element, "type"),
    )
