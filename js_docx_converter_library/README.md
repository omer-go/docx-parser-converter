# DOCX to HTML/Text Converter JS

## Description

This JavaScript library converts DOCX (Office Open XML) files into HTML and plain text. It is designed to work in both browser and Node.js environments. The library parses the structure and formatting of DOCX documents and translates them into semantic HTML or a structured plain text representation.

## Features

*   **DOCX to HTML Conversion:** Converts DOCX documents into HTML, preserving much of the original formatting.
*   **DOCX to Plain Text Conversion:** Extracts textual content from DOCX documents, with options for basic text layout.
*   **Formatting Support (Partial):**
    *   Paragraphs: Alignment, indentation, spacing.
    *   Text Runs: Bold, italics, underline, color, font size, font family, highlight, superscript/subscript.
    *   Lists: Ordered and unordered lists with basic nesting and custom markers.
    *   Tables: Basic structure, cell content, nested tables, column widths, and some cell/row/table properties (borders, shading, alignment - simplified).
    *   Styles: Applies paragraph and character styles defined in `styles.xml`, including default styles and style inheritance.
    *   Numbering: Applies numbering definitions from `numbering.xml` for list items.
*   **Cross-Environment:** Usable in modern web browsers and Node.js.
*   **Zero Dependencies (for core conversion logic):** The core parsing and conversion logic aims to be self-contained after the initial DOCX parsing (which uses `jszip` and `xmldom-qsa`).

## Installation

To install the package, use npm:

```bash
npm install docx-to-html-js
```
*(Note: `docx-to-html-js` is an assumed package name based on project details. Replace with the actual package name if different upon publishing.)*

## Usage (API)

The library exports two main asynchronous functions: `convertDocxToHtml` and `convertDocxToText`.

### Importing

```javascript
// ES Module syntax
import { convertDocxToHtml, convertDocxToText } from 'docx-to-html-js';
```

### Browser Example

This example shows how to get a DOCX file from an `<input type="file">` element, read it as an `ArrayBuffer`, and then pass it to the conversion functions.

```html
<!-- Basic HTML structure -->
<input type="file" id="docxFile" accept=".docx">
<h3>HTML Output:</h3>
<div id="htmlOutput" style="border: 1px solid #ccc; padding: 10px; min-height: 100px;"></div>
<h3>Text Output:</h3>
<pre id="textOutput" style="border: 1px solid #ccc; padding: 10px; min-height: 100px; white-space: pre-wrap;"></pre>

<script type="module">
  // Import the functions (ensure your script tag has type="module")
  import { convertDocxToHtml, convertDocxToText } from 'docx-to-html-js'; // Adjust path if serving locally

  document.getElementById('docxFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();

      try {
        // Convert to HTML
        const htmlOutput = await convertDocxToHtml(arrayBuffer);
        document.getElementById('htmlOutput').innerHTML = htmlOutput;

        // Convert to Text with options
        const textOutput = await convertDocxToText(arrayBuffer, { 
          lineWidth: 80, // Attempt to wrap lines at 80 characters (basic centering/right align)
          paragraphBreak: "\\n\\n", // Use two newlines between paragraphs
          listItemIndent: "  " // Indent list items with two spaces per level
        });
        document.getElementById('textOutput').textContent = textOutput;
      } catch (error) {
        console.error("Error during conversion:", error);
        document.getElementById('htmlOutput').innerHTML = '<p style="color:red;">Error during HTML conversion.</p>';
        document.getElementById('textOutput').textContent = 'Error during text conversion.';
      }
    }
  });
</script>
```

### Node.js Example

This example shows how to read a DOCX file using the `fs/promises` module and then pass the buffer to the conversion functions.

```javascript
// example.js
import { convertDocxToHtml, convertDocxToText } from 'docx-to-html-js';
import fs from 'fs/promises'; // Or: import { readFile, writeFile } from 'fs/promises';

async function main() {
  try {
    // Read the DOCX file into an ArrayBuffer
    // Note: fs.readFile returns a Node.js Buffer. We need its underlying ArrayBuffer.
    const nodeBuffer = await fs.readFile('path/to/your/document.docx');
    const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength
    );

    // Convert to HTML
    const htmlOutput = await convertDocxToHtml(arrayBuffer);
    console.log("HTML Output:\n", htmlOutput);
    // Optionally save to a file:
    // await fs.writeFile('output.html', htmlOutput);

    // Convert to Text with options
    const textOutput = await convertDocxToText(arrayBuffer, {
      lineWidth: 100,          // For basic text formatting attempts
      paragraphBreak: "\n\n",  // Characters between paragraphs
      listItemIndent: "  "     // Indentation string for each list level
    });
    console.log("\nText Output:\n", textOutput);
    // Optionally save to a file:
    // await fs.writeFile('output.txt', textOutput);

  } catch (error) {
    console.error("Error during conversion:", error);
  }
}

main();
```

### `TextConverter` Options

The `convertDocxToText` function accepts an optional second argument, an options object, to customize the plain text output. Available options:

*   `lineWidth` (number | null): Maximum line width for attempting to wrap or align text (e.g., center/right alignment of paragraphs). Default: `null` (no wrapping or specific alignment based on width).
*   `paragraphBreak` (string): String to insert between paragraphs and other block elements (like tables). Default: `"\n\n"`.
*   `listItemIndent` (string): String used to indent list items for each level of nesting. Default: `"  "` (two spaces).
*   `listItemBreak` (string): String used to separate items within the same list. Default: `"\n"`.


## Supported DOCX Features (Current Status)

*   **Paragraphs:** Text content, basic alignment (left, center, right, justify), indentation (left, right, first line, hanging - simplified for text), paragraph spacing (before/after - as margins), paragraph borders (basic indication), paragraph shading.
*   **Text (Runs):** Bold, italic, underline (simple), strikethrough, text color, font size, font family (basic), highlight color, superscript/subscript.
*   **Styles:** Application of default styles, paragraph styles (including inheritance from `basedOn`), character styles (including inheritance), and default paragraph/run properties from `styles.xml`.
*   **Lists:** Ordered (`<ol>`) and unordered (`<ul>`) lists, basic nesting, custom markers (text and styling from `numbering.xml`).
*   **Tables:** Basic structure (rows, cells), nested paragraphs and tables within cells, column widths (`w:tblGrid`), and some direct table/row/cell properties like width, alignment, cell spacing, indentation, shading, and borders (simplified). Header rows are converted to `<th>` elements. GridSpans (colspan) are supported.
*   **Document Margins:** Applied as padding to a container div in HTML output.

**Currently Not Supported (or limited):**
*   Images and other embedded objects (shapes, charts, WordArt).
*   Headers and Footers content.
*   Footnotes and Endnotes content.
*   Complex table features (e.g., `vMerge` for rowspan, complex conditional formatting, specific border conflict resolution).
*   Advanced text effects (e.g., shadows, outlines, 3D effects).
*   Track Changes / Comments.
*   Macros.
*   Complex section formatting (multiple columns, different page orientations within document).
*   Right-to-left (RTL) text flow fully (basic text direction in cells is partially supported).
*   Specific OpenType font features.

## Development / Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

(Further details on setting up a development environment, running tests, etc., would go here.)

## License

This library is released under the MIT License. (Assuming, to match the Python project inspiration).
