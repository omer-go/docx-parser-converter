# Docx Parser and Converter (TypeScript/JavaScript) 📄✨

A powerful TypeScript library for converting DOCX documents into HTML and plain text, with detailed parsing of document properties and styles. This project is based on a [Python version](<https://github.com/omer-go/docx-parser-converter>).

## Table of Contents
- [Introduction 🌟](#introduction-)
- [Project Overview 🛠️](#project-overview-)
- [Key Features 🌟](#key-features-)
- [⚠️ Important Note on Environment Compatibility](#️-important-note-on-environment-compatibility)
- [Installation 💾](#installation-)
- [Usage 🚀](#usage-)
  - [Importing the Library](#importing-the-library)
  - [Quick Start Guide (Browser) 📖](#quick-start-guide-browser-)
- [Supported XML Parsing Types 📄](#supported-xml-parsing-types-)
- [General Code Flow 🔄](#general-code-flow-)
- [Conversion Table of DOCX XML Elements to HTML](#conversion-table-of-docx-xml-elements-to-html)
- [API Reference 📜 (Coming Soon)](#api-reference--coming-soon)

## Introduction 🌟
Welcome to the Docx Parser and Converter for TypeScript/JavaScript! This library allows you to easily convert DOCX documents into HTML and plain text formats, extracting detailed properties and styles.

## Project Overview 🛠️
The project is structured to parse DOCX files, convert their content into structured data models, and provide conversion utilities to transform this data into HTML or plain text.

## Key Features 🌟
- Convert DOCX documents to HTML or plain text.
- Parse and extract detailed document properties and styles.
- Structured data representation for easy manipulation.

## ⚠️ Important Note on Environment Compatibility

**The current version (0.0.1) of this package is primarily designed and tested for browser environments.**

While efforts are underway to ensure full Node.js compatibility, using this version in a Node.js environment might lead to errors (such as `document is not defined` or `Buffer is not defined`) because some underlying dependencies or utility functions currently rely on browser-specific APIs.

For browser usage, the library should function as expected. Node.js support will be improved in future releases.

## Installation 💾
To install the library, you can use npm or yarn:

```sh
npm install @omer-go/docx-parser-converter-ts
# or
yarn add @omer-go/docx-parser-converter-ts
```

## Usage 🚀

### Importing the Library

**ES Modules (Recommended for modern browsers and bundlers):**
```javascript
import { DocxToHtmlConverter, DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';
```

**UMD (for direct use in browsers via `<script>` tag):**
If you include the UMD build (`dist/docx-parser-converter.umd.js`), the library will be available on the global `window.DocxParserConverter` object:
```html
<script src="path/to/node_modules/@omer-go/docx-parser-converter-ts/dist/docx-parser-converter.umd.js"></script>
<script>
  const { DocxToHtmlConverter, DocxToTxtConverter } = window.DocxParserConverter;
  // ... use them ...
</script>
```

### Quick Start Guide (Browser) 📖

This example demonstrates usage with a file input in a browser.

1.  **HTML Setup:**
    ```html
    <input type="file" id="docxFile" accept=".docx" />
    <button onclick="handleConvert()">Convert</button>
    <div id="htmlOutput"></div>
    <pre id="textOutput"></pre>
    ```

2.  **JavaScript for Conversion:**
    ```javascript
    // Assuming you've imported or accessed the converters as shown above

    async function handleConvert() {
        const fileInput = document.getElementById('docxFile');
        const htmlOutputDiv = document.getElementById('htmlOutput');
        const textOutputPre = document.getElementById('textOutput');

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a DOCX file.');
            return;
        }
        const file = fileInput.files[0];

        try {
            const arrayBuffer = await file.arrayBuffer(); // DOCX content as ArrayBuffer

            // Convert to HTML
            const htmlConverter = await DocxToHtmlConverter.create(arrayBuffer, { useDefaultValues: true });
            const htmlResult = htmlConverter.convertToHtml();
            htmlOutputDiv.innerHTML = htmlResult;

            // Convert to Plain Text
            const txtConverter = await DocxToTxtConverter.create(arrayBuffer, { useDefaultValues: true });
            const txtResult = txtConverter.convertToTxt({ indent: true });
            textOutputPre.textContent = txtResult;

        } catch (error) {
            console.error("Conversion error:", error);
            alert("Error during conversion: " + error.message);
        }
    }
    ```

## Supported XML Parsing Types 📄

The Docx Parser and Converter library supports parsing various XML components within a DOCX file. Below is a detailed list of the supported and unsupported components:

### Supported Components

1.  **document.xml**:
    *   **Document Parsing**: Parses the main document structure.
    *   **Paragraphs**: Extracts paragraphs and their properties.
    *   **Runs**: Extracts individual text runs within paragraphs.
    *   **Tables**: Parses table structures and properties.
    *   **Table Rows**: Extracts rows within tables.
    *   **Table Cells**: Extracts cells within rows.
    *   **List Items**: Handles both bulleted and numbered lists through paragraph properties.

2.  **numbering.xml**:
    *   **Numbering Definitions**: Parses numbering definitions and properties for lists.
    *   **Numbering Levels**: Extracts different levels of numbering for nested lists.

3.  **styles.xml**:
    *   **Paragraph Styles**: Extracts styles applied to paragraphs.
    *   **Run Styles**: Extracts styles applied to text runs.
    *   **Table Styles**: Parses styles applied to tables and table elements.
    *   **Default Styles**: Extracts default document styles for paragraphs, runs, and tables.

### Unsupported Components (Current Version)

*   **Images**: Parsing and extraction of images embedded within the document.
*   **Headers and Footers**: Parsing of headers and footers content.
*   **Footnotes and Endnotes**: Handling footnotes and endnotes within the document.
*   **Comments**: Extraction and handling of comments.
*   **Custom XML Parts**: Any custom XML parts beyond the standard DOCX schema.
*   **More complex OOXML features** (e.g., complex fields, VML graphics, certain drawing elements).

## General Code Flow 🔄

The Docx Parser and Converter library follows a structured workflow to parse, convert, and merge document properties and styles according to DOCX specifications. Here’s a detailed overview of the technical process:

1.  **Parsing XML Files**:
    *   The library first unzips the DOCX file (which is a zip archive) and reads essential XML parts like `word/document.xml`, `word/styles.xml`, and `word/numbering.xml`.
    *   Specialized parsers process these XML files:
        *   `DocumentParser` extracts the main document structure (paragraphs, tables, runs) into structured models.
        *   `NumberingParser` extracts numbering definitions and levels.
        *   `StylesParser` extracts styles for paragraphs, runs, tables, and document defaults.

2.  **Property and Style Merging**:
    *   **Hierarchical Style Application**: Styles are applied to paragraphs and runs based on a defined hierarchy (direct formatting > character style > paragraph style > linked style > document defaults).
    *   **Default Style Application**: If no specific style is applied, default styles are used.
    *   **Efficient Property Merging**: Properties are merged efficiently to determine the final computed style for each element.

3.  **Conversion to HTML and TXT**:
    *   **DOCX to HTML**:
        *   The `DocxToHtmlConverter` takes the parsed document models and converts the elements into HTML format.
        *   Styles and properties are translated into equivalent HTML tags and inline CSS attributes.
        *   **WYSIWYG-like Support**: The conversion aims to maintain the visual representation of the document, including numbering, margins, and indentations.
    *   **DOCX to TXT**:
        *   The `DocxToTxtConverter` converts the document models into plain text format.
        *   Paragraphs, lists, and tables are transformed into a readable plain text representation.
        *   **Structure Preservation**: The conversion attempts to preserve the document's structure, maintaining numbering and indentations for readability.

This process ensures accurate parsing and conversion while preserving the original document's structure and style as much as possible within the supported features.

## Conversion Table of DOCX XML Elements to HTML

| XML Element    | HTML Element                        | Notes                                                                 |
|----------------|--------------------------------------|-----------------------------------------------------------------------|
| w:p            | p                                    | Paragraph element                                                     |
| w:r            | span                                 | Run element, used for inline text formatting                          |
| w:tbl          | table                                | Table element                                                         |
| w:tr           | tr                                   | Table row                                                             |
| w:tc           | td                                   | Table cell                                                            |
| w:tblGrid      | colgroup                             | Table grid, converted to colgroup for column definitions              |
| w:gridCol      | col                                  | Grid column, converted to col for column width                        |
| w:tblPr        | table                                | Table properties                                                      |
| w:tblW         | table style="width:Xpt;"             | Table width, converted using CSS `width` property (approx.)           |
| w:tblBorders   | table, tr, td style="border:X;"      | Table borders, converted using CSS `border` property                  |
| w:tblCellMar   | td style="padding:Xpt;"              | Table cell margins, converted using CSS `padding` property            |
| w:b            | b or strong or CSS font-weight       | Bold text                                                             |
| w:i            | i or em or CSS font-style            | Italic text                                                           |
| w:u            | span style="text-decoration:underline;" | Underline text, converted using CSS `text-decoration` property         |
| w:color        | span style="color:#RRGGBB;"          | Text color, converted using CSS `color` property                      |
| w:sz           | span style="font-size:Xpt;"          | Text size, converted using CSS `font-size` property (in points)       |
| w:jc           | p style="text-align:left\|center\|right\|justify;" | Text alignment, converted using CSS `text-align` property             |
| w:ind          | p style="margin-left:Xpt; text-indent:Xpt;" | Indentation, converted using CSS margin and text-indent          |
| w:spacing      | p style="line-height:X; margin-top:Ypt; margin-bottom:Zpt;" | Line/paragraph spacing, converted using CSS properties |
| w:highlight    | span style="background-color:#RRGGBB;" | Text highlight, converted using CSS `background-color` property       |
| w:shd          | span style="background-color:#RRGGBB;" | Shading, converted using CSS `background-color` property              |
| w:vertAlign    | span style="vertical-align:super\|sub;" | Vertical alignment (superscript/subscript)                         |
| w:pgMar        | body/div style="padding: Xpt;"       | Page margins, applied to a wrapper div or body                        |
| w:rFonts       | span style="font-family:'font-name';"| Font name, converted using CSS `font-family` property                 |
| w:tab          | span (with calculated width)         | Tab characters, converted to spans with appropriate spacing           |
| Numbering      | ol, ul, li with CSS for styling      | List items with various numbering/bullet styles                       |



## API Reference 📜 (Coming Soon)

Detailed API documentation will be made available soon. For now, please refer to the exported classes and their methods:
- `DocxToHtmlConverter`
  - `static async create(docxFile: ArrayBuffer | Uint8Array | File | Blob, options?: DocxToHtmlOptions): Promise<DocxToHtmlConverter>`
  - `convertToHtml(): string`
- `DocxToTxtConverter`
  - `static async create(docxFile: ArrayBuffer | Uint8Array | File | Blob, options?: DocxToTxtOptions): Promise<DocxToTxtConverter>`
  - `convertToTxt(options?: { indent?: boolean }): string`

Interfaces for options (`DocxToHtmlOptions`, `DocxToTxtOptions`) are also exported.

---

Enjoy using Docx Parser and Converter! 🚀✨