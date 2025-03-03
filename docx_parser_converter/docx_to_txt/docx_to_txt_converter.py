import os
from docx_parser_converter.docx_to_txt.docx_processor import DocxProcessor
from docx_parser_converter.docx_to_txt.txt_generator import TxtGenerator
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path


class DocxToTxtConverter:
    """
    Class to convert DOCX files to plain text format.
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        """
        Initializes the DocxToTxtConverter with the given DOCX file.

        Args:
            docx_file (bytes): The DOCX file content.
            use_default_values (bool): Whether to use default values for missing schemas. Default is True.

        Example:
            .. code-block:: python

                docx_file_content = read_binary_from_file_path('path_to_docx_file.docx')
                converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
        """
        self.docx_file = docx_file
        self.document_schema, self.styles_schema, self.numbering_schema = DocxProcessor.process_docx(docx_file)

    def convert_to_txt(self, indent: bool = False, extract_tables: bool = True) -> str:
        """
        Convert the DOCX document to plain text.

        Args:
            indent (bool): Whether to apply indentation. Default is False.
            extract_tables (bool): Whether to extract table contents. Default is True.

        Returns:
            str: Plain text representation of the document.

        Example:
            .. code-block:: python

                txt_content = converter.convert_to_txt(indent=True, extract_tables=True)
        """
        return TxtGenerator.generate_txt(self.document_schema, self.numbering_schema, indent)

    def save_txt_to_file(self, txt_content: str, output_path: str) -> None:
        """
        Save the generated plain text to a file.

        Args:
            txt_content (str): The plain text content.
            output_path (str): The output file path.

        Example:
            .. code-block:: python

                converter.save_txt_to_file(txt_content, 'output_path.txt')
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(txt_content)
        except Exception as e:
            print(f"Error: Failed to save TXT file. Error: {e}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/Docx Test Files/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/docx_test.docx"
    txt_output_path = "C:/Users/omerh/Desktop/docx_txt1111.txt"

    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            converter = DocxToTxtConverter(docx_file_content, use_default_values=True)
            txt_output = converter.convert_to_txt(indent=True)
            converter.save_txt_to_file(txt_output, txt_output_path)
            print(f"TXT file saved to: {txt_output_path}")
