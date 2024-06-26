import os
from docx_to_txt.docx_processor import DocxProcessor
from docx_to_txt.txt_generator import TxtGenerator
from docx_parsers.utils import read_binary_from_file_path


class DocxToTxtConverter:
    """
    Class to convert DOCX files to plain text format.
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        self.docx_file = docx_file
        self.document_schema, self.styles_schema, self.numbering_schema = DocxProcessor.process_docx(docx_file)

    def convert_to_txt(self, indent: bool = False, extract_tables: bool = False) -> str:
        """
        Convert the DOCX document to plain text.
        :param indent: Whether to apply indentation.
        :param extract_tables: Whether to extract table contents.
        :return: Plain text representation of the document.
        """
        return TxtGenerator.generate_txt(self.document_schema, self.numbering_schema, indent)

    def save_txt_to_file(self, txt_content: str, output_path: str) -> None:
        """
        Save the generated plain text to a file.
        :param txt_content: The plain text content.
        :param output_path: The output file path.
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(txt_content)
        except Exception as e:
            print(f"Error: Failed to save TXT file. Error: {e}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/docx_test.docx"
    txt_output_path = "C:/Users/omerh/Desktop/docx_txt.txt"

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
