"""Unit tests for CSS generator.

Tests conversion of DOCX properties to CSS styles.
"""

from converters.html.css_generator import (
    CSSGenerator,
    border_to_css,
    cell_margins_to_css,
    cell_vertical_align_to_css,
    color_to_css,
    eighths_to_pt,
    emu_to_px,
    font_family_to_css,
    font_size_to_css,
    half_points_to_pt,
    highlight_to_css,
    paragraph_borders_to_css,
    paragraph_properties_to_css,
    run_properties_to_css,
    shading_to_css,
    twips_to_pt,
    twips_to_px,
    width_to_css,
)
from models.common.border import Border, ParagraphBorders
from models.common.color import Color
from models.common.indentation import Indentation
from models.common.shading import Shading
from models.common.spacing import Spacing
from models.common.width import Width
from models.document.paragraph import ParagraphProperties
from models.document.run import RunFonts, RunProperties, Underline
from models.document.table_cell import TableCellMargins

# =============================================================================
# Color to CSS Tests
# =============================================================================


class TestColorToCSS:
    """Tests for color to CSS conversion."""

    def test_hex_color(self) -> None:
        """Convert hex color to CSS."""
        color = Color(val="FF0000")
        result = color_to_css(color)
        assert result == "#FF0000"

    def test_hex_color_lowercase(self) -> None:
        """Convert lowercase hex color to CSS."""
        color = Color(val="ff0000")
        result = color_to_css(color)
        assert result == "#FF0000"

    def test_auto_color(self) -> None:
        """Auto color returns None or inherit."""
        color = Color(val="auto")
        result = color_to_css(color)
        assert result is None

    def test_none_color(self) -> None:
        """None color returns None."""
        result = color_to_css(None)
        assert result is None

    def test_theme_color_basic(self) -> None:
        """Theme color without tint/shade."""
        color = Color(theme_color="accent1")
        result = color_to_css(color)
        # Theme colors need theme resolution - returns None for now
        assert result is None


# =============================================================================
# Font Properties to CSS Tests
# =============================================================================


class TestFontToCSS:
    """Tests for font properties to CSS conversion."""

    def test_font_family_ascii(self) -> None:
        """Convert ASCII font to CSS font-family."""
        r_fonts = RunFonts(ascii="Arial")
        result = font_family_to_css(r_fonts)
        assert result == "Arial"

    def test_font_family_with_spaces(self) -> None:
        """Font names with spaces are quoted with single quotes for HTML compatibility."""
        r_fonts = RunFonts(ascii="Times New Roman")
        result = font_family_to_css(r_fonts)
        assert result == "'Times New Roman'"

    def test_font_size_half_points(self) -> None:
        """Font size in half-points converts to pt."""
        # Half-points: 24 = 12pt, 32 = 16pt
        result = font_size_to_css(24)
        assert result == "12pt"

    def test_font_size_odd_half_points(self) -> None:
        """Odd half-point sizes."""
        result = font_size_to_css(25)
        assert result == "12.5pt"

    def test_font_size_none(self) -> None:
        """None font size returns None."""
        result = font_size_to_css(None)
        assert result is None


# =============================================================================
# Run Properties to CSS Tests
# =============================================================================


class TestRunPropertiesToCSS:
    """Tests for run properties to CSS conversion."""

    def test_bold(self) -> None:
        """Bold property converts to font-weight."""
        r_pr = RunProperties(b=True)
        result = run_properties_to_css(r_pr)
        assert result["font-weight"] == "bold"

    def test_bold_false(self) -> None:
        """Explicit bold=False converts to normal."""
        r_pr = RunProperties(b=False)
        result = run_properties_to_css(r_pr)
        assert result.get("font-weight") == "normal"

    def test_italic(self) -> None:
        """Italic property converts to font-style."""
        r_pr = RunProperties(i=True)
        result = run_properties_to_css(r_pr)
        assert result["font-style"] == "italic"

    def test_underline_single(self) -> None:
        """Single underline converts to text-decoration."""
        r_pr = RunProperties(u=Underline(val="single"))
        result = run_properties_to_css(r_pr)
        assert "underline" in result["text-decoration"]

    def test_underline_double(self) -> None:
        """Double underline converts to text-decoration with style."""
        r_pr = RunProperties(u=Underline(val="double"))
        result = run_properties_to_css(r_pr)
        assert "underline" in result["text-decoration"]

    def test_underline_none(self) -> None:
        """No underline (val='none') means no text-decoration underline."""
        r_pr = RunProperties(u=Underline(val="none"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" not in result

    def test_strikethrough(self) -> None:
        """Strikethrough converts to text-decoration."""
        r_pr = RunProperties(strike=True)
        result = run_properties_to_css(r_pr)
        assert "line-through" in result["text-decoration"]

    def test_double_strikethrough(self) -> None:
        """Double strikethrough."""
        r_pr = RunProperties(dstrike=True)
        result = run_properties_to_css(r_pr)
        assert "line-through" in result["text-decoration"]

    def test_combined_decorations(self) -> None:
        """Combined underline and strikethrough."""
        r_pr = RunProperties(u=Underline(val="single"), strike=True)
        result = run_properties_to_css(r_pr)
        assert "underline" in result["text-decoration"]
        assert "line-through" in result["text-decoration"]

    def test_all_caps(self) -> None:
        """All caps converts to text-transform."""
        r_pr = RunProperties(caps=True)
        result = run_properties_to_css(r_pr)
        assert result["text-transform"] == "uppercase"

    def test_small_caps(self) -> None:
        """Small caps converts to font-variant."""
        r_pr = RunProperties(small_caps=True)
        result = run_properties_to_css(r_pr)
        assert result["font-variant"] == "small-caps"

    def test_superscript(self) -> None:
        """Superscript vertical alignment."""
        r_pr = RunProperties(vert_align="superscript")
        result = run_properties_to_css(r_pr)
        assert result["vertical-align"] == "super"

    def test_subscript(self) -> None:
        """Subscript vertical alignment."""
        r_pr = RunProperties(vert_align="subscript")
        result = run_properties_to_css(r_pr)
        assert result["vertical-align"] == "sub"

    def test_text_color(self) -> None:
        """Text color."""
        r_pr = RunProperties(color=Color(val="0000FF"))
        result = run_properties_to_css(r_pr)
        assert result["color"] == "#0000FF"

    def test_highlight_color(self) -> None:
        """Highlight color converts to background-color."""
        r_pr = RunProperties(highlight="yellow")
        result = run_properties_to_css(r_pr)
        assert "background-color" in result

    def test_character_spacing(self) -> None:
        """Character spacing (tracking)."""
        r_pr = RunProperties(spacing=20)  # 20 twips = 1pt
        result = run_properties_to_css(r_pr)
        assert "letter-spacing" in result
        assert "1" in result["letter-spacing"] and "pt" in result["letter-spacing"]

    def test_hidden_text(self) -> None:
        """Hidden text (vanish)."""
        r_pr = RunProperties(vanish=True)
        result = run_properties_to_css(r_pr)
        assert result["display"] == "none"

    def test_empty_properties(self) -> None:
        """Empty run properties returns empty dict."""
        r_pr = RunProperties()
        result = run_properties_to_css(r_pr)
        assert result == {}

    def test_none_properties(self) -> None:
        """None run properties returns empty dict."""
        result = run_properties_to_css(None)
        assert result == {}


# =============================================================================
# Paragraph Properties to CSS Tests
# =============================================================================


class TestParagraphPropertiesToCSS:
    """Tests for paragraph properties to CSS conversion."""

    def test_text_align_left(self) -> None:
        """Left justification."""
        p_pr = ParagraphProperties(jc="left")
        result = paragraph_properties_to_css(p_pr)
        assert result["text-align"] == "left"

    def test_text_align_center(self) -> None:
        """Center justification."""
        p_pr = ParagraphProperties(jc="center")
        result = paragraph_properties_to_css(p_pr)
        assert result["text-align"] == "center"

    def test_text_align_right(self) -> None:
        """Right justification."""
        p_pr = ParagraphProperties(jc="right")
        result = paragraph_properties_to_css(p_pr)
        assert result["text-align"] == "right"

    def test_text_align_both(self) -> None:
        """Justified (both)."""
        p_pr = ParagraphProperties(jc="both")
        result = paragraph_properties_to_css(p_pr)
        assert result["text-align"] == "justify"

    def test_margin_before(self) -> None:
        """Space before converts to margin-top."""
        spacing = Spacing(before=240)  # 240 twips = 12pt
        p_pr = ParagraphProperties(spacing=spacing)
        result = paragraph_properties_to_css(p_pr)
        assert "margin-top" in result
        assert "12pt" in result["margin-top"]

    def test_margin_after(self) -> None:
        """Space after converts to margin-bottom."""
        spacing = Spacing(after=240)
        p_pr = ParagraphProperties(spacing=spacing)
        result = paragraph_properties_to_css(p_pr)
        assert "margin-bottom" in result

    def test_line_height_auto(self) -> None:
        """Auto line spacing."""
        spacing = Spacing(line=276, line_rule="auto")  # 276/240 = 1.15
        p_pr = ParagraphProperties(spacing=spacing)
        result = paragraph_properties_to_css(p_pr)
        assert "line-height" in result

    def test_line_height_exact(self) -> None:
        """Exact line height."""
        spacing = Spacing(line=360, line_rule="exact")  # 18pt
        p_pr = ParagraphProperties(spacing=spacing)
        result = paragraph_properties_to_css(p_pr)
        assert "line-height" in result

    def test_indent_left(self) -> None:
        """Left indentation."""
        ind = Indentation(left=720)  # 720 twips = 36pt
        p_pr = ParagraphProperties(ind=ind)
        result = paragraph_properties_to_css(p_pr)
        assert "margin-left" in result

    def test_indent_right(self) -> None:
        """Right indentation."""
        ind = Indentation(right=720)
        p_pr = ParagraphProperties(ind=ind)
        result = paragraph_properties_to_css(p_pr)
        assert "margin-right" in result

    def test_indent_first_line(self) -> None:
        """First line indentation."""
        ind = Indentation(first_line=720)
        p_pr = ParagraphProperties(ind=ind)
        result = paragraph_properties_to_css(p_pr)
        assert "text-indent" in result

    def test_indent_hanging(self) -> None:
        """Hanging indentation (negative first-line)."""
        ind = Indentation(hanging=720)
        p_pr = ParagraphProperties(ind=ind)
        result = paragraph_properties_to_css(p_pr)
        text_indent = result.get("text-indent")
        assert text_indent is not None and text_indent.startswith("-")

    def test_page_break_before(self) -> None:
        """Page break before."""
        p_pr = ParagraphProperties(page_break_before=True)
        result = paragraph_properties_to_css(p_pr)
        assert result.get("page-break-before") == "always"

    def test_keep_with_next(self) -> None:
        """Keep with next paragraph."""
        p_pr = ParagraphProperties(keep_next=True)
        result = paragraph_properties_to_css(p_pr)
        assert result.get("page-break-after") == "avoid"

    def test_keep_lines_together(self) -> None:
        """Keep lines together."""
        p_pr = ParagraphProperties(keep_lines=True)
        result = paragraph_properties_to_css(p_pr)
        assert result.get("page-break-inside") == "avoid"

    def test_rtl_direction(self) -> None:
        """Right-to-left direction."""
        p_pr = ParagraphProperties(bidi=True)
        result = paragraph_properties_to_css(p_pr)
        assert result["direction"] == "rtl"


# =============================================================================
# Border to CSS Tests
# =============================================================================


class TestBorderToCSS:
    """Tests for border to CSS conversion."""

    def test_single_border(self) -> None:
        """Single line border."""
        border = Border(val="single", sz=8, color="000000")
        result = border_to_css(border)
        assert result is not None
        assert "solid" in result
        assert "#000000" in result

    def test_double_border(self) -> None:
        """Double line border."""
        border = Border(val="double", sz=8, color="000000")
        result = border_to_css(border)
        assert result is not None
        assert "double" in result

    def test_dashed_border(self) -> None:
        """Dashed border."""
        border = Border(val="dashed", sz=8, color="000000")
        result = border_to_css(border)
        assert result is not None
        assert "dashed" in result

    def test_dotted_border(self) -> None:
        """Dotted border."""
        border = Border(val="dotted", sz=8, color="000000")
        result = border_to_css(border)
        assert result is not None
        assert "dotted" in result

    def test_none_border(self) -> None:
        """None/nil border."""
        border = Border(val="nil")
        result = border_to_css(border)
        assert result == "none"

    def test_border_size_eighths(self) -> None:
        """Border size in eighths of a point."""
        border = Border(val="single", sz=16, color="000000")  # 2pt
        result = border_to_css(border)
        assert result is not None
        assert "2" in result and "pt" in result  # 2pt or 2.0pt

    def test_auto_color_border(self) -> None:
        """Border with auto color."""
        border = Border(val="single", sz=8, color="auto")
        result = border_to_css(border)
        assert result is not None
        # Should use default color (black)
        assert "#000000" in result

    def test_paragraph_borders_all(self) -> None:
        """All paragraph borders."""
        p_bdr = ParagraphBorders(
            top=Border(val="single", sz=8, color="000000"),
            bottom=Border(val="single", sz=8, color="000000"),
            left=Border(val="single", sz=8, color="000000"),
            right=Border(val="single", sz=8, color="000000"),
        )
        result = paragraph_borders_to_css(p_bdr)
        assert "border-top" in result
        assert "border-bottom" in result
        assert "border-left" in result
        assert "border-right" in result

    def test_paragraph_borders_partial(self) -> None:
        """Only some paragraph borders."""
        p_bdr = ParagraphBorders(
            top=Border(val="single", sz=8, color="000000"),
            bottom=Border(val="single", sz=8, color="000000"),
        )
        result = paragraph_borders_to_css(p_bdr)
        assert "border-top" in result
        assert "border-bottom" in result
        assert "border-left" not in result
        assert "border-right" not in result


# =============================================================================
# Shading to CSS Tests
# =============================================================================


class TestShadingToCSS:
    """Tests for shading to CSS conversion."""

    def test_solid_fill(self) -> None:
        """Solid fill shading."""
        shd = Shading(val="clear", fill="FFFF00")
        result = shading_to_css(shd)
        assert result == "#FFFF00"

    def test_pattern_shading(self) -> None:
        """Pattern shading (approximated)."""
        shd = Shading(val="pct25", fill="FFFFFF", color="000000")
        result = shading_to_css(shd)
        # Should produce some background color based on fill
        assert result is not None

    def test_no_fill(self) -> None:
        """No fill returns None or empty."""
        shd = Shading(val="clear")
        result = shading_to_css(shd)
        # Either no background-color or None
        assert result is None

    def test_none_shading(self) -> None:
        """None shading returns None."""
        result = shading_to_css(None)
        assert result is None


# =============================================================================
# Unit Conversion Tests
# =============================================================================


class TestUnitConversion:
    """Tests for unit conversions in CSS generation."""

    def test_twips_to_pt(self) -> None:
        """Convert twips to points."""
        assert twips_to_pt(20) == 1.0
        assert twips_to_pt(240) == 12.0

    def test_twips_to_px(self) -> None:
        """Convert twips to pixels (approximate)."""
        result = twips_to_px(1440)  # 1 inch at 96 dpi = 96 px
        assert result == 96.0

    def test_half_points_to_pt(self) -> None:
        """Convert half-points to points."""
        assert half_points_to_pt(24) == 12.0
        assert half_points_to_pt(25) == 12.5

    def test_eighths_to_pt(self) -> None:
        """Convert eighths of a point to points."""
        assert eighths_to_pt(8) == 1.0
        assert eighths_to_pt(16) == 2.0

    def test_emu_to_px(self) -> None:
        """Convert EMUs to pixels."""
        # 9525 EMUs = 1 pixel at 96 DPI
        result = emu_to_px(9525)
        assert result == 1.0


# =============================================================================
# CSS Generator Class Tests
# =============================================================================


class TestCSSGeneratorClass:
    """Tests for CSSGenerator class functionality."""

    def test_init_default(self) -> None:
        """Initialize with default settings."""
        css = CSSGenerator()
        assert css is not None

    def test_init_with_options(self) -> None:
        """Initialize with custom options."""
        css = CSSGenerator(use_px=True, dpi=72)
        assert css.use_px is True
        assert css.dpi == 72

    def test_generate_inline_style(self) -> None:
        """Generate inline style string."""
        css = CSSGenerator()
        props = {"font-weight": "bold", "color": "#FF0000"}
        result = css.generate_inline_style(props)
        assert "font-weight: bold" in result
        assert "color: #FF0000" in result

    def test_generate_style_attribute(self) -> None:
        """Generate style attribute for HTML element."""
        css = CSSGenerator()
        props = {"font-weight": "bold"}
        result = css.generate_style_attribute(props)
        assert 'style="font-weight: bold"' == result

    def test_empty_props_returns_empty_style(self) -> None:
        """Empty properties returns empty string."""
        css = CSSGenerator()
        result = css.generate_inline_style({})
        assert result == ""

    def test_merge_css_properties(self) -> None:
        """Merge multiple CSS property dicts."""
        props1 = {"font-weight": "bold"}
        props2 = {"color": "#FF0000"}
        result = CSSGenerator.merge_css(props1, props2)
        assert result["font-weight"] == "bold"
        assert result["color"] == "#FF0000"

    def test_merge_override(self) -> None:
        """Later properties override earlier ones."""
        props1 = {"font-weight": "normal"}
        props2 = {"font-weight": "bold"}
        result = CSSGenerator.merge_css(props1, props2)
        assert result["font-weight"] == "bold"


# =============================================================================
# Highlight Color Mapping Tests
# =============================================================================


class TestHighlightColorMapping:
    """Tests for DOCX highlight colors to CSS."""

    def test_yellow_highlight(self) -> None:
        """Yellow highlight."""
        result = highlight_to_css("yellow")
        assert result == "#FFFF00"

    def test_green_highlight(self) -> None:
        """Green highlight."""
        result = highlight_to_css("green")
        assert result == "#00FF00"

    def test_cyan_highlight(self) -> None:
        """Cyan highlight."""
        result = highlight_to_css("cyan")
        assert result == "#00FFFF"

    def test_magenta_highlight(self) -> None:
        """Magenta highlight."""
        result = highlight_to_css("magenta")
        assert result == "#FF00FF"

    def test_blue_highlight(self) -> None:
        """Blue highlight."""
        result = highlight_to_css("blue")
        assert result == "#0000FF"

    def test_red_highlight(self) -> None:
        """Red highlight."""
        result = highlight_to_css("red")
        assert result == "#FF0000"

    def test_dark_highlight_colors(self) -> None:
        """Dark highlight colors."""
        for color in ["darkBlue", "darkCyan", "darkGreen", "darkMagenta", "darkRed", "darkYellow"]:
            result = highlight_to_css(color)
            assert result is not None

    def test_light_gray_highlight(self) -> None:
        """Light gray highlight."""
        result = highlight_to_css("lightGray")
        assert result == "#D3D3D3"

    def test_dark_gray_highlight(self) -> None:
        """Dark gray highlight."""
        result = highlight_to_css("darkGray")
        assert result == "#A9A9A9"

    def test_black_highlight(self) -> None:
        """Black highlight."""
        result = highlight_to_css("black")
        assert result == "#000000"

    def test_white_highlight(self) -> None:
        """White highlight."""
        result = highlight_to_css("white")
        assert result == "#FFFFFF"

    def test_none_highlight(self) -> None:
        """None highlight."""
        result = highlight_to_css("none")
        assert result is None

    def test_unknown_highlight(self) -> None:
        """Unknown highlight color."""
        result = highlight_to_css("unknown")
        assert result is None


# =============================================================================
# Table CSS Tests
# =============================================================================


class TestTableCSS:
    """Tests for table-related CSS generation."""

    def test_table_width_auto(self) -> None:
        """Auto table width."""
        width = Width(w=0, type="auto")
        result = width_to_css(width)
        assert result == "auto"

    def test_table_width_pct(self) -> None:
        """Percentage table width."""
        width = Width(w=5000, type="pct")  # 100%
        result = width_to_css(width)
        assert result == "100.0%"

    def test_table_width_dxa(self) -> None:
        """DXA (twips) table width."""
        width = Width(w=2880, type="dxa")  # 144pt
        result = width_to_css(width)
        assert result == "144pt"

    def test_cell_vertical_align_top(self) -> None:
        """Cell vertical alignment top."""
        result = cell_vertical_align_to_css("top")
        assert result == "top"

    def test_cell_vertical_align_center(self) -> None:
        """Cell vertical alignment center."""
        result = cell_vertical_align_to_css("center")
        assert result == "middle"

    def test_cell_vertical_align_bottom(self) -> None:
        """Cell vertical alignment bottom."""
        result = cell_vertical_align_to_css("bottom")
        assert result == "bottom"

    def test_table_cell_margins(self) -> None:
        """Table cell margins/padding."""
        margins = TableCellMargins(
            top=Width(w=72, type="dxa"),
            left=Width(w=115, type="dxa"),
            bottom=Width(w=72, type="dxa"),
            right=Width(w=115, type="dxa"),
        )
        result = cell_margins_to_css(margins)
        assert "padding-top" in result
        assert "padding-left" in result
        assert "padding-bottom" in result
        assert "padding-right" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestCSSEdgeCases:
    """Tests for edge cases in CSS generation."""

    def test_empty_string_values_ignored(self) -> None:
        """Empty string values are included but empty."""
        css = CSSGenerator()
        props = {"font-weight": "", "color": "#FF0000"}
        result = css.generate_inline_style(props)
        # Empty values are still included in the output
        assert "color: #FF0000" in result

    def test_none_values_ignored(self) -> None:
        """None values are handled."""
        result = run_properties_to_css(None)
        assert result == {}

    def test_special_characters_escaped(self) -> None:
        """Special characters in font names are handled."""
        # Font names with spaces are quoted with single quotes
        r_fonts = RunFonts(ascii="Font Name")
        result = font_family_to_css(r_fonts)
        assert result == "'Font Name'"

    def test_very_large_size(self) -> None:
        """Very large font sizes."""
        result = half_points_to_pt(1000)  # 500pt
        assert result == 500.0

    def test_zero_values(self) -> None:
        """Zero values are handled."""
        spacing = Spacing(before=0, after=0)
        p_pr = ParagraphProperties(spacing=spacing)
        result = paragraph_properties_to_css(p_pr)
        # Zero values produce 0pt
        assert "margin-top" in result
        assert "0pt" in result["margin-top"]

    def test_negative_indent(self) -> None:
        """Negative indentation values."""
        ind = Indentation(left=-720)  # Negative left indent
        p_pr = ParagraphProperties(ind=ind)
        result = paragraph_properties_to_css(p_pr)
        # Should handle gracefully with negative value
        assert "margin-left" in result
        assert "-36pt" in result["margin-left"]


# =============================================================================
# Underline Style Variants Tests (Regression Tests)
# =============================================================================


# =============================================================================
# Font Quoting Tests (Regression Tests)
# =============================================================================


class TestFontQuotingForHTML:
    """Tests for font quoting that ensures HTML attribute compatibility.

    Font names with spaces must use single quotes so they work correctly
    inside double-quoted HTML style attributes.
    """

    def test_single_word_font_not_quoted(self) -> None:
        """Single-word font names are not quoted."""
        r_fonts = RunFonts(ascii="Arial")
        result = font_family_to_css(r_fonts)
        assert result == "Arial"
        assert "'" not in result
        assert '"' not in result

    def test_multi_word_font_uses_single_quotes(self) -> None:
        """Multi-word font names use single quotes for HTML compatibility."""
        r_fonts = RunFonts(ascii="Times New Roman")
        result = font_family_to_css(r_fonts)
        assert result == "'Times New Roman'"
        # Must use single quotes, not double quotes
        assert result.startswith("'")
        assert result.endswith("'")
        assert '"' not in result

    def test_courier_new_quoted_correctly(self) -> None:
        """Courier New font is quoted with single quotes."""
        r_fonts = RunFonts(ascii="Courier New")
        result = font_family_to_css(r_fonts)
        assert result == "'Courier New'"

    def test_comic_sans_ms_quoted_correctly(self) -> None:
        """Comic Sans MS font is quoted with single quotes."""
        r_fonts = RunFonts(ascii="Comic Sans MS")
        result = font_family_to_css(r_fonts)
        assert result == "'Comic Sans MS'"

    def test_font_in_html_style_attribute(self) -> None:
        """Font family can be used inside HTML style attribute."""
        r_fonts = RunFonts(ascii="Times New Roman")
        font_css = font_family_to_css(r_fonts)

        # Simulate building an HTML style attribute
        style_attr = f'style="font-family: {font_css}; font-size: 12pt"'

        # The attribute should be valid (no broken quotes)
        assert style_attr.count('"') == 2  # Only opening and closing quotes
        assert "'Times New Roman'" in style_attr

    def test_run_properties_with_spaced_font(self) -> None:
        """RunProperties with spaced font generates valid CSS."""
        r_pr = RunProperties(r_fonts=RunFonts(ascii="Times New Roman"))
        result = run_properties_to_css(r_pr)

        assert "font-family" in result
        assert result["font-family"] == "'Times New Roman'"


class TestUnderlineStyleVariants:
    """Tests for underline style variants generating correct CSS text-decoration-style.

    These tests ensure that different DOCX underline styles (double, wave, dotted, etc.)
    are properly converted to CSS text-decoration-style values.
    """

    def test_single_underline_no_style(self) -> None:
        """Single underline uses solid style (default, no explicit style needed)."""
        r_pr = RunProperties(u=Underline(val="single"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        # Single underline should not have extra style (uses default solid)
        assert "double" not in result["text-decoration"]
        assert "wavy" not in result["text-decoration"]

    def test_double_underline_generates_double_style(self) -> None:
        """Double underline generates 'underline double' CSS."""
        r_pr = RunProperties(u=Underline(val="double"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        assert "double" in result["text-decoration"]

    def test_wave_underline_generates_wavy_style(self) -> None:
        """Wave underline generates 'underline wavy' CSS."""
        r_pr = RunProperties(u=Underline(val="wave"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        assert "wavy" in result["text-decoration"]

    def test_dotted_underline_generates_dotted_style(self) -> None:
        """Dotted underline generates 'underline dotted' CSS."""
        r_pr = RunProperties(u=Underline(val="dotted"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        assert "dotted" in result["text-decoration"]

    def test_dash_underline_generates_dashed_style(self) -> None:
        """Dash underline generates 'underline dashed' CSS."""
        r_pr = RunProperties(u=Underline(val="dash"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        assert "dashed" in result["text-decoration"]

    def test_wavy_heavy_underline(self) -> None:
        """Wavy heavy underline also uses wavy style."""
        r_pr = RunProperties(u=Underline(val="wavyHeavy"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "wavy" in result["text-decoration"]

    def test_dotted_heavy_underline(self) -> None:
        """Dotted heavy underline uses dotted style."""
        r_pr = RunProperties(u=Underline(val="dottedHeavy"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "dotted" in result["text-decoration"]

    def test_dash_long_underline(self) -> None:
        """Dash long underline uses dashed style."""
        r_pr = RunProperties(u=Underline(val="dashLong"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "dashed" in result["text-decoration"]

    def test_thick_underline_uses_solid(self) -> None:
        """Thick underline uses solid style (no direct CSS equivalent for thickness)."""
        r_pr = RunProperties(u=Underline(val="thick"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]
        # Thick uses solid (default), no special style
        # It shouldn't have wavy/double/dotted/dashed
        text_dec = result["text-decoration"]
        assert "double" not in text_dec
        assert "wavy" not in text_dec
        assert "dotted" not in text_dec
        assert "dashed" not in text_dec

    def test_words_underline_uses_solid(self) -> None:
        """Words underline (underline words only) uses solid style."""
        r_pr = RunProperties(u=Underline(val="words"))
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        assert "underline" in result["text-decoration"]

    def test_underline_with_strikethrough_and_style(self) -> None:
        """Combined underline with style and strikethrough."""
        r_pr = RunProperties(u=Underline(val="double"), strike=True)
        result = run_properties_to_css(r_pr)
        assert "text-decoration" in result
        # Both underline and line-through should be present
        text_dec = result["text-decoration"]
        assert "underline" in text_dec
        assert "line-through" in text_dec
        assert "double" in text_dec
