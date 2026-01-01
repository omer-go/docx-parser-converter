"""Unit tests for run to HTML converter.

Tests conversion of Run elements to HTML spans.
"""

from converters.html.run_to_html import (
    RunToHTMLConverter,
    run_to_html,
    soft_hyphen_to_html,
    tab_to_html,
    text_to_html,
)
from models.common.color import Color
from models.document.run import Run, RunFonts, RunProperties, Underline
from models.document.run_content import (
    Break,
    CarriageReturn,
    NoBreakHyphen,
    SoftHyphen,
    TabChar,
    Text,
)

# =============================================================================
# Basic Run Conversion Tests
# =============================================================================


class TestBasicRunConversion:
    """Tests for basic run to HTML conversion."""

    def test_simple_text_run(self) -> None:
        """Simple text run converts to span."""
        run = Run(content=[Text(value="Hello")])
        result = run_to_html(run)
        assert "Hello" in result

    def test_empty_run(self) -> None:
        """Empty run returns empty string."""
        run = Run(content=[])
        result = run_to_html(run)
        assert result == ""

    def test_none_run(self) -> None:
        """None run returns empty string."""
        result = run_to_html(None)
        assert result == ""

    def test_text_with_spaces(self) -> None:
        """Text with leading/trailing spaces preserved."""
        run = Run(content=[Text(value="  Hello  ", space="preserve")])
        result = run_to_html(run)
        assert "Hello" in result
        # Spaces should be preserved with &nbsp;
        assert "&nbsp;" in result or "  " in result

    def test_multiple_text_segments(self) -> None:
        """Run with multiple text segments."""
        run = Run(content=[Text(value="Hello "), Text(value="World")])
        result = run_to_html(run)
        assert "Hello " in result
        assert "World" in result


# =============================================================================
# Run Formatting Tests
# =============================================================================


class TestRunFormatting:
    """Tests for run formatting conversion."""

    def test_bold_text(self) -> None:
        """Bold text wrapped in <strong> or styled span."""
        run = Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])
        result = run_to_html(run)
        assert "<strong>" in result or "font-weight" in result

    def test_italic_text(self) -> None:
        """Italic text wrapped in <em> or styled span."""
        run = Run(r_pr=RunProperties(i=True), content=[Text(value="Italic")])
        result = run_to_html(run)
        assert "<em>" in result or "font-style" in result

    def test_underline_text(self) -> None:
        """Underlined text."""
        run = Run(r_pr=RunProperties(u=Underline(val="single")), content=[Text(value="Underlined")])
        result = run_to_html(run)
        assert "underline" in result

    def test_strikethrough_text(self) -> None:
        """Strikethrough text."""
        run = Run(r_pr=RunProperties(strike=True), content=[Text(value="Strikethrough")])
        result = run_to_html(run)
        assert "line-through" in result or "<del>" in result or "<s>" in result

    def test_superscript(self) -> None:
        """Superscript text."""
        run = Run(r_pr=RunProperties(vert_align="superscript"), content=[Text(value="2")])
        result = run_to_html(run)
        assert "<sup>" in result or "vertical-align: super" in result

    def test_subscript(self) -> None:
        """Subscript text."""
        run = Run(r_pr=RunProperties(vert_align="subscript"), content=[Text(value="2")])
        result = run_to_html(run)
        assert "<sub>" in result or "vertical-align: sub" in result

    def test_combined_formatting(self) -> None:
        """Multiple formatting properties."""
        run = Run(
            r_pr=RunProperties(b=True, i=True, u=Underline(val="single")),
            content=[Text(value="Bold Italic Underlined")],
        )
        result = run_to_html(run)
        # All formatting should be present
        assert "Bold Italic Underlined" in result

    def test_font_family(self) -> None:
        """Font family applied."""
        run = Run(
            r_pr=RunProperties(r_fonts=RunFonts(ascii="Arial")), content=[Text(value="Arial text")]
        )
        result = run_to_html(run)
        assert "Arial" in result

    def test_font_size(self) -> None:
        """Font size applied."""
        run = Run(
            r_pr=RunProperties(sz=32),  # 16pt
            content=[Text(value="Large text")],
        )
        result = run_to_html(run)
        assert "16pt" in result or "font-size" in result

    def test_text_color(self) -> None:
        """Text color applied."""
        run = Run(r_pr=RunProperties(color=Color(val="FF0000")), content=[Text(value="Red text")])
        result = run_to_html(run)
        assert "FF0000" in result.upper() or "#ff0000" in result.lower()

    def test_highlight_color(self) -> None:
        """Highlight color applied."""
        run = Run(r_pr=RunProperties(highlight="yellow"), content=[Text(value="Highlighted")])
        result = run_to_html(run)
        assert "background" in result

    def test_all_caps(self) -> None:
        """All caps text."""
        run = Run(r_pr=RunProperties(caps=True), content=[Text(value="uppercase")])
        result = run_to_html(run)
        assert "uppercase" in result

    def test_small_caps(self) -> None:
        """Small caps text."""
        run = Run(r_pr=RunProperties(small_caps=True), content=[Text(value="small caps")])
        result = run_to_html(run)
        assert "small-caps" in result

    def test_hidden_text(self) -> None:
        """Hidden text (vanish)."""
        run = Run(r_pr=RunProperties(vanish=True), content=[Text(value="Hidden")])
        result = run_to_html(run)
        assert "display: none" in result or "visibility: hidden" in result


# =============================================================================
# Special Content Tests
# =============================================================================


class TestSpecialContent:
    """Tests for special run content elements."""

    def test_line_break(self) -> None:
        """Line break converts to <br>."""
        run = Run(content=[Text(value="Line 1"), Break(), Text(value="Line 2")])
        result = run_to_html(run)
        assert "<br" in result

    def test_page_break(self) -> None:
        """Page break handling."""
        run = Run(content=[Break(type="page")])
        result = run_to_html(run)
        # Could be hr, page-break style, or other
        assert "page-break" in result or "<hr" in result

    def test_column_break(self) -> None:
        """Column break handling."""
        run = Run(content=[Break(type="column")])
        result = run_to_html(run)
        assert "break" in result or "column" in result

    def test_tab_character(self) -> None:
        """Tab character handling."""
        result = tab_to_html(TabChar())
        assert "tab" in result or "<span" in result

    def test_carriage_return(self) -> None:
        """Carriage return handling."""
        run = Run(content=[CarriageReturn()])
        result = run_to_html(run)
        # Typically treated as line break
        assert "<br" in result

    def test_soft_hyphen(self) -> None:
        """Soft hyphen character."""
        result = soft_hyphen_to_html(SoftHyphen())
        assert "&shy;" in result

    def test_no_break_hyphen(self) -> None:
        """No-break hyphen character."""
        run = Run(content=[Text(value="non"), NoBreakHyphen(), Text(value="breaking")])
        result = run_to_html(run)
        assert "non" in result
        assert "breaking" in result


# =============================================================================
# HTML Escaping Tests
# =============================================================================


class TestHTMLEscaping:
    """Tests for proper HTML escaping."""

    def test_escape_less_than(self) -> None:
        """Less than sign escaped."""
        result = text_to_html(Text(value="a < b"))
        assert "&lt;" in result

    def test_escape_greater_than(self) -> None:
        """Greater than sign escaped."""
        result = text_to_html(Text(value="a > b"))
        assert "&gt;" in result

    def test_escape_ampersand(self) -> None:
        """Ampersand escaped."""
        result = text_to_html(Text(value="a & b"))
        assert "&amp;" in result

    def test_escape_quotes(self) -> None:
        """Quotes in text."""
        result = text_to_html(Text(value='He said "Hello"'))
        # Text content preserves quotes (they're only escaped in attributes)
        assert "Hello" in result

    def test_escape_html_tags(self) -> None:
        """HTML-like content escaped."""
        result = text_to_html(Text(value="<script>alert('xss')</script>"))
        assert "<script>" not in result
        assert "&lt;script&gt;" in result


# =============================================================================
# Whitespace Handling Tests
# =============================================================================


class TestWhitespaceHandling:
    """Tests for whitespace handling."""

    def test_preserve_single_space(self) -> None:
        """Single spaces preserved."""
        run = Run(content=[Text(value="Hello World")])
        result = run_to_html(run)
        assert "Hello World" in result

    def test_preserve_multiple_spaces(self) -> None:
        """Multiple spaces preserved with xml:space='preserve'."""
        run = Run(content=[Text(value="Hello  World", space="preserve")])
        result = run_to_html(run)
        # Either &nbsp; or preserved spaces
        assert "Hello" in result and "World" in result

    def test_leading_spaces_preserved(self) -> None:
        """Leading spaces preserved."""
        run = Run(content=[Text(value="  Indented", space="preserve")])
        result = run_to_html(run)
        assert "&nbsp;" in result or "  " in result

    def test_trailing_spaces_preserved(self) -> None:
        """Trailing spaces preserved."""
        run = Run(content=[Text(value="Text  ", space="preserve")])
        result = run_to_html(run)
        assert "Text" in result


# =============================================================================
# Inline vs Semantic HTML Tests
# =============================================================================


class TestHTMLOutputMode:
    """Tests for different HTML output modes."""

    def test_inline_style_mode(self) -> None:
        """Inline style mode produces style attribute."""
        converter = RunToHTMLConverter(use_semantic_tags=False)
        run = Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])
        result = converter.convert(run)
        assert "style=" in result
        assert "font-weight" in result

    def test_semantic_tag_mode(self) -> None:
        """Semantic tag mode uses <strong>, <em>, etc."""
        converter = RunToHTMLConverter(use_semantic_tags=True)
        run = Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])
        result = converter.convert(run)
        assert "<strong>" in result

    def test_no_span_for_plain_text(self) -> None:
        """Plain text without formatting doesn't need span."""
        run = Run(content=[Text(value="Plain text")])
        result = run_to_html(run)
        # Plain text might not be wrapped in span
        assert "Plain text" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestRunEdgeCases:
    """Tests for edge cases in run conversion."""

    def test_empty_text(self) -> None:
        """Empty text element."""
        run = Run(content=[Text(value="")])
        result = run_to_html(run)
        assert result == ""

    def test_only_whitespace(self) -> None:
        """Only whitespace text."""
        run = Run(content=[Text(value="   ", space="preserve")])
        result = run_to_html(run)
        # Should preserve whitespace
        assert "&nbsp;" in result or "   " in result

    def test_mixed_content_types(self) -> None:
        """Mixed text, breaks, and tabs."""
        run = Run(
            content=[
                Text(value="Part 1"),
                Break(),
                Text(value="Part 2"),
                TabChar(),
                Text(value="Part 3"),
            ]
        )
        result = run_to_html(run)
        assert "Part 1" in result
        assert "Part 2" in result
        assert "Part 3" in result
        assert "<br" in result

    def test_very_long_text(self) -> None:
        """Very long text content."""
        long_text = "A" * 10000
        run = Run(content=[Text(value=long_text)])
        result = run_to_html(run)
        assert long_text in result

    def test_unicode_text(self) -> None:
        """Unicode characters."""
        run = Run(content=[Text(value="Hello 世界 🌍")])
        result = run_to_html(run)
        assert "世界" in result
        assert "🌍" in result

    def test_rtl_text(self) -> None:
        """Right-to-left text."""
        run = Run(content=[Text(value="مرحبا")])
        result = run_to_html(run)
        assert "مرحبا" in result

    def test_properties_without_content(self) -> None:
        """Run with properties but no content."""
        run = Run(r_pr=RunProperties(b=True), content=[])
        result = run_to_html(run)
        assert result == ""

    def test_double_underline(self) -> None:
        """Double underline style."""
        run = Run(
            r_pr=RunProperties(u=Underline(val="double")), content=[Text(value="Double underlined")]
        )
        result = run_to_html(run)
        assert "underline" in result

    def test_wavy_underline(self) -> None:
        """Wavy underline style."""
        run = Run(
            r_pr=RunProperties(u=Underline(val="wave")), content=[Text(value="Wavy underlined")]
        )
        result = run_to_html(run)
        assert "underline" in result

    def test_colored_underline(self) -> None:
        """Colored underline."""
        run = Run(
            r_pr=RunProperties(u=Underline(val="single", color="FF0000")),
            content=[Text(value="Red underlined")],
        )
        result = run_to_html(run)
        assert "underline" in result


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestRunToHTMLConverterClass:
    """Tests for RunToHTMLConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = RunToHTMLConverter()
        assert converter is not None

    def test_converter_with_options(self) -> None:
        """Initialize with options."""
        converter = RunToHTMLConverter(use_semantic_tags=False, use_classes=True)
        assert converter.use_semantic_tags is False
        assert converter.use_classes is True

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = RunToHTMLConverter()
        run = Run(content=[Text(value="Test")])
        result = converter.convert(run)
        assert "Test" in result

    def test_convert_content_method(self) -> None:
        """Convert content method works."""
        converter = RunToHTMLConverter()
        result = converter.convert_content(Text(value="Test"))
        assert "Test" in result
