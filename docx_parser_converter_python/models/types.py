"""Type definitions for DOCX models.

This module contains all Literal types (enums) used across the models.
Based on the OOXML specification and docs/schemas/document.xml.md.
"""

from typing import Literal

# =============================================================================
# Justification and Alignment
# =============================================================================

JustificationType = Literal["left", "center", "right", "both", "distribute", "start", "end"]
"""Paragraph and table justification."""

VAlignType = Literal["top", "center", "bottom"]
"""Vertical alignment for table cells."""

VertAlignType = Literal["baseline", "superscript", "subscript"]
"""Vertical alignment for text (run properties)."""

TextDirectionType = Literal["lrTb", "tbRl", "btLr", "lrTbV", "tbRlV", "tbLrV"]
"""Text direction in a paragraph or cell."""

# =============================================================================
# Spacing and Sizing
# =============================================================================

LineRuleType = Literal["auto", "exact", "atLeast"]
"""Line spacing rule."""

WidthType = Literal["dxa", "pct", "auto", "nil"]
"""Width type for tables and cells."""

HeightRuleType = Literal["auto", "exact", "atLeast"]
"""Height rule for table rows."""

# =============================================================================
# Borders
# =============================================================================

BorderStyleType = Literal[
    "nil",
    "none",
    "single",
    "thick",
    "double",
    "dotted",
    "dashed",
    "dotDash",
    "dotDotDash",
    "triple",
    "thinThickSmallGap",
    "thickThinSmallGap",
    "thinThickThinSmallGap",
    "thinThickMediumGap",
    "thickThinMediumGap",
    "thinThickThinMediumGap",
    "thinThickLargeGap",
    "thickThinLargeGap",
    "thinThickThinLargeGap",
    "wave",
    "doubleWave",
    "dashSmallGap",
    "dashDotStroked",
    "threeDEmboss",
    "threeDEngrave",
    "outset",
    "inset",
]
"""Border style values."""

# =============================================================================
# Shading
# =============================================================================

ShadingPatternType = Literal[
    "clear",
    "solid",
    "nil",
    "horzStripe",
    "vertStripe",
    "reverseDiagStripe",
    "diagStripe",
    "horzCross",
    "diagCross",
    "thinHorzStripe",
    "thinVertStripe",
    "thinReverseDiagStripe",
    "thinDiagStripe",
    "thinHorzCross",
    "thinDiagCross",
    "pct5",
    "pct10",
    "pct12",
    "pct15",
    "pct20",
    "pct25",
    "pct30",
    "pct35",
    "pct37",
    "pct40",
    "pct45",
    "pct50",
    "pct55",
    "pct60",
    "pct62",
    "pct65",
    "pct70",
    "pct75",
    "pct80",
    "pct85",
    "pct87",
    "pct90",
    "pct95",
]
"""Shading pattern values."""

# =============================================================================
# Colors
# =============================================================================

ThemeColorType = Literal[
    "dark1",
    "light1",
    "dark2",
    "light2",
    "accent1",
    "accent2",
    "accent3",
    "accent4",
    "accent5",
    "accent6",
    "hyperlink",
    "followedHyperlink",
    "background1",
    "text1",
    "background2",
    "text2",
]
"""Theme color identifiers."""

HighlightType = Literal[
    "black",
    "blue",
    "cyan",
    "darkBlue",
    "darkCyan",
    "darkGray",
    "darkGreen",
    "darkMagenta",
    "darkRed",
    "darkYellow",
    "green",
    "lightGray",
    "magenta",
    "none",
    "red",
    "white",
    "yellow",
]
"""Highlight (background) color names."""

# =============================================================================
# Underline
# =============================================================================

UnderlineType = Literal[
    "none",
    "single",
    "words",
    "double",
    "thick",
    "dotted",
    "dottedHeavy",
    "dash",
    "dashedHeavy",
    "dashLong",
    "dashLongHeavy",
    "dotDash",
    "dashDotHeavy",
    "dotDotDash",
    "dashDotDotHeavy",
    "wave",
    "wavyHeavy",
    "wavyDouble",
]
"""Underline style values."""

# =============================================================================
# Tabs
# =============================================================================

TabType = Literal["left", "center", "right", "decimal", "bar", "clear", "num"]
"""Tab stop type."""

TabLeaderType = Literal["none", "dot", "hyphen", "underscore", "heavy", "middleDot"]
"""Tab leader character."""

# =============================================================================
# Breaks and Special Characters
# =============================================================================

BreakType = Literal["page", "column", "textWrapping"]
"""Break type."""

BreakClearType = Literal["none", "left", "right", "all"]
"""Break clear location (for textWrapping breaks)."""

# =============================================================================
# Tables
# =============================================================================

TableLayoutType = Literal["fixed", "autofit"]
"""Table layout algorithm."""

VMergeType = Literal["restart", "continue"]
"""Vertical merge type for table cells."""

# =============================================================================
# Sections
# =============================================================================

SectionType = Literal["nextPage", "continuous", "evenPage", "oddPage", "nextColumn"]
"""Section break type."""

OrientType = Literal["portrait", "landscape"]
"""Page orientation."""

# =============================================================================
# Fonts
# =============================================================================

FontHintType = Literal["default", "eastAsia", "cs", "ascii", "hAnsi"]
"""Font hint for character classification."""

# =============================================================================
# Frames
# =============================================================================

FrameWrapType = Literal["auto", "notBeside", "around", "tight", "through", "none"]
"""Frame text wrap type."""

FrameAnchorType = Literal["text", "margin", "page"]
"""Frame anchor location."""

DropCapType = Literal["none", "drop", "margin"]
"""Drop cap type."""

# =============================================================================
# Fields
# =============================================================================

FieldCharType = Literal["begin", "separate", "end"]
"""Field character type."""

# =============================================================================
# Numbering
# =============================================================================

NumFmtType = Literal[
    "decimal",
    "upperRoman",
    "lowerRoman",
    "upperLetter",
    "lowerLetter",
    "ordinal",
    "cardinalText",
    "ordinalText",
    "hex",
    "chicago",
    "ideographDigital",
    "japaneseCounting",
    "aiueo",
    "iroha",
    "decimalFullWidth",
    "decimalHalfWidth",
    "japaneseLegal",
    "japaneseDigitalTenThousand",
    "decimalEnclosedCircle",
    "decimalFullWidth2",
    "aiueoFullWidth",
    "irohaFullWidth",
    "decimalZero",
    "bullet",
    "ganada",
    "chosung",
    "decimalEnclosedFullstop",
    "decimalEnclosedParen",
    "decimalEnclosedCircleChinese",
    "ideographEnclosedCircle",
    "ideographTraditional",
    "ideographZodiac",
    "ideographZodiacTraditional",
    "taiwaneseCounting",
    "ideographLegalTraditional",
    "taiwaneseCountingThousand",
    "taiwaneseDigital",
    "chineseCounting",
    "chineseLegalSimplified",
    "chineseCountingThousand",
    "koreanDigital",
    "koreanCounting",
    "koreanLegal",
    "koreanDigital2",
    "vietnameseCounting",
    "russianLower",
    "russianUpper",
    "none",
    "numberInDash",
    "hebrew1",
    "hebrew2",
    "arabicAlpha",
    "arabicAbjad",
    "hindiVowels",
    "hindiConsonants",
    "hindiNumbers",
    "hindiCounting",
    "thaiLetters",
    "thaiNumbers",
    "thaiCounting",
    "bahtText",
    "dollarText",
]
"""Numbering format type."""

MultiLevelType = Literal["singleLevel", "multilevel", "hybridMultilevel"]
"""Multi-level numbering type."""

LevelSuffixType = Literal["tab", "space", "nothing"]
"""Level suffix type (character after number)."""

LevelJcType = Literal["left", "center", "right"]
"""Level justification type."""

# =============================================================================
# Styles
# =============================================================================

StyleType = Literal["paragraph", "character", "table", "numbering"]
"""Style type."""

TableStyleConditionType = Literal[
    "wholeTable",
    "firstRow",
    "lastRow",
    "firstCol",
    "lastCol",
    "band1Vert",
    "band2Vert",
    "band1Horz",
    "band2Horz",
    "neCell",
    "nwCell",
    "seCell",
    "swCell",
]
"""Table style conditional formatting type."""
