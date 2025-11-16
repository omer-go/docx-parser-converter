from docx_parser_converter.docx_parsers.models.document_models import DocumentSchema
from docx_parser_converter.docx_parsers.models.styles_models import (
    StylesSchema,
    StyleDefaults,
    ParagraphStyleProperties,
    RunStyleProperties,
)
from docx_parser_converter.docx_parsers.models.numbering_models import NumberingSchema
from docx_parser_converter.docx_parsers.styles.styles_parser import StylesParser
from docx_parser_converter.docx_parsers.document.document_parser import DocumentParser
from docx_parser_converter.docx_parsers.numbering.numbering_parser import NumberingParser
from docx_parser_converter.docx_parsers.styles.styles_merger import StyleMerger
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
import os
import json


class DocxProcessor:
    """
    A processor for parsing and merging DOCX document components such as styles, numbering, and document content.
    """

    @staticmethod
    def process_docx(docx_file: bytes) -> tuple[DocumentSchema, StylesSchema, NumberingSchema]:
        """
        Processes the DOCX file and extracts the document schema, styles schema, and numbering schema.

        Args:
            docx_file (bytes): The binary content of the DOCX file.

        Returns:
            tuple[DocumentSchema, StylesSchema, NumberingSchema]: The parsed document schema, styles schema, and numbering schema.

        Raises:
            Exception: If the document.xml parsing fails.

        Example:
            The following is an example of how to use the process_docx method:

            .. code-block:: python

                docx_path = "path/to/your/docx_file.docx"
                docx_file = read_binary_from_file_path(docx_path)
                document_schema, styles_schema, numbering_schema = DocxProcessor.process_docx(docx_file)
        """
        styles_schema = None
        numbering_schema = None
        try:
            styles_parser = StylesParser(docx_file)
            styles_schema = styles_parser.get_styles_schema()
        except Exception as e:
            print(f"Warning: Failed to parse styles.xml. Using default styles schema. Error: {e}")
            styles_schema = DocxProcessor.get_default_styles_schema()

        try:
            numbering_parser = NumberingParser(docx_file)
            numbering_schema = numbering_parser.get_numbering_schema()
        except Exception as e:
            print(f"Warning: Failed to parse numbering.xml. Using default numbering schema. Error: {e}")
            numbering_schema = DocxProcessor.get_default_numbering_schema()

        try:
            document_parser = DocumentParser(docx_file)
            document_schema = document_parser.get_document_schema()
        except Exception as e:
            print(f"Error: Failed to parse document.xml. Conversion process cannot proceed. Error: {e}")
            raise

        style_merger = StyleMerger(document_schema, styles_schema, numbering_schema)
        document_schema = style_merger.document_schema

        return document_schema, styles_schema, numbering_schema

    @staticmethod
    def get_default_styles_schema() -> StylesSchema:
        """
        Returns a default styles schema.

        Returns:
            StylesSchema: The default styles schema.
        """
        style_defaults = StyleDefaults.model_validate({})
        return StylesSchema.model_validate(
            {
                "styles": [],
                "style_type_defaults": style_defaults.model_dump(),
                "doc_defaults_rpr": RunStyleProperties.model_validate({}).model_dump(),
                "doc_defaults_ppr": ParagraphStyleProperties.model_validate({}).model_dump(),
            }
        )

    @staticmethod
    def get_default_numbering_schema() -> NumberingSchema:
        """
        Returns a default numbering schema.

        Returns:
            NumberingSchema: The default numbering schema.
        """
        return NumberingSchema.model_validate({"instances": []})

if __name__ == "__main__":
    # Input and output paths
    docx_path = r"C:\Projects\Docx-html-txt-converter\docx_html_txt\docx_parser_converter_ts\tests\fixtures\minimal_for_test.docx"
    output_dir = r"C:\Projects\Docx-html-txt-converter\docx_html_txt\docx_parser_converter_ts\tests\python_outputs"
    os.makedirs(output_dir, exist_ok=True)

    # Extract document name (without extension)
    document_name = os.path.splitext(os.path.basename(docx_path))[0]

    # Read DOCX file
    docx_file = read_binary_from_file_path(docx_path)

    # Process DOCX
    document_schema, styles_schema, numbering_schema = DocxProcessor.process_docx(docx_file)

    # Output file path for merged document schema
    document_json_path = os.path.join(output_dir, f"{document_name}_merged_document_schema.json")
    styles_json_path = os.path.join(output_dir, f"{document_name}_styles_schema.json")
    numbering_json_path = os.path.join(output_dir, f"{document_name}_numbering_schema.json")

    # Write only the merged document schema as JSON
    with open(document_json_path, "w", encoding="utf-8") as f:
        json.dump(document_schema.model_dump(), f, ensure_ascii=False, indent=2)
    print(f"Merged document schema written to {document_json_path}")

    # Write the styles schema as JSON
    with open(styles_json_path, "w", encoding="utf-8") as f:
        json.dump(styles_schema.model_dump(), f, ensure_ascii=False, indent=2)
    print(f"Styles schema written to {styles_json_path}")

    # Write the numbering schema as JSON
    with open(numbering_json_path, "w", encoding="utf-8") as f:
        json.dump(numbering_schema.model_dump(), f, ensure_ascii=False, indent=2)
    print(f"Numbering schema written to {numbering_json_path}")
