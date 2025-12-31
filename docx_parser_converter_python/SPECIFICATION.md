# DOCX Parser Converter - Technical Specification

## Overview

This document defines the complete technical specification for the `docx_parser_converter` Python library, a tool for converting DOCX files to HTML and plain text formats.

---

## 1. Core Requirements

### 1.1 Python Version
- **Minimum**: Python 3.10+
- **Rationale**: Enables modern type syntax (`X | Y` unions), pattern matching

### 1.2 Dependencies
- **lxml**: XML parsing (required)
- **Pydantic**: Model validation and immutable dataclasses (required)

### 1.3 Distribution
- **PyPI only**: Standard `pip install` distribution
- **No CLI**: Library-only, no command-line interface

---

## 2. Architecture Decisions

### 2.1 Error Handling Strategy
- **Approach**: Partial results with warnings
- **Implementation**: Use Python's `logging` module for warnings/errors
- **Behavior**: Parse as much as possible, log warnings for issues, continue processing
- **Encrypted files**: Reject with clear error message (no decryption support)

### 2.2 Memory Model
- **Approach**: In-memory only
- **Rationale**: Simpler implementation, sufficient for typical document sizes
- **No streaming**: Entire document loaded into memory

### 2.3 Model Immutability
- **Approach**: Immutable (frozen Pydantic models)
- **Rationale**: Safer, hashable, prevents side effects
- **Modification**: Use Pydantic's `model_copy()` for any modifications

### 2.4 Unit Conversions
- **Timing**: During conversion (not parsing)
- **Storage**: Models store raw XML values (twips, half-points, EMUs)
- **Conversion**: Convert to points/pixels at output generation time

### 2.5 Style Resolution
- **Timing**: Eager (at parse time)
- **Approach**: Fully resolve all styles during parsing
- **Merge order**: defaults → style chain → direct formatting (direct wins)
- **Circular refs**: Detect and warn, break cycle at detection point

### 2.6 Unknown/Unimplemented Elements
- **Handling**: Skip silently
- **Scope**: Drawings, charts, SmartArt, equations, etc.
- **No placeholders**: Clean output without `[UNSUPPORTED]` markers

---

## 3. Input/Output Specification

### 3.1 Input Validation
- **Level**: Strict validation
- **Checks**:
  - Valid ZIP archive
  - Required parts present (document.xml)
  - Correct content types

### 3.2 Input Types Accepted
- File path (`str` or `pathlib.Path`)
- Raw bytes (`bytes`)
- File-like objects (`BinaryIO`)

### 3.3 Output Types
- Return `str` by default
- Optionally write directly to file path if provided

### 3.4 Public API (Backwards Compatible)
```python
def docx_to_html(
    source: str | Path | bytes | BinaryIO,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None
) -> str:
    """Convert DOCX to HTML."""

def docx_to_text(
    source: str | Path | bytes | BinaryIO,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None
) -> str:
    """Convert DOCX to plain text."""
```

### 3.5 Configuration
- **Pattern**: Single `ConversionConfig` Pydantic model
- **Default behavior**: Zero-config with sensible defaults
- **All options optional**: `docx_to_html(path)` just works

---

## 4. HTML Output Specification

### 4.1 Document Structure
- **Output**: Full HTML5 document with `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`
- **Encoding**: UTF-8

### 4.2 Styling Approach
- **Configurable**: Inline CSS vs CSS classes with `<style>` block
- **Default**: Inline CSS for self-contained output
- **Character styling**: CSS spans (not semantic `<strong>`/`<em>`)

```html
<!-- Inline mode (default) -->
<span style="font-weight: bold; color: #FF0000;">text</span>

<!-- Class mode -->
<span class="r1">text</span>
<style>.r1 { font-weight: bold; color: #FF0000; }</style>
```

### 4.3 Paragraph Rendering
- **Element**: `<p>` tags
- **Spacing**: CSS `padding-top`/`padding-bottom` (not margin)
- **Default spacing**: Apply Word defaults (8pt after) when not specified
- **Empty paragraphs**: Preserved (maintain structure)

### 4.4 List/Numbering Rendering
- **Approach**: Flat paragraphs with visual numbering
- **NOT semantic**: No `<ol>`/`<ul>`/`<li>` hierarchy
- **Number tracking**: Per numId, handles restarts via lvlOverride

```html
<p style="margin-left: 36pt;">1. First item</p>
<p style="margin-left: 36pt;">2. Second item</p>
<p style="margin-left: 72pt;">a. Nested item</p>
```

### 4.5 Table Rendering
- **Element**: Standard `<table>`, `<tr>`, `<td>`
- **Cell merging**: Use `colspan`/`rowspan` attributes
- **Borders**: Only if explicitly defined (no defaults)
- **Vertical align**: Convert Word vAlign to CSS `vertical-align`

### 4.6 Font Handling
- **Approach**: Preserve exact font names
- **Output**: `font-family: 'Calibri'` (exact name, no web-safe mapping)

### 4.7 Color Handling
- **Theme colors**: Fallback to explicit `val` attribute only
- **No theme.xml parsing**: Ignore themeColor, themeTint, themeShade
- **Highlight**: Direct `background-color` CSS

### 4.8 Special Characters
- **Soft hyphen**: `&shy;`
- **Non-breaking space**: `&nbsp;`
- **Whitespace**: Preserve exactly (honor `xml:space="preserve"`)

### 4.9 Hyperlinks
- **External only**: Resolve external URLs from relationships
- **Internal anchors**: Skip (bookmarks ignored)

### 4.10 Section/Page Breaks
- **Configurable**: Div wrapper, `<hr>`, or ignore
- **Default**: `<div class="page-break">` wrapper

### 4.11 Text Effects
- **Bold/Italic**: CSS `font-weight: bold`, `font-style: italic`
- **Underline**: CSS `text-decoration: underline`
- **Strikethrough**: CSS `text-decoration: line-through`
- **Double strike**: CSS `text-decoration: line-through; text-decoration-style: double`
- **Sub/superscript**: CSS `vertical-align: sub/super` with other styles combined
- **Highlight**: CSS `background-color: <color>`

### 4.12 Tab Stops
- **Approach**: CSS positioning
- **Implementation**: CSS `tab-size` or absolute positioning based on tab stop definitions

### 4.13 Bidirectional Text
- **Approach**: Preserve `dir` attributes
- **Output**: `dir="rtl"` and CSS `direction` property where specified

### 4.14 Headers/Footers
- **Handling**: Ignore (page-layout specific)

### 4.15 Comments/Annotations
- **Handling**: Strip completely

### 4.16 Field Codes
- **Handling**: Skip entirely (remove field codes and content)

### 4.17 Bookmarks
- **Handling**: Ignore (no ID attributes or anchor spans)

### 4.18 Revision Tracking
- **Handling**: Final only (output accepted state)

### 4.19 Outline Levels
- **Handling**: Ignore (no data attributes or heading tag mapping)

---

## 5. Plain Text Output Specification

### 5.1 Basic Structure
- **Line breaks**: Single `\n` for `<w:br>`, double `\n\n` for paragraph end
- **Empty paragraphs**: Preserved as blank lines

### 5.2 Table Rendering
- **Configurable with smart defaults**:
  - Visible borders → ASCII box drawing (`+--+--+`)
  - Invisible borders → Tab-separated or plain text
- **Options**: ASCII, tab-separated, plain text only

### 5.3 Formatting Hints
- **Configurable**: Plain text vs Markdown-annotated
- **Plain mode**: Pure text, no markers
- **Markdown mode**: `*bold*`, `_italic_`, etc.

### 5.4 Whitespace
- **Preserve**: Exact whitespace from document
- **Tabs**: Convert to spaces or preserve tab character

---

## 6. Parsing Specification

### 6.1 Width vs Indentation Models
- **Width** (`width.py`): For actual widths
  - `<w:tblW>` - Table width
  - `<w:tcW>` - Table cell width

- **Indentation** (`indentation.py`): For all indentation
  - `<w:ind>` - Paragraph indentation
  - `<w:tblInd>` - Table indentation from margin

### 6.2 Style Resolution Order
1. Document defaults (`<w:docDefaults>`)
2. Style chain (basedOn hierarchy, resolved recursively)
3. Direct formatting on element

### 6.3 Numbering Counter Management
- Track counters per `(abstractNumId, level)`
- Reset based on `lvlRestart` when higher level appears
- Honor `startOverride` in `<w:num>` elements

---

## 7. Configuration Object

```python
from pydantic import BaseModel
from typing import Literal

class ConversionConfig(BaseModel):
    """Configuration for DOCX conversion."""

    # HTML-specific options
    html_style_mode: Literal["inline", "classes"] = "inline"
    section_break_mode: Literal["div", "hr", "ignore"] = "div"

    # Text-specific options
    text_table_mode: Literal["ascii", "tabs", "plain", "auto"] = "auto"
    text_formatting: Literal["plain", "markdown"] = "plain"

    # Shared options
    preserve_empty_paragraphs: bool = True

    class Config:
        frozen = True
```

---

## 8. Type System

### 8.1 Type Hints
- **Coverage**: Fully typed (all functions and classes)
- **Tools**: Compatible with mypy strict mode
- **IDE support**: Full autocomplete and type checking

### 8.2 Model Structure
- All models use Pydantic `BaseModel`
- Frozen (immutable) by default
- Optional fields use `X | None` syntax

---

## 9. Logging

### 9.1 Approach
- Use Python standard `logging` module
- Logger name: `docx_parser_converter`
- **No performance logging**: Silent unless errors/warnings

### 9.2 Log Levels
- **WARNING**: Malformed elements, skipped content, circular styles
- **ERROR**: Unrecoverable parsing issues (still continues)
- **DEBUG**: Not used (no performance metrics)

---

## 10. Testing

### 10.1 Test Fixtures
- **Approach**: Include sample DOCX files in repository
- **Location**: `tests/fixtures/`
- **Coverage**: Various document features (tables, styles, numbering, etc.)

### 10.2 Test Structure
```
tests/
├── fixtures/           # Sample DOCX files
├── unit/              # Unit tests per module
│   ├── parsers/
│   ├── converters/
│   └── models/
└── integration/       # End-to-end conversion tests
```

---

## 11. Not Supported (Out of Scope)

The following features are explicitly NOT supported:

1. **Drawings/Images**: Skip silently
2. **Charts**: Skip silently
3. **SmartArt**: Skip silently
4. **Math equations**: Skip silently
5. **Embedded objects**: Skip silently
6. **Password-protected files**: Reject with error
7. **Theme color resolution**: Use fallback values only
8. **Headers/Footers**: Ignore
9. **Comments/Annotations**: Strip
10. **Field codes**: Skip
11. **Bookmarks**: Ignore
12. **Internal hyperlinks**: Skip
13. **Async processing**: Not supported
14. **Streaming/chunked processing**: Not supported
15. **CLI interface**: Not provided
16. **Metadata extraction**: Not provided
17. **Word compatibility modes**: Ignored

---

## 12. API Surface Summary

### Public Functions
```python
# Main conversion functions
docx_to_html(source, output_path=None, config=None) -> str
docx_to_text(source, output_path=None, config=None) -> str
```

### Public Classes
```python
# Configuration
ConversionConfig

# Exceptions (if needed)
DocxParseError
DocxValidationError
```

### Internal (Not Exported)
- All parser functions
- All model classes
- All converter helpers
- Core utilities

---

## 13. Default Behavior Summary

When called with just a file path and no configuration:

```python
html = docx_to_html("document.docx")
```

The output will:
- Be a complete HTML5 document
- Use inline CSS for all styling
- Preserve all whitespace exactly
- Apply Word's default spacing
- Render tables with colspan/rowspan for merges
- Show numbered lists as styled paragraphs
- Skip all unsupported elements silently
- Use exact font names from document
- Preserve bidirectional text direction
- Use `<div>` wrappers for page breaks
