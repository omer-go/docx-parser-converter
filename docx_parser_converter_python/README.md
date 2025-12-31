# DOCX Parser Converter

A Python library for converting Microsoft Word DOCX files to HTML and plain text.

## Installation

```bash
pip install docx-parser-converter
```

## Usage

```python
from docx_parser_converter import docx_to_html, docx_to_text

# Convert to HTML
html = docx_to_html("document.docx")

# Convert to plain text
text = docx_to_text("document.docx")
```

## Features

- Convert DOCX to HTML with full styling support
- Convert DOCX to plain text
- Preserve document formatting
- Support for tables, lists, and styles

## Development

This project is under active development. See IMPLEMENTATION_PLAN.md for details.

## License

MIT License
