import xml.etree.ElementTree as ET

from docx_parser_converter.docx_parsers.styles.run_properties_parser import (
    RunPropertiesParser,
)


def test_run_properties_parser_extracts_underline_color():
    xml = """
    <w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:u w:val="single" w:color="00FF00" />
    </w:rPr>
    """
    element = ET.fromstring(xml)

    parser = RunPropertiesParser()
    properties = parser.parse(element)

    assert properties.underline == "single"
    assert properties.underline_color == "00FF00"
