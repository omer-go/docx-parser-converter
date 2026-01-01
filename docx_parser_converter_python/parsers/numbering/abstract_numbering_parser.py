"""Parser for abstract numbering elements."""

from lxml.etree import _Element as Element

from models.numbering.abstract_numbering import AbstractNumbering
from parsers.numbering.level_parser import parse_level
from parsers.utils import find_all_children, find_child, get_attribute, get_int_attribute


def parse_abstract_numbering(element: Element | None) -> AbstractNumbering | None:
    """Parse <w:abstractNum> element.

    XML Example:
        <w:abstractNum w:abstractNumId="0">
            <w:nsid w:val="12345678"/>
            <w:multiLevelType w:val="multilevel"/>
            <w:lvl w:ilvl="0">...</w:lvl>
            <w:lvl w:ilvl="1">...</w:lvl>
        </w:abstractNum>

    Args:
        element: The <w:abstractNum> element or None

    Returns:
        AbstractNumbering model or None if element is None
    """
    if element is None:
        return None

    # Required: abstract numbering ID
    abstract_num_id = get_int_attribute(element, "abstractNumId")
    if abstract_num_id is None:
        return None

    # NSID (number scheme ID)
    nsid_elem = find_child(element, "nsid")
    nsid = get_attribute(nsid_elem, "val") if nsid_elem is not None else None

    # Multi-level type
    multi_level_type_elem = find_child(element, "multiLevelType")
    multi_level_type = (
        get_attribute(multi_level_type_elem, "val") if multi_level_type_elem is not None else None
    )

    # Template ID
    tmpl_elem = find_child(element, "tmpl")
    tmpl = get_attribute(tmpl_elem, "val") if tmpl_elem is not None else None

    # Name
    name_elem = find_child(element, "name")
    name = get_attribute(name_elem, "val") if name_elem is not None else None

    # Style link (link to numbering style)
    style_link_elem = find_child(element, "styleLink")
    style_link = get_attribute(style_link_elem, "val") if style_link_elem is not None else None

    # Numbering style link (link from style)
    num_style_link_elem = find_child(element, "numStyleLink")
    num_style_link = (
        get_attribute(num_style_link_elem, "val") if num_style_link_elem is not None else None
    )

    # Parse levels
    levels = []
    for lvl_elem in find_all_children(element, "lvl"):
        level = parse_level(lvl_elem)
        if level is not None:
            levels.append(level)

    return AbstractNumbering(
        abstract_num_id=abstract_num_id,
        nsid=nsid,
        multi_level_type=multi_level_type,
        tmpl=tmpl,
        name=name,
        style_link=style_link,
        num_style_link=num_style_link,
        lvl=levels,
    )
