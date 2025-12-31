# DOCX XML Schema Documentation

This folder contains detailed schema documentation for each XML file found in a DOCX archive. These schemas serve as the authoritative reference for implementing Pydantic models.

## Naming Conventions

### Core Principles

1. **Stick to XML tag names** - Model and field names should mirror XML tag names as closely as possible
2. **`Pr` = Properties** - Tags ending in `Pr` become `{Element}Properties` (e.g., `pPr` → `ParagraphProperties`)
3. **No artificial abstractions** - Don't create wrapper models that don't exist in XML
4. **Rename only when necessary** - Only deviate from XML names to avoid conflicts or improve clarity
5. **One model per tag** - No Pydantic model should map to two different XML tags (unless identical structure)

### Naming Patterns

| XML Pattern | Python Pattern | Example |
|-------------|----------------|---------|
| `<w:xxxPr>` | `XxxProperties` | `<w:pPr>` → `ParagraphProperties` |
| `<w:xxx>` (element) | `Xxx` | `<w:p>` → `Paragraph` |
| `<w:xxxYyy>` | `xxx_yyy` (field) | `<w:keepNext>` → `keep_next` |
| `@w:xxx` | `xxx` (field) | `@w:val` → `val` |
| `@w:xxxYyy` | `xxx_yyy` (field) | `@w:themeColor` → `theme_color` |

### Deviation Notes

When a name deviates from the XML tag name, a note explaining the reason is required. Common reasons include:

- **Conflict avoidance**: `<w:tab/>` in run → `TabChar` (to avoid conflict with `Tab` stop model)
- **Clarity**: Single-letter tags may be expanded (e.g., `<w:p>` → `Paragraph` not `P`)
- **Python reserved words**: Avoiding names like `type`, `id` as bare field names when problematic

## File Structure

```
docs/schemas/
├── README.md                 # This file
├── document.xml.md           # Main document content
├── styles.xml.md             # Style definitions
├── numbering.xml.md          # List/numbering definitions
├── settings.xml.md           # Document settings
├── fontTable.xml.md          # Font definitions
├── theme.xml.md              # Theme (colors, fonts)
├── footnotes_endnotes.xml.md # Footnotes and endnotes
├── comments.xml.md           # Comments/annotations
├── headers_footers.xml.md    # Headers and footers
└── shared_models.md          # Models used across multiple XML files
```

## Schema File Format

Each schema file follows this structure:

1. **Overview** - Brief description of the XML file's purpose
2. **Root Element** - The top-level XML element and its Pydantic model
3. **Element Tables** - Detailed mapping tables with:
   - XML Tag/Attribute
   - Pydantic Field Name
   - Type
   - Notes (including deviation explanations)
4. **Naming Deviations** - Summary table of all naming deviations with explanations

## DOCX Archive Structure

A DOCX file is a ZIP archive with the following structure:

```
docx_file.docx/
├── [Content_Types].xml
├── _rels/
│   └── .rels
├── word/
│   ├── document.xml          # Main document content
│   ├── styles.xml            # Style definitions
│   ├── numbering.xml         # Numbering/list definitions
│   ├── settings.xml          # Document settings
│   ├── fontTable.xml         # Font table
│   ├── webSettings.xml       # Web-specific settings
│   ├── footnotes.xml         # Footnotes
│   ├── endnotes.xml          # Endnotes
│   ├── comments.xml          # Comments
│   ├── header1.xml           # Header (can be multiple)
│   ├── footer1.xml           # Footer (can be multiple)
│   ├── theme/
│   │   └── theme1.xml        # Theme definitions
│   ├── media/                # Embedded images
│   └── _rels/
│       └── document.xml.rels # Relationships
└── docProps/
    ├── app.xml               # Application properties
    └── core.xml              # Core properties (author, dates)
```

## XML Namespaces

| Prefix | Namespace URI | Used In |
|--------|---------------|---------|
| `w` | `http://schemas.openxmlformats.org/wordprocessingml/2006/main` | Most word/* files |
| `r` | `http://schemas.openxmlformats.org/officeDocument/2006/relationships` | Relationships |
| `a` | `http://schemas.openxmlformats.org/drawingml/2006/main` | Theme, drawings |
| `wp` | `http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing` | Drawing positioning |
| `m` | `http://schemas.openxmlformats.org/officeDocument/2006/math` | Math equations |
