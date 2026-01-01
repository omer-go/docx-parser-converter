"""Unit tests for common parsers (color, border, shading, width, spacing, indentation).

Each test follows the pattern:
1. test_parse_<element>_none - Tests None input returns None
2. test_parse_<element>_minimal - Tests minimal required attributes
3. test_parse_<element>_all_attributes - Tests all possible attributes
4. test_parse_<element>_<specific_case> - Tests specific edge cases
"""

from parsers.common.border_parser import parse_border, parse_paragraph_borders, parse_table_borders
from parsers.common.color_parser import parse_color
from parsers.common.indentation_parser import parse_indentation
from parsers.common.shading_parser import parse_shading
from parsers.common.spacing_parser import parse_spacing
from parsers.common.width_parser import parse_width
from tests.unit.parsers.conftest import make_element

# =============================================================================
# Color Parser Tests (<w:color>)
# =============================================================================


class TestColorParser:
    """Tests for parse_color function.

    XML Element: <w:color>
    Attributes: val, themeColor, themeTint, themeShade
    """

    def test_parse_color_none(self):
        """None input returns None."""
        result = parse_color(None)
        assert result is None

    def test_parse_color_val_only(self):
        """Parse color with only val attribute (hex color)."""
        elem = make_element('<w:color w:val="FF0000"/>')
        result = parse_color(elem)
        assert result is not None
        assert result.val == "FF0000"
        assert result.theme_color is None

    def test_parse_color_auto(self):
        """Parse color with val='auto'."""
        elem = make_element('<w:color w:val="auto"/>')
        result = parse_color(elem)
        assert result is not None
        assert result.val == "auto"

    def test_parse_color_theme_color(self):
        """Parse color with theme color reference."""
        elem = make_element('<w:color w:themeColor="accent1"/>')
        result = parse_color(elem)
        assert result is not None
        assert result.theme_color == "accent1"

    def test_parse_color_theme_with_tint(self):
        """Parse color with theme color and tint."""
        elem = make_element('<w:color w:val="5B9BD5" w:themeColor="accent1" w:themeTint="80"/>')
        result = parse_color(elem)
        assert result is not None
        assert result.val == "5B9BD5"
        assert result.theme_color == "accent1"
        assert result.theme_tint == "80"
        assert result.theme_shade is None

    def test_parse_color_theme_with_shade(self):
        """Parse color with theme color and shade."""
        elem = make_element('<w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/>')
        result = parse_color(elem)
        assert result is not None
        assert result.val == "2F5496"
        assert result.theme_color == "accent1"
        assert result.theme_shade == "BF"

    def test_parse_color_all_theme_colors(self):
        """Test various theme color values."""
        theme_colors = [
            "dark1",
            "light1",
            "dark2",
            "light2",
            "accent1",
            "accent2",
            "accent3",
            "accent4",
            "accent5",
            "accent6",
            "hyperlink",
            "followedHyperlink",
        ]
        for tc in theme_colors:
            elem = make_element(f'<w:color w:themeColor="{tc}"/>')
            result = parse_color(elem)
            assert result is not None
            assert result.theme_color == tc


# =============================================================================
# Border Parser Tests (<w:top>, <w:left>, <w:bottom>, <w:right>, etc.)
# =============================================================================


class TestBorderParser:
    """Tests for parse_border function.

    XML Elements: <w:top>, <w:left>, <w:bottom>, <w:right>, <w:insideH>, <w:insideV>
    Attributes: val, sz, space, color, themeColor, themeTint, themeShade, frame, shadow
    """

    def test_parse_border_none(self):
        """None input returns None."""
        result = parse_border(None)
        assert result is None

    def test_parse_border_minimal(self):
        """Parse border with minimal attributes."""
        elem = make_element('<w:top w:val="single"/>')
        result = parse_border(elem)
        assert result is not None
        assert result.val == "single"

    def test_parse_border_all_attributes(self):
        """Parse border with all attributes."""
        elem = make_element(
            '<w:top w:val="single" w:sz="12" w:space="4" w:color="FF0000" '
            'w:themeColor="accent1" w:themeTint="80" w:themeShade="BF" '
            'w:frame="1" w:shadow="1"/>'
        )
        result = parse_border(elem)
        assert result is not None
        assert result.val == "single"
        assert result.sz == 12
        assert result.space == 4
        assert result.color == "FF0000"
        assert result.theme_color == "accent1"
        assert result.theme_tint == "80"
        assert result.theme_shade == "BF"
        assert result.frame is True
        assert result.shadow is True

    def test_parse_border_styles(self):
        """Test various border style values."""
        border_styles = [
            "nil",
            "none",
            "single",
            "thick",
            "double",
            "dotted",
            "dashed",
            "dotDash",
            "dotDotDash",
            "triple",
            "wave",
            "doubleWave",
        ]
        for style in border_styles:
            elem = make_element(f'<w:top w:val="{style}"/>')
            result = parse_border(elem)
            assert result is not None
            assert result.val == style

    def test_parse_border_frame_false(self):
        """Parse border with frame explicitly false."""
        elem = make_element('<w:top w:val="single" w:frame="0"/>')
        result = parse_border(elem)
        assert result is not None
        assert result.frame is False

    def test_parse_border_shadow_false(self):
        """Parse border with shadow explicitly false."""
        elem = make_element('<w:top w:val="single" w:shadow="false"/>')
        result = parse_border(elem)
        assert result is not None
        assert result.shadow is False


# =============================================================================
# Paragraph Borders Parser Tests (<w:pBdr>)
# =============================================================================


class TestParagraphBordersParser:
    """Tests for parse_paragraph_borders function.

    XML Element: <w:pBdr>
    Children: top, left, bottom, right, between, bar
    """

    def test_parse_paragraph_borders_none(self):
        """None input returns None."""
        result = parse_paragraph_borders(None)
        assert result is None

    def test_parse_paragraph_borders_empty(self):
        """Parse empty pBdr element."""
        elem = make_element("<w:pBdr/>")
        result = parse_paragraph_borders(elem)
        assert result is not None
        assert result.top is None
        assert result.left is None
        assert result.bottom is None
        assert result.right is None

    def test_parse_paragraph_borders_all_sides(self):
        """Parse pBdr with all four sides."""
        elem = make_element("""
            <w:pBdr>
                <w:top w:val="single" w:sz="4" w:space="1" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="4" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="4" w:color="000000"/>
            </w:pBdr>
        """)
        result = parse_paragraph_borders(elem)
        assert result is not None
        assert result.top is not None
        assert result.top.val == "single"
        assert result.left is not None
        assert result.bottom is not None
        assert result.right is not None

    def test_parse_paragraph_borders_between(self):
        """Parse pBdr with between border (between paragraphs)."""
        elem = make_element("""
            <w:pBdr>
                <w:between w:val="single" w:sz="4" w:space="1" w:color="000000"/>
            </w:pBdr>
        """)
        result = parse_paragraph_borders(elem)
        assert result is not None
        assert result.between is not None
        assert result.between.val == "single"

    def test_parse_paragraph_borders_bar(self):
        """Parse pBdr with bar border."""
        elem = make_element("""
            <w:pBdr>
                <w:bar w:val="single" w:sz="4" w:color="FF0000"/>
            </w:pBdr>
        """)
        result = parse_paragraph_borders(elem)
        assert result is not None
        assert result.bar is not None
        assert result.bar.val == "single"


# =============================================================================
# Table Borders Parser Tests (<w:tblBorders>, <w:tcBorders>)
# =============================================================================


class TestTableBordersParser:
    """Tests for parse_table_borders function.

    XML Elements: <w:tblBorders>, <w:tcBorders>
    Children: top, left, bottom, right, insideH, insideV, tl2br, tr2bl
    """

    def test_parse_table_borders_none(self):
        """None input returns None."""
        result = parse_table_borders(None)
        assert result is None

    def test_parse_table_borders_empty(self):
        """Parse empty tblBorders element."""
        elem = make_element("<w:tblBorders/>")
        result = parse_table_borders(elem)
        assert result is not None
        assert result.top is None
        assert result.inside_h is None

    def test_parse_table_borders_all_sides(self):
        """Parse tblBorders with all sides including inside borders."""
        elem = make_element("""
            <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tblBorders>
        """)
        result = parse_table_borders(elem)
        assert result is not None
        assert result.top is not None
        assert result.left is not None
        assert result.bottom is not None
        assert result.right is not None
        assert result.inside_h is not None
        assert result.inside_h.val == "single"
        assert result.inside_v is not None

    def test_parse_table_borders_diagonals(self):
        """Parse table borders with diagonal borders."""
        elem = make_element("""
            <w:tcBorders>
                <w:tl2br w:val="single" w:sz="4" w:color="FF0000"/>
                <w:tr2bl w:val="single" w:sz="4" w:color="0000FF"/>
            </w:tcBorders>
        """)
        result = parse_table_borders(elem)
        assert result is not None
        assert result.tl2br is not None
        assert result.tl2br.color == "FF0000"
        assert result.tr2bl is not None
        assert result.tr2bl.color == "0000FF"


# =============================================================================
# Shading Parser Tests (<w:shd>)
# =============================================================================


class TestShadingParser:
    """Tests for parse_shading function.

    XML Element: <w:shd>
    Attributes: val, color, fill, themeColor, themeFill, themeTint, themeShade,
                themeFillTint, themeFillShade
    """

    def test_parse_shading_none(self):
        """None input returns None."""
        result = parse_shading(None)
        assert result is None

    def test_parse_shading_clear_with_fill(self):
        """Parse shading with clear pattern and fill color."""
        elem = make_element('<w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>')
        result = parse_shading(elem)
        assert result is not None
        assert result.val == "clear"
        assert result.color == "auto"
        assert result.fill == "FFFF00"

    def test_parse_shading_solid(self):
        """Parse solid shading."""
        elem = make_element('<w:shd w:val="solid" w:color="FF0000"/>')
        result = parse_shading(elem)
        assert result is not None
        assert result.val == "solid"
        assert result.color == "FF0000"

    def test_parse_shading_patterns(self):
        """Test various shading pattern values."""
        patterns = [
            "clear",
            "solid",
            "horzStripe",
            "vertStripe",
            "reverseDiagStripe",
            "diagStripe",
            "horzCross",
            "diagCross",
            "pct10",
            "pct25",
            "pct50",
        ]
        for pattern in patterns:
            elem = make_element(f'<w:shd w:val="{pattern}" w:fill="FFFFFF"/>')
            result = parse_shading(elem)
            assert result is not None
            assert result.val == pattern

    def test_parse_shading_theme_fill(self):
        """Parse shading with theme fill."""
        elem = make_element(
            '<w:shd w:val="clear" w:color="auto" w:fill="5B9BD5" '
            'w:themeFill="accent1" w:themeFillTint="80"/>'
        )
        result = parse_shading(elem)
        assert result is not None
        assert result.theme_fill == "accent1"
        assert result.theme_fill_tint == "80"

    def test_parse_shading_all_attributes(self):
        """Parse shading with all possible attributes."""
        elem = make_element(
            '<w:shd w:val="pct25" w:color="FF0000" w:fill="0000FF" '
            'w:themeColor="accent1" w:themeFill="accent2" '
            'w:themeTint="80" w:themeShade="BF" '
            'w:themeFillTint="60" w:themeFillShade="A0"/>'
        )
        result = parse_shading(elem)
        assert result is not None
        assert result.val == "pct25"
        assert result.color == "FF0000"
        assert result.fill == "0000FF"
        assert result.theme_color == "accent1"
        assert result.theme_fill == "accent2"
        assert result.theme_tint == "80"
        assert result.theme_shade == "BF"
        assert result.theme_fill_tint == "60"
        assert result.theme_fill_shade == "A0"


# =============================================================================
# Width Parser Tests (<w:tcW>, <w:tblW>, <w:tblInd>)
# =============================================================================


class TestWidthParser:
    """Tests for parse_width function.

    XML Elements: <w:tcW>, <w:tblW>, <w:tblInd>, <w:tblCellSpacing>
    Attributes: w, type
    """

    def test_parse_width_none(self):
        """None input returns None."""
        result = parse_width(None)
        assert result is None

    def test_parse_width_dxa(self):
        """Parse width in twips (dxa)."""
        elem = make_element('<w:tcW w:w="2880" w:type="dxa"/>')
        result = parse_width(elem)
        assert result is not None
        assert result.w == 2880
        assert result.type == "dxa"

    def test_parse_width_pct(self):
        """Parse width as percentage."""
        elem = make_element('<w:tblW w:w="5000" w:type="pct"/>')
        result = parse_width(elem)
        assert result is not None
        assert result.w == 5000
        assert result.type == "pct"

    def test_parse_width_auto(self):
        """Parse auto width."""
        elem = make_element('<w:tcW w:w="0" w:type="auto"/>')
        result = parse_width(elem)
        assert result is not None
        assert result.w == 0
        assert result.type == "auto"

    def test_parse_width_nil(self):
        """Parse nil width (no width)."""
        elem = make_element('<w:tcW w:w="0" w:type="nil"/>')
        result = parse_width(elem)
        assert result is not None
        assert result.type == "nil"

    def test_parse_width_types(self):
        """Test all width type values."""
        width_types = ["dxa", "pct", "auto", "nil"]
        for wtype in width_types:
            elem = make_element(f'<w:tcW w:w="100" w:type="{wtype}"/>')
            result = parse_width(elem)
            assert result is not None
            assert result.type == wtype


# =============================================================================
# Spacing Parser Tests (<w:spacing>)
# =============================================================================


class TestSpacingParser:
    """Tests for parse_spacing function.

    XML Element: <w:spacing>
    Attributes: before, after, line, lineRule, beforeLines, afterLines,
                beforeAutospacing, afterAutospacing
    """

    def test_parse_spacing_none(self):
        """None input returns None."""
        result = parse_spacing(None)
        assert result is None

    def test_parse_spacing_before_after(self):
        """Parse spacing with before and after values."""
        elem = make_element('<w:spacing w:before="240" w:after="120"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.before == 240
        assert result.after == 120

    def test_parse_spacing_line_auto(self):
        """Parse spacing with auto line spacing."""
        elem = make_element('<w:spacing w:line="276" w:lineRule="auto"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.line == 276
        assert result.line_rule == "auto"

    def test_parse_spacing_line_exact(self):
        """Parse spacing with exact line spacing."""
        elem = make_element('<w:spacing w:line="240" w:lineRule="exact"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.line == 240
        assert result.line_rule == "exact"

    def test_parse_spacing_line_at_least(self):
        """Parse spacing with atLeast line spacing."""
        elem = make_element('<w:spacing w:line="360" w:lineRule="atLeast"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.line_rule == "atLeast"

    def test_parse_spacing_lines(self):
        """Parse spacing with beforeLines and afterLines."""
        elem = make_element('<w:spacing w:beforeLines="100" w:afterLines="100"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.before_lines == 100
        assert result.after_lines == 100

    def test_parse_spacing_autospacing(self):
        """Parse spacing with autospacing enabled."""
        elem = make_element('<w:spacing w:beforeAutospacing="1" w:afterAutospacing="1"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.before_autospacing is True
        assert result.after_autospacing is True

    def test_parse_spacing_autospacing_false(self):
        """Parse spacing with autospacing disabled."""
        elem = make_element('<w:spacing w:beforeAutospacing="0" w:afterAutospacing="0"/>')
        result = parse_spacing(elem)
        assert result is not None
        assert result.before_autospacing is False
        assert result.after_autospacing is False

    def test_parse_spacing_all_attributes(self):
        """Parse spacing with all attributes."""
        elem = make_element(
            '<w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto" '
            'w:beforeLines="100" w:afterLines="50" '
            'w:beforeAutospacing="0" w:afterAutospacing="0"/>'
        )
        result = parse_spacing(elem)
        assert result is not None
        assert result.before == 240
        assert result.after == 120
        assert result.line == 276
        assert result.line_rule == "auto"
        assert result.before_lines == 100
        assert result.after_lines == 50
        assert result.before_autospacing is False
        assert result.after_autospacing is False


# =============================================================================
# Indentation Parser Tests (<w:ind>)
# =============================================================================


class TestIndentationParser:
    """Tests for parse_indentation function.

    XML Element: <w:ind>
    Attributes: left, right, start, end, firstLine, hanging,
                startChars, endChars, firstLineChars, hangingChars
    """

    def test_parse_indentation_none(self):
        """None input returns None."""
        result = parse_indentation(None)
        assert result is None

    def test_parse_indentation_left_right(self):
        """Parse indentation with left and right values."""
        elem = make_element('<w:ind w:left="720" w:right="360"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == 720
        assert result.right == 360

    def test_parse_indentation_first_line(self):
        """Parse indentation with first line indent."""
        elem = make_element('<w:ind w:left="720" w:firstLine="360"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == 720
        assert result.first_line == 360
        assert result.hanging is None

    def test_parse_indentation_hanging(self):
        """Parse indentation with hanging indent."""
        elem = make_element('<w:ind w:left="720" w:hanging="360"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == 720
        assert result.hanging == 360
        assert result.first_line is None

    def test_parse_indentation_start_end(self):
        """Parse indentation with start and end (bidi support)."""
        elem = make_element('<w:ind w:start="720" w:end="360"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.start == 720
        assert result.end == 360

    def test_parse_indentation_chars(self):
        """Parse indentation with character-based values."""
        elem = make_element(
            '<w:ind w:startChars="100" w:endChars="50" '
            'w:firstLineChars="200" w:hangingChars="150"/>'
        )
        result = parse_indentation(elem)
        assert result is not None
        assert result.start_chars == 100
        assert result.end_chars == 50
        assert result.first_line_chars == 200
        assert result.hanging_chars == 150

    def test_parse_indentation_all_attributes(self):
        """Parse indentation with all attributes."""
        elem = make_element(
            '<w:ind w:left="720" w:right="360" w:start="720" w:end="360" '
            'w:firstLine="360" w:hanging="180" '
            'w:startChars="100" w:endChars="50" '
            'w:firstLineChars="50" w:hangingChars="25"/>'
        )
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == 720
        assert result.right == 360
        assert result.start == 720
        assert result.end == 360
        assert result.first_line == 360
        assert result.hanging == 180
        assert result.start_chars == 100
        assert result.end_chars == 50
        assert result.first_line_chars == 50
        assert result.hanging_chars == 25

    def test_parse_indentation_zero_values(self):
        """Parse indentation with zero values."""
        elem = make_element('<w:ind w:left="0" w:right="0" w:firstLine="0"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == 0
        assert result.right == 0
        assert result.first_line == 0

    def test_parse_indentation_negative_values(self):
        """Parse indentation with negative left indent (outdent)."""
        elem = make_element('<w:ind w:left="-720"/>')
        result = parse_indentation(elem)
        assert result is not None
        assert result.left == -720
