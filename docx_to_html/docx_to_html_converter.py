import os
from docx_parsers.document.document_parser import DocumentParser
from docx_parsers.styles.styles_parser import StylesParser
from docx_parsers.numbering.numbering_parser import NumberingParser
from docx_parsers.styles.styles_merger import StyleMerger
# from docx_parsers.models.document_models import DocumentSchema
# from docx_parsers.models.styles_models import StylesSchema
# from docx_parsers.models.numbering_models import NumberingSchema
from docx_to_html.paragraph_converter import ParagraphConverter
from docx_to_html.utils import read_binary_from_file_path

class DocxToHtmlConverter:
    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        self.docx_file = docx_file
        self.document_schema = None
        self.numbering_schema = None
        self.html_content = ""
        self.numbering_counters = {}
        self.use_default_values = use_default_values
        self.process_docx(docx_file)

    def process_docx(self, docx_file: bytes) -> None:
        styles_schema = None
        numbering_schema = None
        try:
            styles_parser = StylesParser(docx_file)
            styles_schema = styles_parser.get_styles_schema()
        except Exception as e:
            print(f"Warning: Failed to parse styles.xml. Using default styles schema. Error: {e}")
            styles_schema = self.get_default_styles_schema()

        try:
            numbering_parser = NumberingParser(docx_file)
            numbering_schema = numbering_parser.get_numbering_schema()
        except Exception as e:
            print(f"Warning: Failed to parse numbering.xml. Using default numbering schema. Error: {e}")
            numbering_schema = self.get_default_numbering_schema()

        try:
            document_parser = DocumentParser(docx_file)
            document_schema = document_parser.get_document_schema()
        except Exception as e:
            print(f"Error: Failed to parse document.xml. Conversion process cannot proceed. Error: {e}")
            raise

        style_merger = StyleMerger(
            document_schema,
            styles_schema,
            numbering_schema
        )
        self.document_schema = style_merger.document_schema
        self.numbering_schema = numbering_schema

    def get_default_styles_schema(self):
        # TODO: Implement default styles schema
        pass

    def get_default_numbering_schema(self):
        # TODO: Implement default numbering schema
        pass

    def convert_to_html(self) -> str:
        self.html_content = "<html><body>"

        margins = self.document_schema.margins
        if margins:
            margin_style = f"padding-top:{margins.top_pt}pt; padding-right:{margins.right_pt}pt; padding-bottom:{margins.bottom_pt}pt; padding-left:{margins.left_pt}pt;"
            if margins.header_pt:
                margin_style += f" padding-top:{margins.header_pt}pt;"
            if margins.footer_pt:
                margin_style += f" padding-bottom:{margins.footer_pt}pt;"
            if margins.gutter_pt:
                margin_style += f" margin-left:{margins.gutter_pt}pt;"

            self.html_content += f'<div style="{margin_style}">'

        paragraph_converter = ParagraphConverter(self.numbering_schema)
        for paragraph in self.document_schema.paragraphs:
            self.html_content += paragraph_converter.convert_paragraph(paragraph)

        self.html_content += "</div></body></html>"
        return self.html_content

    def save_html_to_file(self, html_content: str, output_path: str) -> None:
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(html_content)
        except Exception as e:
            print(f"Error: Failed to save HTML file. Error: {e}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
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
