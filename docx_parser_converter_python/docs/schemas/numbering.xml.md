# numbering.xml Schema

## Overview

The `numbering.xml` file defines all numbering (list) definitions in the document. It has a two-level structure:

1. **Abstract Numbering (`<w:abstractNum>`)**: Defines the format and behavior of each level (0-8)
2. **Numbering Instances (`<w:num>`)**: References an abstract numbering and can override specific levels

Paragraphs reference numbering via `<w:numPr>` in their properties, which specifies:
- `numId`: The numbering instance ID
- `ilvl`: The level (0-8) within that numbering

---

## XML Structure Tree

```
w:numbering (Numbering)
├── w:abstractNum (AbstractNumbering) [0..*]
│   ├── @w:abstractNumId (required)
│   ├── w:nsid [0..1]
│   ├── w:multiLevelType [0..1]
│   ├── w:tmpl [0..1]
│   ├── w:name [0..1]
│   ├── w:styleLink [0..1]
│   ├── w:numStyleLink [0..1]
│   └── w:lvl (Level) [0..9]
│       ├── @w:ilvl (required, 0-8)
│       ├── @w:tplc [0..1]
│       ├── @w:tentative [0..1]
│       ├── w:start [0..1]
│       ├── w:numFmt [0..1]
│       ├── w:lvlRestart [0..1]
│       ├── w:pStyle [0..1]
│       ├── w:isLgl [0..1]
│       ├── w:suff [0..1]
│       ├── w:lvlText [0..1]
│       ├── w:lvlPicBulletId [0..1]
│       ├── w:lvlJc [0..1]
│       ├── w:pPr (ParagraphProperties) [0..1]
│       │   ├── w:ind [0..1]
│       │   └── w:tabs [0..1]
│       └── w:rPr (RunProperties) [0..1]
│           └── w:rFonts [0..1]
└── w:num (NumberingInstance) [0..*]
    ├── @w:numId (required)
    ├── w:abstractNumId [1]
    └── w:lvlOverride (LevelOverride) [0..*]
        ├── @w:ilvl (required, 0-8)
        ├── w:startOverride [0..1]
        └── w:lvl (Level) [0..1]
```

---

## Enumerated Values (Literals)

```python
from typing import Literal

# Multi-level type
MultiLevelType = Literal["singleLevel", "multilevel", "hybridMultilevel"]

# Number format
NumFmtType = Literal[
    # Basic formats
    "decimal",              # 1, 2, 3
    "upperRoman",           # I, II, III
    "lowerRoman",           # i, ii, iii
    "upperLetter",          # A, B, C
    "lowerLetter",          # a, b, c
    "bullet",               # Bullet character
    "none",                 # No number

    # Extended formats
    "ordinal",              # 1st, 2nd, 3rd
    "cardinalText",         # one, two, three
    "ordinalText",          # first, second, third
    "decimalZero",          # 01, 02, 03
    "decimalEnclosedCircle",# ①, ②, ③
    "decimalEnclosedFullstop", # 1., 2., 3. (enclosed)
    "decimalEnclosedParen", # (1), (2), (3)
    "decimalFullWidth",     # Full-width digits

    # East Asian formats
    "aiueo",                # Japanese あ, い, う
    "aiueoFullWidth",       # Full-width Japanese
    "iroha",                # Japanese い, ろ, は
    "irohaFullWidth",       # Full-width iroha
    "ideographDigital",     # 一, 二, 三
    "ideographTraditional", # 壱, 弐, 参
    "ideographLegalTraditional",
    "ideographZodiac",      # 甲, 乙, 丙
    "ideographZodiacTraditional",
    "ideographEnclosedCircle",
    "japaneseCounting",
    "japaneseDigitalTenThousand",
    "japaneseLegal",
    "koreanCounting",
    "koreanDigital",
    "koreanDigital2",
    "koreanLegal",
    "taiwaneseCounting",
    "taiwaneseCountingThousand",
    "taiwaneseDigital",
    "chineseCounting",
    "chineseCountingThousand",
    "chineseLegalSimplified",
    "thaiLetters",
    "thaiNumbers",
    "thaiCounting",
    "vietnameseCounting",

    # Hebrew formats
    "hebrew1",              # א, ב, ג
    "hebrew2",

    # Arabic formats
    "arabicAlpha",
    "arabicAbjad",
    "hindiVowels",
    "hindiConsonants",
    "hindiNumbers",
    "hindiCounting",

    # Other
    "russianLower",
    "russianUpper",
    "chicago",
    "numberInDash",         # - 1 -, - 2 -
    "hex",                  # Hexadecimal
]

# Suffix type (what comes after the number)
SuffixType = Literal["tab", "space", "nothing"]

# Level justification
LevelJcType = Literal["left", "center", "right"]
```

---

## Root Structure

| XML Tag | Pydantic Model | Description |
|---------|----------------|-------------|
| `<w:numbering>` | `Numbering` | Root element containing all numbering definitions |

```python
class Numbering(BaseModel):
    abstract_num: List[AbstractNumbering] = []
    num: List[NumberingInstance] = []
```

---

## Abstract Numbering (`<w:abstractNum>`)

Defines the template for a numbering scheme, including all 9 possible levels (0-8).

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:abstractNumId` | `abstract_num_id` | `int` | Unique identifier (required) |
| `<w:nsid>` | `nsid` | `Optional[str]` | Number scheme ID (random hex), from `@w:val` |
| `<w:multiLevelType>` | `multi_level_type` | `Optional[MultiLevelType]` | Type of multilevel list |
| `<w:tmpl>` | `tmpl` | `Optional[str]` | Template ID, from `@w:val` |
| `<w:name>` | `name` | `Optional[str]` | Name, from `@w:val` |
| `<w:styleLink>` | `style_link` | `Optional[str]` | Link to numbering style, from `@w:val` |
| `<w:numStyleLink>` | `num_style_link` | `Optional[str]` | Link from style, from `@w:val` |
| `<w:lvl>` | `lvl` | `List[Level]` | Level definitions (0-8) |

```python
class AbstractNumbering(BaseModel):
    abstract_num_id: int
    nsid: Optional[str] = None
    multi_level_type: Optional[MultiLevelType] = None
    tmpl: Optional[str] = None
    name: Optional[str] = None
    style_link: Optional[str] = None
    num_style_link: Optional[str] = None
    lvl: List[Level] = []
```

### Multi-Level Types

| Value | Description |
|-------|-------------|
| `singleLevel` | Single level list (bullets or simple numbers) |
| `multilevel` | True multilevel (all levels interconnected) |
| `hybridMultilevel` | Independent levels (Word's default for UI-created lists) |

---

## Level (`<w:lvl>`)

Defines formatting and behavior for a single level within an abstract numbering.

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:ilvl` | `ilvl` | `int` | Level index 0-8 (required) |
| `@w:tplc` | `tplc` | `Optional[str]` | Template code |
| `@w:tentative` | `tentative` | `Optional[bool]` | Tentative level (not yet used) |
| `<w:start>` | `start` | `Optional[int]` | Starting number, from `@w:val` |
| `<w:numFmt>` | `num_fmt` | `Optional[NumFmtType]` | Number format, from `@w:val` |
| `<w:lvlRestart>` | `lvl_restart` | `Optional[int]` | Restart after level, from `@w:val` |
| `<w:pStyle>` | `p_style` | `Optional[str]` | Associated paragraph style, from `@w:val` |
| `<w:isLgl>` | `is_lgl` | `Optional[bool]` | Use legal numbering (no leading zeros) |
| `<w:suff>` | `suff` | `Optional[SuffixType]` | Suffix type, from `@w:val` |
| `<w:lvlText>` | `lvl_text` | `Optional[str]` | Level text template, from `@w:val` |
| `<w:lvlPicBulletId>` | `lvl_pic_bullet_id` | `Optional[int]` | Picture bullet ID, from `@w:val` |
| `<w:lvlJc>` | `lvl_jc` | `Optional[LevelJcType]` | Justification, from `@w:val` |
| `<w:pPr>` | `p_pr` | `Optional[ParagraphProperties]` | Paragraph properties (indentation, tabs) |
| `<w:rPr>` | `r_pr` | `Optional[RunProperties]` | Run properties (font for bullet/number) |

```python
class Level(BaseModel):
    ilvl: int
    tplc: Optional[str] = None
    tentative: Optional[bool] = None
    start: Optional[int] = None
    num_fmt: Optional[NumFmtType] = None
    lvl_restart: Optional[int] = None
    p_style: Optional[str] = None
    is_lgl: Optional[bool] = None
    suff: Optional[SuffixType] = None
    lvl_text: Optional[str] = None
    lvl_pic_bullet_id: Optional[int] = None
    lvl_jc: Optional[LevelJcType] = None
    p_pr: Optional[ParagraphProperties] = None
    r_pr: Optional[RunProperties] = None
```

### Level Text (`lvlText`)

The `lvl_text` field contains a format string where `%N` is replaced by the number at level N-1:

| lvlText | Level 0 | Level 1 | Level 2 |
|---------|---------|---------|---------|
| `%1.` | 1. | | |
| `%1.%2.` | | 1.1. | |
| `(%3)` | | | (1) |
| `•` (bullet) | • | | |
| `%1.%2.%3` | | | 1.2.3 |

---

## Numbering Instance (`<w:num>`)

Links a `numId` (referenced by paragraphs) to an abstract numbering definition, optionally with level overrides.

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:numId` | `num_id` | `int` | Instance ID (required, referenced by paragraphs) |
| `<w:abstractNumId>` | `abstract_num_id` | `int` | Reference to abstract numbering, from `@w:val` |
| `<w:lvlOverride>` | `lvl_override` | `Optional[List[LevelOverride]]` | Level overrides |

```python
class NumberingInstance(BaseModel):
    num_id: int
    abstract_num_id: int
    lvl_override: Optional[List[LevelOverride]] = None
```

---

## Level Override (`<w:lvlOverride>`)

Overrides specific settings for a level within a numbering instance.

| XML Tag/Attribute | Field Name | Type | Notes |
|-------------------|------------|------|-------|
| `@w:ilvl` | `ilvl` | `int` | Level to override 0-8 (required) |
| `<w:startOverride>` | `start_override` | `Optional[int]` | Override start number, from `@w:val` |
| `<w:lvl>` | `lvl` | `Optional[Level]` | Complete level override |

```python
class LevelOverride(BaseModel):
    ilvl: int
    start_override: Optional[int] = None
    lvl: Optional[Level] = None
```

---

## How Numbering Works

### Document Reference

Paragraphs reference numbering through `<w:numPr>` in their paragraph properties:

```xml
<w:p>
    <w:pPr>
        <w:numPr>
            <w:ilvl w:val="0"/>      <!-- Level 0 -->
            <w:numId w:val="1"/>     <!-- Numbering instance 1 -->
        </w:numPr>
    </w:pPr>
    <w:r>
        <w:t>First item</w:t>
    </w:r>
</w:p>
```

### Resolution Flow

```
Paragraph.numPr.numId = 1, ilvl = 0
        │
        ▼
┌───────────────────────────────────┐
│ Num (numId=1)                     │
│   abstractNumId = 0               │
│   lvlOverride[0]? ──► If exists,  │
│                       use override│
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ AbstractNum (abstractNumId=0)     │
│   lvl[0]:                         │
│     numFmt = "decimal"            │
│     lvlText = "%1."               │
│     start = 1                     │
└───────────────────────────────────┘
        │
        ▼
    Output: "1."
```

### Counter Management

Each `abstractNumId` maintains counters for each level:
- Counter increments for each paragraph at that level
- Counter resets based on `lvlRestart` when a higher level appears
- `startOverride` in `<w:num>` can reset counter for specific instances

---

## Example Numbering Definitions

### Multilevel Legal Numbering (1, 1.1, 1.1.1)

```xml
<w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="multilevel"/>
    <w:lvl w:ilvl="0">
        <w:start w:val="1"/>
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1"/>
        <w:lvlJc w:val="left"/>
        <w:pPr>
            <w:ind w:left="720" w:hanging="360"/>
        </w:pPr>
    </w:lvl>
    <w:lvl w:ilvl="1">
        <w:start w:val="1"/>
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1.%2"/>
        <w:lvlJc w:val="left"/>
        <w:pPr>
            <w:ind w:left="1080" w:hanging="360"/>
        </w:pPr>
    </w:lvl>
    <w:lvl w:ilvl="2">
        <w:start w:val="1"/>
        <w:numFmt w:val="decimal"/>
        <w:lvlText w:val="%1.%2.%3"/>
        <w:lvlJc w:val="left"/>
        <w:pPr>
            <w:ind w:left="1440" w:hanging="360"/>
        </w:pPr>
    </w:lvl>
</w:abstractNum>

<w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
</w:num>
```

This produces:
```
1
    1.1
    1.2
        1.2.1
        1.2.2
    1.3
2
```

### Bullet List

```xml
<w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
        <w:start w:val="1"/>
        <w:numFmt w:val="bullet"/>
        <w:lvlText w:val=""/>
        <w:lvlJc w:val="left"/>
        <w:pPr>
            <w:ind w:left="720" w:hanging="360"/>
        </w:pPr>
        <w:rPr>
            <w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>
        </w:rPr>
    </w:lvl>
    <w:lvl w:ilvl="1">
        <w:start w:val="1"/>
        <w:numFmt w:val="bullet"/>
        <w:lvlText w:val="o"/>
        <w:lvlJc w:val="left"/>
        <w:pPr>
            <w:ind w:left="1440" w:hanging="360"/>
        </w:pPr>
        <w:rPr>
            <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/>
        </w:rPr>
    </w:lvl>
</w:abstractNum>
```

### Roman Numerals (I, II, III)

```xml
<w:lvl w:ilvl="0">
    <w:start w:val="1"/>
    <w:numFmt w:val="upperRoman"/>
    <w:lvlText w:val="%1."/>
    <w:lvlJc w:val="right"/>
    <w:pPr>
        <w:ind w:left="720" w:hanging="360"/>
    </w:pPr>
</w:lvl>
```

---

## Naming Deviations Summary

| XML Tag/Attribute | Model Name | Reason |
|-------------------|------------|--------|
| `<w:numbering>` | `Numbering` | Direct mapping |
| `<w:abstractNum>` | `AbstractNumbering` | Full name for clarity |
| `<w:num>` | `NumberingInstance` | Full name for clarity; `Num` is not descriptive |
| `<w:lvl>` | `Level` | Full name for clarity |
| `<w:lvlOverride>` | `LevelOverride` | Full name for clarity |
| `@w:abstractNumId` | `abstract_num_id` | Snake case |
| `@w:numId` | `num_id` | Snake case |
| `@w:ilvl` | `ilvl` | Preserved; means "indentation level" |
| `<w:numFmt>` | `num_fmt` | Snake case |
| `<w:lvlText>` | `lvl_text` | Snake case |
| `<w:lvlJc>` | `lvl_jc` | Snake case; `jc` = justification |
| `<w:lvlRestart>` | `lvl_restart` | Snake case |
| `<w:pStyle>` | `p_style` | Snake case; paragraph style link |
| `<w:isLgl>` | `is_lgl` | Snake case; `lgl` = legal |
| `<w:suff>` | `suff` | Preserved; means "suffix" |

---

## Notes

1. **numId vs abstractNumId**: `numId` is what paragraphs reference. `abstractNumId` is the actual definition. Multiple `num` elements can reference the same `abstractNum`.

2. **Level 0-8**: OOXML supports 9 levels (0-8), but most documents only use the first few.

3. **Picture Bullets**: Defined via `lvlPicBulletId` referencing a picture in the numbering part's relationships.

4. **Style Links**: A numbering can be linked to a style via `styleLink`/`numStyleLink`, allowing the style to automatically apply numbering.

5. **Indentation**: The `pPr.ind` in a level typically defines `left` (total indent) and `hanging` (negative first line = outdent for the number).

6. **Suffix**: Controls what appears between the number and the text:
   - `tab` (default): Tab character
   - `space`: Space character
   - `nothing`: No separator
