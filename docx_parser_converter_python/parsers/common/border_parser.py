"""Parser for border elements."""

from lxml.etree import _Element as Element

from models.common.border import Border, ParagraphBorders, TableBorders
from parsers.utils import find_child, get_attribute, get_bool_attribute, get_int_attribute


def parse_border(element: Element | None) -> Border | None:
    """Parse a single border element.

    XML Example:
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>

    Args:
        element: A border element (top, left, bottom, right, etc.) or None

    Returns:
        Border model or None if element is None
    """
    if element is None:
        return None

    return Border(
        val=get_attribute(element, "val"),
        sz=get_int_attribute(element, "sz"),
        space=get_int_attribute(element, "space"),
        color=get_attribute(element, "color"),
        theme_color=get_attribute(element, "themeColor"),
        theme_tint=get_attribute(element, "themeTint"),
        theme_shade=get_attribute(element, "themeShade"),
        frame=get_bool_attribute(element, "frame"),
        shadow=get_bool_attribute(element, "shadow"),
    )


def parse_paragraph_borders(element: Element | None) -> ParagraphBorders | None:
    """Parse <w:pBdr> element.

    XML Example:
        <w:pBdr>
            <w:top w:val="single" w:sz="4" w:space="1" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="4" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="4" w:color="000000"/>
        </w:pBdr>

    Args:
        element: The <w:pBdr> element or None

    Returns:
        ParagraphBorders model or None if element is None
    """
    if element is None:
        return None

    return ParagraphBorders(
        top=parse_border(find_child(element, "top")),
        left=parse_border(find_child(element, "left")),
        bottom=parse_border(find_child(element, "bottom")),
        right=parse_border(find_child(element, "right")),
        between=parse_border(find_child(element, "between")),
        bar=parse_border(find_child(element, "bar")),
    )


def parse_table_borders(element: Element | None) -> TableBorders | None:
    """Parse <w:tblBorders> or <w:tcBorders> element.

    XML Example:
        <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>

    Args:
        element: The <w:tblBorders> or <w:tcBorders> element or None

    Returns:
        TableBorders model or None if element is None
    """
    if element is None:
        return None

    return TableBorders(
        top=parse_border(find_child(element, "top")),
        left=parse_border(find_child(element, "left")),
        bottom=parse_border(find_child(element, "bottom")),
        right=parse_border(find_child(element, "right")),
        inside_h=parse_border(find_child(element, "insideH")),
        inside_v=parse_border(find_child(element, "insideV")),
        tl2br=parse_border(find_child(element, "tl2br")),
        tr2bl=parse_border(find_child(element, "tr2bl")),
    )
