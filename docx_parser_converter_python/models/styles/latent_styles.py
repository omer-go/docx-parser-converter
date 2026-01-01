"""Latent styles models for DOCX documents.

Latent styles are built-in styles that are hidden until used.
"""

from __future__ import annotations

from pydantic import BaseModel


class LatentStyleException(BaseModel):
    """Exception to default latent style settings.

    XML Element: <w:lsdException>

    XML Example:
        <w:lsdException w:name="heading 1" w:uiPriority="9" w:qFormat="1"/>

    Attributes:
        name: Style name
        locked: Whether style is locked
        ui_priority: UI sort priority
        semi_hidden: Semi-hidden from UI
        unhide_when_used: Show when used
        q_format: Show in Quick Styles gallery
    """

    name: str | None = None
    locked: bool | None = None
    ui_priority: int | None = None
    semi_hidden: bool | None = None
    unhide_when_used: bool | None = None
    q_format: bool | None = None

    model_config = {"extra": "ignore"}


class LatentStyles(BaseModel):
    """Latent styles container with defaults.

    XML Element: <w:latentStyles>

    XML Example:
        <w:latentStyles w:defLockedState="0" w:defUIPriority="99"
                        w:defSemiHidden="0" w:defUnhideWhenUsed="0"
                        w:defQFormat="0" w:count="376">
            <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>
            ...
        </w:latentStyles>

    Attributes:
        def_locked_state: Default locked state
        def_ui_priority: Default UI priority
        def_semi_hidden: Default semi-hidden state
        def_unhide_when_used: Default unhide when used
        def_q_format: Default quick format
        count: Number of latent styles
        lsd_exception: List of style exceptions
    """

    def_locked_state: bool | None = None
    def_ui_priority: int | None = None
    def_semi_hidden: bool | None = None
    def_unhide_when_used: bool | None = None
    def_q_format: bool | None = None
    count: int | None = None
    lsd_exception: list[LatentStyleException] = []

    model_config = {"extra": "ignore"}
