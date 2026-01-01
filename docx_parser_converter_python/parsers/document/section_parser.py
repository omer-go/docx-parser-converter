"""Parser for section properties elements."""

from lxml.etree import _Element as Element

from models.document.section import (
    Column,
    Columns,
    DocumentGrid,
    HeaderFooterReference,
    LineNumberType,
    PageBorders,
    PageMargins,
    PageNumberType,
    PageSize,
    SectionProperties,
)
from parsers.common.border_parser import parse_border
from parsers.utils import (
    find_all_children,
    find_child,
    get_attribute,
    get_int_attribute,
    parse_toggle,
)


def parse_page_size(element: Element | None) -> PageSize | None:
    """Parse <w:pgSz> element.

    XML Example:
        <w:pgSz w:w="12240" w:h="15840" w:orient="portrait"/>

    Args:
        element: The <w:pgSz> element or None

    Returns:
        PageSize model or None if element is None
    """
    if element is None:
        return None

    return PageSize(
        w=get_int_attribute(element, "w"),
        h=get_int_attribute(element, "h"),
        orient=get_attribute(element, "orient"),
    )


def parse_page_margins(element: Element | None) -> PageMargins | None:
    """Parse <w:pgMar> element.

    XML Example:
        <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"
                 w:header="720" w:footer="720" w:gutter="0"/>

    Args:
        element: The <w:pgMar> element or None

    Returns:
        PageMargins model or None if element is None
    """
    if element is None:
        return None

    return PageMargins(
        top=get_int_attribute(element, "top"),
        right=get_int_attribute(element, "right"),
        bottom=get_int_attribute(element, "bottom"),
        left=get_int_attribute(element, "left"),
        header=get_int_attribute(element, "header"),
        footer=get_int_attribute(element, "footer"),
        gutter=get_int_attribute(element, "gutter"),
    )


def parse_column(element: Element | None) -> Column | None:
    """Parse <w:col> element within <w:cols>.

    Args:
        element: The <w:col> element or None

    Returns:
        Column model or None if element is None
    """
    if element is None:
        return None

    return Column(
        w=get_int_attribute(element, "w"),
        space=get_int_attribute(element, "space"),
    )


def parse_columns(element: Element | None) -> Columns | None:
    """Parse <w:cols> element.

    XML Example:
        <w:cols w:num="2" w:space="720" w:equalWidth="1"/>

    Args:
        element: The <w:cols> element or None

    Returns:
        Columns model or None if element is None
    """
    if element is None:
        return None

    # Parse individual columns if not equal width
    col_list = None
    col_elements = find_all_children(element, "col")
    if col_elements:
        col_list = []
        for col_elem in col_elements:
            col = parse_column(col_elem)
            if col is not None:
                col_list.append(col)

    return Columns(
        num=get_int_attribute(element, "num"),
        space=get_int_attribute(element, "space"),
        equal_width=parse_toggle(element),  # Check if equalWidth attribute exists
        sep=parse_toggle(find_child(element, "sep")),
        col=col_list if col_list else None,
    )


def parse_document_grid(element: Element | None) -> DocumentGrid | None:
    """Parse <w:docGrid> element.

    Args:
        element: The <w:docGrid> element or None

    Returns:
        DocumentGrid model or None if element is None
    """
    if element is None:
        return None

    return DocumentGrid(
        type=get_attribute(element, "type"),
        line_pitch=get_int_attribute(element, "linePitch"),
        char_space=get_int_attribute(element, "charSpace"),
    )


def parse_header_footer_reference(
    element: Element | None, is_header: bool = True
) -> HeaderFooterReference | None:
    """Parse <w:headerReference> or <w:footerReference> element.

    XML Example:
        <w:headerReference w:type="default" r:id="rId1"/>

    Args:
        element: The header/footer reference element or None
        is_header: Whether this is a header (True) or footer (False) reference

    Returns:
        HeaderFooterReference model or None if element is None
    """
    if element is None:
        return None

    from core.constants import REL_NS

    return HeaderFooterReference(
        type=get_attribute(element, "type"),
        r_id=element.get(f"{REL_NS}id"),
    )


def parse_page_borders(element: Element | None) -> PageBorders | None:
    """Parse <w:pgBorders> element.

    Args:
        element: The <w:pgBorders> element or None

    Returns:
        PageBorders model or None if element is None
    """
    if element is None:
        return None

    return PageBorders(
        top=parse_border(find_child(element, "top")),
        left=parse_border(find_child(element, "left")),
        bottom=parse_border(find_child(element, "bottom")),
        right=parse_border(find_child(element, "right")),
        offset_from=get_attribute(element, "offsetFrom"),
        z_order=get_attribute(element, "zOrder"),
        display=get_attribute(element, "display"),
    )


def parse_page_number_type(element: Element | None) -> PageNumberType | None:
    """Parse <w:pgNumType> element.

    XML Example:
        <w:pgNumType w:fmt="decimal" w:start="1"/>

    Args:
        element: The <w:pgNumType> element or None

    Returns:
        PageNumberType model or None if element is None
    """
    if element is None:
        return None

    return PageNumberType(
        fmt=get_attribute(element, "fmt"),
        start=get_int_attribute(element, "start"),
        chapter_style=get_attribute(element, "chapStyle"),
        chapter_sep=get_attribute(element, "chapSep"),
    )


def parse_line_number_type(element: Element | None) -> LineNumberType | None:
    """Parse <w:lnNumType> element.

    Args:
        element: The <w:lnNumType> element or None

    Returns:
        LineNumberType model or None if element is None
    """
    if element is None:
        return None

    return LineNumberType(
        count_by=get_int_attribute(element, "countBy"),
        start=get_int_attribute(element, "start"),
        restart=get_attribute(element, "restart"),
        distance=get_int_attribute(element, "distance"),
    )


def parse_section_properties(element: Element | None) -> SectionProperties | None:
    """Parse <w:sectPr> element.

    XML Example:
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
            <w:cols w:space="720"/>
        </w:sectPr>

    Args:
        element: The <w:sectPr> element or None

    Returns:
        SectionProperties model or None if element is None
    """
    if element is None:
        return None

    # Page size and margins
    pg_sz = parse_page_size(find_child(element, "pgSz"))
    pg_mar = parse_page_margins(find_child(element, "pgMar"))

    # Columns
    cols = parse_columns(find_child(element, "cols"))

    # Document grid
    doc_grid = parse_document_grid(find_child(element, "docGrid"))

    # Header references
    header_refs = None
    header_elements = find_all_children(element, "headerReference")
    if header_elements:
        header_refs = []
        for h_elem in header_elements:
            ref = parse_header_footer_reference(h_elem, is_header=True)
            if ref is not None:
                header_refs.append(ref)

    # Footer references
    footer_refs = None
    footer_elements = find_all_children(element, "footerReference")
    if footer_elements:
        footer_refs = []
        for f_elem in footer_elements:
            ref = parse_header_footer_reference(f_elem, is_header=False)
            if ref is not None:
                footer_refs.append(ref)

    # Page borders
    pg_borders = parse_page_borders(find_child(element, "pgBorders"))

    # Page numbering
    pg_num_type = parse_page_number_type(find_child(element, "pgNumType"))

    # Section type
    type_elem = find_child(element, "type")
    section_type = get_attribute(type_elem, "val") if type_elem is not None else None

    # Title page (different first page)
    title_pg = parse_toggle(find_child(element, "titlePg"))

    # Line numbering
    ln_num_type = parse_line_number_type(find_child(element, "lnNumType"))

    # Bidirectional
    bidi = parse_toggle(find_child(element, "bidi"))

    # RTL gutter
    rtl_gutter = parse_toggle(find_child(element, "rtlGutter"))

    # Form protection
    form_prot = parse_toggle(find_child(element, "formProt"))

    # Vertical alignment
    v_align_elem = find_child(element, "vAlign")
    v_align = get_attribute(v_align_elem, "val") if v_align_elem is not None else None

    return SectionProperties(
        pg_sz=pg_sz,
        pg_mar=pg_mar,
        cols=cols,
        doc_grid=doc_grid,
        header_refs=header_refs if header_refs else None,
        footer_refs=footer_refs if footer_refs else None,
        pg_borders=pg_borders,
        pg_num_type=pg_num_type,
        type=section_type,
        title_pg=title_pg,
        ln_num_type=ln_num_type,
        bidi=bidi,
        rtl_gutter=rtl_gutter,
        form_prot=form_prot,
        v_align=v_align,
    )
