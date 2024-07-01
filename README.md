# DOCX-HTML-TXT Converter 📄✨

A powerful library for converting DOCX documents into HTML and plain text, with detailed parsing of document properties and styles.

## Table of Contents
- [Introduction](#introduction-🌟)
- [Project Overview](#project-overview-🛠️)
- [Key Features](#key-features-🌟)
- [Installation](#installation-💾)
- [Usage](#usage-🚀)
- [Quick Start Guide](#quick-start-guide-📖)
- [Examples](#examples-📚)
- [Models](#models-🏗️)
- [Parsers](#parsers-🔍)
- [Conversion](#conversion-🔄)

## Introduction 🌟
Welcome to the DOCX-HTML-TXT Converter project! This library allows you to easily convert DOCX documents into HTML and plain text formats, extracting detailed properties and styles using Pydantic models.

## Project Overview 🛠️
The project is structured to parse DOCX files, convert their content into structured data using Pydantic models, and provide conversion utilities to transform this data into HTML or plain text.

## Key Features 🌟
- Convert DOCX documents to HTML or plain text.
- Parse and extract detailed document properties and styles.
- Structured data representation using Pydantic models.

## Installation 💾
To install the library, you can use pip. (Add the pip install command manually)

```sh
pip install docx_html_txt
```

## Usage 🚀

### Importing the Library
To start using the library, import the necessary modules:

```python
from docx_html_txt.docx_to_html import DocxToHtmlConverter
from docx_html_txt.docx_to_txt import DocxToTxtConverter
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
```

### Quick Start Guide 📖
1. **Convert to HTML**:
   ```python
   from docx_html_txt.docx_to_html import DocxToHtmlConverter
   from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
   import os

   if __name__ == "__main__":
       docx_path = "path_to_your_docx_file.docx"
       html_output_path = "output.html"

       if not os.path.exists(docx_path):
           print(f"File not found: {docx_path}")
       else:
           try:
               docx_file_content = read_binary_from_file_path(docx_path)
           except Exception as e:
               print(f"Error: Failed to read DOCX file. Error: {e}")
           else:
               converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
               html_output = converter.convert_to_html()
               converter.save_html_to_file(html_output, html_output_path)
               print(f"HTML file saved to: {html_output_path}")
   ```

2. **Convert to Plain Text**:
   ```python
   from docx_html_txt.docx_to_txt import DocxToTxtConverter
   from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
   import os

   if __name__ == "__main__":
       docx_path = "path_to_your_docx_file.docx"
       txt_output_path = "output.txt"

       if not os.path.exists(docx_path):
           print(f"File not found: {docx_path}")
       else:
           try:
               docx_file_content = read_binary_from_file_path(docx_path)
           except Exception as e:
               print(f"Error: Failed to read DOCX file. Error: {e}")
           else:
               converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
               txt_output = converter.convert_to_txt(indent=True)
               converter.save_txt_to_file(txt_output, txt_output_path)
               print(f"TXT file saved to: {txt_output_path}")
   ```

## Examples 📚

### Example: Converting to HTML
```python
from docx_html_txt.docx_to_html import DocxToHtmlConverter
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
import os

if __name__ == "__main__":
    docx_path = "path_to_your_docx_file.docx"
    html_output_path = "output.html"

    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
            html_output = converter.convert_to_html()
            converter.save_html_to_file(html_output, html_output_path)
            print(f"HTML file saved to: {html_output_path}")
```

### Example: Converting to Plain Text
```python
from docx_html_txt.docx_to_txt import DocxToTxtConverter
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
import os

if __name__ == "__main__":
    docx_path = "path_to_your_docx_file.docx"
    txt_output_path = "output.txt"

    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
            txt_output = converter.convert_to_txt(indent=True)
            converter.save_txt_to_file(txt_output, txt_output_path)
            print(f"TXT file saved to: {txt_output_path}")
```

### Example: Using DocumentParser
```python
from docx_html_txt.docx_parsers.document.document_parser import DocumentParser
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
import json

if __name__ == "__main__":
    docx_path = "path_to_your_docx_file.docx"

    docx_file = read_binary_from_file_path(docx_path)
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()

    # Output or further process the filtered schema as needed
    filtered_schema_dict = document_schema.model_dump(exclude_none=True)
    print(json.dumps(filtered_schema_dict, indent=2))
```

## Models 🏗️
### NumberingLevel
Represents the level of numbering in a document.
### NumberingInstance
Represents an instance of numbering.
### ParagraphStyleProperties
Properties related to paragraph styling.
### RunStyleProperties
Properties related to run styling.
### Style
Represents a style in the document.
### StylesSchema
Schema for styles in the document.

## Parsers 🔍
### DocumentParser
Parses the main document.xml file in a DOCX.
### StylesParser
Parses the styles.xml file in a DOCX.
### NumberingParser
Parses the numbering.xml file in a DOCX.
### TablesParser
Parses table-related elements in a DOCX.

## Conversion 🔄
### DOCX to HTML
```python
from docx_html_txt.docx_to_html import DocxToHtmlConverter
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
import os

if __name__ == "__main__":
    docx_path = "path_to_your_docx_file.docx"
    html_output_path = "output.html"

    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
            html_output = converter.convert_to_html()
            converter.save_html_to_file(html_output, html_output_path)
            print(f"HTML file saved to: {html_output_path}")
```

### DOCX to TXT
```python
from docx_html_txt.docx_to_txt import DocxToTxtConverter
from docx_html_txt.docx_parsers.utils import read_binary_from_file_path
import os

if __name__ == "__main__":
    docx_path = "path_to_your_docx_file.docx"
    txt_output_path = "output.txt"

    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
            txt_output = converter.convert_to_txt(indent=True)
            converter.save_txt_to_file(txt_output, txt_output_path)
            print(f"TXT file saved to: {txt_output_path}")
```

Enjoy using DOCX-HTML-TXT Converter! 🚀✨
