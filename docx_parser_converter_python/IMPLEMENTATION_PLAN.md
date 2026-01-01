# DOCX Parser Converter - Implementation Plan

## Overview

This document tracks the implementation progress for the `docx_parser_converter` library. For technical specifications, see [SPECIFICATION.md](SPECIFICATION.md). For code structure and patterns, see [STRUCTURE_PLAN.md](STRUCTURE_PLAN.md).

---

## Implementation Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Core Infrastructure | ✅ Complete | 100% |
| Phase 1: Pydantic Models | ✅ Complete | 100% |
| Phase 2: Parsers | ✅ Complete | 100% |
| Phase 3: Parser Unit Tests | ✅ Complete | 100% |
| Phase 4: Style Resolution | ✅ Complete | 100% |
| Phase 5: HTML Converter | ✅ Complete | 100% |
| Phase 6: Text Converter | ✅ Complete | 100% |
| Phase 7: Integration & Polish | ✅ Complete | 100% |

**Total Tests:** 1369 passing (52 core + 350 parsers + 100 style resolution + 553 HTML converter + 216 text converter + 98 integration/API)

---

## Phase 0: Core Infrastructure ✅

### Deliverables
- [x] `core/docx_reader.py` - DOCX file opening and validation
- [x] `core/xml_extractor.py` - XML content extraction
- [x] `core/constants.py` - XML namespaces and file paths
- [x] `core/exceptions.py` - Custom exception hierarchy
- [x] `parsers/mapper.py` - Tag-to-parser routing
- [x] `parsers/utils.py` - Shared parsing utilities

### Success Criteria
- [x] Can open DOCX from path, bytes, or file-like object
- [x] Validates DOCX structure (rejects encrypted files)
- [x] Extracts document.xml, styles.xml, numbering.xml
- [x] Extracts relationships for hyperlinks
- [x] 52 unit tests passing

---

## Phase 1: Pydantic Models ✅

### Deliverables
- [x] `models/types.py` - Type definitions (Literal types for enums)
- [x] `models/common/` - Border, Color, Shading, Spacing, Indentation, Width
- [x] `models/document/` - Document, Paragraph, Run, Table, Section, etc.
- [x] `models/numbering/` - Numbering, AbstractNumbering, Level, etc.
- [x] `models/styles/` - Styles, Style, DocumentDefaults, LatentStyles

### Success Criteria
- [x] All models use frozen Pydantic BaseModel
- [x] Models store raw XML values (no unit conversion)
- [x] Full type coverage with `X | None` syntax
- [x] All `__init__.py` exports configured

---

## Phase 2: Parsers ✅

### Deliverables
- [x] `parsers/common/` - 6 parser files (color, border, shading, width, spacing, indentation)
- [x] `parsers/document/` - 18 parser files (run, paragraph, table, section, etc.)
- [x] `parsers/numbering/` - 4 parser files
- [x] `parsers/styles/` - 4 parser files
- [x] Mapper factories for mixed content parsing

### Success Criteria
- [x] All parsers handle None input gracefully
- [x] All parsers follow established patterns (see STRUCTURE_PLAN.md)
- [x] Parsers use mapper for mixed content (runs, body, paragraphs)

---

## Phase 3: Parser Unit Tests ✅

### Deliverables
- [x] `tests/unit/parsers/conftest.py` - Test infrastructure with `make_element()` helper
- [x] `tests/unit/parsers/test_common_parsers.py` - 53 tests
- [x] `tests/unit/parsers/test_run_parser.py` - 56 tests
- [x] `tests/unit/parsers/test_paragraph_parser.py` - 46 tests
- [x] `tests/unit/parsers/test_table_parser.py` - 61 tests
- [x] `tests/unit/parsers/test_numbering_parser.py` - 43 tests
- [x] `tests/unit/parsers/test_styles_parser.py` - 47 tests

### Success Criteria
- [x] 350 parser tests passing
- [x] Tests cover None input, empty elements, all attributes
- [x] Tests cover enumerated values and edge cases
- [x] ruff and pyright pass with no errors

---

## Phase 4: Style Resolution ✅

### Deliverables
- [x] `converters/common/style_resolver.py` - Style inheritance resolver
- [x] `converters/common/numbering_tracker.py` - Numbering counter manager
- [x] `core/model_utils.py` - Model merging utilities
- [x] `tests/unit/converters/test_style_resolver.py` - 35 tests
- [x] `tests/unit/converters/test_numbering_tracker.py` - 33 tests
- [x] `tests/unit/core/test_model_utils.py` - 32 tests

### Success Criteria
- [x] Style chains resolve correctly (up to 15 levels deep)
- [x] Circular style references detected and logged
- [x] Direct formatting overrides style properties
- [x] Numbering counters track correctly across paragraphs
- [x] List restarts work via `lvlRestart` and `lvlOverride`
- [x] Number formats: decimal, lowerLetter, upperLetter, lowerRoman, upperRoman, bullet
- [x] Document defaults merged with style chain
- [x] ruff and pyright pass with no errors

---

## Phase 5: HTML Converter ✅

### Deliverables
- [x] `converters/html/html_converter.py` - Main entry point `docx_to_html()`
- [x] `converters/html/html_document.py` - HTML5 document wrapper
- [x] `converters/html/css_generator.py` - Properties to CSS conversion
- [x] `converters/html/paragraph_to_html.py` - Paragraph conversion
- [x] `converters/html/run_to_html.py` - Run/span conversion
- [x] `converters/html/table_to_html.py` - Table conversion with colspan/rowspan
- [x] `converters/html/numbering_to_html.py` - List numbering prefixes
- [x] Unit tests for HTML conversion (553 tests)

### Tasks
1. Implement CSS generator ✅
   - Convert spacing/indentation to CSS (with unit conversion)
   - Convert fonts, colors, borders to CSS
   - Support inline mode and class mode

2. Implement run converter ✅
   - Generate `<span>` with inline styles or class
   - Handle bold, italic, underline, strikethrough, highlight
   - Handle special characters (soft hyphen, non-breaking space)

3. Implement paragraph converter ✅
   - Generate `<p>` with styles
   - Handle numbering prefixes
   - Handle hyperlinks

4. Implement table converter ✅
   - Generate `<table>`, `<tr>`, `<td>`
   - Calculate colspan/rowspan from gridSpan/vMerge
   - Apply cell borders and shading

5. Implement document converter ✅
   - Generate complete HTML5 document
   - Include `<style>` block for class mode
   - Handle section/page breaks

### Success Criteria
- [x] Output is valid HTML5
- [x] Inline CSS mode produces self-contained HTML
- [x] Class mode generates minimal CSS
- [x] Tables render with correct merging
- [x] Lists show correct numbering
- [x] All text effects render correctly

---

## Phase 6: Text Converter ✅

### Deliverables
- [x] `converters/text/text_converter.py` - Main entry point `document_to_text()`
- [x] `converters/text/paragraph_to_text.py` - Paragraph conversion
- [x] `converters/text/run_to_text.py` - Run conversion
- [x] `converters/text/table_to_text.py` - ASCII/tab table conversion
- [x] `converters/text/numbering_to_text.py` - List prefixes
- [x] Unit tests for text conversion (216 tests)

### Tasks
1. Implement run converter ✅
   - Extract text content
   - Handle breaks as newlines
   - Optional: Markdown formatting mode

2. Implement paragraph converter ✅
   - Join runs with appropriate spacing
   - Add numbering prefixes
   - Handle paragraph breaks

3. Implement table converter ✅
   - ASCII box mode for visible borders
   - Tab-separated mode for invisible borders
   - Plain text mode
   - Auto mode (selects based on border visibility)

4. Implement document converter ✅
   - Join paragraphs with blank lines
   - Handle section breaks

### Success Criteria
- [x] Preserves all text content exactly
- [x] Tables render appropriately based on borders
- [x] Optional Markdown mode works
- [x] Whitespace preserved correctly

---

## Phase 7: Integration & Polish ✅

### Deliverables
- [x] `api.py` - Public API with `docx_to_html`, `docx_to_text`, `ConversionConfig`
- [x] `__init__.py` - Public API exports
- [x] Integration tests with real DOCX files (51 tests)
- [x] Unit tests for API module (47 tests)
- [x] Documentation (comprehensive README.md)
- [x] Fixture outputs for smoke testing (HTML, TXT, MD for all 13 fixtures)

### Tasks
1. Finalize public API ✅
   - `docx_to_html(source, output_path=None, config=None) -> str`
   - `docx_to_text(source, output_path=None, config=None) -> str`
   - `ConversionConfig` with all options (HTML and text)

2. Integration testing ✅
   - Test with all 13 fixture files
   - All fixtures convert successfully
   - Generated HTML, TXT, and MD outputs for visual inspection

3. Documentation ✅
   - README with usage examples
   - API documentation with all configuration options
   - Known limitations documented

### Success Criteria
- [x] Public API is simple and intuitive
- [x] All fixture files convert successfully
- [x] 1369 tests passing
- [x] ruff and pyright pass with no errors

---

## Test Fixtures

### Existing Fixtures (in `tests/fixtures/`)

| Category | Count | Files |
|----------|-------|-------|
| text_formatting | 4 | inline_formatting, fonts_and_sizes, run_effects, underline_styles |
| paragraph_formatting | 3 | paragraph_control, paragraphs_and_fonts, formatting_and_styles |
| lists_numbering | 3 | lists_basic, list_formatting, list_with_styling |
| tables | 2 | tables_basic, table_advanced |
| comprehensive | 1 | comprehensive |

**Total: 13 fixtures**

### Generated Outputs

All fixtures have been converted to HTML, TXT, and Markdown formats:
- Location: `tests/fixtures/outputs/`
- Formats: `.html`, `.txt`, `.md` for each fixture

---

## Known Issues

1. **Latent style toggles**: The `parse_toggle()` function for attribute-based toggles (like `w:locked="0"` in `<w:lsdException>`) returns True when attribute is present regardless of value. This is a minor issue affecting latent styles only.

---

## References

- [SPECIFICATION.md](SPECIFICATION.md) - Technical specification and architecture decisions
- [STRUCTURE_PLAN.md](STRUCTURE_PLAN.md) - Code structure, patterns, and guidelines
- [docs/schemas/](docs/schemas/) - XML schema documentation
