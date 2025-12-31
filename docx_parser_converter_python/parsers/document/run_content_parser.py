"""Parsers for run content elements.

These are elements that can appear inside a run (<w:r>).
"""
from lxml.etree import _Element as Element

from models.document.run_content import (
    Break,
    CarriageReturn,
    EndnoteReference,
    FieldChar,
    FootnoteReference,
    InstrText,
    NoBreakHyphen,
    RunContentItem,
    SoftHyphen,
    Symbol,
    TabChar,
    Text,
)
from parsers.utils import (
    get_attribute,
    get_bool_attribute,
    get_int_attribute,
    get_local_name,
    get_text_content,
)


def parse_text(element: Element | None) -> Text | None:
    """Parse <w:t> element.

    XML Examples:
        <w:t>Hello World</w:t>
        <w:t xml:space="preserve"> with spaces </w:t>

    Args:
        element: The <w:t> element or None

    Returns:
        Text model or None if element is None
    """
    if element is None:
        return None

    # xml:space is in the XML namespace, not WORD_NS
    space = element.get("{http://www.w3.org/XML/1998/namespace}space")

    return Text(
        value=get_text_content(element),
        space=space,
    )


def parse_break(element: Element | None) -> Break | None:
    """Parse <w:br> element.

    XML Examples:
        <w:br/>                           (line break)
        <w:br w:type="page"/>             (page break)
        <w:br w:type="column"/>           (column break)
        <w:br w:type="textWrapping" w:clear="all"/>

    Args:
        element: The <w:br> element or None

    Returns:
        Break model or None if element is None
    """
    if element is None:
        return None

    return Break(
        type=get_attribute(element, "type"),
        clear=get_attribute(element, "clear"),
    )


def parse_tab_char(element: Element | None) -> TabChar | None:
    """Parse <w:tab/> element.

    Args:
        element: The <w:tab> element or None

    Returns:
        TabChar model or None if element is None
    """
    if element is None:
        return None

    return TabChar()


def parse_carriage_return(element: Element | None) -> CarriageReturn | None:
    """Parse <w:cr/> element.

    Args:
        element: The <w:cr> element or None

    Returns:
        CarriageReturn model or None if element is None
    """
    if element is None:
        return None

    return CarriageReturn()


def parse_soft_hyphen(element: Element | None) -> SoftHyphen | None:
    """Parse <w:softHyphen/> element.

    Args:
        element: The <w:softHyphen> element or None

    Returns:
        SoftHyphen model or None if element is None
    """
    if element is None:
        return None

    return SoftHyphen()


def parse_no_break_hyphen(element: Element | None) -> NoBreakHyphen | None:
    """Parse <w:noBreakHyphen/> element.

    Args:
        element: The <w:noBreakHyphen> element or None

    Returns:
        NoBreakHyphen model or None if element is None
    """
    if element is None:
        return None

    return NoBreakHyphen()


def parse_symbol(element: Element | None) -> Symbol | None:
    """Parse <w:sym> element.

    XML Example:
        <w:sym w:font="Wingdings" w:char="F0FC"/>

    Args:
        element: The <w:sym> element or None

    Returns:
        Symbol model or None if element is None
    """
    if element is None:
        return None

    return Symbol(
        font=get_attribute(element, "font"),
        char=get_attribute(element, "char"),
    )


def parse_field_char(element: Element | None) -> FieldChar | None:
    """Parse <w:fldChar> element.

    XML Examples:
        <w:fldChar w:fldCharType="begin"/>
        <w:fldChar w:fldCharType="separate"/>
        <w:fldChar w:fldCharType="end"/>

    Args:
        element: The <w:fldChar> element or None

    Returns:
        FieldChar model or None if element is None
    """
    if element is None:
        return None

    return FieldChar(
        fld_char_type=get_attribute(element, "fldCharType"),
        dirty=get_bool_attribute(element, "dirty"),
    )


def parse_instr_text(element: Element | None) -> InstrText | None:
    """Parse <w:instrText> element.

    XML Example:
        <w:instrText xml:space="preserve"> PAGE </w:instrText>

    Args:
        element: The <w:instrText> element or None

    Returns:
        InstrText model or None if element is None
    """
    if element is None:
        return None

    space = element.get("{http://www.w3.org/XML/1998/namespace}space")

    return InstrText(
        value=get_text_content(element),
        space=space,
    )


def parse_footnote_reference(element: Element | None) -> FootnoteReference | None:
    """Parse <w:footnoteReference> element.

    XML Example:
        <w:footnoteReference w:id="1"/>

    Args:
        element: The <w:footnoteReference> element or None

    Returns:
        FootnoteReference model or None if element is None
    """
    if element is None:
        return None

    return FootnoteReference(
        id=get_int_attribute(element, "id"),
    )


def parse_endnote_reference(element: Element | None) -> EndnoteReference | None:
    """Parse <w:endnoteReference> element.

    XML Example:
        <w:endnoteReference w:id="1"/>

    Args:
        element: The <w:endnoteReference> element or None

    Returns:
        EndnoteReference model or None if element is None
    """
    if element is None:
        return None

    return EndnoteReference(
        id=get_int_attribute(element, "id"),
    )


# Mapping of tag names to parser functions
_RUN_CONTENT_PARSERS = {
    "t": parse_text,
    "br": parse_break,
    "tab": parse_tab_char,
    "cr": parse_carriage_return,
    "softHyphen": parse_soft_hyphen,
    "noBreakHyphen": parse_no_break_hyphen,
    "sym": parse_symbol,
    "fldChar": parse_field_char,
    "instrText": parse_instr_text,
    "footnoteReference": parse_footnote_reference,
    "endnoteReference": parse_endnote_reference,
}


def parse_run_content_item(element: Element | None) -> RunContentItem | None:
    """Parse any run content element.

    Dispatches to the appropriate parser based on the element's tag name.

    Args:
        element: A run content element or None

    Returns:
        Appropriate model or None if element is None or unrecognized
    """
    if element is None:
        return None

    local_name = get_local_name(element)
    parser = _RUN_CONTENT_PARSERS.get(local_name)

    if parser is None:
        return None

    return parser(element)
