from docx_parsers.models.document_models import DocumentSchema
from docx_to_html.converters.style_converter import StyleConverter
from docx_to_html.converters.paragraph_converter import ParagraphConverter


class HtmlGenerator:
    @staticmethod
    def generate_html(document_schema: DocumentSchema, numbering_schema) -> str:
        html_content = "<html><body>"
        margins = document_schema.margins
        if margins:
            margin_style = StyleConverter.convert_margins(margins)
            html_content += f'<div style="{margin_style}">'
        for paragraph in document_schema.paragraphs:
            html_content += ParagraphConverter.convert_paragraph(paragraph, numbering_schema)
        html_content += "</div></body></html>"
        return html_content
