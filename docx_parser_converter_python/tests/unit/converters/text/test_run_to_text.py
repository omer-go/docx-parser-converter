"""Unit tests for run to text converter.

Tests conversion of Run elements to plain text.
"""

from converters.text.run_to_text import (
    RunToTextConverter,
    break_to_text,
    run_to_text,
    tab_to_text,
    text_to_text,
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
    """Tests for basic run to text conversion."""

    def test_simple_text_run(self) -> None:
        """Simple text run extracts text."""
        run = Run(content=[Text(value="Hello World")])
        result = run_to_text(run)
        assert result == "Hello World"

    def test_empty_run(self) -> None:
        """Empty run returns empty string."""
        run = Run(content=[])
        result = run_to_text(run)
        assert result == ""

    def test_none_run(self) -> None:
        """None run returns empty string."""
        result = run_to_text(None)
        assert result == ""

    def test_multiple_text_segments(self) -> None:
        """Run with multiple text segments joined."""
        run = Run(content=[Text(value="Hello "), Text(value="World")])
        result = run_to_text(run)
        assert result == "Hello World"

    def test_text_with_spaces(self) -> None:
        """Text with leading/trailing spaces preserved."""
        run = Run(content=[Text(value="  Hello  ", space="preserve")])
        result = run_to_text(run)
        assert result == "  Hello  "


# =============================================================================
# Text Content Tests
# =============================================================================


class TestTextContent:
    """Tests for text content extraction."""

    def test_text_to_text_basic(self) -> None:
        """Basic text extraction."""
        result = text_to_text(Text(value="Test content"))
        assert result == "Test content"

    def test_text_to_text_empty(self) -> None:
        """Empty text returns empty string."""
        result = text_to_text(Text(value=""))
        assert result == ""

    def test_text_to_text_with_space_preserve(self) -> None:
        """Text with space='preserve' keeps whitespace."""
        result = text_to_text(Text(value="   spaces   ", space="preserve"))
        assert result == "   spaces   "

    def test_text_with_unicode(self) -> None:
        """Unicode text preserved."""
        run = Run(content=[Text(value="Hello 世界 🌍")])
        result = run_to_text(run)
        assert result == "Hello 世界 🌍"

    def test_text_with_rtl(self) -> None:
        """RTL text preserved."""
        run = Run(content=[Text(value="مرحبا")])
        result = run_to_text(run)
        assert result == "مرحبا"


# =============================================================================
# Break Handling Tests
# =============================================================================


class TestBreakHandling:
    """Tests for break elements in text output."""

    def test_line_break(self) -> None:
        """Line break converts to newline."""
        result = break_to_text(Break())
        assert result == "\n"

    def test_page_break(self) -> None:
        """Page break converts to newline or page separator."""
        result = break_to_text(Break(type="page"))
        # Could be newline or special marker
        assert "\n" in result

    def test_column_break(self) -> None:
        """Column break converts to newline."""
        result = break_to_text(Break(type="column"))
        assert "\n" in result

    def test_text_wrap_break(self) -> None:
        """Text wrap break converts to newline."""
        result = break_to_text(Break(type="textWrapping"))
        assert result == "\n"

    def test_run_with_line_break(self) -> None:
        """Run with line break includes newline."""
        run = Run(content=[Text(value="Line 1"), Break(), Text(value="Line 2")])
        result = run_to_text(run)
        assert result == "Line 1\nLine 2"


# =============================================================================
# Tab Handling Tests
# =============================================================================


class TestTabHandling:
    """Tests for tab character handling."""

    def test_tab_to_tab_character(self) -> None:
        """Tab converts to tab character."""
        result = tab_to_text(TabChar())
        assert result == "\t"

    def test_run_with_tab(self) -> None:
        """Run with tab includes tab character."""
        run = Run(content=[Text(value="Column1"), TabChar(), Text(value="Column2")])
        result = run_to_text(run)
        assert result == "Column1\tColumn2"


# =============================================================================
# Special Character Tests
# =============================================================================


class TestSpecialCharacters:
    """Tests for special character handling."""

    def test_soft_hyphen(self) -> None:
        """Soft hyphen converted appropriately."""
        run = Run(content=[SoftHyphen()])
        result = run_to_text(run)
        # Soft hyphen could be empty or actual soft hyphen
        assert result == "" or result == "\u00ad"

    def test_no_break_hyphen(self) -> None:
        """No-break hyphen converted to hyphen."""
        run = Run(content=[NoBreakHyphen()])
        result = run_to_text(run)
        assert result == "-" or result == "\u2011"

    def test_carriage_return(self) -> None:
        """Carriage return treated as line break."""
        run = Run(content=[CarriageReturn()])
        result = run_to_text(run)
        assert result == "\n"


# =============================================================================
# Markdown Mode Tests
# =============================================================================


class TestMarkdownMode:
    """Tests for markdown formatting mode."""

    def test_bold_markdown(self) -> None:
        """Bold text wrapped in markdown markers."""
        run = Run(r_pr=RunProperties(b=True), content=[Text(value="bold")])
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        assert result == "**bold**"

    def test_italic_markdown(self) -> None:
        """Italic text wrapped in markdown markers."""
        run = Run(r_pr=RunProperties(i=True), content=[Text(value="italic")])
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        assert result == "*italic*"

    def test_bold_italic_markdown(self) -> None:
        """Bold italic text wrapped in markdown markers."""
        run = Run(r_pr=RunProperties(b=True, i=True), content=[Text(value="bold italic")])
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        assert result == "***bold italic***"

    def test_strikethrough_markdown(self) -> None:
        """Strikethrough text wrapped in markdown markers."""
        run = Run(r_pr=RunProperties(strike=True), content=[Text(value="deleted")])
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        assert result == "~~deleted~~"

    def test_underline_markdown(self) -> None:
        """Underline text (no standard markdown, could use underscore)."""
        run = Run(r_pr=RunProperties(u=Underline(val="single")), content=[Text(value="underlined")])
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        # Underline has no markdown equivalent, could be unchanged or use _
        assert "underlined" in result

    def test_code_font_markdown(self) -> None:
        """Monospace font text wrapped in backticks."""
        run = Run(
            r_pr=RunProperties(r_fonts=RunFonts(ascii="Courier New")), content=[Text(value="code")]
        )
        converter = RunToTextConverter(use_markdown=True)
        result = converter.convert(run)
        # Could wrap in backticks for monospace fonts
        assert "code" in result


# =============================================================================
# Plain Mode Tests
# =============================================================================


class TestPlainMode:
    """Tests for plain text mode (no formatting markers)."""

    def test_bold_plain(self) -> None:
        """Bold text has no markers in plain mode."""
        run = Run(r_pr=RunProperties(b=True), content=[Text(value="bold")])
        converter = RunToTextConverter(use_markdown=False)
        result = converter.convert(run)
        assert result == "bold"

    def test_italic_plain(self) -> None:
        """Italic text has no markers in plain mode."""
        run = Run(r_pr=RunProperties(i=True), content=[Text(value="italic")])
        converter = RunToTextConverter(use_markdown=False)
        result = converter.convert(run)
        assert result == "italic"

    def test_formatted_text_plain(self) -> None:
        """All formatting ignored in plain mode."""
        run = Run(
            r_pr=RunProperties(
                b=True,
                i=True,
                strike=True,
                u=Underline(val="single"),
                color=Color(val="FF0000"),
            ),
            content=[Text(value="formatted")],
        )
        result = run_to_text(run)
        assert result == "formatted"


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestRunEdgeCases:
    """Tests for edge cases in run conversion."""

    def test_empty_text(self) -> None:
        """Empty text element."""
        run = Run(content=[Text(value="")])
        result = run_to_text(run)
        assert result == ""

    def test_only_whitespace(self) -> None:
        """Only whitespace text."""
        run = Run(content=[Text(value="   ", space="preserve")])
        result = run_to_text(run)
        assert result == "   "

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
        result = run_to_text(run)
        assert "Part 1" in result
        assert "Part 2" in result
        assert "Part 3" in result
        assert "\n" in result
        assert "\t" in result

    def test_very_long_text(self) -> None:
        """Very long text content."""
        long_text = "A" * 10000
        run = Run(content=[Text(value=long_text)])
        result = run_to_text(run)
        assert result == long_text

    def test_properties_without_content(self) -> None:
        """Run with properties but no content."""
        run = Run(r_pr=RunProperties(b=True), content=[])
        result = run_to_text(run)
        assert result == ""

    def test_multiple_consecutive_breaks(self) -> None:
        """Multiple consecutive breaks."""
        run = Run(content=[Text(value="Text"), Break(), Break(), Break(), Text(value="More")])
        result = run_to_text(run)
        assert result == "Text\n\n\nMore"

    def test_multiple_consecutive_tabs(self) -> None:
        """Multiple consecutive tabs."""
        run = Run(content=[Text(value="Col1"), TabChar(), TabChar(), Text(value="Col2")])
        result = run_to_text(run)
        assert result == "Col1\t\tCol2"


# =============================================================================
# RunToTextConverter Class Tests
# =============================================================================


class TestRunToTextConverterClass:
    """Tests for RunToTextConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = RunToTextConverter()
        assert converter is not None

    def test_converter_plain_mode(self) -> None:
        """Initialize with plain mode."""
        converter = RunToTextConverter(use_markdown=False)
        assert converter.use_markdown is False

    def test_converter_markdown_mode(self) -> None:
        """Initialize with markdown mode."""
        converter = RunToTextConverter(use_markdown=True)
        assert converter.use_markdown is True

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = RunToTextConverter()
        run = Run(content=[Text(value="Test")])
        result = converter.convert(run)
        assert result == "Test"

    def test_convert_content_method(self) -> None:
        """Convert content method works."""
        converter = RunToTextConverter()
        result = converter.convert_content(Text(value="Test"))
        assert result == "Test"


# =============================================================================
# Whitespace Handling Tests
# =============================================================================


class TestWhitespaceHandling:
    """Tests for whitespace handling."""

    def test_preserve_single_space(self) -> None:
        """Single spaces preserved."""
        run = Run(content=[Text(value="Hello World")])
        result = run_to_text(run)
        assert result == "Hello World"

    def test_preserve_multiple_spaces(self) -> None:
        """Multiple spaces preserved with xml:space='preserve'."""
        run = Run(content=[Text(value="Hello  World", space="preserve")])
        result = run_to_text(run)
        assert result == "Hello  World"

    def test_leading_spaces_preserved(self) -> None:
        """Leading spaces preserved."""
        run = Run(content=[Text(value="  Indented", space="preserve")])
        result = run_to_text(run)
        assert result == "  Indented"

    def test_trailing_spaces_preserved(self) -> None:
        """Trailing spaces preserved."""
        run = Run(content=[Text(value="Text  ", space="preserve")])
        result = run_to_text(run)
        assert result == "Text  "

    def test_newlines_in_text(self) -> None:
        """Newlines in text content preserved."""
        run = Run(content=[Text(value="Line1\nLine2", space="preserve")])
        result = run_to_text(run)
        assert "Line1" in result
        assert "Line2" in result
