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

        Args:
            document_schema (DocumentSchema): The document schema.
            numbering_schema: The numbering schema.
            indent (bool): Whether to apply indentation.

        Returns:
            str: Plain text representation of the document.

        Example:
            .. code-block:: python

                txt_content = TxtGenerator.generate_txt(document_schema, numbering_schema, indent=True)
        """
        body_text = TxtGenerator.generate_txt_body(document_schema.doc_margins, document_schema.elements, numbering_schema, indent)
        return body_text

    @staticmethod
    def generate_txt_body(doc_margins, elements, numbering_schema, indent: bool) -> str:
        """
        Generate the body text from document elements.

        Args:
            doc_margins: The document margins.
            elements: The document elements.
            numbering_schema: The numbering schema.
            indent (bool): Whether to apply indentation.

        Returns:
            str: Body text as a string.

        Example:
            .. code-block:: python

                body_text = TxtGenerator.generate_txt_body(doc_margins, elements, numbering_schema, indent=True)
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
