from docx_parser_converter.docx_parsers.models.styles_models import RunStyleProperties
from docx_parser_converter.docx_to_html.converters.run_converter import RunConverter


def test_run_converter_includes_strikethrough_styles():
    properties = RunStyleProperties.model_validate({"strikethrough": True})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'text-decoration-line:line-through;' in style_attr


def test_run_converter_includes_double_strikethrough_style():
    properties = RunStyleProperties.model_validate({"double_strikethrough": True})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'text-decoration-style:double;' in style_attr


def test_run_converter_includes_highlight_color():
    properties = RunStyleProperties.model_validate({"highlight": "FF0000"})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'background-color:#FF0000;' in style_attr


def test_run_converter_applies_vertical_alignment():
    properties = RunStyleProperties.model_validate({"vertical_align": "superscript"})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'vertical-align:super;' in style_attr
    assert 'font-size:smaller;' in style_attr
    assert 'top:' not in style_attr  # baseline shift should not be used when vertical align is present


def test_run_converter_uses_text_position_when_no_vertical_align():
    properties = RunStyleProperties.model_validate({"text_position_pt": 2})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'position:relative;' in style_attr
    assert 'top:-2pt;' in style_attr


def test_run_converter_prefers_all_caps_over_small_caps():
    properties = RunStyleProperties.model_validate({"all_caps": True, "small_caps": True})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'text-transform:uppercase;' in style_attr
    assert 'font-variant:small-caps;' not in style_attr


def test_run_converter_uses_small_caps_when_no_all_caps():
    properties = RunStyleProperties.model_validate({"small_caps": True})

    style_attr = RunConverter.convert_run_properties(properties)

    assert 'font-variant:small-caps;' in style_attr
