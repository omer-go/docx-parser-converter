"""Parser for numbering level elements."""

from lxml.etree import _Element as Element

from models.numbering.level import Level
from parsers.common.indentation_parser import parse_indentation
from parsers.document.run_properties_parser import parse_run_properties
from parsers.utils import find_child, get_attribute, get_int_attribute, parse_toggle


def parse_level(element: Element | None) -> Level | None:
    """Parse <w:lvl> element.

    XML Example:
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
            <w:lvlJc w:val="left"/>
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
            <w:rPr>
                <w:rFonts w:ascii="Symbol"/>
            </w:rPr>
        </w:lvl>

    Args:
        element: The <w:lvl> element or None

    Returns:
        Level model or None if element is None
    """
    if element is None:
        return None

    # Required: level index
    ilvl = get_int_attribute(element, "ilvl")
    if ilvl is None:
        return None

    # Template code
    tplc = get_attribute(element, "tplc")

    # Tentative
    tentative = parse_toggle(find_child(element, "tentative"))

    # Start value
    start_elem = find_child(element, "start")
    start = get_int_attribute(start_elem, "val") if start_elem is not None else None

    # Number format
    num_fmt_elem = find_child(element, "numFmt")
    num_fmt = get_attribute(num_fmt_elem, "val") if num_fmt_elem is not None else None

    # Level restart
    lvl_restart_elem = find_child(element, "lvlRestart")
    lvl_restart = (
        get_int_attribute(lvl_restart_elem, "val") if lvl_restart_elem is not None else None
    )

    # Associated paragraph style
    p_style_elem = find_child(element, "pStyle")
    p_style = get_attribute(p_style_elem, "val") if p_style_elem is not None else None

    # Legal numbering style
    is_lgl = parse_toggle(find_child(element, "isLgl"))

    # Suffix (tab, space, nothing)
    suff_elem = find_child(element, "suff")
    suff = get_attribute(suff_elem, "val") if suff_elem is not None else None

    # Level text template
    lvl_text_elem = find_child(element, "lvlText")
    lvl_text = get_attribute(lvl_text_elem, "val") if lvl_text_elem is not None else None

    # Picture bullet ID
    lvl_pic_bullet_id_elem = find_child(element, "lvlPicBulletId")
    lvl_pic_bullet_id = (
        get_int_attribute(lvl_pic_bullet_id_elem, "val")
        if lvl_pic_bullet_id_elem is not None
        else None
    )

    # Level justification
    lvl_jc_elem = find_child(element, "lvlJc")
    lvl_jc = get_attribute(lvl_jc_elem, "val") if lvl_jc_elem is not None else None

    # Paragraph properties (mainly for indentation)
    p_pr_elem = find_child(element, "pPr")
    p_pr = None
    if p_pr_elem is not None:
        ind = parse_indentation(find_child(p_pr_elem, "ind"))
        if ind is not None:
            p_pr = ind.model_dump(exclude_none=True)

    # Run properties (for bullet/number formatting)
    r_pr_elem = find_child(element, "rPr")
    r_pr = None
    if r_pr_elem is not None:
        parsed_r_pr = parse_run_properties(r_pr_elem)
        if parsed_r_pr is not None:
            r_pr = parsed_r_pr.model_dump(exclude_none=True)

    return Level(
        ilvl=ilvl,
        tplc=tplc,
        tentative=tentative,
        start=start,
        num_fmt=num_fmt,
        lvl_restart=lvl_restart,
        p_style=p_style,
        is_lgl=is_lgl,
        suff=suff,
        lvl_text=lvl_text,
        lvl_pic_bullet_id=lvl_pic_bullet_id,
        lvl_jc=lvl_jc,
        p_pr=p_pr,
        r_pr=r_pr,
    )
