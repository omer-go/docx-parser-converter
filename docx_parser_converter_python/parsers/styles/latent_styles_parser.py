"""Parser for latent styles elements."""

from lxml.etree import _Element as Element

from models.styles.latent_styles import LatentStyleException, LatentStyles
from parsers.utils import find_all_children, get_attribute, get_int_attribute, parse_toggle


def parse_latent_style_exception(element: Element | None) -> LatentStyleException | None:
    """Parse <w:lsdException> element.

    XML Example:
        <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>

    Args:
        element: The <w:lsdException> element or None

    Returns:
        LatentStyleException model or None if element is None
    """
    if element is None:
        return None

    return LatentStyleException(
        name=get_attribute(element, "name"),
        locked=parse_toggle(element) if get_attribute(element, "locked") is not None else None,
        ui_priority=get_int_attribute(element, "uiPriority"),
        semi_hidden=parse_toggle(element)
        if get_attribute(element, "semiHidden") is not None
        else None,
        unhide_when_used=parse_toggle(element)
        if get_attribute(element, "unhideWhenUsed") is not None
        else None,
        q_format=parse_toggle(element) if get_attribute(element, "qFormat") is not None else None,
    )


def parse_latent_styles(element: Element | None) -> LatentStyles | None:
    """Parse <w:latentStyles> element.

    XML Example:
        <w:latentStyles w:defLockedState="0" w:defUIPriority="99"
                        w:defSemiHidden="0" w:defUnhideWhenUsed="0"
                        w:defQFormat="0" w:count="376">
            <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>
            <w:lsdException w:name="heading 1" w:uiPriority="9" w:qFormat="1"/>
        </w:latentStyles>

    Args:
        element: The <w:latentStyles> element or None

    Returns:
        LatentStyles model or None if element is None
    """
    if element is None:
        return None

    # Parse exceptions
    exceptions = []
    for exc_elem in find_all_children(element, "lsdException"):
        exc = parse_latent_style_exception(exc_elem)
        if exc is not None:
            exceptions.append(exc)

    return LatentStyles(
        def_locked_state=parse_toggle(element)
        if get_attribute(element, "defLockedState") is not None
        else None,
        def_ui_priority=get_int_attribute(element, "defUIPriority"),
        def_semi_hidden=parse_toggle(element)
        if get_attribute(element, "defSemiHidden") is not None
        else None,
        def_unhide_when_used=parse_toggle(element)
        if get_attribute(element, "defUnhideWhenUsed") is not None
        else None,
        def_q_format=parse_toggle(element)
        if get_attribute(element, "defQFormat") is not None
        else None,
        count=get_int_attribute(element, "count"),
        lsd_exception=exceptions,
    )
