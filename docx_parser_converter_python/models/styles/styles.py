"""Styles root model for DOCX documents.

The Styles model is the root container for all style definitions.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.styles.document_defaults import DocumentDefaults
from models.styles.latent_styles import LatentStyles
from models.styles.style import Style


class Styles(BaseModel):
    """Root container for all style definitions.

    XML Element: <w:styles>

    XML Example:
        <w:styles xmlns:w="...">
            <w:docDefaults>...</w:docDefaults>
            <w:latentStyles>...</w:latentStyles>
            <w:style>...</w:style>
            <w:style>...</w:style>
        </w:styles>

    Attributes:
        doc_defaults: Document defaults (base formatting)
        latent_styles: Latent styles settings
        style: List of style definitions
    """

    doc_defaults: DocumentDefaults | None = None
    latent_styles: LatentStyles | None = None
    style: list[Style] = []

    model_config = {"extra": "ignore"}
