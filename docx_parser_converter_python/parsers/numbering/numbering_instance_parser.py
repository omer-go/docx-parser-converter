"""Parser for numbering instance elements."""

from lxml.etree import _Element as Element

from models.numbering.level_override import LevelOverride
from models.numbering.numbering_instance import NumberingInstance
from parsers.numbering.level_parser import parse_level
from parsers.utils import find_all_children, find_child, get_int_attribute


def parse_level_override(element: Element | None) -> LevelOverride | None:
    """Parse <w:lvlOverride> element.

    XML Example:
        <w:lvlOverride w:ilvl="0">
            <w:startOverride w:val="5"/>
        </w:lvlOverride>

    Args:
        element: The <w:lvlOverride> element or None

    Returns:
        LevelOverride model or None if element is None
    """
    if element is None:
        return None

    # Required: level index
    ilvl = get_int_attribute(element, "ilvl")
    if ilvl is None:
        return None

    # Start override
    start_override_elem = find_child(element, "startOverride")
    start_override = (
        get_int_attribute(start_override_elem, "val") if start_override_elem is not None else None
    )

    # Level override (full level replacement)
    lvl = parse_level(find_child(element, "lvl"))

    return LevelOverride(
        ilvl=ilvl,
        start_override=start_override,
        lvl=lvl,
    )


def parse_numbering_instance(element: Element | None) -> NumberingInstance | None:
    """Parse <w:num> element.

    XML Example:
        <w:num w:numId="1">
            <w:abstractNumId w:val="0"/>
            <w:lvlOverride w:ilvl="0">
                <w:startOverride w:val="5"/>
            </w:lvlOverride>
        </w:num>

    Args:
        element: The <w:num> element or None

    Returns:
        NumberingInstance model or None if element is None
    """
    if element is None:
        return None

    # Required: numbering ID
    num_id = get_int_attribute(element, "numId")
    if num_id is None:
        return None

    # Reference to abstract numbering
    abstract_num_id_elem = find_child(element, "abstractNumId")
    abstract_num_id = (
        get_int_attribute(abstract_num_id_elem, "val") if abstract_num_id_elem is not None else None
    )

    # Level overrides
    lvl_overrides = None
    override_elements = find_all_children(element, "lvlOverride")
    if override_elements:
        lvl_overrides = []
        for override_elem in override_elements:
            override = parse_level_override(override_elem)
            if override is not None:
                lvl_overrides.append(override)

    return NumberingInstance(
        num_id=num_id,
        abstract_num_id=abstract_num_id,
        lvl_override=lvl_overrides if lvl_overrides else None,
    )
