from docx_parsers.models.document_models import DocumentSchema
from docx_parsers.models.styles_models import StylesSchema
from docx_parsers.models.numbering_models import NumberingSchema
from docx_parsers.styles.styles_parser import StylesParser
from docx_parsers.document.document_parser import DocumentParser
from docx_parsers.numbering.numbering_parser import NumberingParser
from docx_parsers.styles.styles_merger import StyleMerger


class Initialize:
    @staticmethod
    def process_docx(docx_file: bytes) -> tuple[DocumentSchema, StylesSchema, NumberingSchema]:
        styles_schema = None
        numbering_schema = None
        try:
            styles_parser = StylesParser(docx_file)
            styles_schema = styles_parser.get_styles_schema()
        except Exception as e:
            print(f"Warning: Failed to parse styles.xml. Using default styles schema. Error: {e}")
            styles_schema = Initialize.get_default_styles_schema()

        try:
            numbering_parser = NumberingParser(docx_file)
            numbering_schema = numbering_parser.get_numbering_schema()
        except Exception as e:
            print(f"Warning: Failed to parse numbering.xml. Using default numbering schema. Error: {e}")
            numbering_schema = Initialize.get_default_numbering_schema()

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
    def get_default_styles_schema():
        pass

    @staticmethod
    def get_default_numbering_schema():
        pass
