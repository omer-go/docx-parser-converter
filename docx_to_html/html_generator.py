from lxml import etree, html
from docx_parsers.models.document_models import DocumentSchema
from docx_to_html.converters.style_converter import StyleConverter
from docx_to_html.converters.paragraph_converter import ParagraphConverter

class HtmlGenerator:
    @staticmethod
    def generate_html(document_schema: DocumentSchema, numbering_schema) -> str:
        root = etree.Element("html")
        body = etree.SubElement(root, "body")
        
        margins_html = HtmlGenerator.generate_margins_html(document_schema.margins, document_schema.paragraphs, numbering_schema)
        body.append(margins_html)

        return html.tostring(root, pretty_print=True, encoding="unicode")

    @staticmethod
    def generate_margins_html(margins, paragraphs, numbering_schema) -> etree.Element:
        div = etree.Element("div")
        if margins:
            margin_style = StyleConverter.convert_margins(margins)
            div.set("style", margin_style)
        
        paragraphs_html = HtmlGenerator.generate_paragraphs_html(paragraphs, numbering_schema)
        div.append(paragraphs_html)
        
        return div

    @staticmethod
    def generate_paragraphs_html(paragraphs, numbering_schema) -> etree.Element:
        container = etree.Element("div")
        for paragraph in paragraphs:
            paragraph_html = ParagraphConverter.convert_paragraph(paragraph, numbering_schema)
            container.append(html.fragment_fromstring(paragraph_html))
        return container
