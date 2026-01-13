# CLAUDE.md - Docx Parser Converter

> Institutional memory for Claude Code sessions. Update this file whenever Claude makes mistakes or learns something new about the project.

---

## Project Overview

A dual-implementation DOCX parser and converter:
- **Python**: Production-ready library (`docx_parser_converter_python/`)
- **TypeScript**: Browser-compatible version (`docx_parser_converter_ts/`)

Converts `.docx` files to HTML or plain text while preserving formatting, styles, lists, and tables.

---

## Tech Stack

### Python Implementation
- **Language**: Python 3.10+
- **Package Manager**: PDM
- **Core Dependencies**: lxml, pydantic v2
- **Testing**: pytest (1,493 tests)
- **Type Checking**: pyright (basic mode)
- **Linting**: ruff

### TypeScript Implementation
- **Language**: TypeScript 5.2+
- **Package Manager**: pnpm
- **Core Dependencies**: @xmldom/xmldom, jszip
- **Build**: Vite (ES, UMD, IIFE outputs)
- **Linting**: ESLint with typescript-eslint

---

## Project Structure

```
/
├── docx_parser_converter_python/    # Main Python implementation
│   ├── core/                        # Infrastructure (DocxReader, etc.)
│   ├── models/                      # Pydantic data models
│   ├── parsers/                     # XML-to-model parsers
│   ├── converters/                  # HTML/Text converters
│   ├── tests/unit/                  # Unit tests
│   └── api.py                       # Public API
├── docx_parser_converter_ts/        # TypeScript implementation
│   └── src/
├── fixtures/                        # Test data
│   ├── test_docx_files/             # Input .docx files + expected outputs
│   └── tagged_tests/                # Tagged test DOCX files (Test #N format)
└── docs/                            # Documentation
```

---

## Essential Commands

### Python (run from `docx_parser_converter_python/`)

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/converters/html/test_html_converter.py -v

# Run tests matching pattern
pytest -k "test_list" -v

# Type checking
pyright

# Linting
ruff check .

# Auto-fix lint issues
ruff check . --fix

# Format code
ruff format .
```

### TypeScript (run from `docx_parser_converter_ts/`)

```bash
# Development server
pnpm run dev

# Build
pnpm run build

# Lint
pnpm run lint
```

---

## Architecture Patterns

### Data Flow
```
DOCX File → DocxReader → XML Parts → Parsers → Pydantic Models → Converters → Output
```

### Key Principles

1. **Type-First Approach**: All data flows through Pydantic v2 models
2. **Immutable Models**: Use `frozen=True` on Pydantic models
3. **Raw Values**: Models store raw XML values (no unit conversion during parsing)
4. **Style Resolution**: Hierarchical inheritance (direct → style → defaults)
5. **Parser Separation**: One parser per XML part (document, styles, numbering)

### Public API

```python
from docx_parser_converter_python import docx_to_html, docx_to_text

# Convert to HTML
html = docx_to_html("document.docx")

# Convert to text
text = docx_to_text("document.docx")

# With configuration
from docx_parser_converter_python import ConversionConfig, StyleMode
config = ConversionConfig(style_mode=StyleMode.INLINE)
html = docx_to_html("document.docx", config=config)
```

---

## Code Style Guidelines

### Python

1. **Type hints everywhere** - All function parameters and returns must be typed
2. **Pydantic for data** - Use Pydantic models, not dataclasses or dicts
3. **Private methods** - Prefix with `_` for internal methods
4. **No magic numbers** - Use constants or enums
5. **Docstrings** - Required for public API functions only

### Naming Conventions

```python
# Classes: PascalCase
class StyleResolver:
    pass

# Functions/methods: snake_case
def parse_document_xml():
    pass

# Constants: SCREAMING_SNAKE_CASE
DEFAULT_FONT_SIZE = 11

# Private: leading underscore
def _internal_helper():
    pass
```

### Import Order

```python
# 1. Standard library
from typing import Optional
from pathlib import Path

# 2. Third-party
from lxml import etree
from pydantic import BaseModel

# 3. Local imports
from .models import Paragraph
from .core import DocxReader
```

---

## Common Mistakes to Avoid

### 1. Forgetting to Handle None/Optional Values

```python
# BAD
def get_font_size(run) -> int:
    return run.properties.font_size  # May be None!

# GOOD
def get_font_size(run) -> Optional[int]:
    if run.properties and run.properties.font_size:
        return run.properties.font_size
    return None
```

### 2. Modifying Frozen Pydantic Models

```python
# BAD - Will raise error
model.field = new_value

# GOOD - Create new instance
new_model = model.model_copy(update={"field": new_value})
```

### 3. Not Using the Style Resolver

```python
# BAD - Direct property access misses inheritance
font_size = paragraph.properties.font_size

# GOOD - Use resolver for proper inheritance
resolved = style_resolver.resolve_paragraph_properties(paragraph)
font_size = resolved.font_size
```

### 4. Hardcoding XML Namespaces

```python
# BAD
element.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p")

# GOOD - Use constants from core/constants.py
from core.constants import NAMESPACES
element.find(f"{{{NAMESPACES['w']}}}p")
```

### 5. Not Handling Empty/Missing XML Elements

```python
# BAD - Assumes element exists
value = element.find("child").text

# GOOD - Handle missing elements
child = element.find("child")
value = child.text if child is not None else None
```

### 6. Forgetting List Context in HTML Conversion

Lists require tracking state across paragraphs. Always use the list manager:
```python
# The HTML converter maintains list state via NumberingContext
# Never try to handle list items in isolation
```

### 7. Using datetime.now() Instead of Proper Testing

```python
# BAD - Non-deterministic
timestamp = datetime.now()

# GOOD - Use fixtures or freeze time in tests
```

---

## Testing Guidelines

### Test File Organization

```
tests/unit/
├── parsers/          # Test XML parsing
├── core/             # Test infrastructure
├── converters/       # Test HTML/Text output
│   ├── html/
│   └── text/
└── conftest.py       # Shared fixtures
```

### Test Naming

```python
# Format: test_<what>_<condition>_<expected_result>
def test_parse_paragraph_with_bold_run_returns_bold_property():
    pass

def test_convert_table_with_merged_cells_generates_colspan():
    pass
```

### Using Fixtures

```python
# In conftest.py - use make_element helper
def test_something(make_element):
    element = make_element("<w:p><w:r><w:t>Hello</w:t></w:r></w:p>")
    # Test with element
```

### Output Verification

Expected outputs are in `fixtures/test_docx_files/` alongside the input files. When changing converter behavior:
1. Run conversion on test files
2. Compare with expected outputs using `python scripts/verify_outputs.py`
3. If intentional change, update expected outputs with `--update` flag
4. If unintentional, fix the bug

### Tagged Tests

For testing specific formatting features, use the tagged test system in `fixtures/tagged_tests/`:
```bash
python scripts/verify_tests.py --all
```

---

## Verification Checklist

Before committing changes:

1. **Type Check**: `pyright` - must pass with no errors
2. **Lint**: `ruff check .` - must pass
3. **Tests**: `pytest` - all 1,493 tests must pass
4. **Output Verification**: `python scripts/verify_outputs.py` - must pass
5. **Tagged Tests**: `python scripts/verify_tests.py --all` - all 44 tests must pass

**Note:** A `PostToolUse` hook automatically runs all verification checks after any Python file is modified (Write/Edit). See `.claude/settings.json` for hook configuration.

---

## Image Format Support

Images are embedded as base64 data URLs. Browser support varies:

| Format | Browser Support |
|--------|-----------------|
| PNG, JPEG, GIF, WebP, SVG, BMP | ✅ Full |
| TIFF | ⚠️ Safari only |
| EMF, WMF | ❌ Not supported (Windows vector formats) |

Key files:
- `models/document/drawing.py` - Pydantic models for Drawing elements
- `parsers/document/drawing_parser.py` - Parses `<w:drawing>` XML
- `converters/html/image_to_html.py` - Converts to `<img>` with base64 data URL
- `core/xml_extractor.py` - `get_media_content_type()` maps extensions to MIME types

---

## Known Limitations

The parser intentionally does NOT support:
- Headers/footers
- Footnotes/endnotes
- Comments
- Custom XML parts
- Embedded objects (OLE)

These are documented in README.md and should not be implemented without discussion.

---

## Debugging Tips

### Inspect Raw XML

```python
from docx_parser_converter_python.core import DocxReader

reader = DocxReader("document.docx")
document_xml = reader.read_xml("word/document.xml")
print(etree.tostring(document_xml, pretty_print=True).decode())
```

### Debug Style Resolution

```python
from docx_parser_converter_python.core import StyleResolver

resolver = StyleResolver(styles, numbering, document_defaults)
resolved = resolver.resolve_paragraph_properties(paragraph)
print(f"Font: {resolved.font_name}, Size: {resolved.font_size}")
```

### Compare Outputs

```bash
# Verify all outputs match expected
python scripts/verify_outputs.py --verbose

# Verify tagged tests (formatting, tables, lists)
python scripts/verify_tests.py --all -v
```

---

## Changelog of Lessons Learned

| Date | Issue | Resolution |
|------|-------|------------|
| - | Style inheritance not working | Use StyleResolver, not direct property access |
| - | List numbering incorrect | Maintain NumberingContext across paragraphs |
| - | Font names with spaces breaking CSS | Use single quotes around font names |
| - | Underline variants not rendering | Handle all underline types in style mapping |
| - | Page margins not applied to HTML | Extract from `sect_pr.pg_mar` and apply as body padding |
| - | Browser default `<p>` margins causing extra space | Add `p { margin: 0; }` CSS reset |
| - | Empty paragraphs invisible in HTML | Add `<br>` to empty paragraphs to preserve vertical space |

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| Public API | `docx_parser_converter_python/api.py` |
| Models | `docx_parser_converter_python/models/` |
| HTML Converter | `docx_parser_converter_python/converters/html/` |
| Test Fixtures | `fixtures/test_docx_files/` |
| Expected Outputs | `fixtures/test_docx_files/*-python.html/txt` |
| Tagged Tests | `fixtures/tagged_tests/` |

### Key Classes

| Class | Purpose |
|-------|---------|
| `DocxReader` | Opens and reads DOCX archives |
| `DocumentParser` | Parses document.xml |
| `StylesParser` | Parses styles.xml |
| `NumberingParser` | Parses numbering.xml |
| `StyleResolver` | Resolves style inheritance |
| `HTMLConverter` | Converts to HTML |
| `TextConverter` | Converts to plain text |

### Table Text Conversion

The `table_to_text` function supports multiple rendering modes:

| Mode | Description |
|------|-------------|
| `ascii` | Full ASCII box with all borders (`+`, `-`, `\|`) |
| `tabs` | Tab-separated columns, newline-separated rows (no borders) |
| `plain` | Space-separated columns, newline-separated rows (no borders) |
| `auto` | Chooses `ascii` or `tabs` based on border detection (default) |

**Border Detection (auto mode)**:
- Checks table-level borders (`tbl_pr.tbl_borders`)
- Falls back to cell-level borders (`tc_pr.tc_borders`) if no table borders
- Supports partial borders: top only, bottom only, outer only, inside only
- Borders with `val="none"` or `val="nil"` are treated as invisible

**Partial Border Rendering**:
When `mode="auto"` and the table has partial borders, only the defined borders are rendered:
```
# Table with top and bottom borders only (no sides):
-----------
  A     B
  C     D
-----------

# Table with outer borders only (no inside grid):
+---------+
| A     B |
| C     D |
+---------+

# Table with inside borders only (grid lines, no outer):
  A | B
----+----
  C | D
```

**Explicit vs Auto Mode**:
- `mode="ascii"`: Always renders full borders regardless of table definition
- `mode="auto"`: Renders only the borders defined in the DOCX
