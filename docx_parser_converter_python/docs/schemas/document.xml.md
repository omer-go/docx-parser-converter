# document.xml Schema

## Overview

The `document.xml` file contains the main content of a Word document, including paragraphs, tables, images, and other content elements. It is the primary XML file that represents the document body.

---

## XML Structure Tree

```
w:document
└── w:body
    ├── w:p (Paragraph) [0..*]
    │   ├── w:pPr (ParagraphProperties) [0..1]
    │   │   ├── w:pStyle [0..1]
    │   │   ├── w:keepNext [0..1]
    │   │   ├── w:keepLines [0..1]
    │   │   ├── w:pageBreakBefore [0..1]
    │   │   ├── w:widowControl [0..1]
    │   │   ├── w:suppressLineNumbers [0..1]
    │   │   ├── w:pBdr (ParagraphBorders) [0..1]
    │   │   │   ├── w:top [0..1]
    │   │   │   ├── w:left [0..1]
    │   │   │   ├── w:bottom [0..1]
    │   │   │   ├── w:right [0..1]
    │   │   │   ├── w:between [0..1]
    │   │   │   └── w:bar [0..1]
    │   │   ├── w:shd (Shading) [0..1]
    │   │   ├── w:tabs [0..1]
    │   │   │   └── w:tab (TabStop) [0..*]
    │   │   ├── w:suppressAutoHyphens [0..1]
    │   │   ├── w:spacing (Spacing) [0..1]
    │   │   ├── w:ind (Indentation) [0..1]
    │   │   ├── w:jc [0..1]
    │   │   ├── w:outlineLvl [0..1]
    │   │   ├── w:numPr (NumberingProperties) [0..1]
    │   │   │   ├── w:ilvl [0..1]
    │   │   │   └── w:numId [0..1]
    │   │   ├── w:bidi [0..1]
    │   │   ├── w:rPr (RunProperties) [0..1]
    │   │   ├── w:textDirection [0..1]
    │   │   ├── w:textAlignment [0..1]
    │   │   └── w:framePr (FrameProperties) [0..1]
    │   ├── w:r (Run) [0..*]
    │   │   ├── w:rPr (RunProperties) [0..1]
    │   │   │   ├── w:rStyle [0..1]
    │   │   │   ├── w:rFonts (RunFonts) [0..1]
    │   │   │   ├── w:b [0..1]
    │   │   │   ├── w:bCs [0..1]
    │   │   │   ├── w:i [0..1]
    │   │   │   ├── w:iCs [0..1]
    │   │   │   ├── w:caps [0..1]
    │   │   │   ├── w:smallCaps [0..1]
    │   │   │   ├── w:strike [0..1]
    │   │   │   ├── w:dstrike [0..1]
    │   │   │   ├── w:outline [0..1]
    │   │   │   ├── w:shadow [0..1]
    │   │   │   ├── w:emboss [0..1]
    │   │   │   ├── w:imprint [0..1]
    │   │   │   ├── w:vanish [0..1]
    │   │   │   ├── w:color (Color) [0..1]
    │   │   │   ├── w:spacing [0..1]
    │   │   │   ├── w:w [0..1]
    │   │   │   ├── w:kern [0..1]
    │   │   │   ├── w:position [0..1]
    │   │   │   ├── w:sz [0..1]
    │   │   │   ├── w:szCs [0..1]
    │   │   │   ├── w:highlight [0..1]
    │   │   │   ├── w:u (Underline) [0..1]
    │   │   │   ├── w:effect [0..1]
    │   │   │   ├── w:bdr (Border) [0..1]
    │   │   │   ├── w:shd (Shading) [0..1]
    │   │   │   ├── w:vertAlign [0..1]
    │   │   │   ├── w:lang (Language) [0..1]
    │   │   │   └── w:specVanish [0..1]
    │   │   └── [Run Content] [0..*]
    │   │       ├── w:t (Text)
    │   │       ├── w:tab (TabCharacter)
    │   │       ├── w:br (Break)
    │   │       ├── w:cr (CarriageReturn)
    │   │       ├── w:sym (Symbol)
    │   │       ├── w:drawing (Drawing)
    │   │       ├── w:object (Object)
    │   │       ├── w:fldChar (FieldCharacter)
    │   │       ├── w:instrText (InstructionText)
    │   │       ├── w:footnoteReference (FootnoteReference)
    │   │       ├── w:endnoteReference (EndnoteReference)
    │   │       ├── w:commentReference (CommentReference)
    │   │       ├── w:softHyphen (SoftHyphen)
    │   │       └── w:noBreakHyphen (NoBreakHyphen)
    │   ├── w:hyperlink (Hyperlink) [0..*]
    │   │   └── w:r (Run) [0..*]
    │   ├── w:bookmarkStart (BookmarkStart) [0..*]
    │   └── w:bookmarkEnd (BookmarkEnd) [0..*]
    ├── w:tbl (Table) [0..*]
    │   ├── w:tblPr (TableProperties) [0..1]
    │   │   ├── w:tblStyle [0..1]
    │   │   ├── w:tblW (Width) [0..1]
    │   │   ├── w:jc [0..1]
    │   │   ├── w:tblInd (Width) [0..1]
    │   │   ├── w:tblBorders (TableBorders) [0..1]
    │   │   │   ├── w:top [0..1]
    │   │   │   ├── w:left [0..1]
    │   │   │   ├── w:bottom [0..1]
    │   │   │   ├── w:right [0..1]
    │   │   │   ├── w:insideH [0..1]
    │   │   │   └── w:insideV [0..1]
    │   │   ├── w:shd (Shading) [0..1]
    │   │   ├── w:tblLayout [0..1]
    │   │   ├── w:tblCellMar (TableCellMargins) [0..1]
    │   │   │   ├── w:top [0..1]
    │   │   │   ├── w:left [0..1]
    │   │   │   ├── w:bottom [0..1]
    │   │   │   └── w:right [0..1]
    │   │   └── w:tblLook (TableLook) [0..1]
    │   ├── w:tblGrid (TableGrid) [0..1]
    │   │   └── w:gridCol (GridColumn) [0..*]
    │   └── w:tr (TableRow) [0..*]
    │       ├── w:trPr (TableRowProperties) [0..1]
    │       │   ├── w:trHeight (RowHeight) [0..1]
    │       │   ├── w:tblHeader [0..1]
    │       │   ├── w:jc [0..1]
    │       │   ├── w:cantSplit [0..1]
    │       │   └── w:tblCellSpacing [0..1]
    │       └── w:tc (TableCell) [0..*]
    │           ├── w:tcPr (TableCellProperties) [0..1]
    │           │   ├── w:tcW (Width) [0..1]
    │           │   ├── w:tcBorders (TableBorders) [0..1]
    │           │   ├── w:shd (Shading) [0..1]
    │           │   ├── w:tcMar (TableCellMargins) [0..1]
    │           │   ├── w:textDirection [0..1]
    │           │   ├── w:vAlign [0..1]
    │           │   ├── w:gridSpan [0..1]
    │           │   ├── w:vMerge [0..1]
    │           │   ├── w:hMerge [0..1]
    │           │   ├── w:noWrap [0..1]
    │           │   ├── w:tcFitText [0..1]
    │           │   └── w:hideMark [0..1]
    │           └── [w:p | w:tbl] [0..*]
    └── w:sectPr (SectionProperties) [0..1]
        ├── w:pgSz (PageSize) [0..1]
        ├── w:pgMar (PageMargins) [0..1]
        ├── w:cols (Columns) [0..1]
        ├── w:docGrid (DocumentGrid) [0..1]
        ├── w:headerReference [0..*]
        ├── w:footerReference [0..*]
        ├── w:pgBorders (PageBorders) [0..1]
        ├── w:pgNumType (PageNumberType) [0..1]
        ├── w:type [0..1]
        ├── w:titlePg [0..1]
        └── w:lnNumType (LineNumberType) [0..1]
```

---

## Enumerated Values (Literals)

These are the allowed values for enumerated fields. Use `Literal` types in Pydantic models.

```python
from typing import Literal

# Justification (jc)
JustificationType = Literal["left", "center", "right", "both", "distribute", "start", "end"]

# Line spacing rule
LineRuleType = Literal["auto", "exact", "atLeast"]

# Tab stop type
TabType = Literal["left", "center", "right", "decimal", "bar", "clear", "num"]

# Tab leader
TabLeaderType = Literal["none", "dot", "hyphen", "underscore", "heavy", "middleDot"]

# Break type
BreakType = Literal["page", "column", "textWrapping"]

# Field character type
FieldCharType = Literal["begin", "separate", "end"]

# Vertical alignment (text)
VertAlignType = Literal["baseline", "superscript", "subscript"]

# Vertical alignment (cell)
VAlignType = Literal["top", "center", "bottom"]

# Vertical merge
VMergeType = Literal["restart", "continue"]

# Width type
WidthType = Literal["dxa", "pct", "auto", "nil"]

# Height rule
HeightRuleType = Literal["auto", "exact", "atLeast"]

# Page orientation
OrientType = Literal["portrait", "landscape"]

# Section type
SectionType = Literal["nextPage", "continuous", "evenPage", "oddPage", "nextColumn"]

# Table layout
TableLayoutType = Literal["fixed", "autofit"]

# Text direction
TextDirectionType = Literal["lrTb", "tbRl", "btLr", "lrTbV", "tbRlV", "tbLrV"]

# Highlight colors
HighlightType = Literal[
    "black", "blue", "cyan", "darkBlue", "darkCyan", "darkGray",
    "darkGreen", "darkMagenta", "darkRed", "darkYellow", "green",
    "lightGray", "magenta", "none", "red", "white", "yellow"
]

# Theme colors
ThemeColorType = Literal[
    "dark1", "light1", "dark2", "light2",
    "accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
    "hyperlink", "followedHyperlink", "background1", "text1", "background2", "text2"
]

# Underline style
UnderlineType = Literal[
    "single", "words", "double", "thick", "dotted", "dottedHeavy",
    "dash", "dashedHeavy", "dashLong", "dashLongHeavy", "dotDash",
    "dashDotHeavy", "dotDotDash", "dashDotDotHeavy", "wave", "wavyHeavy",
    "wavyDouble", "none"
]

# Border style
BorderStyleType = Literal[
    "nil", "none", "single", "thick", "double", "dotted", "dashed",
    "dotDash", "dotDotDash", "triple", "thinThickSmallGap", "thickThinSmallGap",
    "thinThickThinSmallGap", "thinThickMediumGap", "thickThinMediumGap",
    "thinThickThinMediumGap", "thinThickLargeGap", "thickThinLargeGap",
    "thinThickThinLargeGap", "wave", "doubleWave", "dashSmallGap",
    "dashDotStroked", "threeDEmboss", "threeDEngrave", "outset", "inset",
    # ... many more border styles
]

# Shading pattern
ShadingPatternType = Literal[
    "clear", "solid", "horzStripe", "vertStripe", "reverseDiagStripe",
    "diagStripe", "horzCross", "diagCross", "thinHorzStripe", "thinVertStripe",
    "thinReverseDiagStripe", "thinDiagStripe", "thinHorzCross", "thinDiagCross",
    "pct5", "pct10", "pct12", "pct15", "pct20", "pct25", "pct30", "pct35",
    "pct37", "pct40", "pct45", "pct50", "pct55", "pct60", "pct62", "pct65",
    "pct70", "pct75", "pct80", "pct85", "pct87", "pct90", "pct95", "nil"
]

# Font hint
FontHintType = Literal["default", "eastAsia", "cs", "ascii", "hAnsi"]

# Frame wrap type
FrameWrapType = Literal["auto", "notBeside", "around", "tight", "through", "none"]

# Frame anchor
FrameAnchorType = Literal["text", "margin", "page"]

# Drop cap type
DropCapType = Literal["none", "drop", "margin"]
```

---

## Root Structure

| XML Tag | Pydantic Model | Description |
|---------|----------------|-------------|
| `<w:document>` | `Document` | Root element of the document |
| `<w:body>` | `Body` | Container for all document content |

### Document Model

```python
class Document(BaseModel):
    body: Body
```

### Body Model

```python
class Body(BaseModel):
    content: List[Paragraph | Table | StructuredDocumentTag]
    sect_pr: Optional[SectionProperties] = None
```

---

## Paragraph (`<w:p>`)

### Paragraph Model

```python
class Paragraph(BaseModel):
    p_pr: Optional[ParagraphProperties] = None
    content: List[Run | Hyperlink | BookmarkStart | BookmarkEnd | StructuredDocumentTag] = []
```

---

## Paragraph Properties (`<w:pPr>`)

| XML Tag | Field Name | Type | Notes |
|---------|------------|------|-------|
| `<w:pStyle>` | `p_style` | `Optional[str]` | Style ID reference |
| `<w:keepNext>` | `keep_next` | `Optional[bool]` | Keep with next paragraph |
| `<w:keepLines>` | `keep_lines` | `Optional[bool]` | Keep lines together |
| `<w:pageBreakBefore>` | `page_break_before` | `Optional[bool]` | Page break before |
| `<w:widowControl>` | `widow_control` | `Optional[bool]` | Widow/orphan control |
| `<w:suppressLineNumbers>` | `suppress_line_numbers` | `Optional[bool]` | Suppress line numbers |
| `<w:pBdr>` | `p_bdr` | `Optional[ParagraphBorders]` | Paragraph borders |
| `<w:shd>` | `shd` | `Optional[Shading]` | Shading |
| `<w:tabs>` | `tabs` | `Optional[List[TabStop]]` | Tab stops |
| `<w:suppressAutoHyphens>` | `suppress_auto_hyphens` | `Optional[bool]` | Suppress auto-hyphenation |
| `<w:spacing>` | `spacing` | `Optional[Spacing]` | Paragraph spacing |
| `<w:ind>` | `ind` | `Optional[Indentation]` | Indentation |
| `<w:jc>` | `jc` | `Optional[JustificationType]` | Justification |
| `<w:outlineLvl>` | `outline_lvl` | `Optional[int]` | Outline level (0-9) |
| `<w:numPr>` | `num_pr` | `Optional[NumberingProperties]` | Numbering properties |
| `<w:bidi>` | `bidi` | `Optional[bool]` | Right-to-left paragraph |
| `<w:rPr>` | `r_pr` | `Optional[RunProperties]` | Default run properties |
| `<w:textDirection>` | `text_direction` | `Optional[TextDirectionType]` | Text direction |
| `<w:textAlignment>` | `text_alignment` | `Optional[str]` | Vertical text alignment |
| `<w:framePr>` | `frame_pr` | `Optional[FrameProperties]` | Frame properties |

### ParagraphProperties Model

```python
class ParagraphProperties(BaseModel):
    p_style: Optional[str] = None
    keep_next: Optional[bool] = None
    keep_lines: Optional[bool] = None
    page_break_before: Optional[bool] = None
    widow_control: Optional[bool] = None
    suppress_line_numbers: Optional[bool] = None
    p_bdr: Optional[ParagraphBorders] = None
    shd: Optional[Shading] = None
    tabs: Optional[List[TabStop]] = None
    suppress_auto_hyphens: Optional[bool] = None
    spacing: Optional[Spacing] = None
    ind: Optional[Indentation] = None
    jc: Optional[JustificationType] = None
    outline_lvl: Optional[int] = None
    num_pr: Optional[NumberingProperties] = None
    bidi: Optional[bool] = None
    r_pr: Optional[RunProperties] = None
    text_direction: Optional[TextDirectionType] = None
    text_alignment: Optional[str] = None
    frame_pr: Optional[FrameProperties] = None
```

---

## Numbering Properties (`<w:numPr>`)

```python
class NumberingProperties(BaseModel):
    ilvl: Optional[int] = None    # @w:val, level 0-8
    num_id: Optional[int] = None  # @w:val, numbering instance ID
```

---

## Tab Stop (`<w:tab>` in `<w:tabs>`)

| XML Attribute | Field Name | Type | Notes |
|---------------|------------|------|-------|
| `@w:val` | `val` | `TabType` | Tab type |
| `@w:pos` | `pos` | `float` | Position (twips → points) |
| `@w:leader` | `leader` | `Optional[TabLeaderType]` | Leader character |

```python
class TabStop(BaseModel):
    val: TabType
    pos: float
    leader: Optional[TabLeaderType] = None
```

---

## Spacing (`<w:spacing>`)

| XML Attribute | Field Name | Type | Notes |
|---------------|------------|------|-------|
| `@w:before` | `before` | `Optional[float]` | Space before (points) |
| `@w:after` | `after` | `Optional[float]` | Space after (points) |
| `@w:line` | `line` | `Optional[float]` | Line spacing value |
| `@w:lineRule` | `line_rule` | `Optional[LineRuleType]` | Line rule |
| `@w:beforeLines` | `before_lines` | `Optional[int]` | Space before in lines |
| `@w:afterLines` | `after_lines` | `Optional[int]` | Space after in lines |
| `@w:beforeAutospacing` | `before_autospacing` | `Optional[bool]` | Auto spacing before |
| `@w:afterAutospacing` | `after_autospacing` | `Optional[bool]` | Auto spacing after |

```python
class Spacing(BaseModel):
    before: Optional[float] = None
    after: Optional[float] = None
    line: Optional[float] = None
    line_rule: Optional[LineRuleType] = None
    before_lines: Optional[int] = None
    after_lines: Optional[int] = None
    before_autospacing: Optional[bool] = None
    after_autospacing: Optional[bool] = None
```

---

## Indentation (`<w:ind>`)

```python
class Indentation(BaseModel):
    left: Optional[float] = None        # @w:left (points)
    right: Optional[float] = None       # @w:right (points)
    first_line: Optional[float] = None  # @w:firstLine (positive indent)
    hanging: Optional[float] = None     # @w:hanging (negative first line)
    start: Optional[float] = None       # @w:start (for bidi)
    end: Optional[float] = None         # @w:end (for bidi)
```

---

## Run (`<w:r>`)

```python
class Run(BaseModel):
    r_pr: Optional[RunProperties] = None
    content: List[Text | TabCharacter | Break | CarriageReturn | Symbol | Drawing | Object | FieldCharacter | InstructionText | FootnoteReference | EndnoteReference | CommentReference | SoftHyphen | NoBreakHyphen] = []
```

---

## Run Content Elements

| XML Tag | Pydantic Model | Fields |
|---------|----------------|--------|
| `<w:t>` | `Text` | `value: str`, `space: Optional[str]` |
| `<w:tab/>` | `TabCharacter` | (empty) |
| `<w:br>` | `Break` | `type: Optional[BreakType]` |
| `<w:cr/>` | `CarriageReturn` | (empty) |
| `<w:sym>` | `Symbol` | `font: Optional[str]`, `char: Optional[str]` |
| `<w:drawing>` | `Drawing` | (complex) |
| `<w:object>` | `Object` | `id: Optional[str]` |
| `<w:fldChar>` | `FieldCharacter` | `fld_char_type: FieldCharType` |
| `<w:instrText>` | `InstructionText` | `value: str` |
| `<w:footnoteReference>` | `FootnoteReference` | `id: str` |
| `<w:endnoteReference>` | `EndnoteReference` | `id: str` |
| `<w:commentReference>` | `CommentReference` | `id: str` |
| `<w:softHyphen/>` | `SoftHyphen` | (empty) |
| `<w:noBreakHyphen/>` | `NoBreakHyphen` | (empty) |

```python
class Text(BaseModel):
    value: str
    space: Optional[Literal["preserve"]] = None  # @xml:space

class TabCharacter(BaseModel):
    """Tab character. Named TabCharacter to avoid conflict with TabStop model."""
    pass

class Break(BaseModel):
    type: Optional[BreakType] = None  # @w:type

class CarriageReturn(BaseModel):
    pass

class Symbol(BaseModel):
    font: Optional[str] = None  # @w:font
    char: Optional[str] = None  # @w:char

class FieldCharacter(BaseModel):
    fld_char_type: FieldCharType  # @w:fldCharType

class InstructionText(BaseModel):
    value: str

class FootnoteReference(BaseModel):
    id: str  # @w:id

class EndnoteReference(BaseModel):
    id: str  # @w:id

class CommentReference(BaseModel):
    id: str  # @w:id

class SoftHyphen(BaseModel):
    pass

class NoBreakHyphen(BaseModel):
    pass
```

---

## Run Properties (`<w:rPr>`)

| XML Tag | Field Name | Type | Notes |
|---------|------------|------|-------|
| `<w:rStyle>` | `r_style` | `Optional[str]` | Character style ID |
| `<w:rFonts>` | `r_fonts` | `Optional[RunFonts]` | Font settings |
| `<w:b>` | `b` | `Optional[bool]` | Bold |
| `<w:bCs>` | `b_cs` | `Optional[bool]` | Bold (complex script) |
| `<w:i>` | `i` | `Optional[bool]` | Italic |
| `<w:iCs>` | `i_cs` | `Optional[bool]` | Italic (complex script) |
| `<w:caps>` | `caps` | `Optional[bool]` | All capitals |
| `<w:smallCaps>` | `small_caps` | `Optional[bool]` | Small capitals |
| `<w:strike>` | `strike` | `Optional[bool]` | Strikethrough |
| `<w:dstrike>` | `dstrike` | `Optional[bool]` | Double strikethrough |
| `<w:outline>` | `outline` | `Optional[bool]` | Outline effect |
| `<w:shadow>` | `shadow` | `Optional[bool]` | Shadow effect |
| `<w:emboss>` | `emboss` | `Optional[bool]` | Emboss effect |
| `<w:imprint>` | `imprint` | `Optional[bool]` | Imprint/engrave |
| `<w:vanish>` | `vanish` | `Optional[bool]` | Hidden text |
| `<w:color>` | `color` | `Optional[Color]` | Text color |
| `<w:spacing>` | `spacing` | `Optional[float]` | Character spacing (points) |
| `<w:w>` | `w` | `Optional[int]` | Width scale percentage |
| `<w:kern>` | `kern` | `Optional[float]` | Kerning threshold (points) |
| `<w:position>` | `position` | `Optional[float]` | Vertical position (points) |
| `<w:sz>` | `sz` | `Optional[float]` | Font size (points) |
| `<w:szCs>` | `sz_cs` | `Optional[float]` | Font size complex script |
| `<w:highlight>` | `highlight` | `Optional[HighlightType]` | Highlight color |
| `<w:u>` | `u` | `Optional[Underline]` | Underline |
| `<w:effect>` | `effect` | `Optional[str]` | Text effect |
| `<w:bdr>` | `bdr` | `Optional[Border]` | Text border |
| `<w:shd>` | `shd` | `Optional[Shading]` | Shading |
| `<w:vertAlign>` | `vert_align` | `Optional[VertAlignType]` | Vertical alignment |
| `<w:lang>` | `lang` | `Optional[Language]` | Language |
| `<w:specVanish>` | `spec_vanish` | `Optional[bool]` | Special vanish |

```python
class RunProperties(BaseModel):
    r_style: Optional[str] = None
    r_fonts: Optional[RunFonts] = None
    b: Optional[bool] = None
    b_cs: Optional[bool] = None
    i: Optional[bool] = None
    i_cs: Optional[bool] = None
    caps: Optional[bool] = None
    small_caps: Optional[bool] = None
    strike: Optional[bool] = None
    dstrike: Optional[bool] = None
    outline: Optional[bool] = None
    shadow: Optional[bool] = None
    emboss: Optional[bool] = None
    imprint: Optional[bool] = None
    vanish: Optional[bool] = None
    color: Optional[Color] = None
    spacing: Optional[float] = None
    w: Optional[int] = None
    kern: Optional[float] = None
    position: Optional[float] = None
    sz: Optional[float] = None
    sz_cs: Optional[float] = None
    highlight: Optional[HighlightType] = None
    u: Optional[Underline] = None
    effect: Optional[str] = None
    bdr: Optional[Border] = None
    shd: Optional[Shading] = None
    vert_align: Optional[VertAlignType] = None
    lang: Optional[Language] = None
    spec_vanish: Optional[bool] = None
```

---

## Run Fonts (`<w:rFonts>`)

| XML Attribute | Field Name | Type | Notes |
|---------------|------------|------|-------|
| `@w:ascii` | `ascii` | `Optional[str]` | ASCII font |
| `@w:hAnsi` | `h_ansi` | `Optional[str]` | High ANSI font |
| `@w:eastAsia` | `east_asia` | `Optional[str]` | East Asian font |
| `@w:cs` | `cs` | `Optional[str]` | Complex script font |
| `@w:hint` | `hint` | `Optional[FontHintType]` | Font hint |

```python
class RunFonts(BaseModel):
    ascii: Optional[str] = None
    h_ansi: Optional[str] = None
    east_asia: Optional[str] = None
    cs: Optional[str] = None
    hint: Optional[FontHintType] = None
```

---

## Color (`<w:color>`)

```python
class Color(BaseModel):
    val: Optional[str] = None                      # @w:val (hex or "auto")
    theme_color: Optional[ThemeColorType] = None   # @w:themeColor
    theme_tint: Optional[str] = None               # @w:themeTint
    theme_shade: Optional[str] = None              # @w:themeShade
```

---

## Underline (`<w:u>`)

```python
class Underline(BaseModel):
    val: Optional[UnderlineType] = None            # @w:val
    color: Optional[str] = None                    # @w:color
    theme_color: Optional[ThemeColorType] = None   # @w:themeColor
```

---

## Shading (`<w:shd>`)

```python
class Shading(BaseModel):
    val: Optional[ShadingPatternType] = None       # @w:val
    color: Optional[str] = None                    # @w:color
    fill: Optional[str] = None                     # @w:fill
    theme_color: Optional[ThemeColorType] = None   # @w:themeColor
    theme_fill: Optional[ThemeColorType] = None    # @w:themeFill
```

---

## Border (`<w:bdr>`, `<w:top>`, etc.)

```python
class Border(BaseModel):
    val: Optional[BorderStyleType] = None          # @w:val
    sz: Optional[float] = None                     # @w:sz (eighths of a point)
    space: Optional[float] = None                  # @w:space (points)
    color: Optional[str] = None                    # @w:color
    theme_color: Optional[ThemeColorType] = None   # @w:themeColor
    shadow: Optional[bool] = None                  # @w:shadow
    frame: Optional[bool] = None                   # @w:frame
```

---

## Language (`<w:lang>`)

```python
class Language(BaseModel):
    val: Optional[str] = None        # @w:val (Latin language)
    east_asia: Optional[str] = None  # @w:eastAsia
    bidi: Optional[str] = None       # @w:bidi
```

---

## Hyperlink (`<w:hyperlink>`)

```python
class Hyperlink(BaseModel):
    r_id: Optional[str] = None       # @r:id (relationship ID)
    anchor: Optional[str] = None     # @w:anchor (bookmark name)
    tooltip: Optional[str] = None    # @w:tooltip
    content: List[Run] = []
```

---

## Bookmarks

```python
class BookmarkStart(BaseModel):
    id: str    # @w:id
    name: str  # @w:name

class BookmarkEnd(BaseModel):
    id: str    # @w:id
```

---

## Table (`<w:tbl>`)

```python
class Table(BaseModel):
    tbl_pr: Optional[TableProperties] = None
    tbl_grid: Optional[TableGrid] = None
    tr: List[TableRow] = []

class TableGrid(BaseModel):
    grid_col: List[GridColumn] = []

class GridColumn(BaseModel):
    w: Optional[float] = None  # @w:w (points)

class TableRow(BaseModel):
    tr_pr: Optional[TableRowProperties] = None
    tc: List[TableCell] = []

class TableCell(BaseModel):
    tc_pr: Optional[TableCellProperties] = None
    content: List[Paragraph | Table] = []
```

---

## Table Properties (`<w:tblPr>`)

```python
class TableProperties(BaseModel):
    tbl_style: Optional[str] = None                  # <w:tblStyle>
    tbl_w: Optional[Width] = None                    # <w:tblW>
    jc: Optional[JustificationType] = None           # <w:jc>
    tbl_ind: Optional[Width] = None                  # <w:tblInd>
    tbl_borders: Optional[TableBorders] = None       # <w:tblBorders>
    shd: Optional[Shading] = None                    # <w:shd>
    tbl_layout: Optional[TableLayoutType] = None     # <w:tblLayout>
    tbl_cell_mar: Optional[TableCellMargins] = None   # <w:tblCellMar>
    tbl_look: Optional[TableLook] = None             # <w:tblLook>
    tbl_caption: Optional[str] = None                # <w:tblCaption>
    tbl_description: Optional[str] = None            # <w:tblDescription>
```

---

## Width (`<w:tblW>`, `<w:tcW>`, `<w:tblInd>`)

```python
class Width(BaseModel):
    w: Optional[float] = None           # @w:w
    type: Optional[WidthType] = None    # @w:type
```

---

## Table Borders (`<w:tblBorders>`, `<w:tcBorders>`)

```python
class TableBorders(BaseModel):
    top: Optional[Border] = None
    left: Optional[Border] = None
    bottom: Optional[Border] = None
    right: Optional[Border] = None
    inside_h: Optional[Border] = None   # <w:insideH>
    inside_v: Optional[Border] = None   # <w:insideV>
    tl2br: Optional[Border] = None      # <w:tl2br> (diagonal)
    tr2bl: Optional[Border] = None      # <w:tr2bl> (diagonal)
```

---

## Table Cell Margins (`<w:tblCellMar>`, `<w:tcMar>`)

```python
class TableCellMargins(BaseModel):
    top: Optional[Width] = None
    left: Optional[Width] = None
    bottom: Optional[Width] = None
    right: Optional[Width] = None
```

---

## Table Look (`<w:tblLook>`)

```python
class TableLook(BaseModel):
    first_row: Optional[bool] = None     # @w:firstRow
    last_row: Optional[bool] = None      # @w:lastRow
    first_column: Optional[bool] = None  # @w:firstColumn
    last_column: Optional[bool] = None   # @w:lastColumn
    no_h_band: Optional[bool] = None     # @w:noHBand
    no_v_band: Optional[bool] = None     # @w:noVBand
```

---

## Table Row Properties (`<w:trPr>`)

```python
class TableRowProperties(BaseModel):
    tr_height: Optional[RowHeight] = None           # <w:trHeight>
    tbl_header: Optional[bool] = None               # <w:tblHeader>
    jc: Optional[JustificationType] = None          # <w:jc>
    cant_split: Optional[bool] = None               # <w:cantSplit>
    tbl_cell_spacing: Optional[Width] = None        # <w:tblCellSpacing>
```

---

## Row Height (`<w:trHeight>`)

```python
class RowHeight(BaseModel):
    val: Optional[float] = None              # @w:val (points)
    h_rule: Optional[HeightRuleType] = None  # @w:hRule
```

---

## Table Cell Properties (`<w:tcPr>`)

```python
class TableCellProperties(BaseModel):
    tc_w: Optional[Width] = None                       # <w:tcW>
    tc_borders: Optional[TableBorders] = None          # <w:tcBorders>
    shd: Optional[Shading] = None                      # <w:shd>
    tc_mar: Optional[TableCellMargins] = None           # <w:tcMar>
    text_direction: Optional[TextDirectionType] = None # <w:textDirection>
    v_align: Optional[VAlignType] = None               # <w:vAlign>
    grid_span: Optional[int] = None                    # <w:gridSpan>
    v_merge: Optional[VMergeType] = None               # <w:vMerge>
    h_merge: Optional[str] = None                      # <w:hMerge> (deprecated)
    no_wrap: Optional[bool] = None                     # <w:noWrap>
    tc_fit_text: Optional[bool] = None                 # <w:tcFitText>
    hide_mark: Optional[bool] = None                   # <w:hideMark>
```

---

## Section Properties (`<w:sectPr>`)

```python
class SectionProperties(BaseModel):
    pg_sz: Optional[PageSize] = None                       # <w:pgSz>
    pg_mar: Optional[PageMargins] = None                   # <w:pgMar>
    cols: Optional[Columns] = None                         # <w:cols>
    doc_grid: Optional[DocumentGrid] = None                     # <w:docGrid>
    header_refs: Optional[List[HeaderFooterReference]] = None  # <w:headerReference>
    footer_refs: Optional[List[HeaderFooterReference]] = None  # <w:footerReference>
    pg_borders: Optional[PageBorders] = None               # <w:pgBorders>
    pg_num_type: Optional[PageNumberType] = None            # <w:pgNumType>
    type: Optional[SectionType] = None                     # <w:type>
    title_pg: Optional[bool] = None                        # <w:titlePg>
    ln_num_type: Optional[LineNumberType] = None            # <w:lnNumType>
```

---

## Page Size (`<w:pgSz>`)

```python
class PageSize(BaseModel):
    w: Optional[float] = None              # @w:w (points)
    h: Optional[float] = None              # @w:h (points)
    orient: Optional[OrientType] = None    # @w:orient
```

---

## Page Margins (`<w:pgMar>`)

```python
class PageMargins(BaseModel):
    top: Optional[float] = None      # @w:top (points)
    right: Optional[float] = None    # @w:right (points)
    bottom: Optional[float] = None   # @w:bottom (points)
    left: Optional[float] = None     # @w:left (points)
    header: Optional[float] = None   # @w:header (points)
    footer: Optional[float] = None   # @w:footer (points)
    gutter: Optional[float] = None   # @w:gutter (points)
```

---

## Paragraph Borders (`<w:pBdr>`)

```python
class ParagraphBorders(BaseModel):
    top: Optional[Border] = None
    left: Optional[Border] = None
    bottom: Optional[Border] = None
    right: Optional[Border] = None
    between: Optional[Border] = None  # <w:between>
    bar: Optional[Border] = None      # <w:bar>
```

---

## Frame Properties (`<w:framePr>`)

```python
class FrameProperties(BaseModel):
    w: Optional[float] = None                    # @w:w
    h: Optional[float] = None                    # @w:h
    h_space: Optional[float] = None              # @w:hSpace
    v_space: Optional[float] = None              # @w:vSpace
    wrap: Optional[FrameWrapType] = None         # @w:wrap
    h_anchor: Optional[FrameAnchorType] = None   # @w:hAnchor
    v_anchor: Optional[FrameAnchorType] = None   # @w:vAnchor
    x: Optional[float] = None                    # @w:x
    y: Optional[float] = None                    # @w:y
    x_align: Optional[str] = None                # @w:xAlign
    y_align: Optional[str] = None                # @w:yAlign
    anchor_lock: Optional[bool] = None           # @w:anchorLock
    drop_cap: Optional[DropCapType] = None       # @w:dropCap
    lines: Optional[int] = None                  # @w:lines
```

---

## Naming Deviations Summary

| XML Tag/Attribute | Model Name | Reason |
|-------------------|------------|--------|
| `<w:tab/>` (in run) | `TabCharacter` | Avoid conflict with `TabStop` model; full name for clarity |
| `<w:tab>` (in tabs) | `TabStop` | Full name for clarity; `Tab` is ambiguous |
| `<w:p>` | `Paragraph` | Expanded for clarity; `P` is not descriptive |
| `<w:r>` | `Run` | Expanded for clarity; `R` is not descriptive |
| `<w:t>` | `Text` | Expanded for clarity; `T` is not descriptive |
| `<w:tbl>` | `Table` | Expanded for clarity |
| `<w:tr>` | `TableRow` | Expanded for clarity |
| `<w:tc>` | `TableCell` | Expanded for clarity |
| `<w:rFonts>` | `RunFonts` | Full name for clarity; `Fonts` is ambiguous |
| `<w:lang>` | `Language` | Full name for clarity |
| `<w:gridCol>` | `GridColumn` | Full name for clarity |
| `<w:tblCellMar>` | `TableCellMargins` | Full name for clarity |
| `<w:tcMar>` | `TableCellMargins` | Same model as `tblCellMar` |
| `<w:docGrid>` | `DocumentGrid` | Full name for clarity |
| `<w:pgNumType>` | `PageNumberType` | Full name for clarity |
| `<w:lnNumType>` | `LineNumberType` | Full name for clarity |
| `<w:headerReference>` | `HeaderFooterReference` | Shared model for header/footer refs |
| `<w:footerReference>` | `HeaderFooterReference` | Shared model for header/footer refs |
| `<w:fldChar>` | `FieldCharacter` | Full name for clarity |
| `<w:instrText>` | `InstructionText` | Full name for clarity |
| `<w:footnoteReference>` | `FootnoteReference` | Full name for clarity |
| `<w:endnoteReference>` | `EndnoteReference` | Full name for clarity |
| `<w:commentReference>` | `CommentReference` | Full name for clarity |
| `<w:sdt>` | `StructuredDocumentTag` | Full name for clarity; `Sdt` is not descriptive |
