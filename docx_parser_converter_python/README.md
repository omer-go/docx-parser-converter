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

This project uses [PDM](https://pdm-project.org/) for dependency management.

### Setup

```bash
# Install PDM (if not already installed)
pip install pdm

# Install dependencies
pdm install

# Install dev dependencies
pdm install -G dev
```

### Running Tests

```bash
pdm run pytest
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
├── core/           # Core utilities (reader, extractor, exceptions)
├── models/         # Pydantic models for DOCX elements
├── parsers/        # XML parsing functions
├── converters/     # HTML and text converters
└── tests/          # Test suite
```

See [STRUCTURE_PLAN.md](STRUCTURE_PLAN.md) for detailed structure.

## License

MIT License
