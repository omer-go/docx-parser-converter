import xml.etree.ElementTree as ET

from docx_parser_converter.docx_parsers.document.run_parser import RunParser
from docx_parser_converter.docx_parsers.models.paragraph_models import TextContent, BreakContent


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


def test_run_parser_preserves_xml_like_characters():
    xml = """
    <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:t>&lt;tag&gt;&amp;text</w:t>
    </w:r>
    """
    element = ET.fromstring(xml)

    run = RunParser().parse(element)

    first_content = run.contents[0].run
    assert isinstance(first_content, TextContent)
    assert first_content.text == "<tag>&text"


def test_run_parser_handles_line_breaks():
    xml = """
    <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:t>Line 1</w:t>
        <w:br w:type="textWrapping"/>
        <w:t>Line 2</w:t>
    </w:r>
    """
    element = ET.fromstring(xml)

    run = RunParser().parse(element)

    assert isinstance(run.contents[1].run, BreakContent)
    assert run.contents[1].run.break_type == "textWrapping"
