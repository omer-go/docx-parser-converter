# DOCX Parser Converter

A Python library for converting Microsoft Word DOCX files to HTML and plain text formats. Built with modern Python (3.10+), Pydantic models, and comprehensive OOXML support.

## Features

- **High-fidelity HTML conversion** with CSS styling support
- **Plain text extraction** with optional Markdown formatting
- **Comprehensive formatting support**: bold, italic, underline, strikethrough, subscript, superscript, highlight, and more
- **Table conversion** with cell merging (colspan/rowspan), borders, and multiple rendering modes
- **List and numbering support**: bullets, numbered lists, multi-level lists, various number formats
- **Hyperlink resolution** from document relationships
- **Style inheritance** following Word's style chain (character → paragraph → linked → basedOn → defaults)
- **Flexible configuration** for customizing output
- **Multiple input types**: file path, bytes, file-like objects, or parsed Document models

## Installation

```bash
pip install docx-parser-converter
```

Or with PDM:

```bash
pdm add docx-parser-converter
```

## Quick Start

```python
from docx_parser_converter_python import docx_to_html, docx_to_text

# Convert DOCX to HTML
html = docx_to_html("document.docx")

# Convert DOCX to plain text
text = docx_to_text("document.docx")

# Save output to file
docx_to_html("document.docx", output_path="output.html")
docx_to_text("document.docx", output_path="output.txt")
```

## Configuration

Use `ConversionConfig` to customize the conversion:

```python
from docx_parser_converter_python import ConversionConfig, docx_to_html, docx_to_text

# HTML conversion options
config = ConversionConfig(
    # HTML-specific options
    title="My Document",           # Document title in <title> tag
    language="en",                 # HTML lang attribute
    style_mode="inline",           # "inline", "class", or "none"
    use_semantic_tags=True,        # Use <strong>, <em> vs <b>, <i>
    fragment_only=False,           # Output just content without HTML wrapper
    custom_css="body { margin: 2em; }",  # Custom CSS to include
    responsive=True,               # Include viewport meta tag

    # Text-specific options
    text_formatting="plain",       # "plain" or "markdown"
    table_mode="auto",             # "auto", "ascii", "tabs", or "plain"
    paragraph_separator="\n\n",    # Separator between paragraphs
)

html = docx_to_html("document.docx", config=config)
text = docx_to_text("document.docx", config=config)
```

### Configuration Options

#### HTML Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style_mode` | `"inline"` \| `"class"` \| `"none"` | `"inline"` | How to output CSS styles |
| `use_semantic_tags` | `bool` | `True` | Use semantic HTML5 tags (`<strong>`, `<em>`) |
| `preserve_whitespace` | `bool` | `False` | Preserve whitespace in content |
| `title` | `str` | `""` | Document title for HTML output |
| `language` | `str` | `"en"` | HTML `lang` attribute |
| `fragment_only` | `bool` | `False` | Output only content, no HTML wrapper |
| `custom_css` | `str \| None` | `None` | Custom CSS to include |
| `css_files` | `list[str]` | `[]` | External CSS files to reference |
| `responsive` | `bool` | `True` | Include viewport meta tag |
| `include_print_styles` | `bool` | `False` | Include print media query styles |

#### Text Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text_formatting` | `"plain"` \| `"markdown"` | `"plain"` | Output format |
| `table_mode` | `"auto"` \| `"ascii"` \| `"tabs"` \| `"plain"` | `"auto"` | Table rendering mode |
| `paragraph_separator` | `str` | `"\n\n"` | Separator between paragraphs |
| `preserve_empty_paragraphs` | `bool` | `True` | Preserve empty paragraphs |

### Table Rendering Modes

- **`auto`**: Automatically selects ASCII for tables with visible borders, tabs for others
- **`ascii`**: ASCII box drawing characters (`+`, `-`, `|`)
- **`tabs`**: Tab-separated columns
- **`plain`**: Space-separated columns

Example ASCII table output:
```
+----------+----------+
| Header 1 | Header 2 |
+----------+----------+
| Cell 1   | Cell 2   |
+----------+----------+
```

### Markdown Formatting

When using `text_formatting="markdown"`, formatting is preserved:

```python
config = ConversionConfig(text_formatting="markdown")
text = docx_to_text("document.docx", config=config)

# Output: "This is **bold** and *italic* text."
```

## Input Types

The library accepts multiple input types:

```python
from pathlib import Path
from io import BytesIO

# File path as string
html = docx_to_html("document.docx")

# File path as Path object
html = docx_to_html(Path("document.docx"))

# Bytes content
with open("document.docx", "rb") as f:
    content = f.read()
html = docx_to_html(content)

# File-like object
with open("document.docx", "rb") as f:
    html = docx_to_html(f)

# None returns empty output
html = docx_to_html(None)  # Returns empty HTML document
text = docx_to_text(None)  # Returns ""
```

## Supported DOCX Elements

### Text Formatting
- Bold, italic, underline, strikethrough
- Subscript, superscript
- Highlight colors
- Font family, size, and color
- All caps, small caps
- Various underline styles (single, double, dotted, dashed, wave, etc.)

### Paragraph Formatting
- Alignment (left, center, right, justify)
- Indentation (left, right, first line, hanging)
- Spacing (before, after, line spacing)
- Borders and shading
- Keep with next, keep lines together, page break before

### Lists and Numbering
- Bullet lists
- Numbered lists (decimal, roman, letters, ordinal)
- Multi-level lists with various formats
- List restart and override support

### Tables
- Simple and complex tables
- Cell merging (horizontal and vertical)
- Cell borders and shading
- Column widths

### Other Elements
- Hyperlinks (external URLs resolved from relationships)
- Line breaks and page breaks
- Tab characters
- Special characters (soft hyphen, non-breaking hyphen)

## Error Handling

The library provides specific exceptions for different error cases:

```python
from docx_parser_converter_python import (
    docx_to_html,
    DocxNotFoundError,
    DocxReadError,
    DocxValidationError,
    DocxEncryptedError,
)

try:
    html = docx_to_html("document.docx")
except DocxNotFoundError:
    print("File not found")
except DocxEncryptedError:
    print("Document is encrypted")
except DocxValidationError as e:
    print(f"Invalid DOCX: {e}")
except DocxReadError as e:
    print(f"Error reading file: {e}")
```

## Known Limitations

### Not Currently Supported
- **Images and media**: Embedded images, drawings, and shapes are not extracted
- **Headers and footers**: Document headers/footers are not included
- **Footnotes and endnotes**: These are not extracted
- **Comments and track changes**: Revision marks are not processed
- **OLE objects**: Embedded Excel charts, etc. are not supported
- **Text boxes**: Floating text boxes and shapes are not extracted
- **Complex field codes**: Most field codes besides hyperlinks
- **RTL/BiDi text**: Right-to-left text may not render correctly
- **Password-protected files**: Encrypted documents cannot be opened

### Partial Support
- **Styles**: Style inheritance works but complex conditional formatting is limited
- **Themes**: Theme colors and fonts are not resolved
- **Custom XML**: Custom document properties are not extracted
- **Sections**: Section properties (columns, page size) affect content but aren't fully rendered

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/omer-go/docx-parser-converter.git
cd docx-parser-converter/docx_parser_converter_python

# Install PDM (if not already installed)
pip install pdm

# Install dependencies
pdm install

# Install dev dependencies
pdm install -G dev
```

### Running Tests

```bash
# Run all tests
pdm run pytest

# Run with coverage
pdm run pytest --cov

# Run specific test file
pdm run pytest tests/unit/test_api.py
```

### Type Checking

```bash
pdm run pyright
```

### Linting

```bash
pdm run ruff check .
pdm run ruff format .
```

## Project Structure

```
docx_parser_converter_python/
├── api.py              # Public API (docx_to_html, docx_to_text, ConversionConfig)
├── core/               # Core utilities
│   ├── docx_reader.py  # DOCX file opening and validation
│   ├── xml_extractor.py # XML content extraction
│   ├── constants.py    # XML namespaces and paths
│   └── exceptions.py   # Custom exceptions
├── models/             # Pydantic models
│   ├── common/         # Shared models (Color, Border, Spacing, etc.)
│   ├── document/       # Document models (Paragraph, Run, Table, etc.)
│   ├── numbering/      # Numbering definitions
│   └── styles/         # Style definitions
├── parsers/            # XML to Pydantic conversion
│   ├── common/         # Common element parsers
│   ├── document/       # Document element parsers
│   ├── numbering/      # Numbering parsers
│   └── styles/         # Style parsers
├── converters/         # Model to output conversion
│   ├── common/         # Style resolution, numbering tracking
│   ├── html/           # HTML conversion
│   └── text/           # Text conversion
└── tests/              # Test suite
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── fixtures/       # Test DOCX files
```

## Architecture

The library follows a three-phase conversion process:

1. **Parse**: DOCX XML → Pydantic models
   - Open and validate DOCX file
   - Extract document.xml, styles.xml, numbering.xml
   - Parse XML to strongly-typed Pydantic models

2. **Resolve**: Apply style inheritance
   - Merge document defaults → style chain → direct formatting
   - Track numbering counters for lists

3. **Convert**: Models → Output format
   - HTML: Generate semantic HTML with CSS
   - Text: Extract plain text with optional Markdown

## License

MIT License

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Related Documentation

- [SPECIFICATION.md](SPECIFICATION.md) - Technical specification
- [STRUCTURE_PLAN.md](STRUCTURE_PLAN.md) - Code structure and patterns
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Implementation progress
