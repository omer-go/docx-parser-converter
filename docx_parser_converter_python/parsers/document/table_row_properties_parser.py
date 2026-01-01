"""Parser for table row properties elements."""

from lxml.etree import _Element as Element

from models.document.table_row import TableRowHeight, TableRowProperties
from parsers.common.width_parser import parse_width
from parsers.utils import find_child, get_attribute, get_int_attribute, parse_toggle


def parse_table_row_height(element: Element | None) -> TableRowHeight | None:
    """Parse <w:trHeight> element.

    XML Example:
        <w:trHeight w:val="720" w:hRule="exact"/>

    Args:
        element: The <w:trHeight> element or None

    Returns:
        TableRowHeight model or None if element is None
    """
    if element is None:
        return None

    return TableRowHeight(
        val=get_int_attribute(element, "val"),
        h_rule=get_attribute(element, "hRule"),
    )


def parse_table_row_properties(element: Element | None) -> TableRowProperties | None:
    """Parse <w:trPr> element.

    XML Example:
        <w:trPr>
            <w:trHeight w:val="720" w:hRule="exact"/>
            <w:tblHeader/>
            <w:cantSplit/>
        </w:trPr>

    Args:
        element: The <w:trPr> element or None

    Returns:
        TableRowProperties model or None if element is None
    """
    if element is None:
        return None

    # Row height
    tr_height = parse_table_row_height(find_child(element, "trHeight"))

    # Header row (repeat on each page)
    tbl_header = parse_toggle(find_child(element, "tblHeader"))

    # Row justification
    jc_elem = find_child(element, "jc")
    jc = get_attribute(jc_elem, "val") if jc_elem is not None else None

    # Can't split across pages
    cant_split = parse_toggle(find_child(element, "cantSplit"))

    # Cell spacing for this row
    tbl_cell_spacing = parse_width(find_child(element, "tblCellSpacing"))

    return TableRowProperties(
        tr_height=tr_height,
        tbl_header=tbl_header,
        jc=jc,
        cant_split=cant_split,
        tbl_cell_spacing=tbl_cell_spacing,
    )
