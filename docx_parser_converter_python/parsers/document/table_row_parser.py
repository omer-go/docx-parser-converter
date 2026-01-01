"""Parser for table row elements."""

from lxml.etree import _Element as Element

from models.document.table_row import TableRow
from parsers.document.table_cell_parser import parse_table_cell
from parsers.document.table_row_properties_parser import parse_table_row_properties
from parsers.utils import find_all_children, find_child


def parse_table_row(element: Element | None) -> TableRow | None:
    """Parse <w:tr> element.

    XML Example:
        <w:tr>
            <w:trPr>
                <w:tblHeader/>
            </w:trPr>
            <w:tc>...</w:tc>
            <w:tc>...</w:tc>
        </w:tr>

    Args:
        element: The <w:tr> element or None

    Returns:
        TableRow model or None if element is None
    """
    if element is None:
        return None

    # Parse row properties
    tr_pr = parse_table_row_properties(find_child(element, "trPr"))

    # Parse cells
    cells = []
    for cell_elem in find_all_children(element, "tc"):
        cell = parse_table_cell(cell_elem)
        if cell is not None:
            cells.append(cell)

    return TableRow(
        tr_pr=tr_pr,
        tc=cells,
    )
