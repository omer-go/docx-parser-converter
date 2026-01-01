"""Parser for style elements."""

from lxml.etree import _Element as Element

from models.styles.style import Style
from models.styles.table_style import TableStyleProperties
from parsers.document.paragraph_properties_parser import parse_paragraph_properties
from parsers.document.run_properties_parser import parse_run_properties
from parsers.document.table_cell_properties_parser import parse_table_cell_properties
from parsers.document.table_properties_parser import parse_table_properties
from parsers.document.table_row_properties_parser import parse_table_row_properties
from parsers.utils import (
    find_all_children,
    find_child,
    get_attribute,
    get_int_attribute,
    parse_toggle,
)


def parse_table_style_properties(element: Element | None) -> TableStyleProperties | None:
    """Parse <w:tblStylePr> element.

    XML Example:
        <w:tblStylePr w:type="firstRow">
            <w:rPr>
                <w:b/>
            </w:rPr>
            <w:tcPr>
                <w:shd w:val="clear" w:fill="4472C4"/>
            </w:tcPr>
        </w:tblStylePr>

    Args:
        element: The <w:tblStylePr> element or None

    Returns:
        TableStyleProperties model or None if element is None
    """
    if element is None:
        return None

    # Required: condition type
    condition_type = get_attribute(element, "type")
    if condition_type is None:
        return None

    # Paragraph properties
    p_pr_elem = find_child(element, "pPr")
    p_pr = None
    if p_pr_elem is not None:
        parsed = parse_paragraph_properties(p_pr_elem)
        if parsed is not None:
            p_pr = parsed.model_dump(exclude_none=True)

    # Run properties
    r_pr_elem = find_child(element, "rPr")
    r_pr = None
    if r_pr_elem is not None:
        parsed = parse_run_properties(r_pr_elem)
        if parsed is not None:
            r_pr = parsed.model_dump(exclude_none=True)

    # Table properties
    tbl_pr_elem = find_child(element, "tblPr")
    tbl_pr = None
    if tbl_pr_elem is not None:
        parsed = parse_table_properties(tbl_pr_elem)
        if parsed is not None:
            tbl_pr = parsed.model_dump(exclude_none=True)

    # Table row properties
    tr_pr_elem = find_child(element, "trPr")
    tr_pr = None
    if tr_pr_elem is not None:
        parsed = parse_table_row_properties(tr_pr_elem)
        if parsed is not None:
            tr_pr = parsed.model_dump(exclude_none=True)

    # Table cell properties
    tc_pr_elem = find_child(element, "tcPr")
    tc_pr = None
    if tc_pr_elem is not None:
        parsed = parse_table_cell_properties(tc_pr_elem)
        if parsed is not None:
            tc_pr = parsed.model_dump(exclude_none=True)

    return TableStyleProperties(
        type=condition_type,
        p_pr=p_pr,
        r_pr=r_pr,
        tbl_pr=tbl_pr,
        tr_pr=tr_pr,
        tc_pr=tc_pr,
    )


def parse_style(element: Element | None) -> Style | None:
    """Parse <w:style> element.

    XML Example:
        <w:style w:type="paragraph" w:styleId="Heading1">
            <w:name w:val="heading 1"/>
            <w:basedOn w:val="Normal"/>
            <w:next w:val="Normal"/>
            <w:uiPriority w:val="9"/>
            <w:qFormat/>
            <w:pPr>...</w:pPr>
            <w:rPr>...</w:rPr>
        </w:style>

    Args:
        element: The <w:style> element or None

    Returns:
        Style model or None if element is None
    """
    if element is None:
        return None

    # Required: type and styleId
    style_type = get_attribute(element, "type")
    style_id = get_attribute(element, "styleId")
    if style_type is None or style_id is None:
        return None

    # Default style flag
    default = parse_toggle(element) if get_attribute(element, "default") is not None else None

    # Custom style flag
    custom_style = (
        parse_toggle(element) if get_attribute(element, "customStyle") is not None else None
    )

    # Name
    name_elem = find_child(element, "name")
    name = get_attribute(name_elem, "val") if name_elem is not None else None

    # Aliases
    aliases_elem = find_child(element, "aliases")
    aliases = get_attribute(aliases_elem, "val") if aliases_elem is not None else None

    # Based on
    based_on_elem = find_child(element, "basedOn")
    based_on = get_attribute(based_on_elem, "val") if based_on_elem is not None else None

    # Next style
    next_elem = find_child(element, "next")
    next_style = get_attribute(next_elem, "val") if next_elem is not None else None

    # Linked style
    link_elem = find_child(element, "link")
    link = get_attribute(link_elem, "val") if link_elem is not None else None

    # Auto-redefine
    auto_redefine = parse_toggle(find_child(element, "autoRedefine"))

    # Hidden
    hidden = parse_toggle(find_child(element, "hidden"))

    # UI priority
    ui_priority_elem = find_child(element, "uiPriority")
    ui_priority = (
        get_int_attribute(ui_priority_elem, "val") if ui_priority_elem is not None else None
    )

    # Semi-hidden
    semi_hidden = parse_toggle(find_child(element, "semiHidden"))

    # Unhide when used
    unhide_when_used = parse_toggle(find_child(element, "unhideWhenUsed"))

    # Quick format
    q_format = parse_toggle(find_child(element, "qFormat"))

    # Locked
    locked = parse_toggle(find_child(element, "locked"))

    # Personal styles
    personal = parse_toggle(find_child(element, "personal"))
    personal_compose = parse_toggle(find_child(element, "personalCompose"))
    personal_reply = parse_toggle(find_child(element, "personalReply"))

    # RSID
    rsid_elem = find_child(element, "rsid")
    rsid = get_attribute(rsid_elem, "val") if rsid_elem is not None else None

    # Paragraph properties
    p_pr_elem = find_child(element, "pPr")
    p_pr = None
    if p_pr_elem is not None:
        parsed = parse_paragraph_properties(p_pr_elem)
        if parsed is not None:
            p_pr = parsed.model_dump(exclude_none=True)

    # Run properties
    r_pr_elem = find_child(element, "rPr")
    r_pr = None
    if r_pr_elem is not None:
        parsed = parse_run_properties(r_pr_elem)
        if parsed is not None:
            r_pr = parsed.model_dump(exclude_none=True)

    # Table properties (for table styles)
    tbl_pr_elem = find_child(element, "tblPr")
    tbl_pr = None
    if tbl_pr_elem is not None:
        parsed = parse_table_properties(tbl_pr_elem)
        if parsed is not None:
            tbl_pr = parsed.model_dump(exclude_none=True)

    # Table row properties
    tr_pr_elem = find_child(element, "trPr")
    tr_pr = None
    if tr_pr_elem is not None:
        parsed = parse_table_row_properties(tr_pr_elem)
        if parsed is not None:
            tr_pr = parsed.model_dump(exclude_none=True)

    # Table cell properties
    tc_pr_elem = find_child(element, "tcPr")
    tc_pr = None
    if tc_pr_elem is not None:
        parsed = parse_table_cell_properties(tc_pr_elem)
        if parsed is not None:
            tc_pr = parsed.model_dump(exclude_none=True)

    # Table style conditional formatting
    tbl_style_pr = None
    tbl_style_pr_elements = find_all_children(element, "tblStylePr")
    if tbl_style_pr_elements:
        tbl_style_pr = []
        for tsp_elem in tbl_style_pr_elements:
            tsp = parse_table_style_properties(tsp_elem)
            if tsp is not None:
                tbl_style_pr.append(tsp)

    return Style(
        type=style_type,
        style_id=style_id,
        default=default,
        custom_style=custom_style,
        name=name,
        aliases=aliases,
        based_on=based_on,
        next=next_style,
        link=link,
        auto_redefine=auto_redefine,
        hidden=hidden,
        ui_priority=ui_priority,
        semi_hidden=semi_hidden,
        unhide_when_used=unhide_when_used,
        q_format=q_format,
        locked=locked,
        personal=personal,
        personal_compose=personal_compose,
        personal_reply=personal_reply,
        rsid=rsid,
        p_pr=p_pr,
        r_pr=r_pr,
        tbl_pr=tbl_pr,
        tr_pr=tr_pr,
        tc_pr=tc_pr,
        tbl_style_pr=tbl_style_pr if tbl_style_pr else None,
    )
