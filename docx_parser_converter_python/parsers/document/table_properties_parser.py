"""Parser for table properties elements."""

from lxml.etree import _Element as Element

from models.document.table import TableLook, TableProperties
from parsers.common.border_parser import parse_table_borders
from parsers.common.shading_parser import parse_shading
from parsers.common.width_parser import parse_width
from parsers.document.table_cell_properties_parser import parse_table_cell_margins
from parsers.utils import find_child, get_attribute


def parse_table_look(element: Element | None) -> TableLook | None:
    """Parse <w:tblLook> element.

    XML Example:
        <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1"
                   w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>

    Args:
        element: The <w:tblLook> element or None

    Returns:
        TableLook model or None if element is None
    """
    if element is None:
        return None

    # These can be "0", "1", "true", "false" etc.
    first_row = get_attribute(element, "firstRow")
    last_row = get_attribute(element, "lastRow")
    first_column = get_attribute(element, "firstColumn")
    last_column = get_attribute(element, "lastColumn")
    no_h_band = get_attribute(element, "noHBand")
    no_v_band = get_attribute(element, "noVBand")

    def to_bool(val: str | None) -> bool | None:
        if val is None:
            return None
        return val.lower() not in ("0", "false", "off")

    return TableLook(
        first_row=to_bool(first_row),
        last_row=to_bool(last_row),
        first_column=to_bool(first_column),
        last_column=to_bool(last_column),
        no_h_band=to_bool(no_h_band),
        no_v_band=to_bool(no_v_band),
    )


def parse_table_properties(element: Element | None) -> TableProperties | None:
    """Parse <w:tblPr> element.

    XML Example:
        <w:tblPr>
            <w:tblStyle w:val="TableGrid"/>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:jc w:val="center"/>
            <w:tblBorders>...</w:tblBorders>
        </w:tblPr>

    Args:
        element: The <w:tblPr> element or None

    Returns:
        TableProperties model or None if element is None
    """
    if element is None:
        return None

    # Table style reference
    tbl_style_elem = find_child(element, "tblStyle")
    tbl_style = get_attribute(tbl_style_elem, "val") if tbl_style_elem is not None else None

    # Table width
    tbl_w = parse_width(find_child(element, "tblW"))

    # Table justification
    jc_elem = find_child(element, "jc")
    jc = get_attribute(jc_elem, "val") if jc_elem is not None else None

    # Table indentation
    tbl_ind = parse_width(find_child(element, "tblInd"))

    # Table borders
    tbl_borders = parse_table_borders(find_child(element, "tblBorders"))

    # Table shading
    shd = parse_shading(find_child(element, "shd"))

    # Table layout (fixed or autofit)
    tbl_layout_elem = find_child(element, "tblLayout")
    tbl_layout = get_attribute(tbl_layout_elem, "type") if tbl_layout_elem is not None else None

    # Default cell margins
    tbl_cell_mar = parse_table_cell_margins(find_child(element, "tblCellMar"))

    # Table look (conditional formatting flags)
    tbl_look = parse_table_look(find_child(element, "tblLook"))

    # Table caption
    tbl_caption_elem = find_child(element, "tblCaption")
    tbl_caption = get_attribute(tbl_caption_elem, "val") if tbl_caption_elem is not None else None

    # Table description
    tbl_description_elem = find_child(element, "tblDescription")
    tbl_description = (
        get_attribute(tbl_description_elem, "val") if tbl_description_elem is not None else None
    )

    return TableProperties(
        tbl_style=tbl_style,
        tbl_w=tbl_w,
        jc=jc,
        tbl_ind=tbl_ind,
        tbl_borders=tbl_borders,
        shd=shd,
        tbl_layout=tbl_layout,
        tbl_cell_mar=tbl_cell_mar,
        tbl_look=tbl_look,
        tbl_caption=tbl_caption,
        tbl_description=tbl_description,
    )
