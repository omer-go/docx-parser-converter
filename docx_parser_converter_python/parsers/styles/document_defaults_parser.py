"""Parser for document defaults elements."""

from lxml.etree import _Element as Element

from models.styles.document_defaults import (
    DocumentDefaults,
    ParagraphPropertiesDefault,
    RunPropertiesDefault,
)
from parsers.document.paragraph_properties_parser import parse_paragraph_properties
from parsers.document.run_properties_parser import parse_run_properties
from parsers.utils import find_child


def parse_run_properties_default(element: Element | None) -> RunPropertiesDefault | None:
    """Parse <w:rPrDefault> element.

    XML Example:
        <w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Times New Roman"/>
                <w:sz w:val="24"/>
            </w:rPr>
        </w:rPrDefault>

    Args:
        element: The <w:rPrDefault> element or None

    Returns:
        RunPropertiesDefault model or None if element is None
    """
    if element is None:
        return None

    r_pr_elem = find_child(element, "rPr")
    r_pr = None
    if r_pr_elem is not None:
        parsed_r_pr = parse_run_properties(r_pr_elem)
        if parsed_r_pr is not None:
            r_pr = parsed_r_pr.model_dump(exclude_none=True)

    return RunPropertiesDefault(
        r_pr=r_pr,
    )


def parse_paragraph_properties_default(
    element: Element | None,
) -> ParagraphPropertiesDefault | None:
    """Parse <w:pPrDefault> element.

    XML Example:
        <w:pPrDefault>
            <w:pPr>
                <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
            </w:pPr>
        </w:pPrDefault>

    Args:
        element: The <w:pPrDefault> element or None

    Returns:
        ParagraphPropertiesDefault model or None if element is None
    """
    if element is None:
        return None

    p_pr_elem = find_child(element, "pPr")
    p_pr = None
    if p_pr_elem is not None:
        parsed_p_pr = parse_paragraph_properties(p_pr_elem)
        if parsed_p_pr is not None:
            p_pr = parsed_p_pr.model_dump(exclude_none=True)

    return ParagraphPropertiesDefault(
        p_pr=p_pr,
    )


def parse_document_defaults(element: Element | None) -> DocumentDefaults | None:
    """Parse <w:docDefaults> element.

    XML Example:
        <w:docDefaults>
            <w:rPrDefault>...</w:rPrDefault>
            <w:pPrDefault>...</w:pPrDefault>
        </w:docDefaults>

    Args:
        element: The <w:docDefaults> element or None

    Returns:
        DocumentDefaults model or None if element is None
    """
    if element is None:
        return None

    r_pr_default = parse_run_properties_default(find_child(element, "rPrDefault"))
    p_pr_default = parse_paragraph_properties_default(find_child(element, "pPrDefault"))

    return DocumentDefaults(
        r_pr_default=r_pr_default,
        p_pr_default=p_pr_default,
    )
