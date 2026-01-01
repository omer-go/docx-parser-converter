"""Document and body models for DOCX documents.

The document is the root element containing the body.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.document.section import SectionProperties


class Body(BaseModel):
    """The body of a document.

    XML Element: <w:body>

    The body contains all document content (paragraphs, tables, etc.)
    and optionally section properties.

    Attributes:
        content: List of paragraphs, tables, and other block-level elements
        sect_pr: Section properties for the final section
    """

    content: list = []  # List of Paragraph | Table | StructuredDocumentTag
    sect_pr: SectionProperties | None = None

    model_config = {"extra": "ignore"}


class Document(BaseModel):
    """The root document element.

    XML Element: <w:document>

    XML Example:
        <w:document xmlns:w="...">
            <w:body>
                <w:p>...</w:p>
                <w:tbl>...</w:tbl>
                <w:sectPr>...</w:sectPr>
            </w:body>
        </w:document>

    Attributes:
        body: The document body
    """

    body: Body

    model_config = {"extra": "ignore"}
