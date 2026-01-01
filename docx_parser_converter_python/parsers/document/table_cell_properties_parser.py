"""Parser for table cell properties elements."""

from lxml.etree import _Element as Element

from models.document.table_cell import TableCellMargins, TableCellProperties
from parsers.common.border_parser import parse_table_borders
from parsers.common.shading_parser import parse_shading
from parsers.common.width_parser import parse_width
from parsers.utils import find_child, get_attribute, get_int_attribute, parse_toggle


def parse_table_cell_margins(element: Element | None) -> TableCellMargins | None:
    """Parse <w:tcMar> element.

    XML Example:
        <w:tcMar>
            <w:top w:w="72" w:type="dxa"/>
            <w:left w:w="115" w:type="dxa"/>
            <w:bottom w:w="72" w:type="dxa"/>
            <w:right w:w="115" w:type="dxa"/>
        </w:tcMar>

    Args:
        element: The <w:tcMar> element or None

    Returns:
        TableCellMargins model or None if element is None
    """
    if element is None:
        return None

    return TableCellMargins(
        top=parse_width(find_child(element, "top")),
        left=parse_width(find_child(element, "left")),
        bottom=parse_width(find_child(element, "bottom")),
        right=parse_width(find_child(element, "right")),
    )


def parse_table_cell_properties(element: Element | None) -> TableCellProperties | None:
    """Parse <w:tcPr> element.

    XML Example:
        <w:tcPr>
            <w:tcW w:w="2880" w:type="dxa"/>
            <w:gridSpan w:val="2"/>
            <w:vMerge w:val="restart"/>
            <w:shd w:val="clear" w:fill="FFFF00"/>
        </w:tcPr>

    Args:
        element: The <w:tcPr> element or None

    Returns:
        TableCellProperties model or None if element is None
    """
    if element is None:
        return None

    # Cell width
    tc_w = parse_width(find_child(element, "tcW"))

    # Cell borders
    tc_borders = parse_table_borders(find_child(element, "tcBorders"))

    # Shading
    shd = parse_shading(find_child(element, "shd"))

    # Cell margins
    tc_mar = parse_table_cell_margins(find_child(element, "tcMar"))

    # Text direction
    text_direction_elem = find_child(element, "textDirection")
    text_direction = (
        get_attribute(text_direction_elem, "val") if text_direction_elem is not None else None
    )

    # Vertical alignment
    v_align_elem = find_child(element, "vAlign")
    v_align = get_attribute(v_align_elem, "val") if v_align_elem is not None else None

    # Grid span (horizontal merge)
    grid_span_elem = find_child(element, "gridSpan")
    grid_span = get_int_attribute(grid_span_elem, "val") if grid_span_elem is not None else None

    # Vertical merge
    v_merge_elem = find_child(element, "vMerge")
    v_merge = None
    if v_merge_elem is not None:
        # If present without val, it means "continue"
        v_merge = get_attribute(v_merge_elem, "val") or "continue"

    # Horizontal merge (deprecated)
    h_merge_elem = find_child(element, "hMerge")
    h_merge = get_attribute(h_merge_elem, "val") if h_merge_elem is not None else None

    # No wrap
    no_wrap = parse_toggle(find_child(element, "noWrap"))

    # Fit text
    tc_fit_text = parse_toggle(find_child(element, "tcFitText"))

    # Hide mark
    hide_mark = parse_toggle(find_child(element, "hideMark"))

    return TableCellProperties(
        tc_w=tc_w,
        tc_borders=tc_borders,
        shd=shd,
        tc_mar=tc_mar,
        text_direction=text_direction,
        v_align=v_align,
        grid_span=grid_span,
        v_merge=v_merge,
        h_merge=h_merge,
        no_wrap=no_wrap,
        tc_fit_text=tc_fit_text,
        hide_mark=hide_mark,
    )
