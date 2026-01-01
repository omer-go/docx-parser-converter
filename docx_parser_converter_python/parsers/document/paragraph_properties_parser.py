"""Parser for paragraph properties elements."""

from lxml.etree import _Element as Element

from models.document.paragraph import (
    NumberingProperties,
    ParagraphProperties,
    TabStop,
)
from parsers.common.border_parser import parse_paragraph_borders
from parsers.common.indentation_parser import parse_indentation
from parsers.common.shading_parser import parse_shading
from parsers.common.spacing_parser import parse_spacing
from parsers.document.run_properties_parser import parse_run_properties
from parsers.utils import (
    find_all_children,
    find_child,
    get_attribute,
    get_int_attribute,
    parse_toggle,
)


def parse_tab_stop(element: Element | None) -> TabStop | None:
    """Parse <w:tab> element (within <w:tabs>).

    XML Example:
        <w:tab w:val="left" w:pos="720" w:leader="dot"/>

    Args:
        element: The <w:tab> element or None

    Returns:
        TabStop model or None if element is None
    """
    if element is None:
        return None

    return TabStop(
        val=get_attribute(element, "val"),
        pos=get_int_attribute(element, "pos"),
        leader=get_attribute(element, "leader"),
    )


def parse_numbering_properties(element: Element | None) -> NumberingProperties | None:
    """Parse <w:numPr> element.

    XML Example:
        <w:numPr>
            <w:ilvl w:val="0"/>
            <w:numId w:val="1"/>
        </w:numPr>

    Args:
        element: The <w:numPr> element or None

    Returns:
        NumberingProperties model or None if element is None
    """
    if element is None:
        return None

    ilvl_elem = find_child(element, "ilvl")
    ilvl = get_int_attribute(ilvl_elem, "val") if ilvl_elem is not None else None

    num_id_elem = find_child(element, "numId")
    num_id = get_int_attribute(num_id_elem, "val") if num_id_elem is not None else None

    return NumberingProperties(
        ilvl=ilvl,
        num_id=num_id,
    )


def parse_paragraph_properties(element: Element | None) -> ParagraphProperties | None:
    """Parse <w:pPr> element.

    XML Example:
        <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:jc w:val="center"/>
            <w:spacing w:before="240" w:after="120"/>
            <w:ind w:left="720"/>
        </w:pPr>

    Args:
        element: The <w:pPr> element or None

    Returns:
        ParagraphProperties model or None if element is None
    """
    if element is None:
        return None

    # Style reference
    p_style_elem = find_child(element, "pStyle")
    p_style = get_attribute(p_style_elem, "val") if p_style_elem is not None else None

    # Boolean toggles
    keep_next = parse_toggle(find_child(element, "keepNext"))
    keep_lines = parse_toggle(find_child(element, "keepLines"))
    page_break_before = parse_toggle(find_child(element, "pageBreakBefore"))
    widow_control = parse_toggle(find_child(element, "widowControl"))
    suppress_line_numbers = parse_toggle(find_child(element, "suppressLineNumbers"))
    suppress_auto_hyphens = parse_toggle(find_child(element, "suppressAutoHyphens"))
    bidi = parse_toggle(find_child(element, "bidi"))

    # Borders and shading
    p_bdr = parse_paragraph_borders(find_child(element, "pBdr"))
    shd = parse_shading(find_child(element, "shd"))

    # Tab stops
    tabs_elem = find_child(element, "tabs")
    tabs = None
    if tabs_elem is not None:
        tabs = []
        for tab_elem in find_all_children(tabs_elem, "tab"):
            tab = parse_tab_stop(tab_elem)
            if tab is not None:
                tabs.append(tab)

    # Spacing and indentation
    spacing = parse_spacing(find_child(element, "spacing"))
    ind = parse_indentation(find_child(element, "ind"))

    # Justification
    jc_elem = find_child(element, "jc")
    jc = get_attribute(jc_elem, "val") if jc_elem is not None else None

    # Outline level
    outline_lvl_elem = find_child(element, "outlineLvl")
    outline_lvl = (
        get_int_attribute(outline_lvl_elem, "val") if outline_lvl_elem is not None else None
    )

    # Numbering properties
    num_pr = parse_numbering_properties(find_child(element, "numPr"))

    # Default run properties for the paragraph
    r_pr_elem = find_child(element, "rPr")
    r_pr = None
    if r_pr_elem is not None:
        parsed_r_pr = parse_run_properties(r_pr_elem)
        if parsed_r_pr is not None:
            # Convert to dict to avoid circular import issues in the model
            r_pr = parsed_r_pr.model_dump(exclude_none=True)

    # Text direction
    text_direction_elem = find_child(element, "textDirection")
    text_direction = (
        get_attribute(text_direction_elem, "val") if text_direction_elem is not None else None
    )

    # Text alignment
    text_alignment_elem = find_child(element, "textAlignment")
    text_alignment = (
        get_attribute(text_alignment_elem, "val") if text_alignment_elem is not None else None
    )

    # Frame properties (simplified - just check if present)
    frame_pr_elem = find_child(element, "framePr")
    frame_pr = None
    if frame_pr_elem is not None:
        # Basic frame properties extraction
        frame_pr = {
            "w": get_int_attribute(frame_pr_elem, "w"),
            "h": get_int_attribute(frame_pr_elem, "h"),
            "wrap": get_attribute(frame_pr_elem, "wrap"),
            "h_anchor": get_attribute(frame_pr_elem, "hAnchor"),
            "v_anchor": get_attribute(frame_pr_elem, "vAnchor"),
            "x": get_int_attribute(frame_pr_elem, "x"),
            "y": get_int_attribute(frame_pr_elem, "y"),
            "drop_cap": get_attribute(frame_pr_elem, "dropCap"),
            "lines": get_int_attribute(frame_pr_elem, "lines"),
        }
        # Remove None values
        frame_pr = {k: v for k, v in frame_pr.items() if v is not None}
        if not frame_pr:
            frame_pr = None

    return ParagraphProperties(
        p_style=p_style,
        keep_next=keep_next,
        keep_lines=keep_lines,
        page_break_before=page_break_before,
        widow_control=widow_control,
        suppress_line_numbers=suppress_line_numbers,
        p_bdr=p_bdr,
        shd=shd,
        tabs=tabs if tabs else None,
        suppress_auto_hyphens=suppress_auto_hyphens,
        spacing=spacing,
        ind=ind,
        jc=jc,
        outline_lvl=outline_lvl,
        num_pr=num_pr,
        bidi=bidi,
        r_pr=r_pr,
        text_direction=text_direction,
        text_alignment=text_alignment,
        frame_pr=frame_pr,
    )
