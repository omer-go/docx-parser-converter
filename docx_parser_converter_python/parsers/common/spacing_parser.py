"""Parser for spacing elements."""

from lxml.etree import _Element as Element

from models.common.spacing import Spacing
from parsers.utils import get_attribute, get_bool_attribute, get_int_attribute


def parse_spacing(element: Element | None) -> Spacing | None:
    """Parse <w:spacing> element.

    XML Example:
        <w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto"/>

    Args:
        element: The <w:spacing> element or None

    Returns:
        Spacing model or None if element is None
    """
    if element is None:
        return None

    return Spacing(
        before=get_int_attribute(element, "before"),
        after=get_int_attribute(element, "after"),
        line=get_int_attribute(element, "line"),
        line_rule=get_attribute(element, "lineRule"),
        before_lines=get_int_attribute(element, "beforeLines"),
        after_lines=get_int_attribute(element, "afterLines"),
        before_autospacing=get_bool_attribute(element, "beforeAutospacing"),
        after_autospacing=get_bool_attribute(element, "afterAutospacing"),
    )
