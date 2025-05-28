#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter
from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path

def main():
    # Use the same test file as the JavaScript version
    docx_path = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx"
    html_output_path = "python_output.html"
    txt_output_path = "python_output.txt"

    print(f"🔄 Reading DOCX file from: {docx_path}")
    
    if not os.path.exists(docx_path):
        print(f"❌ File not found: {docx_path}")
        return
    
    try:
        docx_file_content = read_binary_from_file_path(docx_path)
        print(f"✅ File loaded successfully, size: {len(docx_file_content)} bytes")
    except Exception as e:
        print(f"❌ Error reading DOCX file: {e}")
        return

    # Convert to HTML
    try:
        print("🔄 Converting to HTML...")
        html_converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
        html_output = html_converter.convert_to_html()
        html_converter.save_html_to_file(html_output, html_output_path)
        print(f"✅ HTML conversion completed")
        print(f"💾 HTML saved to: {os.path.abspath(html_output_path)}")
    except Exception as e:
        print(f"❌ Error converting to HTML: {e}")
        return

    # Convert to text
    try:
        print("🔄 Converting to plain text...")
        txt_converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
        txt_output = txt_converter.convert_to_txt(indent=True)
        txt_converter.save_txt_to_file(txt_output, txt_output_path)
        print(f"✅ Text conversion completed")
        print(f"💾 Text saved to: {os.path.abspath(txt_output_path)}")
    except Exception as e:
        print(f"❌ Error converting to text: {e}")
        return

    # Show preview of HTML output
    print("\n📄 HTML Preview (first 500 characters):")
    print("─" * 50)
    print(html_output[:500])
    print("─" * 50)

    # Show preview of text output
    print("\n📄 Text Preview (first 500 characters):")
    print("─" * 50)
    print(txt_output[:500])
    print("─" * 50)

    print("\n🎉 Python conversion completed successfully!")
    print("📁 Output files created:")
    print(f"   - HTML: {os.path.abspath(html_output_path)}")
    print(f"   - Text: {os.path.abspath(txt_output_path)}")

if __name__ == "__main__":
    main() 