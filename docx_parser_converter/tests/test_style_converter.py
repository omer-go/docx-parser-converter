from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter


def test_convert_color_adds_hash_for_hex():
    assert (
        StyleConverter.convert_color("FF0000")
        == "color:#FF0000;text-decoration-color:#FF0000;"
    )


def test_convert_color_preserves_named_color():
    assert (
        StyleConverter.convert_color("red")
        == "color:red;text-decoration-color:red;"
    )


def test_convert_color_keeps_existing_hash():
    assert (
        StyleConverter.convert_color("#00FF00")
        == "color:#00FF00;text-decoration-color:#00FF00;"
    )


def test_convert_color_auto_returns_empty():
    assert StyleConverter.convert_color("auto") == ""


def test_convert_underline_color_prefers_explicit_color():
    assert (
        StyleConverter.convert_underline_color("00FF00")
        == "text-decoration-color:#00FF00;"
    )


def test_convert_underline_color_auto_returns_empty():
    assert StyleConverter.convert_underline_color("auto") == ""


def test_convert_highlight_accepts_named_color():
    assert StyleConverter.convert_highlight("yellow") == "background-color:yellow;"


def test_convert_highlight_formats_hex():
    assert (
        StyleConverter.convert_highlight("FFEEAA")
        == "background-color:#FFEEAA;"
    )


def test_convert_underline_single():
    assert (
        StyleConverter.convert_underline("single")
        == "text-decoration-line:underline;text-decoration-style:solid;"
    )


def test_convert_underline_double():
    assert (
        StyleConverter.convert_underline("double")
        == "text-decoration-line:underline;text-decoration-style:double;"
    )


def test_convert_underline_thick_includes_thickness():
    assert (
        StyleConverter.convert_underline("thick")
        == "text-decoration-line:underline;text-decoration-style:solid;text-decoration-thickness:0.15em;"
    )


def test_convert_underline_dotted_heavy():
    assert (
        StyleConverter.convert_underline("dottedHeavy")
        == "text-decoration-line:underline;text-decoration-style:dotted;text-decoration-thickness:0.15em;"
    )


def test_convert_underline_dash_long_heavy():
    assert (
        StyleConverter.convert_underline("dashLongHeavy")
        == "text-decoration-line:underline;text-decoration-style:dashed;text-decoration-thickness:0.15em;"
    )


def test_convert_underline_dot_dot_dash_falls_back_to_dot_dash():
    expected = "text-decoration-line:underline;text-decoration-style:dashed;"
    assert StyleConverter.convert_underline("dotDash") == expected
    assert StyleConverter.convert_underline("dotDotDash") == expected


def test_convert_underline_wavy_double_falls_back_to_single_wave():
    expected = "text-decoration-line:underline;text-decoration-style:wavy;"
    assert StyleConverter.convert_underline("wave") == expected
    assert StyleConverter.convert_underline("wavyDouble") == expected


def test_convert_underline_wavy_direct_mapping():
    expected = "text-decoration-line:underline;text-decoration-style:wavy;"
    assert StyleConverter.convert_underline("wavy") == expected


def test_convert_underline_none():
    assert StyleConverter.convert_underline("none") == "text-decoration-line:none;"


def test_convert_underline_unknown_returns_empty():
    assert StyleConverter.convert_underline("mystery") == ""


def test_convert_underline_with_strikethrough_combines_lines():
    assert (
        StyleConverter.convert_underline("single", strikethrough=True)
        == "text-decoration-line:underline line-through;text-decoration-style:solid;"
    )


def test_convert_underline_with_only_strikethrough():
    assert (
        StyleConverter.convert_underline(None, strikethrough=True)
        == "text-decoration-line:line-through;"
    )


def test_convert_underline_with_double_strikethrough():
    assert (
        StyleConverter.convert_underline(None, double_strikethrough=True)
        == "text-decoration-line:line-through;text-decoration-style:double;"
    )


def test_convert_all_caps():
    assert StyleConverter.convert_all_caps(True) == "text-transform:uppercase;"


def test_convert_small_caps():
    assert StyleConverter.convert_small_caps(True) == "font-variant:small-caps;"


def test_convert_vertical_align_superscript():
    assert (
        StyleConverter.convert_vertical_align("superscript")
        == "vertical-align:super;font-size:smaller;"
    )


def test_convert_vertical_align_subscript():
    assert (
        StyleConverter.convert_vertical_align("subscript")
        == "vertical-align:sub;font-size:smaller;"
    )


def test_convert_vertical_align_prefers_css_over_text_position():
    assert (
        StyleConverter.convert_vertical_align("superscript", 2.0)
        == "vertical-align:super;font-size:smaller;"
    )


def test_convert_vertical_align_falls_back_to_text_position():
    assert (
        StyleConverter.convert_vertical_align("baseline", 2.0)
        == "position:relative;top:-2pt;"
    )


def test_convert_vertical_align_uses_text_position_when_no_align():
    assert (
        StyleConverter.convert_vertical_align(None, -1.5)
        == "position:relative;top:1.5pt;"
    )


def test_convert_text_position_positive_shifts_up():
    assert (
        StyleConverter.convert_text_position(2.0)
        == "position:relative;top:-2pt;"
    )


def test_convert_text_position_negative_shifts_down():
    assert (
        StyleConverter.convert_text_position(-1.5)
        == "position:relative;top:1.5pt;"
    )
