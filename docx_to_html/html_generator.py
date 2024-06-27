from lxml import etree, html
from docx_parsers.models.document_models import DocumentSchema, Paragraph
from docx_parsers.models.table_models import Table
from docx_to_html.converters.style_converter import StyleConverter
from docx_to_html.converters.paragraph_converter import ParagraphConverter
from docx_to_html.converters.table_converter import TableConverter

class HtmlGenerator:
    """
    A generator class for converting DOCX document schema to HTML.
    """

    @staticmethod
    def generate_html(document_schema: DocumentSchema, numbering_schema) -> str:
        """
        Generates HTML content from the given document schema.

        Args:
            document_schema (DocumentSchema): The schema containing elements from document.xml.
            numbering_schema: The schema containing numbering definitions.

        Returns:
            str: The generated HTML content.

        Example:
            The following is an example of how to generate HTML content:

            .. code-block:: python

                html_content = HtmlGenerator.generate_html(document_schema, numbering_schema)
                print(html_content)
        """
        root = etree.Element("html")
        body = etree.SubElement(root, "body")
        
        body_html = HtmlGenerator.generate_html_body(document_schema.doc_margins, document_schema.elements, numbering_schema)
        body.append(body_html)

        return html.tostring(root, pretty_print=True, encoding="unicode")

    @staticmethod
    def generate_html_body(doc_margins, elements, numbering_schema) -> etree.Element:
        """
        Generates the body of the HTML content from the given document elements.

        Args:
            doc_margins: The document margins.
            elements: The list of document elements (paragraphs and tables).
            numbering_schema: The schema containing numbering definitions.

        Returns:
            etree.Element: The generated HTML body element.

        Example:
            The following is an example of how to generate the HTML body:

            .. code-block:: python

                body_html = HtmlGenerator.generate_html_body(doc_margins, elements, numbering_schema)
                print(etree.tostring(body_html, pretty_print=True, encoding="unicode"))
        """
        div = etree.Element("div")
        if doc_margins:
            margin_style = StyleConverter.convert_doc_margins(doc_margins)
            div.set("style", margin_style)
        
        for element in elements:
            if isinstance(element, Paragraph):
                paragraph_html = ParagraphConverter.convert_paragraph(element, numbering_schema)
                div.append(html.fragment_fromstring(paragraph_html))
            elif isinstance(element, Table):
                table_html = TableConverter.convert_table(element)
                div.append(html.fragment_fromstring(table_html))
        
        return div
