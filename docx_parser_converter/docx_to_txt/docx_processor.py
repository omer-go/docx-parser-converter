from typing import Union, Optional, Dict, Tuple
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
    def process_docx(
        source: Union[bytes, Dict[str, str]]
    ) -> tuple[DocumentSchema, StylesSchema, NumberingSchema]:
        """
        Process the DOCX file or XML content to extract document, styles, and numbering schemas.

        Args:
            source (Union[bytes, Dict[str, str]]): Either:
                - The DOCX file content as bytes, or
                - A dictionary containing XML content as strings with keys:
                  'document', 'styles', and 'numbering'

        Returns:
            tuple[DocumentSchema, StylesSchema, NumberingSchema]: A tuple containing DocumentSchema, StylesSchema, and NumberingSchema.

        Raises:
            Exception: If the document.xml cannot be parsed.
            ValueError: If the source dictionary is missing required keys.

        Example:
            Given a DOCX file, this method processes the file and returns the corresponding schemas:

            .. code-block:: python

                # Using bytes from a DOCX file
                docx_file = read_binary_from_file_path('path_to_docx_file.docx')
                document_schema, styles_schema, numbering_schema = DocxProcessor.process_docx(docx_file)

                # Using XML strings
                xml_content = {
                    'document': '<w:document>...</w:document>',
                    'styles': '<w:styles>...</w:styles>',
                    'numbering': '<w:numbering>...</w:numbering>'
                }
                document_schema, styles_schema, numbering_schema = DocxProcessor.process_docx(xml_content)
        """
        styles_schema = None
        numbering_schema = None

        # Handle different input types
        if isinstance(source, bytes):
            docx_file = source
            styles_source = docx_file
            numbering_source = docx_file
            document_source = docx_file
        elif isinstance(source, dict):
            # Validate required keys
            if 'document' not in source:
                raise ValueError("The 'document' key is required in the source dictionary")
            
            # Extract XML content
            styles_source = source.get('styles', None)
            numbering_source = source.get('numbering', None)
            document_source = source['document']
        else:
            raise TypeError("source must be either bytes or a dictionary of XML strings")

        # Process styles
        try:
            if styles_source is not None:
                styles_parser = StylesParser(styles_source)
                styles_schema = styles_parser.get_styles_schema()
        except Exception as e:
            print(f"Warning: Failed to parse styles.xml. Using default styles schema. Error: {e}")
            styles_schema = DocxProcessor.get_default_styles_schema()

        # Process numbering
        try:
            if numbering_source is not None:
                numbering_parser = NumberingParser(numbering_source)
                numbering_schema = numbering_parser.get_numbering_schema()
        except Exception as e:
            print(f"Warning: Failed to parse numbering.xml. Using default numbering schema. Error: {e}")
            numbering_schema = DocxProcessor.get_default_numbering_schema()

        # Process document (required)
        try:
            document_parser = DocumentParser(document_source)
            document_schema = document_parser.get_document_schema()
        except Exception as e:
            print(f"Error: Failed to parse document.xml. Conversion process cannot proceed. Error: {e}")
            raise

        # Merge styles
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
