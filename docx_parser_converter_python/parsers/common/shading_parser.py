"""Parser for shading elements."""

from lxml.etree import _Element as Element

from models.common.shading import Shading
from parsers.utils import get_attribute


def parse_shading(element: Element | None) -> Shading | None:
    """Parse <w:shd> element.

    XML Example:
        <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"
               w:themeFill="accent1" w:themeFillTint="80"/>

    Args:
        element: The <w:shd> element or None

    Returns:
        Shading model or None if element is None
    """
    if element is None:
        return None

    return Shading(
        val=get_attribute(element, "val"),
        color=get_attribute(element, "color"),
        fill=get_attribute(element, "fill"),
        theme_color=get_attribute(element, "themeColor"),
        theme_fill=get_attribute(element, "themeFill"),
        theme_tint=get_attribute(element, "themeTint"),
        theme_shade=get_attribute(element, "themeShade"),
        theme_fill_tint=get_attribute(element, "themeFillTint"),
        theme_fill_shade=get_attribute(element, "themeFillShade"),
    )
