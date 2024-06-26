from lxml import etree, html
from docx_parsers.models.document_models import DocumentSchema, Paragraph
from docx_parsers.models.table_models import Table
from docx_to_html.converters.style_converter import StyleConverter
from docx_to_html.converters.paragraph_converter import ParagraphConverter
from docx_to_html.converters.table_converter import TableConverter

class HtmlGenerator:
    @staticmethod
    def generate_html(document_schema: DocumentSchema, numbering_schema) -> str:
        root = etree.Element("html")
        body = etree.SubElement(root, "body")
        
        body_html = HtmlGenerator.generate_html_body(document_schema.doc_margins, document_schema.elements, numbering_schema)
        body.append(body_html)

        return html.tostring(root, pretty_print=True, encoding="unicode")

    @staticmethod
    def generate_html_body(doc_margins, elements, numbering_schema) -> etree.Element:
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
