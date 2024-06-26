from docx_parsers.models.document_models import DocumentSchema, Paragraph
from docx_to_txt.converters.paragraph_converter import ParagraphConverter


class TxtGenerator:
    """
    Class to generate plain text from the document schema.
    """

    @staticmethod
    def generate_txt(document_schema: DocumentSchema, numbering_schema, indent: bool) -> str:
        """
        Generate plain text from the document schema.
        :param document_schema: The document schema.
        :param numbering_schema: The numbering schema.
        :param indent: Whether to apply indentation.
        :return: Plain text representation of the document.
        """
        body_text = TxtGenerator.generate_txt_body(document_schema.doc_margins, document_schema.elements, numbering_schema, indent)
        return body_text

    @staticmethod
    def generate_txt_body(doc_margins, elements, numbering_schema, indent: bool) -> str:
        """
        Generate the body text from document elements.
        :param doc_margins: The document margins.
        :param elements: The document elements.
        :param numbering_schema: The numbering schema.
        :param indent: Whether to apply indentation.
        :return: Body text as a string.
        """
        body = ""
        if doc_margins:
            # Handle document margins if needed
            pass

        prev_paragraph = None
        for element in elements:
            if isinstance(element, Paragraph):
                if prev_paragraph:
                    body += ParagraphConverter.add_spacing(prev_paragraph, element)
                paragraph_text = ParagraphConverter.convert_paragraph(element, numbering_schema, indent)
                body += paragraph_text + "\n"
                prev_paragraph = element
            # Handle tables in future implementation
            # elif isinstance(element, Table):
            #     table_text = TableConverter.convert_table(element)
            #     body += table_text + "\n"
        
        return body
