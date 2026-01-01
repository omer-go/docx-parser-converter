"""Unit tests for paragraph to text converter.

Tests conversion of Paragraph elements to plain text.
"""

from converters.text.paragraph_to_text import (
    ParagraphToTextConverter,
    paragraph_to_text,
)
from models.common.indentation import Indentation
from models.common.spacing import Spacing
from models.document.hyperlink import Hyperlink
from models.document.paragraph import (
    NumberingProperties,
    Paragraph,
    ParagraphProperties,
)
from models.document.run import Run, RunProperties
from models.document.run_content import Break, TabChar, Text

# =============================================================================
# Basic Paragraph Conversion Tests
# =============================================================================


class TestBasicParagraphConversion:
    """Tests for basic paragraph to text conversion."""

    def test_simple_paragraph(self) -> None:
        """Simple paragraph with single run."""
        para = Paragraph(content=[Run(content=[Text(value="Hello World")])])
        result = paragraph_to_text(para)
        assert result == "Hello World"

    def test_empty_paragraph(self) -> None:
        """Empty paragraph returns empty string."""
        para = Paragraph(content=[])
        result = paragraph_to_text(para)
        assert result == ""

    def test_none_paragraph(self) -> None:
        """None paragraph returns empty string."""
        result = paragraph_to_text(None)
        assert result == ""

    def test_multiple_runs(self) -> None:
        """Paragraph with multiple runs joined."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="Hello ")]),
                Run(content=[Text(value="World")]),
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Hello World"

    def test_paragraph_with_properties_only(self) -> None:
        """Paragraph with properties but no content."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="center"),
            content=[],
        )
        result = paragraph_to_text(para)
        assert result == ""


# =============================================================================
# Hyperlink Tests
# =============================================================================


class TestHyperlinkHandling:
    """Tests for hyperlink handling in paragraphs."""

    def test_hyperlink_text_extracted(self) -> None:
        """Hyperlink text is extracted."""
        para = Paragraph(
            content=[
                Hyperlink(
                    r_id="rId1",
                    content=[Run(content=[Text(value="Click here")])],
                )
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Click here"

    def test_hyperlink_with_surrounding_text(self) -> None:
        """Hyperlink with surrounding text."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="Visit ")]),
                Hyperlink(
                    r_id="rId1",
                    content=[Run(content=[Text(value="our website")])],
                ),
                Run(content=[Text(value=" for more info.")]),
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Visit our website for more info."

    def test_hyperlink_markdown_mode(self) -> None:
        """Hyperlink in markdown mode shows URL if available."""
        para = Paragraph(
            content=[
                Hyperlink(
                    r_id="rId1",
                    content=[Run(content=[Text(value="Example")])],
                )
            ]
        )
        converter = ParagraphToTextConverter(
            use_markdown=True,
            hyperlink_urls={"rId1": "https://example.com"},
        )
        result = converter.convert(para)
        assert "Example" in result
        assert "https://example.com" in result


# =============================================================================
# Numbering/List Tests
# =============================================================================


class TestNumberingHandling:
    """Tests for list numbering in paragraphs."""

    def test_numbered_paragraph(self) -> None:
        """Numbered paragraph includes prefix."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
            content=[Run(content=[Text(value="First item")])],
        )
        converter = ParagraphToTextConverter(
            numbering_prefixes={
                (1, 0): ("1.", "\t"),
            }
        )
        result = converter.convert(para)
        assert "1." in result
        assert "First item" in result

    def test_bulleted_paragraph(self) -> None:
        """Bulleted paragraph includes bullet."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=2, ilvl=0)),
            content=[Run(content=[Text(value="Bullet point")])],
        )
        converter = ParagraphToTextConverter(
            numbering_prefixes={
                (2, 0): ("•", "\t"),
            }
        )
        result = converter.convert(para)
        assert "•" in result
        assert "Bullet point" in result

    def test_multi_level_list(self) -> None:
        """Multi-level list with indentation."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=1)),
            content=[Run(content=[Text(value="Sub-item")])],
        )
        converter = ParagraphToTextConverter(
            numbering_prefixes={
                (1, 1): ("a.", "\t"),
            }
        )
        result = converter.convert(para)
        assert "a." in result
        assert "Sub-item" in result


# =============================================================================
# Break and Tab Handling Tests
# =============================================================================


class TestBreakAndTabHandling:
    """Tests for breaks and tabs in paragraphs."""

    def test_paragraph_with_line_break(self) -> None:
        """Line break within paragraph."""
        para = Paragraph(
            content=[
                Run(
                    content=[
                        Text(value="Line 1"),
                        Break(),
                        Text(value="Line 2"),
                    ]
                )
            ]
        )
        result = paragraph_to_text(para)
        assert "Line 1\nLine 2" == result

    def test_paragraph_with_tabs(self) -> None:
        """Tabs within paragraph."""
        para = Paragraph(
            content=[
                Run(
                    content=[
                        Text(value="Col1"),
                        TabChar(),
                        Text(value="Col2"),
                    ]
                )
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Col1\tCol2"


# =============================================================================
# Formatting Mode Tests
# =============================================================================


class TestFormattingModes:
    """Tests for different formatting modes."""

    def test_plain_mode_no_markers(self) -> None:
        """Plain mode strips all formatting markers."""
        para = Paragraph(
            content=[
                Run(
                    r_pr=RunProperties(b=True),
                    content=[Text(value="bold")],
                )
            ]
        )
        converter = ParagraphToTextConverter(use_markdown=False)
        result = converter.convert(para)
        assert result == "bold"

    def test_markdown_mode_preserves_formatting(self) -> None:
        """Markdown mode preserves formatting markers."""
        para = Paragraph(
            content=[
                Run(
                    r_pr=RunProperties(b=True),
                    content=[Text(value="bold")],
                )
            ]
        )
        converter = ParagraphToTextConverter(use_markdown=True)
        result = converter.convert(para)
        assert result == "**bold**"

    def test_mixed_formatting_markdown(self) -> None:
        """Mixed formatting in markdown mode."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="Normal ")]),
                Run(
                    r_pr=RunProperties(b=True),
                    content=[Text(value="bold")],
                ),
                Run(content=[Text(value=" and ")]),
                Run(
                    r_pr=RunProperties(i=True),
                    content=[Text(value="italic")],
                ),
            ]
        )
        converter = ParagraphToTextConverter(use_markdown=True)
        result = converter.convert(para)
        assert "Normal " in result
        assert "**bold**" in result
        assert "*italic*" in result


# =============================================================================
# Whitespace Handling Tests
# =============================================================================


class TestWhitespaceHandling:
    """Tests for whitespace handling in paragraphs."""

    def test_preserve_spaces_between_runs(self) -> None:
        """Spaces between runs preserved."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="Word1 ")]),
                Run(content=[Text(value="Word2")]),
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Word1 Word2"

    def test_leading_spaces_preserved(self) -> None:
        """Leading spaces in text preserved."""
        para = Paragraph(content=[Run(content=[Text(value="  Indented", space="preserve")])])
        result = paragraph_to_text(para)
        assert result == "  Indented"

    def test_trailing_spaces_preserved(self) -> None:
        """Trailing spaces in text preserved."""
        para = Paragraph(content=[Run(content=[Text(value="Text  ", space="preserve")])])
        result = paragraph_to_text(para)
        assert result == "Text  "


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestParagraphEdgeCases:
    """Tests for edge cases in paragraph conversion."""

    def test_empty_runs(self) -> None:
        """Paragraph with empty runs."""
        para = Paragraph(
            content=[
                Run(content=[]),
                Run(content=[Text(value="Text")]),
                Run(content=[]),
            ]
        )
        result = paragraph_to_text(para)
        assert result == "Text"

    def test_only_whitespace(self) -> None:
        """Paragraph with only whitespace."""
        para = Paragraph(content=[Run(content=[Text(value="   ", space="preserve")])])
        result = paragraph_to_text(para)
        assert result == "   "

    def test_unicode_content(self) -> None:
        """Paragraph with unicode content."""
        para = Paragraph(content=[Run(content=[Text(value="Hello 世界 🌍")])])
        result = paragraph_to_text(para)
        assert result == "Hello 世界 🌍"

    def test_rtl_content(self) -> None:
        """Paragraph with RTL content."""
        para = Paragraph(content=[Run(content=[Text(value="مرحبا")])])
        result = paragraph_to_text(para)
        assert result == "مرحبا"

    def test_very_long_paragraph(self) -> None:
        """Very long paragraph content."""
        long_text = "A" * 10000
        para = Paragraph(content=[Run(content=[Text(value=long_text)])])
        result = paragraph_to_text(para)
        assert result == long_text


# =============================================================================
# Paragraph Properties Tests
# =============================================================================


class TestParagraphProperties:
    """Tests for paragraph properties handling."""

    def test_properties_ignored_in_plain_text(self) -> None:
        """Paragraph properties don't affect plain text output."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                jc="center",
                spacing=Spacing(before=240, after=120),
                ind=Indentation(left=720),
            ),
            content=[Run(content=[Text(value="Styled text")])],
        )
        result = paragraph_to_text(para)
        assert result == "Styled text"

    def test_indentation_as_spaces(self) -> None:
        """Paragraph indentation can be rendered as spaces."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                ind=Indentation(first_line=720),  # Half inch = 720 twips
            ),
            content=[Run(content=[Text(value="Indented")])],
        )
        converter = ParagraphToTextConverter(render_indentation=True)
        result = converter.convert(para)
        # Should have some leading spaces
        assert result.endswith("Indented")


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestParagraphToTextConverterClass:
    """Tests for ParagraphToTextConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = ParagraphToTextConverter()
        assert converter is not None

    def test_converter_plain_mode(self) -> None:
        """Initialize with plain mode."""
        converter = ParagraphToTextConverter(use_markdown=False)
        assert converter.use_markdown is False

    def test_converter_markdown_mode(self) -> None:
        """Initialize with markdown mode."""
        converter = ParagraphToTextConverter(use_markdown=True)
        assert converter.use_markdown is True

    def test_converter_with_hyperlink_urls(self) -> None:
        """Initialize with hyperlink URLs."""
        urls = {"rId1": "https://example.com"}
        converter = ParagraphToTextConverter(hyperlink_urls=urls)
        assert converter.hyperlink_urls == urls

    def test_converter_with_numbering_prefixes(self) -> None:
        """Initialize with numbering prefixes."""
        prefixes = {(1, 0): ("1.", "\t")}
        converter = ParagraphToTextConverter(numbering_prefixes=prefixes)
        assert converter.numbering_prefixes == prefixes

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = ParagraphToTextConverter()
        para = Paragraph(content=[Run(content=[Text(value="Test")])])
        result = converter.convert(para)
        assert result == "Test"
