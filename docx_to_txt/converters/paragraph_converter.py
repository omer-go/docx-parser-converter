from docx_parsers.models.document_models import Paragraph
from docx_to_txt.converters.run_converter import RunConverter
from docx_to_txt.converters.numbering_converter import NumberingConverter


class ParagraphConverter:
    """
    Class to convert paragraphs to plain text.
    """

    @staticmethod
    def convert_paragraph(paragraph: Paragraph, numbering_schema, indent: bool) -> str:
        """
        Convert a paragraph to plain text.
        :param paragraph: The paragraph object.
        :param numbering_schema: The numbering schema.
        :param indent: Whether to apply indentation.
        :return: Plain text representation of the paragraph.
        """
        paragraph_text = ""
        if paragraph.numbering:
            paragraph_text += NumberingConverter.convert_numbering(paragraph, numbering_schema)
        for run in paragraph.runs:
            paragraph_text += RunConverter.convert_run(run, paragraph)
        if indent:
            paragraph_text = "\t" + paragraph_text
        return paragraph_text

    @staticmethod
    def convert_paragraph_properties(properties, indent: bool) -> str:
        """
        Convert paragraph properties to text format.
        :param properties: The paragraph properties.
        :param indent: Whether to apply indentation.
        :return: Text representation of paragraph properties.
        """
        # Convert properties if needed
        return ""
