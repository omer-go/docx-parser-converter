"""Parser for run properties elements."""

from lxml.etree import _Element as Element

from models.document.run import Language, RunFonts, RunProperties, Underline
from parsers.common.border_parser import parse_border
from parsers.common.color_parser import parse_color
from parsers.common.shading_parser import parse_shading
from parsers.utils import (
    find_child,
    get_attribute,
    get_int_attribute,
    parse_toggle,
)


def parse_run_fonts(element: Element | None) -> RunFonts | None:
    """Parse <w:rFonts> element.

    XML Example:
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>

    Args:
        element: The <w:rFonts> element or None

    Returns:
        RunFonts model or None if element is None
    """
    if element is None:
        return None

    return RunFonts(
        ascii=get_attribute(element, "ascii"),
        h_ansi=get_attribute(element, "hAnsi"),
        east_asia=get_attribute(element, "eastAsia"),
        cs=get_attribute(element, "cs"),
        hint=get_attribute(element, "hint"),
    )


def parse_language(element: Element | None) -> Language | None:
    """Parse <w:lang> element.

    XML Example:
        <w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/>

    Args:
        element: The <w:lang> element or None

    Returns:
        Language model or None if element is None
    """
    if element is None:
        return None

    return Language(
        val=get_attribute(element, "val"),
        east_asia=get_attribute(element, "eastAsia"),
        bidi=get_attribute(element, "bidi"),
    )


def parse_underline(element: Element | None) -> Underline | None:
    """Parse <w:u> element.

    XML Example:
        <w:u w:val="single" w:color="FF0000"/>

    Args:
        element: The <w:u> element or None

    Returns:
        Underline model or None if element is None
    """
    if element is None:
        return None

    return Underline(
        val=get_attribute(element, "val"),
        color=get_attribute(element, "color"),
        theme_color=get_attribute(element, "themeColor"),
    )


def parse_run_properties(element: Element | None) -> RunProperties | None:
    """Parse <w:rPr> element.

    XML Example:
        <w:rPr>
            <w:rStyle w:val="Strong"/>
            <w:b/>
            <w:sz w:val="24"/>
            <w:color w:val="FF0000"/>
        </w:rPr>

    Args:
        element: The <w:rPr> element or None

    Returns:
        RunProperties model or None if element is None
    """
    if element is None:
        return None

    # Style reference
    r_style_elem = find_child(element, "rStyle")
    r_style = get_attribute(r_style_elem, "val") if r_style_elem is not None else None

    # Font settings
    r_fonts = parse_run_fonts(find_child(element, "rFonts"))

    # Boolean toggles
    b = parse_toggle(find_child(element, "b"))
    b_cs = parse_toggle(find_child(element, "bCs"))
    i = parse_toggle(find_child(element, "i"))
    i_cs = parse_toggle(find_child(element, "iCs"))
    caps = parse_toggle(find_child(element, "caps"))
    small_caps = parse_toggle(find_child(element, "smallCaps"))
    strike = parse_toggle(find_child(element, "strike"))
    dstrike = parse_toggle(find_child(element, "dstrike"))
    outline = parse_toggle(find_child(element, "outline"))
    shadow = parse_toggle(find_child(element, "shadow"))
    emboss = parse_toggle(find_child(element, "emboss"))
    imprint = parse_toggle(find_child(element, "imprint"))
    vanish = parse_toggle(find_child(element, "vanish"))
    spec_vanish = parse_toggle(find_child(element, "specVanish"))

    # Color
    color = parse_color(find_child(element, "color"))

    # Spacing/sizing
    spacing_elem = find_child(element, "spacing")
    spacing = get_int_attribute(spacing_elem, "val") if spacing_elem is not None else None

    w_elem = find_child(element, "w")
    w = get_int_attribute(w_elem, "val") if w_elem is not None else None

    kern_elem = find_child(element, "kern")
    kern = get_int_attribute(kern_elem, "val") if kern_elem is not None else None

    position_elem = find_child(element, "position")
    position = get_int_attribute(position_elem, "val") if position_elem is not None else None

    sz_elem = find_child(element, "sz")
    sz = get_int_attribute(sz_elem, "val") if sz_elem is not None else None

    sz_cs_elem = find_child(element, "szCs")
    sz_cs = get_int_attribute(sz_cs_elem, "val") if sz_cs_elem is not None else None

    # Highlight
    highlight_elem = find_child(element, "highlight")
    highlight = get_attribute(highlight_elem, "val") if highlight_elem is not None else None

    # Underline
    u = parse_underline(find_child(element, "u"))

    # Effect (deprecated)
    effect_elem = find_child(element, "effect")
    effect = get_attribute(effect_elem, "val") if effect_elem is not None else None

    # Border and shading
    bdr = parse_border(find_child(element, "bdr"))
    shd = parse_shading(find_child(element, "shd"))

    # Vertical alignment
    vert_align_elem = find_child(element, "vertAlign")
    vert_align = get_attribute(vert_align_elem, "val") if vert_align_elem is not None else None

    # Language
    lang = parse_language(find_child(element, "lang"))

    return RunProperties(
        r_style=r_style,
        r_fonts=r_fonts,
        b=b,
        b_cs=b_cs,
        i=i,
        i_cs=i_cs,
        caps=caps,
        small_caps=small_caps,
        strike=strike,
        dstrike=dstrike,
        outline=outline,
        shadow=shadow,
        emboss=emboss,
        imprint=imprint,
        vanish=vanish,
        color=color,
        spacing=spacing,
        w=w,
        kern=kern,
        position=position,
        sz=sz,
        sz_cs=sz_cs,
        highlight=highlight,
        u=u,
        effect=effect,
        bdr=bdr,
        shd=shd,
        vert_align=vert_align,
        lang=lang,
        spec_vanish=spec_vanish,
    )
