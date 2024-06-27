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
            paragraph_text += RunConverter.convert_run(run)
        
        if indent and paragraph.properties and paragraph.properties.indent:
            indent_value = paragraph.properties.indent.left_pt or 0
            paragraph_text = ParagraphConverter.add_indentation(paragraph_text, indent_value)

        return paragraph_text

    @staticmethod
    def add_indentation(text: str, indent_value: float) -> str:
        """
        Add indentation to the text based on the indent value in points.
        :param text: The text to indent.
        :param indent_value: The indentation value in points.
        :return: The indented text.
        """
        tab_size_in_points = 36
        num_tabs = int(indent_value // tab_size_in_points)
        remaining_points = indent_value % tab_size_in_points
        num_spaces = int(remaining_points / (tab_size_in_points / 4))  # Assume 4 spaces per tab size
        
        return "\t" * num_tabs + " " * num_spaces + text

    @staticmethod
    def add_spacing(prev_paragraph: Paragraph, curr_paragraph: Paragraph) -> str:
        """
        Add spacing between paragraphs based on their spacing properties.
        :param prev_paragraph: The previous paragraph.
        :param curr_paragraph: The current paragraph.
        :return: Newlines to add for spacing.
        """

        spacing_after = prev_paragraph.properties.spacing.after_pt if prev_paragraph.properties and prev_paragraph.properties.spacing and prev_paragraph.properties.spacing.after_pt is not None else 0
        spacing_before = curr_paragraph.properties.spacing.before_pt if curr_paragraph.properties and curr_paragraph.properties.spacing and curr_paragraph.properties.spacing.before_pt is not None else 0

        # Total spacing in points
        total_spacing_points = spacing_after + spacing_before
        
        # Convert points to newlines (1 newline = 12 points, assuming standard line height)
        # Use a threshold of 6 points for adding a newline
        threshold = 6
        num_newlines = int((total_spacing_points + threshold) // 12)

        return "\n" * num_newlines

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
