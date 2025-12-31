# DOCX Parser Converter - Python Restructure Plan

## Overview

This document outlines the proposed folder and file structure for the refactored `docx-parser-converter-python` package. The structure is designed around:

1. **Schema alignment** - Organization mirrors the three core XML files (document.xml, styles.xml, numbering.xml)
2. **Single responsibility** - Each file handles one focused concern
3. **Full model names** - As defined in our schema documentation
4. **Clear separation** - Parsers, models, and converters in distinct layers

---

## Proposed Folder Structure

```
docx_parser_converter_python/           # Project root
├── __init__.py                         # Package entry point
├── pyproject.toml                      # PDM project configuration
├── pdm.lock                            # PDM lock file
├── README.md
├── SPECIFICATION.md
├── STRUCTURE_PLAN.md
├── IMPLEMENTATION_PLAN.md
│
├── core/
│   ├── __init__.py
│   ├── constants.py                # XML namespaces, file paths, configuration
│   ├── exceptions.py               # Custom exception hierarchy
│   ├── docx_reader.py              # DOCX ZIP extraction, validation
│   ├── xml_extractor.py            # XML content extraction utilities
│   ├── xml_helpers.py              # XML element/attribute extraction utilities
│   ├── unit_conversion.py          # twips_to_points, half_points_to_points, etc.
│   └── model_utils.py              # Pydantic model merging, deep copy utilities
│
├── models/
│   ├── __init__.py
│   │
│   ├── common/
│   │   ├── __init__.py
│   │   ├── border.py               # Border, BorderStyleType
│   │   ├── shading.py              # Shading, ShadingPatternType
│   │   ├── color.py                # Color, ThemeColorType
│   │   ├── width.py                # Width, WidthType (for tblW, tcW)
│   │   ├── spacing.py              # Spacing (paragraph before/after/line spacing)
│   │   └── indentation.py          # Indentation (paragraph ind, table tblInd)
│   │
│   ├── document/
│   │   ├── __init__.py
│   │   ├── document.py             # Document, Body
│   │   ├── paragraph.py            # Paragraph, ParagraphProperties, ParagraphBorders
│   │   ├── run.py                  # Run, RunProperties, RunFonts, Language
│   │   ├── run_content.py          # Text, TabCharacter, Break, Symbol, etc.
│   │   ├── hyperlink.py            # Hyperlink, BookmarkStart, BookmarkEnd
│   │   ├── table.py                # Table, TableProperties, TableGrid, GridColumn
│   │   ├── table_row.py            # TableRow, TableRowProperties, RowHeight
│   │   ├── table_cell.py           # TableCell, TableCellProperties, TableCellMargins
│   │   ├── section.py              # SectionProperties, PageSize, PageMargins
│   │   └── frame.py                # FrameProperties
│   │
│   ├── styles/
│   │   ├── __init__.py
│   │   ├── styles.py               # Styles (root container)
│   │   ├── style.py                # Style, StyleType
│   │   ├── document_defaults.py    # DocumentDefaults, RunPropertiesDefault, ParagraphPropertiesDefault
│   │   ├── latent_styles.py        # LatentStyles, LatentStyleException
│   │   └── table_style.py          # TableStyleProperties, TableStyleConditionType
│   │
│   └── numbering/
│       ├── __init__.py
│       ├── numbering.py            # Numbering (root container)
│       ├── abstract_numbering.py   # AbstractNumbering, MultiLevelType
│       ├── level.py                # Level, NumFmtType, SuffixType, LevelJcType
│       ├── numbering_instance.py   # NumberingInstance
│       └── level_override.py       # LevelOverride
│
├── parsers/
│   ├── __init__.py
│   ├── mapper.py                   # Tag-to-parser routing (ParserMapper)
│   ├── utils.py                    # Shared parsing utilities
│   │
│   ├── common/
│   │   ├── __init__.py
│   │   ├── border_parser.py        # parse_border(), parse_paragraph_borders(), parse_table_borders()
│   │   ├── shading_parser.py       # parse_shading()
│   │   ├── color_parser.py         # parse_color()
│   │   ├── spacing_parser.py       # parse_spacing()
│   │   └── indentation_parser.py   # parse_indentation(), parse_table_indentation()
│   │
│   ├── document/
│   │   ├── __init__.py
│   │   ├── document_parser.py      # parse_document() - main entry point
│   │   ├── body_parser.py          # parse_body() - paragraphs, tables, sections
│   │   ├── paragraph_parser.py     # parse_paragraph()
│   │   ├── paragraph_properties_parser.py  # parse_paragraph_properties()
│   │   ├── run_parser.py           # parse_run()
│   │   ├── run_properties_parser.py        # parse_run_properties()
│   │   ├── run_content_parser.py   # parse_text(), parse_break(), parse_symbol(), etc.
│   │   ├── hyperlink_parser.py     # parse_hyperlink(), parse_bookmarks()
│   │   ├── table_parser.py         # parse_table()
│   │   ├── table_properties_parser.py      # parse_table_properties()
│   │   ├── table_row_parser.py     # parse_table_row()
│   │   ├── table_row_properties_parser.py  # parse_table_row_properties()
│   │   ├── table_cell_parser.py    # parse_table_cell()
│   │   ├── table_cell_properties_parser.py # parse_table_cell_properties()
│   │   ├── table_grid_parser.py    # parse_table_grid()
│   │   └── section_parser.py       # parse_section_properties()
│   │
│   ├── styles/
│   │   ├── __init__.py
│   │   ├── styles_parser.py        # parse_styles() - main entry point
│   │   ├── style_parser.py         # parse_style() - individual style
│   │   ├── document_defaults_parser.py     # parse_document_defaults()
│   │   └── latent_styles_parser.py # parse_latent_styles()
│   │
│   └── numbering/
│       ├── __init__.py
│       ├── numbering_parser.py     # parse_numbering() - main entry point
│       ├── abstract_numbering_parser.py    # parse_abstract_numbering()
│       ├── level_parser.py         # parse_level()
│       └── numbering_instance_parser.py    # parse_numbering_instance()
│
├── converters/
│   ├── __init__.py
│   │
│   ├── common/
│   │   ├── __init__.py
│   │   ├── style_resolver.py       # Resolves styles through inheritance chain
│   │   └── numbering_tracker.py    # Tracks numbering counters across paragraphs
│   │
│   ├── html/
│   │   ├── __init__.py
│   │   ├── html_converter.py       # Main entry: docx_to_html()
│   │   ├── html_document.py        # Generates HTML document wrapper
│   │   ├── css_generator.py        # Converts style properties to CSS
│   │   ├── paragraph_to_html.py    # Paragraph → <p> conversion
│   │   ├── run_to_html.py          # Run → <span> conversion
│   │   ├── table_to_html.py        # Table → <table> conversion
│   │   └── numbering_to_html.py    # Numbering → <ol>/<ul> conversion
│   │
│   └── text/
│       ├── __init__.py
│       ├── text_converter.py       # Main entry: docx_to_text()
│       ├── paragraph_to_text.py    # Paragraph → plain text
│       ├── run_to_text.py          # Run → plain text
│       ├── table_to_text.py        # Table → ASCII table or plain text
│       └── numbering_to_text.py    # Numbering → text prefix (1., a., -, etc.)
│
└── tests/
    ├── __init__.py
    ├── conftest.py                 # Shared fixtures
    │
    ├── fixtures/                   # Test fixture DOCX files
    │   ├── text_formatting/        # Inline formatting tests
    │   ├── paragraph_formatting/   # Paragraph style tests
    │   ├── lists_numbering/        # Lists and numbering tests
    │   ├── tables/                 # Table tests
    │   └── comprehensive/          # Full document tests
    │
    ├── unit/
    │   ├── __init__.py
    │   ├── core/                   # Core module tests
    │   │   ├── test_docx_reader.py
    │   │   ├── test_xml_extractor.py
    │   │   └── test_exceptions.py
    │   ├── parsers/
    │   │   ├── test_paragraph_parser.py
    │   │   ├── test_run_parser.py
    │   │   ├── test_table_parser.py
    │   │   ├── test_styles_parser.py
    │   │   └── test_numbering_parser.py
    │   ├── converters/
    │   │   ├── test_css_generator.py
    │   │   ├── test_paragraph_to_html.py
    │   │   └── test_table_to_html.py
    │   └── models/
    │       └── test_model_validation.py
    │
    └── integration/
        ├── __init__.py
        ├── test_docx_to_html.py
        └── test_docx_to_text.py
```

---

## Design Principles

### 1. Single Responsibility per File

Each file should handle ONE concern:

| Bad (current) | Good (proposed) |
|---------------|-----------------|
| `run_properties_parser.py` (538 lines) | Split into: `run_properties_parser.py`, `color_parser.py`, `font_parser.py` |
| `table_properties_parser.py` (361 lines) | Split into: `table_properties_parser.py`, `border_parser.py`, `shading_parser.py` |

**Target**: No file should exceed ~150-200 lines of actual code.

### 2. Model Organization by XML Source

Models are grouped by which XML file they represent:

```
models/
├── document/    # → document.xml elements
├── styles/      # → styles.xml elements
└── numbering/   # → numbering.xml elements
```

Plus `common/` for shared types used across all three (borders, colors, shading).

### 3. Parser Organization Mirrors Models

Each parser file corresponds to a model file:

```
models/document/paragraph.py       → parsers/document/paragraph_parser.py
models/document/run.py             → parsers/document/run_parser.py
models/styles/style.py             → parsers/styles/style_parser.py
models/numbering/level.py          → parsers/numbering/level_parser.py
```

### 4. Converters are Output-Format Specific

Converters are grouped by output format (HTML, text), not by document element:

```
converters/
├── html/       # All HTML conversion logic
└── text/       # All plain text conversion logic
```

### 5. Common Utilities in Core

Shared utilities that don't belong to any specific domain:

- `constants.py` - XML namespaces, file paths
- `exceptions.py` - Custom exception hierarchy
- `docx_reader.py` - ZIP extraction, validation
- `xml_extractor.py` - XML content extraction
- `xml_helpers.py` - Low-level XML utilities
- `unit_conversion.py` - Twips, points, EMUs, etc.
- `model_utils.py` - Pydantic model utilities

### 6. Import Convention

All imports use **absolute imports** from the project root:

```python
# Correct - absolute imports from project root
from core.constants import WORD_NS
from core.exceptions import DocxParserError
from parsers.utils import get_attribute

# Incorrect - do NOT use package prefix
from docx_parser_converter.core.constants import WORD_NS  # NO!
```

This convention works because the project root is added to `PYTHONPATH` via `pyproject.toml`.

---

## File Contents Overview

### Core Module

#### `core/docx_reader.py`
```python
def read_docx(file_path: str | Path) -> DocxPackage
def extract_xml(docx_package: DocxPackage, part_name: str) -> Element
```

#### `core/xml_helpers.py`
```python
def get_element(parent: Element, tag: str) -> Element | None
def get_elements(parent: Element, tag: str) -> list[Element]
def get_attribute(element: Element, attr: str) -> str | None
def get_val_attribute(element: Element) -> str | None
```

#### `core/unit_conversion.py`
```python
def twips_to_points(twips: int) -> float
def half_points_to_points(half_points: int) -> float
def emu_to_points(emu: int) -> float
def eighths_to_points(eighths: int) -> float
```

---

### Models Module

#### `models/common/border.py`
```python
BorderStyleType = Literal["nil", "none", "single", "thick", ...]

class Border(BaseModel):
    val: BorderStyleType | None = None
    sz: float | None = None           # Size in points
    space: float | None = None        # Spacing in points
    color: str | None = None
    theme_color: ThemeColorType | None = None
```

#### `models/document/paragraph.py`
```python
class ParagraphBorders(BaseModel):
    top: Border | None = None
    left: Border | None = None
    bottom: Border | None = None
    right: Border | None = None
    between: Border | None = None
    bar: Border | None = None

class ParagraphProperties(BaseModel):
    p_style: str | None = None
    keep_next: bool | None = None
    keep_lines: bool | None = None
    spacing: Spacing | None = None
    ind: Indentation | None = None
    jc: JustificationType | None = None
    # ... etc.

class Paragraph(BaseModel):
    p_pr: ParagraphProperties | None = None
    content: list[Run | Hyperlink | BookmarkStart | BookmarkEnd] = []
```

#### `models/document/run_content.py`
```python
class Text(BaseModel):
    value: str
    space: Literal["preserve"] | None = None

class TabCharacter(BaseModel):
    """Tab character in run content."""
    pass

class Break(BaseModel):
    type: BreakType | None = None

class Symbol(BaseModel):
    font: str | None = None
    char: str | None = None

# Union type for run content
RunContentItem = Text | TabCharacter | Break | CarriageReturn | Symbol | ...
```

---

### Parsers Module

#### `parsers/document/paragraph_parser.py`
```python
from ..common.border_parser import parse_paragraph_borders
from ..common.spacing_parser import parse_spacing
from ..common.indentation_parser import parse_indentation

def parse_paragraph(element: Element) -> Paragraph:
    """Parse a <w:p> element into a Paragraph model."""
    p_pr = parse_paragraph_properties(element.find(W_PPR))
    content = parse_paragraph_content(element)
    return Paragraph(p_pr=p_pr, content=content)

def parse_paragraph_content(element: Element) -> list[RunContentItem]:
    """Parse all content within a paragraph (runs, hyperlinks, bookmarks)."""
    ...
```

#### `parsers/document/paragraph_properties_parser.py`
```python
def parse_paragraph_properties(element: Element | None) -> ParagraphProperties | None:
    """Parse <w:pPr> element into ParagraphProperties model."""
    if element is None:
        return None

    return ParagraphProperties(
        p_style=get_val_attribute(element.find(W_PSTYLE)),
        keep_next=parse_bool_element(element.find(W_KEEPNEXT)),
        keep_lines=parse_bool_element(element.find(W_KEEPLINES)),
        spacing=parse_spacing(element.find(W_SPACING)),
        ind=parse_indentation(element.find(W_IND)),
        jc=get_val_attribute(element.find(W_JC)),
        # ... etc.
    )
```

#### `parsers/common/border_parser.py`
```python
def parse_border(element: Element | None) -> Border | None:
    """Parse a single border element (<w:top>, <w:left>, etc.)."""
    ...

def parse_paragraph_borders(element: Element | None) -> ParagraphBorders | None:
    """Parse <w:pBdr> element."""
    ...

def parse_table_borders(element: Element | None) -> TableBorders | None:
    """Parse <w:tblBorders> or <w:tcBorders> element."""
    ...
```

---

### Converters Module

#### `converters/common/style_resolver.py`
```python
class StyleResolver:
    """Resolves style properties by traversing the style inheritance chain."""

    def __init__(self, styles: Styles, document_defaults: DocumentDefaults):
        self.styles = styles
        self.document_defaults = document_defaults
        self._cache: dict[str, ResolvedStyle] = {}

    def resolve_paragraph_style(self, style_id: str | None) -> ParagraphProperties:
        """Get fully resolved paragraph properties for a style ID."""
        ...

    def resolve_run_style(self, style_id: str | None) -> RunProperties:
        """Get fully resolved run properties for a style ID."""
        ...
```

#### `converters/common/numbering_tracker.py`
```python
class NumberingTracker:
    """Tracks numbering counters across paragraphs."""

    def __init__(self, numbering: Numbering):
        self.numbering = numbering
        self._counters: dict[tuple[int, int], int] = {}  # (numId, ilvl) -> count

    def get_number(self, num_id: int, ilvl: int) -> str:
        """Get the formatted number for a paragraph at the given level."""
        ...

    def reset_level(self, num_id: int, ilvl: int):
        """Reset counter when higher level appears."""
        ...
```

#### `converters/html/css_generator.py`
```python
def paragraph_properties_to_css(props: ParagraphProperties) -> dict[str, str]:
    """Convert paragraph properties to CSS style dict."""
    ...

def run_properties_to_css(props: RunProperties) -> dict[str, str]:
    """Convert run properties to CSS style dict."""
    ...

def table_properties_to_css(props: TableProperties) -> dict[str, str]:
    """Convert table properties to CSS style dict."""
    ...
```

#### `converters/html/paragraph_to_html.py`
```python
def paragraph_to_html(
    paragraph: Paragraph,
    style_resolver: StyleResolver,
    numbering_tracker: NumberingTracker | None = None
) -> str:
    """Convert a Paragraph model to HTML string."""
    ...
```

---

## Migration Strategy

### Phase 1: Models
1. Create `models/common/` with shared types
2. Create `models/document/` with document.xml models
3. Create `models/styles/` with styles.xml models
4. Create `models/numbering/` with numbering.xml models

### Phase 2: Core Utilities
1. Create `core/docx_reader.py`
2. Create `core/xml_helpers.py`
3. Create `core/unit_conversion.py`
4. Create `core/model_utils.py`

### Phase 3: Parsers
1. Create `parsers/common/` with shared parsing utilities
2. Create `parsers/document/` parsers
3. Create `parsers/styles/` parsers
4. Create `parsers/numbering/` parsers

### Phase 4: Converters
1. Create `converters/common/` with style resolver and numbering tracker
2. Create `converters/html/` converters
3. Create `converters/text/` converters

### Phase 5: Integration & Testing
1. Create integration tests
2. Verify output matches original library
3. Deprecate old code

---

## Questions for Review

1. **Naming conventions**: Should we use `parse_` prefix for all parser functions, or is the module name sufficient context?

2. **Model inheritance**: Should we have base classes for common patterns (e.g., `BaseProperties` for all `*Properties` classes)?

3. **Converter patterns**: Should converters be classes or pure functions? Current plan uses functions.

4. **Output formats**: Are there other output formats planned beyond HTML and plain text (e.g., Markdown, JSON)?

5. **Streaming**: Should the API support streaming large documents, or is in-memory processing sufficient?

6. **Error handling**: How should parsing errors be handled - exceptions, result types, or logging and fallbacks?

---

## File Count Comparison

| Category | Current | Proposed |
|----------|---------|----------|
| Models | 5 files | 17 files |
| Parsers | 16 files | 23 files |
| Converters (HTML) | 6 files | 7 files |
| Converters (Text) | 5 files | 5 files |
| Core utilities | 2 files | 4 files |
| **Total** | **34 files** | **56 files** |

More files, but each file is smaller and more focused. Average lines per file should drop from ~180 to ~80-100.

---

## Important Design Decisions

### Width vs Indentation

- **Width** (`width.py`) - Used for actual widths with value + type:
  - `<w:tblW>` - Table width
  - `<w:tcW>` - Table cell width

- **Indentation** (`indentation.py`) - Used for all indentation properties:
  - `<w:ind>` - Paragraph indentation (left, right, firstLine, hanging, start, end)
  - `<w:tblInd>` - Table indentation (conceptually indentation, not width)

Note: Although `<w:tblInd>` has similar XML attributes to Width (`w:w`, `w:type`), it represents table indentation from the margin, so it uses the Indentation model for semantic clarity.
