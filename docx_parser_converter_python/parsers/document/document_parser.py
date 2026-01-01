"""Parser for document elements."""

from lxml.etree import _Element as Element

from models.document.document import Document
from parsers.document.body_parser import parse_body
from parsers.utils import find_child


def parse_document(element: Element | None) -> Document | None:
    """Parse <w:document> element.

    XML Example:
        <w:document xmlns:w="...">
            <w:body>
                <w:p>...</w:p>
                <w:tbl>...</w:tbl>
                <w:sectPr>...</w:sectPr>
            </w:body>
        </w:document>

    Args:
        element: The <w:document> element or None

    Returns:
        Document model or None if element is None
    """
    if element is None:
        return None

    # Parse body
    body_elem = find_child(element, "body")
    body = parse_body(body_elem)

    if body is None:
        # Document must have a body
        from models.document.document import Body

        body = Body(content=[], sect_pr=None)

    return Document(
        body=body,
    )
