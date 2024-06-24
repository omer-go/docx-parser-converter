from docx_parsers.models.document_models import Paragraph, ParagraphStyleProperties
from docx_to_html.run_converter import RunConverter
from docx_to_html.numbering_converter import NumberingConverter

class ParagraphConverter:
    def __init__(self, numbering_schema):
        self.numbering_converter = NumberingConverter(numbering_schema)

    def convert_paragraph(self, paragraph: Paragraph) -> str:
        paragraph_html = f"<p{self.convert_paragraph_properties(paragraph.properties)}>"
        if paragraph.numbering:
            paragraph_html += self.numbering_converter.convert_numbering(paragraph)
        run_converter = RunConverter()
        for run in paragraph.runs:
            paragraph_html += run_converter.convert_run(run, paragraph)
        paragraph_html += "</p>"
        return paragraph_html

    def convert_paragraph_properties(self, properties: ParagraphStyleProperties) -> str:
        style = ""
        if properties.spacing:
            style += f"margin-top:{properties.spacing.before_pt}pt; margin-bottom:{properties.spacing.after_pt}pt; line-height:{properties.spacing.line_pt}pt;"
        if properties.indent:
            style += f"margin-left:{properties.indent.left_pt}pt; margin-right:{properties.indent.right_pt}pt; text-indent:{properties.indent.firstline_pt}pt;"
        if properties.justification:
            style += f"text-align:{properties.justification};"
        return f' style="{style}"' if style else ""
