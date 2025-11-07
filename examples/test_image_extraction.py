"""
Example script demonstrating image extraction from DOCX files.

This script shows how to:
1. Parse a DOCX file with embedded images
2. Extract image metadata (dimensions, alt text, title)
3. Convert to HTML with embedded base64 images
4. Convert to TXT with image placeholders
"""

from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter
from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter
from docx_parser_converter.docx_parsers.document.document_parser import DocumentParser
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
from docx_parser_converter.docx_parsers.models.paragraph_models import Paragraph, ImageContent
import os

def main():
    # Path to the test DOCX file with an image
    script_dir = os.path.dirname(os.path.abspath(__file__))
    docx_path = os.path.join(script_dir, "test_image.docx")
    
    if not os.path.exists(docx_path):
        print(f"Error: Test file not found at {docx_path}")
        return
    
    print("=" * 60)
    print("DOCX Image Extraction Example")
    print("=" * 60)
    print()
    
    # Read the DOCX file
    docx_file = read_binary_from_file_path(docx_path)
    
    # --- Part 1: Parse and inspect the document ---
    print("1. Parsing document and extracting image metadata...")
    print("-" * 60)
    
    parser = DocumentParser(docx_file)
    document = parser.get_document_schema()
    
    image_count = 0
    for element in document.elements:
        if isinstance(element, Paragraph):
            for run in element.runs:
                for content in run.contents:
                    if isinstance(content.run, ImageContent):
                        image_count += 1
                        img = content.run
                        print(f"\nImage #{image_count}:")
                        print(f"  Relationship ID: {img.rId}")
                        print(f"  Title: {img.title}")
                        print(f"  Alt Text: {img.alt_text}")
                        print(f"  Width (EMU): {img.width_emu}")
                        print(f"  Height (EMU): {img.height_emu}")
                        if img.width_emu and img.height_emu:
                            width_inches = img.width_emu / 914400
                            height_inches = img.height_emu / 914400
                            print(f"  Dimensions: {width_inches:.2f}\" x {height_inches:.2f}\"")
                        if img.image_data:
                            print(f"  Image data: Embedded (base64, {len(img.image_data)} chars)")
    
    if image_count == 0:
        print("  No images found in the document.")
    
    print()
    
    # --- Part 2: Convert to HTML ---
    print("2. Converting to HTML with embedded images...")
    print("-" * 60)
    
    html_converter = DocxToHtmlConverter(docx_file, use_default_values=True)
    html_output = html_converter.convert_to_html()
    
    # Save HTML output
    html_path = os.path.join(script_dir, "test_image_output.html")
    html_converter.save_html_to_file(html_output, html_path)
    print(f"  HTML saved to: {html_path}")
    
    # Show snippet
    if '<img' in html_output:
        img_start = html_output.find('<img')
        img_end = html_output.find('/>', img_start)
        if img_end != -1:
            img_end += 2
            print(f"\n  Image tag preview:")
            img_tag = html_output[img_start:img_end]
            # Truncate base64 data for display
            if 'base64,' in img_tag:
                try:
                    base64_start = img_tag.find('base64,') + 7
                    quote_end = img_tag.find('"', base64_start)
                    if quote_end != -1:
                        data_part = img_tag[base64_start:quote_end]
                        if len(data_part) > 60:
                            truncated = data_part[:30] + '...' + data_part[-30:]
                            img_tag = img_tag[:base64_start] + truncated + img_tag[quote_end:]
                except Exception:
                    # If truncation fails, just show the tag as-is
                    pass
            print(f"  {img_tag}")
    
    print()
    
    # --- Part 3: Convert to TXT ---
    print("3. Converting to TXT with image placeholders...")
    print("-" * 60)
    
    txt_converter = DocxToTxtConverter(docx_file, use_default_values=True)
    txt_output = txt_converter.convert_to_txt(indent=True)
    
    # Save TXT output
    txt_path = os.path.join(script_dir, "test_image_output.txt")
    txt_converter.save_txt_to_file(txt_output, txt_path)
    print(f"  TXT saved to: {txt_path}")
    
    print(f"\n  TXT output preview:")
    print("  " + "-" * 40)
    for line in txt_output.split('\n')[:10]:
        print(f"  {line}")
    print("  " + "-" * 40)
    
    print()
    print("=" * 60)
    print("Example complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
