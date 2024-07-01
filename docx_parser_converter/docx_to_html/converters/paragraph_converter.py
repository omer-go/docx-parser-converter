from docx_parser_converter.docx_parsers.models.paragraph_models import Paragraph
from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter
from docx_parser_converter.docx_to_html.converters.run_converter import RunConverter
from docx_parser_converter.docx_to_html.converters.numbering_converter import NumberingConverter


class ParagraphConverter:
    """
    A converter class for converting DOCX paragraphs to HTML.
    """

    @staticmethod
    def convert_paragraph(paragraph: Paragraph, numbering_schema) -> str:
        """
        Converts a paragraph to its HTML representation.

        Args:
            paragraph (Paragraph): The paragraph to convert.
            numbering_schema: The schema containing numbering definitions.

        Returns:
            str: The HTML representation of the paragraph.

        Example:
            Given a paragraph with text and numbering, the output HTML string might look like:

            .. code-block:: html

                <p style="text-align:left;">
                    <span style="font-family:Times New Roman;">1.</span>
                    <span style="padding-left:7.2pt;"></span>
                    This is a sample paragraph.
                </p>
        """
        paragraph_html = f"<p{ParagraphConverter.convert_paragraph_properties(paragraph.properties)}>"
        if paragraph.numbering:
            paragraph_html += NumberingConverter.convert_numbering(paragraph, numbering_schema)
        for run in paragraph.runs:
            paragraph_html += RunConverter.convert_run(run, paragraph)
        paragraph_html += "</p>"
        return paragraph_html

    @staticmethod
    def convert_paragraph_properties(properties) -> str:
        """
        Converts paragraph properties to an HTML style attribute.

        Args:
            properties: The paragraph style properties to convert.

        Returns:
            str: The HTML style attribute representing the paragraph properties.

        Example:
            The output style attribute might look like:

            .. code-block:: html

                ' style="margin-top:12pt;margin-bottom:12pt;text-align:left;"'
        """
        style = ""
        if properties.spacing:
            style += StyleConverter.convert_spacing(properties.spacing)
        if properties.indent:
            style += StyleConverter.convert_indent(properties.indent)
        if properties.justification:
            style += StyleConverter.convert_justification(properties.justification)
        return f' style="{style}"' if style else ""
