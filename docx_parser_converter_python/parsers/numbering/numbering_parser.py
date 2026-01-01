"""Parser for numbering root element."""

from lxml.etree import _Element as Element

from models.numbering.numbering import Numbering
from parsers.numbering.abstract_numbering_parser import parse_abstract_numbering
from parsers.numbering.numbering_instance_parser import parse_numbering_instance
from parsers.utils import find_all_children


def parse_numbering(element: Element | None) -> Numbering | None:
    """Parse <w:numbering> root element.

    XML Example:
        <w:numbering xmlns:w="...">
            <w:abstractNum w:abstractNumId="0">...</w:abstractNum>
            <w:abstractNum w:abstractNumId="1">...</w:abstractNum>
            <w:num w:numId="1">...</w:num>
            <w:num w:numId="2">...</w:num>
        </w:numbering>

    Args:
        element: The <w:numbering> element or None

    Returns:
        Numbering model or None if element is None
    """
    if element is None:
        return None

    # Parse abstract numbering definitions
    abstract_nums = []
    for abstract_elem in find_all_children(element, "abstractNum"):
        abstract_num = parse_abstract_numbering(abstract_elem)
        if abstract_num is not None:
            abstract_nums.append(abstract_num)

    # Parse numbering instances
    nums = []
    for num_elem in find_all_children(element, "num"):
        num = parse_numbering_instance(num_elem)
        if num is not None:
            nums.append(num)

    return Numbering(
        abstract_num=abstract_nums,
        num=nums,
    )
