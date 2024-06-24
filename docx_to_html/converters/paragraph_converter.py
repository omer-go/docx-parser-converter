from docx_parsers.models.document_models import Paragraph
from docx_to_html.converters.style_converter import StyleConverter
from docx_to_html.converters.run_converter import RunConverter
from docx_to_html.converters.numbering_converter import NumberingConverter


class ParagraphConverter:
    @staticmethod
    def convert_paragraph(paragraph: Paragraph, numbering_schema) -> str:
        paragraph_html = f"<p{ParagraphConverter.convert_paragraph_properties(paragraph.properties)}>"
        if paragraph.numbering:
            paragraph_html += NumberingConverter.convert_numbering(paragraph, numbering_schema)
        for run in paragraph.runs:
            paragraph_html += RunConverter.convert_run(run, paragraph)
        paragraph_html += "</p>"
        return paragraph_html

    @staticmethod
    def convert_paragraph_properties(properties) -> str:
        style = ""
        if properties.spacing:
            style += StyleConverter.convert_spacing(properties.spacing)
        if properties.indent:
            style += StyleConverter.convert_indent(properties.indent)
        if properties.justification:
            style += StyleConverter.convert_justification(properties.justification)
        return f' style="{style}"' if style else ""
