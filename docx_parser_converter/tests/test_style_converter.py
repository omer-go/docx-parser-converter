from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter


def test_convert_color_adds_hash_for_hex():
    assert StyleConverter.convert_color("FF0000") == "color:#FF0000;"


def test_convert_color_preserves_named_color():
    assert StyleConverter.convert_color("red") == "color:red;"


def test_convert_color_keeps_existing_hash():
    assert StyleConverter.convert_color("#00FF00") == "color:#00FF00;"


def test_convert_color_auto_returns_empty():
    assert StyleConverter.convert_color("auto") == ""
