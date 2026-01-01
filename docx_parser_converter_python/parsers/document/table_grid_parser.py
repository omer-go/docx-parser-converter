"""Parser for table grid elements."""

from lxml.etree import _Element as Element

from models.document.table import TableGrid, TableGridColumn
from parsers.utils import find_all_children, get_int_attribute


def parse_table_grid_column(element: Element | None) -> TableGridColumn | None:
    """Parse <w:gridCol> element.

    XML Example:
        <w:gridCol w:w="2880"/>

    Args:
        element: The <w:gridCol> element or None

    Returns:
        TableGridColumn model or None if element is None
    """
    if element is None:
        return None

    return TableGridColumn(
        w=get_int_attribute(element, "w"),
    )


def parse_table_grid(element: Element | None) -> TableGrid | None:
    """Parse <w:tblGrid> element.

    XML Example:
        <w:tblGrid>
            <w:gridCol w:w="2880"/>
            <w:gridCol w:w="2880"/>
            <w:gridCol w:w="2880"/>
        </w:tblGrid>

    Args:
        element: The <w:tblGrid> element or None

    Returns:
        TableGrid model or None if element is None
    """
    if element is None:
        return None

    # Parse grid columns
    grid_cols = []
    for col_elem in find_all_children(element, "gridCol"):
        col = parse_table_grid_column(col_elem)
        if col is not None:
            grid_cols.append(col)

    return TableGrid(
        grid_col=grid_cols,
    )
