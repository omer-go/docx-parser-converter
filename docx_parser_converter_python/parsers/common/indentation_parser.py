"""Parser for indentation elements."""

from lxml.etree import _Element as Element

from models.common.indentation import Indentation
from parsers.utils import get_int_attribute


def parse_indentation(element: Element | None) -> Indentation | None:
    """Parse <w:ind> element.

    XML Example:
        <w:ind w:left="720" w:right="0" w:hanging="360"/>
        <w:ind w:start="720" w:firstLine="720"/>

    Args:
        element: The <w:ind> element or None

    Returns:
        Indentation model or None if element is None
    """
    if element is None:
        return None

    return Indentation(
        left=get_int_attribute(element, "left"),
        right=get_int_attribute(element, "right"),
        start=get_int_attribute(element, "start"),
        end=get_int_attribute(element, "end"),
        first_line=get_int_attribute(element, "firstLine"),
        hanging=get_int_attribute(element, "hanging"),
        start_chars=get_int_attribute(element, "startChars"),
        end_chars=get_int_attribute(element, "endChars"),
        first_line_chars=get_int_attribute(element, "firstLineChars"),
        hanging_chars=get_int_attribute(element, "hangingChars"),
    )
