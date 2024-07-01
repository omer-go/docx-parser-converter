from docx_parser_converter.docx_parsers.models.paragraph_models import Paragraph
from docx_parser_converter.docx_to_txt.converters.run_converter import RunConverter
from docx_parser_converter.docx_to_txt.converters.numbering_converter import NumberingConverter


class ParagraphConverter:
    """
    Class to convert paragraphs to plain text.
    """

    @staticmethod
    def convert_paragraph(paragraph: Paragraph, numbering_schema, indent: bool) -> str:
        """
        Convert a paragraph to plain text.

        Args:
            paragraph (Paragraph): The paragraph object.
            numbering_schema: The numbering schema.
            indent (bool): Whether to apply indentation.

        Returns:
            str: Plain text representation of the paragraph.

        Example:
            .. code-block:: python

                paragraph_text = ParagraphConverter.convert_paragraph(paragraph, numbering_schema, indent=True)
                print(paragraph_text)
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

        Args:
            text (str): The text to indent.
            indent_value (float): The indentation value in points.

        Returns:
            str: The indented text.

        Example:
            .. code-block:: python

                indented_text = ParagraphConverter.add_indentation("This is a test.", 72)
                print(indented_text)  # Output: "\t\tThis is a test."
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

        Args:
            prev_paragraph (Paragraph): The previous paragraph.
            curr_paragraph (Paragraph): The current paragraph.

        Returns:
            str: Newlines to add for spacing.

        Example:
            .. code-block:: python

                spacing = ParagraphConverter.add_spacing(prev_paragraph, curr_paragraph)
                print(spacing)  # Output: "\n\n" (depending on spacing properties)
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

        Args:
            properties: The paragraph properties.
            indent (bool): Whether to apply indentation.

        Returns:
            str: Text representation of paragraph properties.

        Example:
            .. code-block:: python

                paragraph_properties_text = ParagraphConverter.convert_paragraph_properties(properties, indent=True)
                print(paragraph_properties_text)
        """
        # Convert properties if needed
        return ""
