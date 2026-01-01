"""Run models for DOCX documents.

A run is a contiguous region of text with the same formatting.
"""

from __future__ import annotations

from pydantic import BaseModel

from models.common.border import Border
from models.common.color import Color
from models.common.shading import Shading


class Language(BaseModel):
    """Language settings for a run.

    XML Element: <w:lang>

    XML Example:
        <w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/>

    Attributes:
        val: Primary language (e.g., "en-US")
        east_asia: East Asian language
        bidi: Complex script language
    """

    val: str | None = None
    east_asia: str | None = None
    bidi: str | None = None

    model_config = {"extra": "ignore"}


class RunFonts(BaseModel):
    """Font settings for a run.

    XML Element: <w:rFonts>

    XML Example:
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>

    Attributes:
        ascii: Font for ASCII characters (0x00-0x7F)
        h_ansi: Font for high ANSI characters (0x80-0xFF)
        east_asia: Font for East Asian characters
        cs: Font for complex script characters
        hint: Which font to use when ambiguous
    """

    ascii: str | None = None
    h_ansi: str | None = None
    east_asia: str | None = None
    cs: str | None = None
    hint: str | None = None

    model_config = {"extra": "ignore"}


class Underline(BaseModel):
    """Underline settings for a run.

    XML Element: <w:u>

    XML Example:
        <w:u w:val="single" w:color="FF0000"/>

    Attributes:
        val: Underline style
        color: Underline color (RGB hex)
        theme_color: Theme color for underline
    """

    val: str | None = None
    color: str | None = None
    theme_color: str | None = None

    model_config = {"extra": "ignore"}


class RunProperties(BaseModel):
    """Formatting properties for a run.

    XML Element: <w:rPr>

    Attributes:
        r_style: Character style ID reference
        r_fonts: Font settings
        b: Bold
        b_cs: Bold for complex script
        i: Italic
        i_cs: Italic for complex script
        caps: All caps
        small_caps: Small caps
        strike: Strikethrough
        dstrike: Double strikethrough
        outline: Outline effect
        shadow: Shadow effect
        emboss: Emboss effect
        imprint: Imprint (engrave) effect
        vanish: Hidden text
        color: Text color
        spacing: Character spacing (in twips)
        w: Character width scaling (percentage, 100 = normal)
        kern: Kerning threshold (in half-points)
        position: Vertical position offset (in half-points)
        sz: Font size (in half-points, so 24 = 12pt)
        sz_cs: Font size for complex script
        highlight: Highlight color
        u: Underline settings
        effect: Text effect (deprecated)
        bdr: Character border
        shd: Character shading
        vert_align: Vertical alignment (superscript/subscript)
        lang: Language settings
        spec_vanish: Special hidden text
    """

    r_style: str | None = None
    r_fonts: RunFonts | None = None
    b: bool | None = None
    b_cs: bool | None = None
    i: bool | None = None
    i_cs: bool | None = None
    caps: bool | None = None
    small_caps: bool | None = None
    strike: bool | None = None
    dstrike: bool | None = None
    outline: bool | None = None
    shadow: bool | None = None
    emboss: bool | None = None
    imprint: bool | None = None
    vanish: bool | None = None
    color: Color | None = None
    spacing: int | None = None
    w: int | None = None
    kern: int | None = None
    position: int | None = None
    sz: int | None = None
    sz_cs: int | None = None
    highlight: str | None = None
    u: Underline | None = None
    effect: str | None = None
    bdr: Border | None = None
    shd: Shading | None = None
    vert_align: str | None = None
    lang: Language | None = None
    spec_vanish: bool | None = None

    model_config = {"extra": "ignore"}


class Run(BaseModel):
    """A run of text with consistent formatting.

    XML Element: <w:r>

    A run is a contiguous region of text that shares the same formatting.
    It contains run properties (optional) and content (text, breaks, etc.).

    XML Example:
        <w:r>
            <w:rPr>
                <w:b/>
                <w:sz w:val="24"/>
            </w:rPr>
            <w:t>Bold text</w:t>
        </w:r>

    Attributes:
        r_pr: Run properties (formatting)
        content: List of content items (Text, Break, TabChar, etc.)
    """

    r_pr: RunProperties | None = None
    content: list = []  # List of RunContentItem, but avoiding circular import

    model_config = {"extra": "ignore"}
