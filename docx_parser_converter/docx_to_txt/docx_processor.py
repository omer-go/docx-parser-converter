from docx_parser_converter.docx_parsers.models.document_models import DocumentSchema
from docx_parser_converter.docx_parsers.models.styles_models import StylesSchema
from docx_parser_converter.docx_parsers.models.numbering_models import NumberingSchema
from docx_parser_converter.docx_parsers.styles.styles_parser import StylesParser
from docx_parser_converter.docx_parsers.document.document_parser import DocumentParser
from docx_parser_converter.docx_parsers.numbering.numbering_parser import NumberingParser
from docx_parser_converter.docx_parsers.styles.styles_merger import StyleMerger


class DocxProcessor:
    """
    Class to process the DOCX file and extract the schemas.
    """

    @staticmethod
    def process_docx(docx_file: bytes) -> tuple[DocumentSchema, StylesSchema, NumberingSchema]:
        """
        Process the DOCX file to extract document, styles, and numbering schemas.

        Args:
            docx_file (bytes): The DOCX file content.

        Returns:
            tuple[DocumentSchema, StylesSchema, NumberingSchema]: A tuple containing DocumentSchema, StylesSchema, and NumberingSchema.

        Raises:
            Exception: If the document.xml cannot be parsed.

        Example:
            Given a DOCX file, this method processes the file and returns the corresponding schemas:

            .. code-block:: python

                docx_file = read_binary_from_file_path('path_to_docx_file.docx')
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
        Returns the default styles schema.

        Returns:
            StylesSchema: The default styles schema.

        Example:
            .. code-block:: python

                default_styles_schema = DocxProcessor.get_default_styles_schema()
        """
        pass

    @staticmethod
    def get_default_numbering_schema() -> NumberingSchema:
        """
        Returns the default numbering schema.

        Returns:
            NumberingSchema: The default numbering schema.

        Example:
            .. code-block:: python

                default_numbering_schema = DocxProcessor.get_default_numbering_schema()
        """
        pass
