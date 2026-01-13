# DOCX Parser and Converter

Convert Microsoft Word DOCX files to HTML and plain text. Available for both **Python** and **TypeScript/JavaScript**.

## Features

- **High-fidelity HTML conversion** with CSS styling
- **Plain text extraction** with optional Markdown formatting
- **Rich text formatting**: bold, italic, underline, strikethrough, subscript, superscript, highlight
- **Images**: inline and floating images
- **Tables**: cell merging, borders, shading
- **Lists**: bullets, numbered, multi-level
- **Hyperlinks**: resolved from document relationships
- **Style inheritance**: follows Word's style chain

## 🚀 Try the Live Demo

**[Open the Interactive Demo →](https://omer-go.github.io/docx-parser-converter/)**

Upload a DOCX file and see it converted to HTML or plain text instantly in your browser. Experiment with all configuration options.

## ⚠️ Python v1.0.0 Breaking Changes

The Python package (v1.0.0) has a **completely rewritten API**. If upgrading from a previous version:

- See the [Python CHANGELOG](docx_parser_converter_python/CHANGELOG.md) for migration guide
- Old API still works with deprecation warnings
- New API: `from docx_parser_converter import docx_to_html, docx_to_text`

## ⚠️ TypeScript v1.0.0 - New Package

The TypeScript package (v1.0.0) is a **complete rewrite** and is **not backwards compatible** with previous versions:

- Entirely new API design
- No migration path from earlier versions
- See the [TypeScript CHANGELOG](docx_parser_converter_ts/CHANGELOG.md) for details

## Installation

### Python

```bash
pip install docx-parser-converter
```

### TypeScript/JavaScript

```bash
pnpm install @omer-go/docx-parser-converter-ts
# or
pnpm add @omer-go/docx-parser-converter-ts
# or
yarn add @omer-go/docx-parser-converter-ts
```

## Quick Start

### Python

```python
from docx_parser_converter import docx_to_html, docx_to_text

# Convert to HTML
html = docx_to_html("document.docx")

# Convert to plain text
text = docx_to_text("document.docx")

# Save directly to file
docx_to_html("document.docx", output_path="output.html")
```

### TypeScript/JavaScript

```typescript
import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';

// Browser: from file input
const file = document.getElementById('fileInput').files[0];
const html = await docxToHtml(file);
const text = await docxToText(file);

// Browser: from ArrayBuffer
const arrayBuffer = await file.arrayBuffer();
const html = await docxToHtml(arrayBuffer);

// Node.js: from file path
const html = await docxToHtml('document.docx');

// Node.js: save directly to file
await docxToHtml('document.docx', undefined, { outputPath: 'output.html' });
```

## Configuration

### Python

```python
from docx_parser_converter import docx_to_html, ConversionConfig

config = ConversionConfig(
    title="My Document",
    style_mode="inline",       # "inline", "class", or "none"
    use_semantic_tags=False,   # CSS spans vs <strong>, <em>
    text_formatting="plain",   # "plain" or "markdown"
    table_mode="auto",         # "auto", "ascii", "tabs", "plain"
)

html = docx_to_html("document.docx", config=config)
```

### TypeScript/JavaScript

```typescript
import { docxToHtml, docxToText, ConversionConfig } from '@omer-go/docx-parser-converter-ts';

const config: ConversionConfig = {
  title: 'My Document',
  styleMode: 'inline',         // "inline", "class", or "none"
  useSemanticTags: false,      // CSS spans vs <strong>, <em>
  textFormatting: 'plain',     // "plain" or "markdown"
  tableMode: 'auto',           // "auto", "ascii", "tabs", "plain"
};

const html = await docxToHtml(buffer, config);
const text = await docxToText(buffer, config);
```

## Supported Elements

| Element | Python | TypeScript |
|---------|--------|------------|
| **Text formatting** (bold, italic, underline, etc.) | ✅ | ✅ |
| **Paragraph formatting** (alignment, spacing, indentation) | ✅ | ✅ |
| **Lists** (bullets, numbered, multi-level) | ✅ | ✅ |
| **Tables** (borders, merging, shading) | ✅ | ✅ |
| **Hyperlinks** | ✅ | ✅ |
| **Images** (inline and floating) | ✅ | ✅ |
| **Style inheritance** | ✅ | ✅ |

## Environment Compatibility

| Environment | Python | TypeScript |
|-------------|--------|------------|
| **Server / Node.js** | ✅ | ✅ |
| **Browser** | ❌ | ✅ |
| **File path input** | ✅ | ✅ (Node.js only) |
| **Binary input** | ✅ | ✅ |
| **ArrayBuffer / Blob** | ❌ | ✅ |

## Known Limitations

**Not supported in either implementation:**
- Headers and footers
- Footnotes and endnotes
- Comments and track changes
- OLE objects (embedded Excel, etc.)
- Text boxes and shapes
- Password-protected files

## Implementation Details

For detailed documentation specific to each implementation:

- **[Python Documentation](docx_parser_converter_python/README.md)** - Configuration options, API reference, development setup
- **[TypeScript Documentation](docx_parser_converter_ts/README.md)** - Browser usage, API reference, build options

## Technical Reference

- [XML to CSS Conversion](docs/xml_to_css_conversion.md) - Mapping of DOCX XML elements to CSS
- [XML Structure Guide](docs/xml_structure_guide.md) - OOXML structure reference

## Development

```bash
# Clone repository
git clone https://github.com/omer-go/docx-parser-converter.git

# Python development
cd docx_parser_converter_python
pip install pdm && pdm install -G dev
pdm run pytest

# TypeScript development
cd docx_parser_converter_ts
pnpm install
pnpm build
pnpm test
```

## License

MIT License

## Contributing

Contributions welcome! See the implementation-specific READMEs for development setup.
