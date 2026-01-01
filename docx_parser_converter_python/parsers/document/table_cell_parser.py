"""Parser for table cell elements."""

from lxml.etree import _Element as Element

from models.document.table_cell import TableCell
from parsers.document.paragraph_parser import parse_paragraph
from parsers.document.table_cell_properties_parser import parse_table_cell_properties
from parsers.utils import find_child, get_local_name


def parse_table_cell(element: Element | None) -> TableCell | None:
    """Parse <w:tc> element.

    XML Example:
        <w:tc>
            <w:tcPr>
                <w:tcW w:w="2880" w:type="dxa"/>
            </w:tcPr>
            <w:p>
                <w:r><w:t>Cell content</w:t></w:r>
            </w:p>
        </w:tc>

    Args:
        element: The <w:tc> element or None

    Returns:
        TableCell model or None if element is None
    """
    if element is None:
        return None

    # Parse cell properties
    tc_pr = parse_table_cell_properties(find_child(element, "tcPr"))

    # Parse content (paragraphs and nested tables)
    content = []

    for child in element:
        local_name = get_local_name(child)

        if local_name == "tcPr":
            continue  # Skip properties element
        elif local_name == "p":
            item = parse_paragraph(child)
        elif local_name == "tbl":
            # Nested table - import here to avoid circular import
            from parsers.document.table_parser import parse_table

            item = parse_table(child)
        else:
            # Skip unrecognized elements
            continue

        if item is not None:
            content.append(item)

    return TableCell(
        tc_pr=tc_pr,
        content=content,
    )
