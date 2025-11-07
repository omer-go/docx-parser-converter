# Examples

This directory contains example scripts and test files for the docx-parser-converter library.

## Files

### test_image.docx
A sample DOCX file containing:
- Text paragraphs
- An embedded image (1x1 pixel PNG)
- Image metadata (title: "Test Image", alt text: "A test image for validation")
- Image dimensions: 1 inch x 1 inch (914400 EMU x 914400 EMU)

### test_image_extraction.py
A comprehensive example demonstrating the image extraction feature:
- Parses a DOCX file and extracts image metadata
- Converts to HTML with base64-embedded images
- Converts to TXT with image placeholders

## Running the Examples

### Image Extraction Example

```bash
cd examples
python test_image_extraction.py
```

This will:
1. Parse `test_image.docx` and display image metadata
2. Generate `test_image_output.html` with the image embedded as base64
3. Generate `test_image_output.txt` with image placeholders like `[Image: Test Image]`

## Image Extraction Features

The library now supports:

### 1. Image Parsing
- Extracts images from `<w:drawing>` elements in runs
- Supports both inline (`<wp:inline>`) and anchored (`<wp:anchor>`) images
- Extracts image metadata:
  - Relationship ID (`r:embed`)
  - Dimensions in EMU (English Metric Units)
  - Alt text (`descr` attribute)
  - Title (`name` attribute)

### 2. Binary Data Extraction
- Reads `word/_rels/document.xml.rels` to map relationship IDs to image files
- Extracts image binary data from `word/media/` directory
- Supports multiple image formats: PNG, JPEG, GIF, BMP, SVG, WebP, TIFF

### 3. HTML Conversion
- Embeds images as base64 data URIs in `<img>` tags
- Converts EMU dimensions to CSS points
- Includes alt text and title attributes
- Example output:
  ```html
  <img src="data:image/png;base64,iVBORw0KG..." 
       style="width:72.0pt;height:72.0pt;" 
       alt="A test image" 
       title="My Image"/>
  ```

### 4. TXT Conversion
- Represents images as text placeholders
- Uses title if available: `[Image: Title]`
- Falls back to alt text: `[Image: Alt text]`
- Default placeholder: `[Image]`

## Technical Details

### Dimension Conversions
- 1 inch = 914400 EMU
- 1 inch = 72 points
- 1 inch = 96 pixels (at 96 DPI)

The library provides utility functions:
- `convert_emu_to_points(emu)` - Converts EMU to CSS points
- `convert_emu_to_pixels(emu, dpi)` - Converts EMU to pixels at specified DPI

### Supported Namespaces
- `w` - WordprocessingML main namespace
- `wp` - DrawingML wordprocessing drawing
- `a` - DrawingML main namespace
- `pic` - DrawingML picture namespace
- `r` - Office Open XML relationships

## Code Example

```python
from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

# Read DOCX file
docx_file = read_binary_from_file_path("document.docx")

# Convert to HTML (images embedded as base64)
converter = DocxToHtmlConverter(docx_file, use_default_values=True)
html_output = converter.convert_to_html()

# Save HTML
converter.save_html_to_file(html_output, "output.html")
```

## Notes

- Images are automatically detected and processed during parsing
- Base64 encoding is performed automatically for HTML output
- Large images will result in large HTML files due to base64 encoding
- The library uses the existing XML parsers (no additional dependencies)
