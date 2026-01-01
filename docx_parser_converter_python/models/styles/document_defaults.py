"""Document defaults models for DOCX styles.

Document defaults define base formatting applied to all content.
"""

from __future__ import annotations

from pydantic import BaseModel


class RunPropertiesDefault(BaseModel):
    """Default run properties wrapper.

    XML Element: <w:rPrDefault>

    XML Example:
        <w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Times New Roman"/>
                <w:sz w:val="24"/>
            </w:rPr>
        </w:rPrDefault>

    Attributes:
        r_pr: Default run properties (using dict to avoid circular import)
    """

    r_pr: dict | None = None  # Actually RunProperties

    model_config = {"extra": "ignore"}


class ParagraphPropertiesDefault(BaseModel):
    """Default paragraph properties wrapper.

    XML Element: <w:pPrDefault>

    XML Example:
        <w:pPrDefault>
            <w:pPr>
                <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
            </w:pPr>
        </w:pPrDefault>

    Attributes:
        p_pr: Default paragraph properties (using dict to avoid circular import)
    """

    p_pr: dict | None = None  # Actually ParagraphProperties

    model_config = {"extra": "ignore"}


class DocumentDefaults(BaseModel):
    """Document defaults for base formatting.

    XML Element: <w:docDefaults>

    Contains default run and paragraph properties applied to all content
    before any styles are applied.

    XML Example:
        <w:docDefaults>
            <w:rPrDefault>...</w:rPrDefault>
            <w:pPrDefault>...</w:pPrDefault>
        </w:docDefaults>

    Attributes:
        r_pr_default: Default run properties wrapper
        p_pr_default: Default paragraph properties wrapper
    """

    r_pr_default: RunPropertiesDefault | None = None
    p_pr_default: ParagraphPropertiesDefault | None = None

    model_config = {"extra": "ignore"}
