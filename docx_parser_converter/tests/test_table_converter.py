from docx_parser_converter.docx_parsers.models.table_models import TableProperties
from docx_parser_converter.docx_to_html.converters.table_converter import (
    TableConverter,
)


def test_table_converter_applies_justified_alignment():
    properties = TableProperties.model_validate({"justification": "both"})

    style = TableConverter.convert_table_properties(properties)

    assert "text-align:justify;" in style


def test_table_converter_normalizes_left_alignment():
    properties = TableProperties.model_validate({"justification": "start"})

    style = TableConverter.convert_table_properties(properties)

    assert "text-align:left;" in style
