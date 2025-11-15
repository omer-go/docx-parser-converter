import xml.etree.ElementTree as ET

from docx_parser_converter.docx_parsers.styles.paragraph_properties_parser import (
    ParagraphPropertiesParser,
)


def test_paragraph_properties_parser_extracts_highlight_element():
    xml = """
    <w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:highlight w:val="yellow" />
    </w:pPr>
    """
    element = ET.fromstring(xml)

    parser = ParagraphPropertiesParser()
    properties = parser.parse(element)

    assert properties.highlight == "yellow"


def test_paragraph_properties_parser_prefers_shading_fill_color():
    xml = """
    <w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:shd w:fill="FFEEAA" w:color="auto" />
    </w:pPr>
    """
    element = ET.fromstring(xml)

    parser = ParagraphPropertiesParser()
    properties = parser.parse(element)

    assert properties.highlight == "FFEEAA"
