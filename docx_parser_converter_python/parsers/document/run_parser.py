"""Parser for run elements."""

from lxml.etree import _Element as Element

from core.constants import WORD_NS
from models.document.run import Run
from parsers.document.run_content_parser import parse_run_content_item
from parsers.document.run_properties_parser import parse_run_properties
from parsers.utils import find_child


def parse_run(element: Element | None) -> Run | None:
    """Parse <w:r> element.

    XML Example:
        <w:r>
            <w:rPr>
                <w:b/>
                <w:sz w:val="24"/>
            </w:rPr>
            <w:t>Bold text</w:t>
        </w:r>

    Args:
        element: The <w:r> element or None

    Returns:
        Run model or None if element is None
    """
    if element is None:
        return None

    # Parse run properties
    r_pr = parse_run_properties(find_child(element, "rPr"))

    # Parse content (all children except rPr)
    content = []
    rpr_tag = f"{WORD_NS}rPr"

    for child in element:
        if child.tag == rpr_tag:
            continue  # Skip properties element

        item = parse_run_content_item(child)
        if item is not None:
            content.append(item)

    return Run(
        r_pr=r_pr,
        content=content,
    )
