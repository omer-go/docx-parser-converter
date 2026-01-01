"""Parser for hyperlink and bookmark elements."""

from lxml.etree import _Element as Element

from core.constants import REL_NS
from models.document.hyperlink import BookmarkEnd, BookmarkStart, Hyperlink
from parsers.document.run_parser import parse_run
from parsers.utils import find_all_children, get_attribute


def parse_hyperlink(element: Element | None) -> Hyperlink | None:
    """Parse <w:hyperlink> element.

    XML Example:
        <w:hyperlink r:id="rId1" w:tooltip="Click here">
            <w:r>
                <w:t>Link text</w:t>
            </w:r>
        </w:hyperlink>

    Args:
        element: The <w:hyperlink> element or None

    Returns:
        Hyperlink model or None if element is None
    """
    if element is None:
        return None

    # r:id uses the relationship namespace
    r_id = element.get(f"{REL_NS}id")

    # Parse all runs within the hyperlink
    content = []
    for run_elem in find_all_children(element, "r"):
        run = parse_run(run_elem)
        if run is not None:
            content.append(run)

    return Hyperlink(
        r_id=r_id,
        anchor=get_attribute(element, "anchor"),
        tooltip=get_attribute(element, "tooltip"),
        content=content,
    )


def parse_bookmark_start(element: Element | None) -> BookmarkStart | None:
    """Parse <w:bookmarkStart> element.

    XML Example:
        <w:bookmarkStart w:id="0" w:name="MyBookmark"/>

    Args:
        element: The <w:bookmarkStart> element or None

    Returns:
        BookmarkStart model or None if element is None
    """
    if element is None:
        return None

    return BookmarkStart(
        id=get_attribute(element, "id"),
        name=get_attribute(element, "name"),
    )


def parse_bookmark_end(element: Element | None) -> BookmarkEnd | None:
    """Parse <w:bookmarkEnd> element.

    XML Example:
        <w:bookmarkEnd w:id="0"/>

    Args:
        element: The <w:bookmarkEnd> element or None

    Returns:
        BookmarkEnd model or None if element is None
    """
    if element is None:
        return None

    return BookmarkEnd(
        id=get_attribute(element, "id"),
    )
