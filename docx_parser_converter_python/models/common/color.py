"""Color model for DOCX elements.

Represents the <w:color> element used in run properties and other contexts.
"""

from pydantic import BaseModel


class Color(BaseModel):
    """Color specification for text and other elements.

    Can specify color using:
    - Direct RGB value (val)
    - Theme color reference (theme_color with optional tint/shade)

    XML Example:
        <w:color w:val="FF0000"/>
        <w:color w:themeColor="accent1" w:themeTint="80"/>

    Attributes:
        val: RGB color value (e.g., "FF0000" for red, "auto" for automatic)
        theme_color: Theme color identifier (e.g., "accent1", "dark1")
        theme_tint: Tint applied to theme color (hex string, 00-FF)
        theme_shade: Shade applied to theme color (hex string, 00-FF)
    """

    val: str | None = None
    theme_color: str | None = None
    theme_tint: str | None = None
    theme_shade: str | None = None

    model_config = {"extra": "ignore"}
