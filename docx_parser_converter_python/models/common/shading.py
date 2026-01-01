"""Shading model for DOCX elements.

Represents the <w:shd> element used in paragraphs, tables, and cells.
"""

from pydantic import BaseModel


class Shading(BaseModel):
    """Shading (background) specification.

    Shading can be:
    - Solid color fill
    - Pattern with foreground and background colors
    - Theme-based colors

    XML Example:
        <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
        <w:shd w:val="pct25" w:color="000000" w:fill="FFFFFF"/>

    Attributes:
        val: Shading pattern type (e.g., "clear" for solid, "pct25" for 25%)
        color: Foreground color for pattern (RGB hex or "auto")
        fill: Background fill color (RGB hex or "auto")
        theme_color: Theme color for foreground (e.g., "accent1")
        theme_fill: Theme color for background fill
        theme_tint: Tint applied to theme_color
        theme_shade: Shade applied to theme_color
        theme_fill_tint: Tint applied to theme_fill
        theme_fill_shade: Shade applied to theme_fill
    """

    val: str | None = None
    color: str | None = None
    fill: str | None = None
    theme_color: str | None = None
    theme_fill: str | None = None
    theme_tint: str | None = None
    theme_shade: str | None = None
    theme_fill_tint: str | None = None
    theme_fill_shade: str | None = None

    model_config = {"extra": "ignore"}
