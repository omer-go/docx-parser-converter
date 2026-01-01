"""Parser for table elements."""

from lxml.etree import _Element as Element

from models.document.table import Table
from parsers.document.table_grid_parser import parse_table_grid
from parsers.document.table_properties_parser import parse_table_properties
from parsers.document.table_row_parser import parse_table_row
from parsers.utils import find_all_children, find_child


def parse_table(element: Element | None) -> Table | None:
    """Parse <w:tbl> element.

    XML Example:
        <w:tbl>
            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="5000" w:type="pct"/>
            </w:tblPr>
            <w:tblGrid>
                <w:gridCol w:w="2880"/>
                <w:gridCol w:w="2880"/>
            </w:tblGrid>
            <w:tr>...</w:tr>
            <w:tr>...</w:tr>
        </w:tbl>

    Args:
        element: The <w:tbl> element or None

    Returns:
        Table model or None if element is None
    """
    if element is None:
        return None

    # Parse table properties
    tbl_pr = parse_table_properties(find_child(element, "tblPr"))

    # Parse table grid
    tbl_grid = parse_table_grid(find_child(element, "tblGrid"))

    # Parse table rows
    rows = []
    for row_elem in find_all_children(element, "tr"):
        row = parse_table_row(row_elem)
        if row is not None:
            rows.append(row)

    return Table(
        tbl_pr=tbl_pr,
        tbl_grid=tbl_grid,
        tr=rows,
    )
