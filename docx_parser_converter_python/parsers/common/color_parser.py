"""Parser for color elements."""

from lxml.etree import _Element as Element

from models.common.color import Color
from parsers.utils import get_attribute


def parse_color(element: Element | None) -> Color | None:
    """Parse <w:color> element.

    XML Example:
        <w:color w:val="FF0000" w:themeColor="accent1" w:themeTint="80"/>

    Args:
        element: The <w:color> element or None

    Returns:
        Color model or None if element is None
    """
    if element is None:
        return None

    return Color(
        val=get_attribute(element, "val"),
        theme_color=get_attribute(element, "themeColor"),
        theme_tint=get_attribute(element, "themeTint"),
        theme_shade=get_attribute(element, "themeShade"),
    )
