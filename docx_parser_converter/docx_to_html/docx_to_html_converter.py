import os
from docx_parser_converter.docx_to_html.docx_processor import DocxProcessor
from docx_parser_converter.docx_to_html.html_generator import HtmlGenerator
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path


class DocxToHtmlConverter:
    """
    A converter class for converting DOCX files to HTML.
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        """
        Initializes the DocxToHtmlConverter with the given DOCX file.

        Args:
            docx_file (bytes): The binary content of the DOCX file.
            use_default_values (bool): Whether to use default values for missing styles and numbering. Defaults to True.

        Example:
            The following is an example of how to initialize the DocxToHtmlConverter:

            .. code-block:: python

                docx_file_content = read_binary_from_file_path("path/to/your/docx_file.docx")
                converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
        """
        self.docx_file = docx_file
        self.document_schema, self.styles_schema, self.numbering_schema = DocxProcessor.process_docx(docx_file)

    def convert_to_html(self) -> str:
        """
        Converts the DOCX file to HTML.

        Returns:
            str: The generated HTML content.

        Example:
            The following is an example of how to convert a DOCX file to HTML:

            .. code-block:: python

                html_content = converter.convert_to_html()
                print(html_content)
        """
        return HtmlGenerator.generate_html(self.document_schema, self.numbering_schema)

    def save_html_to_file(self, html_content: str, output_path: str) -> None:
        """
        Saves the generated HTML content to a file.

        Args:
            html_content (str): The HTML content to save.
            output_path (str): The path to save the HTML file.

        Example:
            The following is an example of how to save HTML content to a file:

            .. code-block:: python

                converter.save_html_to_file(html_content, "path/to/output.html")
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(html_content)
        except Exception as e:
            print(f"Error: Failed to save HTML file. Error: {e}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/docx_test.docx"
    docx_path = "C:/Users/omerh/Desktop/SAFEs for analysis/SAFE 1 - Cap Only.docx"
    html_output_path = "C:/Users/omerh/Desktop/new_newnewdocx.html"

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
