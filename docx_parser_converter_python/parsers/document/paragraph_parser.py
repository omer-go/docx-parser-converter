"""Parser for paragraph elements."""

from lxml.etree import _Element as Element

from models.document.paragraph import Paragraph
from parsers.document.hyperlink_parser import (
    parse_bookmark_end,
    parse_bookmark_start,
    parse_hyperlink,
)
from parsers.document.paragraph_properties_parser import parse_paragraph_properties
from parsers.document.run_parser import parse_run
from parsers.utils import find_child, get_local_name


def parse_paragraph(element: Element | None) -> Paragraph | None:
    """Parse <w:p> element.

    XML Example:
        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:t>Centered text</w:t>
            </w:r>
            <w:hyperlink r:id="rId1">
                <w:r><w:t>Link</w:t></w:r>
            </w:hyperlink>
        </w:p>

    Args:
        element: The <w:p> element or None

    Returns:
        Paragraph model or None if element is None
    """
    if element is None:
        return None

    # Parse paragraph properties
    p_pr = parse_paragraph_properties(find_child(element, "pPr"))

    # Parse content (runs, hyperlinks, bookmarks, etc.)
    content = []

    for child in element:
        local_name = get_local_name(child)

        if local_name == "pPr":
            continue  # Skip properties element
        elif local_name == "r":
            item = parse_run(child)
        elif local_name == "hyperlink":
            item = parse_hyperlink(child)
        elif local_name == "bookmarkStart":
            item = parse_bookmark_start(child)
        elif local_name == "bookmarkEnd":
            item = parse_bookmark_end(child)
        else:
            # Skip unrecognized elements
            continue

        if item is not None:
            content.append(item)

    return Paragraph(
        p_pr=p_pr,
        content=content,
    )
