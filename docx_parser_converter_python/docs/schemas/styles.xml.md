# styles.xml Schema

## Overview

The `styles.xml` file defines all document styles including paragraph styles, character styles, table styles, and numbering styles. It also contains document defaults that apply to all content.

---

## XML Structure Tree

```
w:styles
├── w:docDefaults (DocumentDefaults) [0..1]
│   ├── w:rPrDefault (RunPropertiesDefault) [0..1]
│   │   └── w:rPr (RunProperties) [0..1]
│   └── w:pPrDefault (ParagraphPropertiesDefault) [0..1]
│       └── w:pPr (ParagraphProperties) [0..1]
├── w:latentStyles (LatentStyles) [0..1]
│   └── w:lsdException (LatentStyleException) [0..*]
└── w:style (Style) [0..*]
    ├── @w:type (paragraph|character|table|numbering)
    ├── @w:styleId
    ├── @w:default [0..1]
    ├── @w:customStyle [0..1]
    ├── w:name [0..1]
    ├── w:aliases [0..1]
    ├── w:basedOn [0..1]
    ├── w:next [0..1]
    ├── w:link [0..1]
    ├── w:autoRedefine [0..1]
    ├── w:hidden [0..1]
    ├── w:uiPriority [0..1]
    ├── w:semiHidden [0..1]
    ├── w:unhideWhenUsed [0..1]
    ├── w:qFormat [0..1]
    ├── w:locked [0..1]
    ├── w:personal [0..1]
    ├── w:personalCompose [0..1]
    ├── w:personalReply [0..1]
    ├── w:rsid [0..1]
    ├── w:pPr (ParagraphProperties) [0..1]
    ├── w:rPr (RunProperties) [0..1]
    ├── w:tblPr (TableProperties) [0..1]
    ├── w:trPr (TableRowProperties) [0..1]
    ├── w:tcPr (TableCellProperties) [0..1]
    └── w:tblStylePr (TableStyleProperties) [0..*]
        ├── @w:type (wholeTable|firstRow|lastRow|...)
        ├── w:pPr [0..1]
        ├── w:rPr [0..1]
        ├── w:tblPr [0..1]
        ├── w:trPr [0..1]
        └── w:tcPr [0..1]
```

---

## Enumerated Values (Literals)

```python
from typing import Literal

# Style type
StyleType = Literal["paragraph", "character", "table", "numbering"]

# Table style conditional formatting type
TableStyleConditionType = Literal[
    "wholeTable",   # Entire table
    "firstRow",     # Header row
    "lastRow",      # Total row
    "firstCol",     # First column
    "lastCol",      # Last column
    "band1Vert",    # Odd vertical banding
    "band2Vert",    # Even vertical banding
    "band1Horz",    # Odd horizontal banding
    "band2Horz",    # Even horizontal banding
    "neCell",       # Top right cell
    "nwCell",       # Top left cell
    "seCell",       # Bottom right cell
    "swCell"        # Bottom left cell
]
```

> **Note**: Styles also use all the Literal types from `document.xml` for `ParagraphProperties`, `RunProperties`, `TableProperties`, etc.

---

## Root Structure

| XML Tag | Pydantic Model | Description |
|---------|----------------|-------------|
| `<w:styles>` | `Styles` | Root element containing all style definitions |

### Styles Model

```python
class Styles(BaseModel):
    doc_defaults: Optional[DocumentDefaults] = None
    latent_styles: Optional[LatentStyles] = None
    style: List[Style] = []
```

---

## Document Defaults (`<w:docDefaults>`)

The document defaults define base formatting applied to all paragraphs and runs before any styles are applied.

| XML Tag | Pydantic Model | Description |
|---------|----------------|-------------|
| `<w:docDefaults>` | `DocumentDefaults` | Container for default settings |
| `<w:rPrDefault>` | `RunPropertiesDefault` | Default run properties wrapper |
| `<w:pPrDefault>` | `ParagraphPropertiesDefault` | Default paragraph properties wrapper |

```python
class DocumentDefaults(BaseModel):
    r_pr_default: Optional[RunPropertiesDefault] = None
    p_pr_default: Optional[ParagraphPropertiesDefault] = None

class RunPropertiesDefault(BaseModel):
    r_pr: Optional[RunProperties] = None

class ParagraphPropertiesDefault(BaseModel):
    p_pr: Optional[ParagraphProperties] = None
```

---

## Latent Styles (`<w:latentStyles>`)

Latent styles are built-in styles that are hidden until used.

| XML Attribute | Field Name | Type | Notes |
|---------------|------------|------|-------|
| `@w:defLockedState` | `def_locked_state` | `Optional[bool]` | Default locked state |
| `@w:defUIPriority` | `def_ui_priority` | `Optional[int]` | Default UI priority |
| `@w:defSemiHidden` | `def_semi_hidden` | `Optional[bool]` | Default semi-hidden |
| `@w:defUnhideWhenUsed` | `def_unhide_when_used` | `Optional[bool]` | Default unhide behavior |
| `@w:defQFormat` | `def_q_format` | `Optional[bool]` | Default quick format |
| `@w:count` | `count` | `Optional[int]` | Number of latent styles |
| children | `lsd_exception` | `List[LatentStyleException]` | Style exceptions |

```python
class LatentStyles(BaseModel):
    def_locked_state: Optional[bool] = None
    def_ui_priority: Optional[int] = None
    def_semi_hidden: Optional[bool] = None
    def_unhide_when_used: Optional[bool] = None
    def_q_format: Optional[bool] = None
    count: Optional[int] = None
    lsd_exception: List[LatentStyleException] = []
```

### Latent Style Exception (`<w:lsdException>`)

| XML Attribute | Field Name | Type | Notes |
|---------------|------------|------|-------|
| `@w:name` | `name` | `str` | Style name |
| `@w:locked` | `locked` | `Optional[bool]` | Locked |
| `@w:uiPriority` | `ui_priority` | `Optional[int]` | UI priority |
| `@w:semiHidden` | `semi_hidden` | `Optional[bool]` | Semi-hidden |
| `@w:unhideWhenUsed` | `unhide_when_used` | `Optional[bool]` | Unhide when used |
| `@w:qFormat` | `q_format` | `Optional[bool]` | Quick format |

```python
class LatentStyleException(BaseModel):
    name: str
    locked: Optional[bool] = None
    ui_priority: Optional[int] = None
    semi_hidden: Optional[bool] = None
    unhide_when_used: Optional[bool] = None
    q_format: Optional[bool] = None
```

---

## Style (`<w:style>`)

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:type` | `type` | `StyleType` | Style type |
| `@w:styleId` | `style_id` | `str` | Unique style identifier |
| `@w:default` | `default` | `Optional[bool]` | Is default style for type |
| `@w:customStyle` | `custom_style` | `Optional[bool]` | Is custom (not built-in) |
| `<w:name>` | `name` | `Optional[str]` | Display name, from `@w:val` |
| `<w:aliases>` | `aliases` | `Optional[str]` | Alternative names, from `@w:val` |
| `<w:basedOn>` | `based_on` | `Optional[str]` | Parent style ID, from `@w:val` |
| `<w:next>` | `next` | `Optional[str]` | Next paragraph style ID, from `@w:val` |
| `<w:link>` | `link` | `Optional[str]` | Linked style ID, from `@w:val` |
| `<w:autoRedefine>` | `auto_redefine` | `Optional[bool]` | Auto-redefine on format change |
| `<w:hidden>` | `hidden` | `Optional[bool]` | Hidden from UI |
| `<w:uiPriority>` | `ui_priority` | `Optional[int]` | UI sort priority, from `@w:val` |
| `<w:semiHidden>` | `semi_hidden` | `Optional[bool]` | Semi-hidden (shown in some UI) |
| `<w:unhideWhenUsed>` | `unhide_when_used` | `Optional[bool]` | Show when used |
| `<w:qFormat>` | `q_format` | `Optional[bool]` | Show in Quick Styles gallery |
| `<w:locked>` | `locked` | `Optional[bool]` | Locked (cannot be modified) |
| `<w:personal>` | `personal` | `Optional[bool]` | Personal style |
| `<w:personalCompose>` | `personal_compose` | `Optional[bool]` | Personal compose style |
| `<w:personalReply>` | `personal_reply` | `Optional[bool]` | Personal reply style |
| `<w:rsid>` | `rsid` | `Optional[str]` | Revision save ID, from `@w:val` |
| `<w:pPr>` | `p_pr` | `Optional[ParagraphProperties]` | Paragraph properties |
| `<w:rPr>` | `r_pr` | `Optional[RunProperties]` | Run properties |
| `<w:tblPr>` | `tbl_pr` | `Optional[TableProperties]` | Table properties (table styles) |
| `<w:trPr>` | `tr_pr` | `Optional[TableRowProperties]` | Table row properties |
| `<w:tcPr>` | `tc_pr` | `Optional[TableCellProperties]` | Table cell properties |
| `<w:tblStylePr>` | `tbl_style_pr` | `Optional[List[TableStyleProperties]]` | Table style conditional formatting |

```python
class Style(BaseModel):
    type: StyleType
    style_id: str
    default: Optional[bool] = None
    custom_style: Optional[bool] = None
    name: Optional[str] = None
    aliases: Optional[str] = None
    based_on: Optional[str] = None
    next: Optional[str] = None
    link: Optional[str] = None
    auto_redefine: Optional[bool] = None
    hidden: Optional[bool] = None
    ui_priority: Optional[int] = None
    semi_hidden: Optional[bool] = None
    unhide_when_used: Optional[bool] = None
    q_format: Optional[bool] = None
    locked: Optional[bool] = None
    personal: Optional[bool] = None
    personal_compose: Optional[bool] = None
    personal_reply: Optional[bool] = None
    rsid: Optional[str] = None
    p_pr: Optional[ParagraphProperties] = None
    r_pr: Optional[RunProperties] = None
    tbl_pr: Optional[TableProperties] = None
    tr_pr: Optional[TableRowProperties] = None
    tc_pr: Optional[TableCellProperties] = None
    tbl_style_pr: Optional[List[TableStyleProperties]] = None
```

---

## Table Style Properties (`<w:tblStylePr>`)

Conditional formatting for different parts of a table (first row, last column, etc.).

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:type` | `type` | `TableStyleConditionType` | Condition type |
| `<w:pPr>` | `p_pr` | `Optional[ParagraphProperties]` | Paragraph properties |
| `<w:rPr>` | `r_pr` | `Optional[RunProperties]` | Run properties |
| `<w:tblPr>` | `tbl_pr` | `Optional[TableProperties]` | Table properties |
| `<w:trPr>` | `tr_pr` | `Optional[TableRowProperties]` | Table row properties |
| `<w:tcPr>` | `tc_pr` | `Optional[TableCellProperties]` | Table cell properties |

```python
class TableStyleProperties(BaseModel):
    type: TableStyleConditionType
    p_pr: Optional[ParagraphProperties] = None
    r_pr: Optional[RunProperties] = None
    tbl_pr: Optional[TableProperties] = None
    tr_pr: Optional[TableRowProperties] = None
    tc_pr: Optional[TableCellProperties] = None
```

---

## Style Types

| Type Value | Description | Contains |
|------------|-------------|----------|
| `paragraph` | Paragraph style | `pPr`, `rPr` |
| `character` | Character/run style | `rPr` only |
| `table` | Table style | `tblPr`, `trPr`, `tcPr`, `pPr`, `rPr`, `tblStylePr` |
| `numbering` | Numbering/list style | Links to numbering.xml definitions |

---

## Shared Models Used

The following models from `document.xml` are reused in styles:

- `ParagraphProperties` - Same structure as in documents
- `RunProperties` - Same structure as in documents
- `TableProperties` - Same structure as in documents
- `TableRowProperties` - Same structure as in documents
- `TableCellProperties` - Same structure as in documents

See [document.xml.md](./document.xml.md) for complete definitions.

---

## Example Style Definition

```xml
<w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:link w:val="Heading1Char"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
        <w:keepNext/>
        <w:keepLines/>
        <w:spacing w:before="240" w:after="0"/>
        <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
        <w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi"/>
        <w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/>
        <w:sz w:val="32"/>
    </w:rPr>
</w:style>
```

Corresponding Pydantic model instance:

```python
Style(
    type="paragraph",
    style_id="Heading1",
    name="heading 1",
    based_on="Normal",
    next="Normal",
    link="Heading1Char",
    ui_priority=9,
    q_format=True,
    p_pr=ParagraphProperties(
        keep_next=True,
        keep_lines=True,
        spacing=Spacing(before=12.0, after=0.0),  # converted to points
        outline_lvl=0
    ),
    r_pr=RunProperties(
        r_fonts=RunFonts(ascii_theme="majorHAnsi", h_ansi_theme="majorHAnsi"),
        color=Color(val="2F5496", theme_color="accent1", theme_shade="BF"),
        sz=16.0  # converted to points (32 half-points)
    )
)
```

---

## Naming Deviations Summary

| XML Tag/Attribute | Model Name | Reason |
|-------------------|------------|--------|
| `<w:styles>` | `Styles` | Direct mapping |
| `<w:style>` | `Style` | Direct mapping |
| `@w:styleId` | `style_id` | Snake case of XML attribute |
| `<w:docDefaults>` | `DocumentDefaults` | Full name for clarity |
| `<w:rPrDefault>` | `RunPropertiesDefault` | Full name for clarity; `r_pr_default` for field |
| `<w:pPrDefault>` | `ParagraphPropertiesDefault` | Full name for clarity; `p_pr_default` for field |
| `<w:tblStylePr>` | `TableStyleProperties` | Full name for clarity |
| `<w:lsdException>` | `LatentStyleException` | Full name for clarity; LSD = Latent Style Data |
| `<w:qFormat>` | `q_format` | Snake case; `q` = Quick |

---

## Notes

1. **Style Inheritance**: Styles can inherit from other styles via `based_on`. When resolving formatting, traverse the inheritance chain.

2. **Default Styles**: Each style type has a default (`@w:default="1"`):
   - Default paragraph style: Usually "Normal"
   - Default character style: Usually "Default Paragraph Font"
   - Default table style: Usually "Normal Table"

3. **Quick Format**: Styles with `q_format=True` appear in the Quick Styles gallery.

4. **Theme Fonts**: Font references like `asciiTheme="majorHAnsi"` resolve to fonts defined in `theme.xml`.

5. **Linked Styles**: A paragraph style can link to a character style. When text is selected within a paragraph using that style, the linked character style is applied.
