# Docx Parser and Converter 📄✨

A powerful library for converting DOCX documents into HTML and plain text, with detailed parsing of document properties and styles.

## Table of Contents
- [Introduction 🌟](#introduction-)
- [Project Overview 🛠️](#project-overview-)
- [Key Features 🌟](#key-features-)
- [Installation 💾](#installation-)
- [Usage 🚀](#usage-)
- [Quick Start Guide 📖](#quick-start-guide-)
- [Examples 📚](#examples-)
- [API Reference 📜](#api-reference-)

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
pip install docx-parser-converter
```

## Usage 🚀

### Importing the Library
To start using the library, import the necessary modules:

```python
from docx_parser_converter.docx_to_html import DocxToHtmlConverter
from docx_parser_converter.docx_to_txt import DocxToTxtConverter
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
```

### Quick Start Guide 📖
1. **Convert to HTML**:
   ```python
   from docx_parser_converter.docx_to_html import DocxToHtmlConverter
   from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

    docx_path = "path_to_your_docx_file.docx"
    html_output_path = "output.html"

    docx_file_content = read_binary_from_file_path(docx_path)

    converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
    html_output = converter.convert_to_html()
    converter.save_html_to_file(html_output, html_output_path)
   ```

2. **Convert to Plain Text**:
   ```python
   from docx_parser_converter.docx_to_txt import DocxToTxtConverter
   from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

    docx_path = "path_to_your_docx_file.docx"
    txt_output_path = "output.txt"

    docx_file_content = read_binary_from_file_path(docx_path)

    converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
    txt_output = converter.convert_to_txt(indent=True)
    converter.save_txt_to_file(txt_output, txt_output_path)
   ```

## Examples 📚

### Original DOCX File
![Original DOCX File in LibreOffice](docs/images/docx-test-1.png)
![Original DOCX File in LibreOffice](docs/images/docx-test-2.png)

### Converted to HTML
![Converted HTML Output](docs/images/docx-to-html-1.png)
![Converted HTML Output](docs/images/docx-to-html-2.png)

### Converted to Plain Text
![Converted TXT Output](docs/images/docx-to-txt.png)


## API Reference 📜

For detailed API documentation, please visit our [Read the Docs page](https://docx-parser-and-converter.readthedocs.io/en/latest/).


Enjoy using DOCX-HTML-TXT Converter! 🚀✨
