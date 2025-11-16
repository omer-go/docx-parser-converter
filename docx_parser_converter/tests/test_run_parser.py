import xml.etree.ElementTree as ET

from docx_parser_converter.docx_parsers.document.run_parser import RunParser
from docx_parser_converter.docx_parsers.models.paragraph_models import TextContent


def test_run_parser_handles_empty_run_text():
    xml = """
    <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:t />
    </w:r>
    """
    element = ET.fromstring(xml)

    run = RunParser().parse(element)

    assert len(run.contents) == 1
    first_content = run.contents[0].run
    assert isinstance(first_content, TextContent)
    assert first_content.text == ""
