from docx_parser_converter.docx_parsers.models.paragraph_models import (
    Paragraph,
    Run,
    RunContent,
    TextContent,
)
from docx_parser_converter.docx_parsers.models.styles_models import (
    ParagraphStyleProperties,
    RunStyleProperties,
)
from docx_parser_converter.docx_to_html.converters.paragraph_converter import (
    ParagraphConverter,
)


def _paragraph_with_highlight(highlight: str) -> Paragraph:
    properties = ParagraphStyleProperties.model_validate({"highlight": highlight})
    run = Run(
        contents=[RunContent(run=TextContent(text="Example"))],
        properties=RunStyleProperties.model_validate({}),
    )
    return Paragraph(properties=properties, runs=[run], numbering=None)


def _paragraph_with_justification(justification: str) -> Paragraph:
    properties = ParagraphStyleProperties.model_validate(
        {"justification": justification}
    )
    run = Run(
        contents=[RunContent(run=TextContent(text="Aligned"))],
        properties=RunStyleProperties.model_validate({}),
    )
    return Paragraph(properties=properties, runs=[run], numbering=None)


def test_paragraph_converter_includes_highlight_style():
    paragraph = _paragraph_with_highlight("yellow")

    html = ParagraphConverter.convert_paragraph(paragraph, numbering_schema=None)

    assert 'style="background-color:yellow;' in html
    assert "Example" in html


def test_paragraph_converter_emits_justification_style():
    paragraph = _paragraph_with_justification("both")

    html = ParagraphConverter.convert_paragraph(paragraph, numbering_schema=None)

    assert 'text-align:justify;' in html
    assert "Aligned" in html
