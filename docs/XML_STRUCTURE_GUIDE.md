# Understanding DOCX XML Structure

This document explains the internal XML structure of DOCX files and provides examples of the raw XML for various features.

## What is a DOCX File?

A `.docx` file is actually a ZIP archive containing XML files and other resources. The main components are:

```
document.docx (ZIP archive)
├── [Content_Types].xml
├── _rels/
│   └── .rels
├── word/
│   ├── document.xml          # Main content
│   ├── styles.xml            # Style definitions
│   ├── numbering.xml         # List configurations
│   ├── settings.xml          # Document settings
│   ├── fontTable.xml         # Font information
│   └── _rels/
│       └── document.xml.rels # Relationships
└── docProps/
    ├── app.xml               # Application properties
    └── core.xml              # Core properties
```

## Basic XML Structure Examples

### 1. Simple Paragraph with Text

```xml
<w:p>
  <w:r>
    <w:t>Hello, this is plain text.</w:t>
  </w:r>
</w:p>
```

**Elements:**
- `<w:p>` = Paragraph
- `<w:r>` = Run (a region of text with consistent properties)
- `<w:t>` = Text content

### 2. Bold Text

```xml
<w:p>
  <w:r>
    <w:rPr>
      <w:b/>
    </w:rPr>
    <w:t>This text is bold.</w:t>
  </w:r>
</w:p>
```

**New Elements:**
- `<w:rPr>` = Run properties
- `<w:b/>` = Bold flag (presence = enabled)

### 3. Italic Text

```xml
<w:p>
  <w:r>
    <w:rPr>
      <w:i/>
    </w:rPr>
    <w:t>This text is italic.</w:t>
  </w:r>
</w:p>
```

### 4. Bold + Italic + Colored Text

```xml
<w:p>
  <w:r>
    <w:rPr>
      <w:b/>
      <w:i/>
      <w:color w:val="FF0000"/>
    </w:rPr>
    <w:t>Bold, italic, and red text.</w:t>
  </w:r>
</w:p>
```

**New Elements:**
- `<w:color w:val="FF0000"/>` = Text color (hex value)

### 5. Underlined Text

```xml
<w:p>
  <w:r>
    <w:rPr>
      <w:u w:val="single"/>
    </w:rPr>
    <w:t>This text is underlined.</w:t>
  </w:r>
</w:p>
```

**Underline types:**
- `single` = Single underline
- `double` = Double underline
- `thick` = Thick underline
- `dotted` = Dotted underline
- `dash` = Dashed underline
- `wave` = Wavy underline

### 6. Font Family and Size

```xml
<w:p>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="28"/>
    </w:rPr>
    <w:t>Arial 14pt text.</w:t>
  </w:r>
</w:p>
```

**New Elements:**
- `<w:rFonts>` = Font specification
- `<w:sz w:val="28"/>` = Font size in half-points (28 = 14pt)

### 7. Paragraph with Style Reference

```xml
<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
  </w:pPr>
  <w:r>
    <w:t>This is Heading 1</w:t>
  </w:r>
</w:p>
```

**New Elements:**
- `<w:pPr>` = Paragraph properties
- `<w:pStyle w:val="Heading1"/>` = Reference to style defined in styles.xml

### 8. Bullet List Item

```xml
<w:p>
  <w:pPr>
    <w:numPr>
      <w:ilvl w:val="0"/>
      <w:numId w:val="1"/>
    </w:numPr>
  </w:pPr>
  <w:r>
    <w:t>First bullet point</w:t>
  </w:r>
</w:p>
```

**New Elements:**
- `<w:numPr>` = Numbering properties
- `<w:ilvl w:val="0"/>` = List level (0 = main level)
- `<w:numId w:val="1"/>` = Reference to numbering definition in numbering.xml

### 9. Numbered List Item

```xml
<w:p>
  <w:pPr>
    <w:numPr>
      <w:ilvl w:val="0"/>
      <w:numId w:val="2"/>
    </w:numPr>
  </w:pPr>
  <w:r>
    <w:t>First numbered item</w:t>
  </w:r>
</w:p>
```

**Note:** The numId references a different numbering definition that uses decimal numbers instead of bullets.

### 10. Simple Table (2x2)

```xml
<w:tbl>
  <w:tblPr>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="000000"/>
      <w:left w:val="single" w:sz="4" w:color="000000"/>
      <w:bottom w:val="single" w:sz="4" w:color="000000"/>
      <w:right w:val="single" w:sz="4" w:color="000000"/>
      <w:insideH w:val="single" w:sz="4" w:color="000000"/>
      <w:insideV w:val="single" w:sz="4" w:color="000000"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:p>
        <w:r><w:t>Cell 1,1</w:t></w:r>
      </w:p>
    </w:tc>
    <w:tc>
      <w:p>
        <w:r><w:t>Cell 1,2</w:t></w:r>
      </w:p>
    </w:tc>
  </w:tr>
  <w:tr>
    <w:tc>
      <w:p>
        <w:r><w:t>Cell 2,1</w:t></w:r>
      </w:p>
    </w:tc>
    <w:tc>
      <w:p>
        <w:r><w:t>Cell 2,2</w:t></w:r>
      </w:p>
    </w:tc>
  </w:tr>
</w:tbl>
```

**New Elements:**
- `<w:tbl>` = Table
- `<w:tblPr>` = Table properties
- `<w:tblBorders>` = Table borders
- `<w:tr>` = Table row
- `<w:tc>` = Table cell

### 11. Table Cell with Shading

```xml
<w:tc>
  <w:tcPr>
    <w:shd w:val="clear" w:color="auto" w:fill="D5E8F0"/>
  </w:tcPr>
  <w:p>
    <w:r><w:t>Cell with blue background</w:t></w:r>
  </w:p>
</w:tc>
```

**New Elements:**
- `<w:tcPr>` = Table cell properties
- `<w:shd w:fill="D5E8F0"/>` = Cell shading/background color

### 12. Text Alignment

```xml
<!-- Left aligned (default) -->
<w:p>
  <w:pPr>
    <w:jc w:val="left"/>
  </w:pPr>
  <w:r><w:t>Left aligned text</w:t></w:r>
</w:p>

<!-- Center aligned -->
<w:p>
  <w:pPr>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r><w:t>Center aligned text</w:t></w:r>
</w:p>

<!-- Right aligned -->
<w:p>
  <w:pPr>
    <w:jc w:val="right"/>
  </w:pPr>
  <w:r><w:t>Right aligned text</w:t></w:r>
</w:p>

<!-- Justified -->
<w:p>
  <w:pPr>
    <w:jc w:val="both"/>
  </w:pPr>
  <w:r><w:t>Justified text will stretch to fill the width.</w:t></w:r>
</w:p>
```

**New Elements:**
- `<w:jc w:val="..."/>` = Justification/alignment

## styles.xml Example

The styles.xml file defines reusable styles:

```xml
<w:styles>
  <!-- Default style -->
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
        <w:sz w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  
  <!-- Paragraph style: Heading 1 -->
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
      <w:outlineLevel w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="2E75B6"/>
    </w:rPr>
  </w:style>
  
  <!-- Character style: RedBold -->
  <w:style w:type="character" w:styleId="RedBold">
    <w:name w:val="Red Bold"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="FF0000"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>
```

## numbering.xml Example

The numbering.xml file defines list formatting:

```xml
<w:numbering>
  <!-- Abstract numbering definition for bullets -->
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    </w:lvl>
  </w:abstractNum>
  
  <!-- Abstract numbering definition for decimal -->
  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    </w:lvl>
  </w:abstractNum>
  
  <!-- Numbering instance for bullets -->
  <w:num w:numId="1">
    <w:abstractNumId w:val="1"/>
  </w:num>
  
  <!-- Numbering instance for decimal -->
  <w:num w:numId="2">
    <w:abstractNumId w:val="2"/>
  </w:num>
</w:numbering>
```

## Complete Document Structure

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document 
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- All paragraphs, tables, and content go here -->
    
    <!-- Section properties (margins, page size) -->
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>
```

## Common Run Properties (`<w:rPr>`)

```xml
<w:rPr>
  <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>  <!-- Font family -->
  <w:b/>                                         <!-- Bold -->
  <w:i/>                                         <!-- Italic -->
  <w:u w:val="single"/>                          <!-- Underline -->
  <w:strike/>                                    <!-- Strikethrough -->
  <w:sz w:val="24"/>                             <!-- Font size (half-points) -->
  <w:color w:val="FF0000"/>                      <!-- Text color -->
  <w:highlight w:val="yellow"/>                  <!-- Highlight -->
  <w:vertAlign w:val="superscript"/>             <!-- Superscript -->
  <w:vertAlign w:val="subscript"/>               <!-- Subscript -->
  <w:smallCaps/>                                 <!-- Small caps -->
</w:rPr>
```

## Common Paragraph Properties (`<w:pPr>`)

```xml
<w:pPr>
  <w:pStyle w:val="Heading1"/>                   <!-- Style reference -->
  <w:jc w:val="center"/>                         <!-- Alignment -->
  <w:spacing w:before="240" w:after="120"/>      <!-- Spacing -->
  <w:ind w:left="720" w:right="720"/>            <!-- Indentation -->
  <w:numPr>                                      <!-- List numbering -->
    <w:ilvl w:val="0"/>
    <w:numId w:val="1"/>
  </w:numPr>
</w:pPr>
```

## Measurement Units

All measurements in DOCX XML use "twentieths of a point" (also called DXA):

- **1 point = 20 DXA**
- **1 inch = 1440 DXA** (72 points × 20)
- **1 cm ≈ 567 DXA**

Common measurements:
- 0.25" = 360 DXA (typical hanging indent)
- 0.5" = 720 DXA (typical left indent for lists)
- 1" = 1440 DXA (standard margins)
- Letter width = 11906 DXA (8.5")
- Letter height = 16838 DXA (11")

## How to Examine DOCX XML

To view the XML structure of any .docx file:

1. Rename the file from `.docx` to `.zip`
2. Extract the ZIP archive
3. Navigate to `word/document.xml`
4. Open in a text editor or XML viewer

This allows you to see exactly how Word represents the formatting in XML.

## Tips for Working with DOCX XML

1. **Namespaces**: All WordprocessingML elements use the `w:` prefix
2. **Required sections**: Every document needs a `<w:sectPr>` at the end
3. **Text content**: Must be inside `<w:t>` elements
4. **Properties before content**: Always put `<w:pPr>` and `<w:rPr>` before text content
5. **Valid XML**: Ensure proper nesting and closing tags
6. **Self-closing tags**: Boolean properties like `<w:b/>` are self-closing

## Complete Example: Document with All Features

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Title -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:t>Document Title</w:t>
      </w:r>
    </w:p>
    
    <!-- Normal paragraph with inline formatting -->
    <w:p>
      <w:r>
        <w:t>This is </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>bold</w:t>
      </w:r>
      <w:r>
        <w:t> and </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:i/>
        </w:rPr>
        <w:t>italic</w:t>
      </w:r>
      <w:r>
        <w:t> text.</w:t>
      </w:r>
    </w:p>
    
    <!-- Bullet list -->
    <w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>First bullet</w:t>
      </w:r>
    </w:p>
    
    <!-- Table -->
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:p>
            <w:r><w:t>Cell 1</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:r><w:t>Cell 2</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <!-- Section properties (required) -->
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>
```

This XML structure is what the docx.js library generates when you create Word documents programmatically!
