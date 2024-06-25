import os
from docx_to_html.docx_processor import DocxProcessor
from docx_to_html.html_generator import HtmlGenerator
from docx_parsers.utils import read_binary_from_file_path


class DocxToHtmlConverter:
    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        self.docx_file = docx_file
        self.document_schema, self.styles_schema, self.numbering_schema = DocxProcessor.process_docx(docx_file)

    def convert_to_html(self) -> str:
        return HtmlGenerator.generate_html(self.document_schema, self.numbering_schema)

    def save_html_to_file(self, html_content: str, output_path: str) -> None:
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(html_content)
        except Exception as e:
            print(f"Error: Failed to save HTML file. Error: {e}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/docx_test.docx"
    html_output_path = "C:/Users/omerh/Desktop/new_docx.html"

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
