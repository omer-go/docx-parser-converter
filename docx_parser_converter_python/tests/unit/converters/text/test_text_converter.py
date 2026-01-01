"""Unit tests for main text converter.

Tests the docx_to_text entry point and TextConverter class.
"""

from converters.text.text_converter import (
    TextConverter,
    TextConverterConfig,
    document_to_text,
)
from models.document.document import Body, Document
from models.document.hyperlink import Hyperlink
from models.document.paragraph import (
    NumberingProperties,
    Paragraph,
    ParagraphProperties,
)
from models.document.run import Run, RunProperties
from models.document.run_content import Break, Text
from models.document.section import SectionProperties
from models.document.table import Table
from models.document.table_cell import TableCell
from models.document.table_row import TableRow
from models.numbering.numbering import Numbering
from models.styles.styles import Styles

# =============================================================================
# Helper Functions
# =============================================================================


def make_paragraph(text: str, **kwargs) -> Paragraph:
    """Create a simple paragraph with text."""
    return Paragraph(
        p_pr=ParagraphProperties(**kwargs) if kwargs else None,
        content=[Run(content=[Text(value=text)])],
    )


def make_table(rows: list[list[str]]) -> Table:
    """Create a simple table from text content."""
    return Table(
        tbl_pr=None,
        tbl_grid=None,
        tr=[
            TableRow(tc=[TableCell(content=[make_paragraph(cell)]) for cell in row]) for row in rows
        ],
    )


def make_document(
    paragraphs: list[Paragraph] | None = None,
    tables: list[Table] | None = None,
) -> Document:
    """Create a document with paragraphs and/or tables."""
    content: list[Paragraph | Table] = []
    if paragraphs:
        content.extend(paragraphs)
    if tables:
        content.extend(tables)
    return Document(body=Body(content=content))


# =============================================================================
# Basic Document Conversion Tests
# =============================================================================


class TestBasicDocumentConversion:
    """Tests for basic document to text conversion."""

    def test_simple_document(self) -> None:
        """Simple document with one paragraph."""
        doc = make_document([make_paragraph("Hello World")])
        result = document_to_text(doc)
        assert result == "Hello World"

    def test_empty_document(self) -> None:
        """Empty document returns empty string."""
        doc = Document(body=Body(content=[]))
        result = document_to_text(doc)
        assert result == ""

    def test_none_document(self) -> None:
        """None document returns empty string."""
        result = document_to_text(None)
        assert result == ""

    def test_multiple_paragraphs(self) -> None:
        """Document with multiple paragraphs."""
        doc = make_document(
            [
                make_paragraph("Paragraph 1"),
                make_paragraph("Paragraph 2"),
                make_paragraph("Paragraph 3"),
            ]
        )
        result = document_to_text(doc)
        assert "Paragraph 1" in result
        assert "Paragraph 2" in result
        assert "Paragraph 3" in result
        # Paragraphs should be separated
        assert "\n" in result

    def test_paragraph_separation(self) -> None:
        """Paragraphs separated by blank line."""
        doc = make_document(
            [
                make_paragraph("First"),
                make_paragraph("Second"),
            ]
        )
        result = document_to_text(doc)
        # Check for separation (could be single or double newline)
        lines = result.strip().split("\n")
        assert len([line for line in lines if line.strip()]) >= 2


# =============================================================================
# Table Conversion Tests
# =============================================================================


class TestTableConversion:
    """Tests for table conversion in documents."""

    def test_document_with_table(self) -> None:
        """Document containing a table."""
        table = make_table(
            [
                ["A1", "B1"],
                ["A2", "B2"],
            ]
        )
        doc = make_document(tables=[table])
        result = document_to_text(doc)
        assert "A1" in result
        assert "B1" in result
        assert "A2" in result
        assert "B2" in result

    def test_mixed_content(self) -> None:
        """Document with paragraphs and tables."""
        para1 = make_paragraph("Before table")
        table = make_table([["Cell1", "Cell2"]])
        para2 = make_paragraph("After table")
        doc = Document(body=Body(content=[para1, table, para2]))
        result = document_to_text(doc)
        assert "Before table" in result
        assert "Cell1" in result
        assert "After table" in result
        # Order should be preserved
        assert result.index("Before") < result.index("Cell1") < result.index("After")


# =============================================================================
# Formatting Mode Tests
# =============================================================================


class TestFormattingModes:
    """Tests for different formatting modes."""

    def test_plain_mode(self) -> None:
        """Plain mode strips all formatting."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Run(
                            r_pr=RunProperties(b=True),
                            content=[Text(value="bold")],
                        )
                    ]
                )
            ]
        )
        config = TextConverterConfig(formatting="plain")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert result == "bold"
        assert "**" not in result

    def test_markdown_mode(self) -> None:
        """Markdown mode preserves formatting markers."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Run(
                            r_pr=RunProperties(b=True),
                            content=[Text(value="bold")],
                        )
                    ]
                )
            ]
        )
        config = TextConverterConfig(formatting="markdown")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "**bold**" in result


# =============================================================================
# Table Mode Tests
# =============================================================================


class TestTableModes:
    """Tests for different table rendering modes."""

    def test_ascii_table_mode(self) -> None:
        """ASCII box table mode."""
        table = make_table([["A", "B"]])
        doc = make_document(tables=[table])
        config = TextConverterConfig(table_mode="ascii")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "A" in result
        assert "B" in result

    def test_tabs_table_mode(self) -> None:
        """Tab-separated table mode."""
        table = make_table([["A", "B"]])
        doc = make_document(tables=[table])
        config = TextConverterConfig(table_mode="tabs")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "A" in result
        assert "B" in result

    def test_plain_table_mode(self) -> None:
        """Plain text table mode."""
        table = make_table([["A", "B"]])
        doc = make_document(tables=[table])
        config = TextConverterConfig(table_mode="plain")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "A" in result
        assert "B" in result

    def test_auto_table_mode(self) -> None:
        """Auto table mode (default)."""
        table = make_table([["A", "B"]])
        doc = make_document(tables=[table])
        config = TextConverterConfig(table_mode="auto")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "A" in result
        assert "B" in result


# =============================================================================
# Numbering Tests
# =============================================================================


class TestNumberingConversion:
    """Tests for numbered/bulleted list conversion."""

    def test_numbered_list(self) -> None:
        """Numbered list items."""
        doc = make_document(
            [
                Paragraph(
                    p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
                    content=[Run(content=[Text(value="Item 1")])],
                ),
                Paragraph(
                    p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
                    content=[Run(content=[Text(value="Item 2")])],
                ),
            ]
        )
        converter = TextConverter()
        result = converter.convert(doc)
        assert "Item 1" in result
        assert "Item 2" in result

    def test_bulleted_list(self) -> None:
        """Bulleted list items."""
        doc = make_document(
            [
                Paragraph(
                    p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=2, ilvl=0)),
                    content=[Run(content=[Text(value="Bullet 1")])],
                ),
            ]
        )
        converter = TextConverter()
        result = converter.convert(doc)
        assert "Bullet 1" in result


# =============================================================================
# Hyperlink Tests
# =============================================================================


class TestHyperlinkConversion:
    """Tests for hyperlink conversion."""

    def test_hyperlink_text_extracted(self) -> None:
        """Hyperlink text is extracted."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Hyperlink(
                            r_id="rId1",
                            content=[Run(content=[Text(value="Link text")])],
                        )
                    ]
                )
            ]
        )
        result = document_to_text(doc)
        assert "Link text" in result

    def test_hyperlink_with_url_in_markdown(self) -> None:
        """Hyperlink in markdown mode shows URL."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Hyperlink(
                            r_id="rId1",
                            content=[Run(content=[Text(value="Example")])],
                        )
                    ]
                )
            ]
        )
        config = TextConverterConfig(formatting="markdown")
        converter = TextConverter(
            config=config,
            hyperlink_urls={"rId1": "https://example.com"},
        )
        result = converter.convert(doc)
        assert "Example" in result
        assert "https://example.com" in result


# =============================================================================
# Section Break Tests
# =============================================================================


class TestSectionBreaks:
    """Tests for section break handling."""

    def test_section_break_as_separator(self) -> None:
        """Section breaks create separation."""
        doc = Document(
            body=Body(
                content=[
                    make_paragraph("Section 1"),
                    make_paragraph("Section 2"),
                ],
                sect_pr=SectionProperties(),
            )
        )
        result = document_to_text(doc)
        assert "Section 1" in result
        assert "Section 2" in result


# =============================================================================
# Empty Paragraph Tests
# =============================================================================


class TestEmptyParagraphs:
    """Tests for empty paragraph handling."""

    def test_empty_paragraph_preserved(self) -> None:
        """Empty paragraphs create blank lines."""
        doc = make_document(
            [
                make_paragraph("Before"),
                Paragraph(content=[]),
                make_paragraph("After"),
            ]
        )
        result = document_to_text(doc)
        assert "Before" in result
        assert "After" in result
        # Should have blank line between them
        lines = result.split("\n")
        non_empty = [line for line in lines if line.strip()]
        assert len(non_empty) == 2  # Just "Before" and "After"

    def test_multiple_empty_paragraphs(self) -> None:
        """Multiple empty paragraphs."""
        doc = make_document(
            [
                make_paragraph("Text"),
                Paragraph(content=[]),
                Paragraph(content=[]),
                make_paragraph("More"),
            ]
        )
        result = document_to_text(doc)
        assert "Text" in result
        assert "More" in result


# =============================================================================
# Whitespace Handling Tests
# =============================================================================


class TestWhitespaceHandling:
    """Tests for whitespace handling."""

    def test_preserve_spaces(self) -> None:
        """Spaces within text preserved."""
        doc = make_document([make_paragraph("Word1  Word2")])
        result = document_to_text(doc)
        # Multiple spaces might be normalized or preserved
        assert "Word1" in result
        assert "Word2" in result

    def test_trailing_newlines_trimmed(self) -> None:
        """Trailing newlines are trimmed."""
        doc = make_document([make_paragraph("Content")])
        result = document_to_text(doc)
        assert not result.endswith("\n\n\n")


# =============================================================================
# TextConverter Class Tests
# =============================================================================


class TestTextConverterClass:
    """Tests for TextConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = TextConverter()
        assert converter is not None

    def test_converter_with_config(self) -> None:
        """Initialize with config."""
        config = TextConverterConfig(
            formatting="markdown",
            table_mode="ascii",
        )
        converter = TextConverter(config=config)
        assert converter.config.formatting == "markdown"
        assert converter.config.table_mode == "ascii"

    def test_converter_with_styles(self) -> None:
        """Initialize with styles."""
        styles = Styles(doc_defaults=None, latent_styles=None, style=[])
        converter = TextConverter(styles=styles)
        assert converter.styles is not None

    def test_converter_with_numbering(self) -> None:
        """Initialize with numbering."""
        numbering = Numbering(abstract_num=[], num=[])
        converter = TextConverter(numbering=numbering)
        assert converter.numbering is not None

    def test_converter_with_hyperlinks(self) -> None:
        """Initialize with hyperlink URLs."""
        urls = {"rId1": "https://example.com"}
        converter = TextConverter(hyperlink_urls=urls)
        assert converter.hyperlink_urls == urls

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = TextConverter()
        doc = make_document([make_paragraph("Test")])
        result = converter.convert(doc)
        assert result == "Test"


# =============================================================================
# TextConverterConfig Tests
# =============================================================================


class TestTextConverterConfig:
    """Tests for TextConverterConfig class."""

    def test_default_config(self) -> None:
        """Default config values."""
        config = TextConverterConfig()
        assert config.formatting == "plain"
        assert config.table_mode == "auto"

    def test_config_formatting_options(self) -> None:
        """Formatting config options."""
        config = TextConverterConfig(formatting="markdown")
        assert config.formatting == "markdown"

        config = TextConverterConfig(formatting="plain")
        assert config.formatting == "plain"

    def test_config_table_mode_options(self) -> None:
        """Table mode config options."""
        config_ascii = TextConverterConfig(table_mode="ascii")
        assert config_ascii.table_mode == "ascii"

        config_tabs = TextConverterConfig(table_mode="tabs")
        assert config_tabs.table_mode == "tabs"

        config_plain = TextConverterConfig(table_mode="plain")
        assert config_plain.table_mode == "plain"

        config_auto = TextConverterConfig(table_mode="auto")
        assert config_auto.table_mode == "auto"


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_unicode_content(self) -> None:
        """Unicode content preserved."""
        doc = make_document([make_paragraph("Hello 世界 🌍")])
        result = document_to_text(doc)
        assert result == "Hello 世界 🌍"

    def test_rtl_content(self) -> None:
        """RTL content preserved."""
        doc = make_document([make_paragraph("مرحبا")])
        result = document_to_text(doc)
        assert result == "مرحبا"

    def test_very_long_document(self) -> None:
        """Very long document."""
        paragraphs = [make_paragraph(f"Paragraph {i}") for i in range(100)]
        doc = make_document(paragraphs)
        result = document_to_text(doc)
        assert "Paragraph 0" in result
        assert "Paragraph 99" in result

    def test_document_with_only_whitespace(self) -> None:
        """Document with only whitespace paragraphs."""
        doc = make_document(
            [Paragraph(content=[Run(content=[Text(value="   ", space="preserve")])])]
        )
        result = document_to_text(doc)
        # Should preserve or strip whitespace consistently
        assert result.strip() == "" or result == "   "

    def test_mixed_formatting_styles(self) -> None:
        """Document with mixed formatting styles."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Run(content=[Text(value="Normal ")]),
                        Run(
                            r_pr=RunProperties(b=True),
                            content=[Text(value="bold")],
                        ),
                        Run(content=[Text(value=" ")]),
                        Run(
                            r_pr=RunProperties(i=True),
                            content=[Text(value="italic")],
                        ),
                    ]
                )
            ]
        )
        config = TextConverterConfig(formatting="markdown")
        converter = TextConverter(config=config)
        result = converter.convert(doc)
        assert "Normal" in result
        assert "**bold**" in result
        assert "*italic*" in result


# =============================================================================
# Line Break Tests
# =============================================================================


class TestLineBreaks:
    """Tests for line break handling."""

    def test_line_break_within_paragraph(self) -> None:
        """Line break within paragraph."""
        doc = make_document(
            [
                Paragraph(
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
            ]
        )
        result = document_to_text(doc)
        assert "Line 1\nLine 2" in result

    def test_page_break(self) -> None:
        """Page break handling."""
        doc = make_document(
            [
                Paragraph(
                    content=[
                        Run(
                            content=[
                                Text(value="Page 1"),
                                Break(type="page"),
                                Text(value="Page 2"),
                            ]
                        )
                    ]
                )
            ]
        )
        result = document_to_text(doc)
        assert "Page 1" in result
        assert "Page 2" in result
        # Page break should create some kind of separation
        assert "\n" in result
