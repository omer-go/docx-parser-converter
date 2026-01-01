"""Unit tests for the public API module.

Tests the API functions and ConversionConfig without actual DOCX files.
"""

import tempfile
from pathlib import Path

from api import ConversionConfig, docx_to_html, docx_to_text

from models.document.document import Body, Document
from models.document.paragraph import Paragraph
from models.document.run import Run
from models.document.run_content import Text
from models.document.table import Table
from models.document.table_cell import TableCell
from models.document.table_row import TableRow

# =============================================================================
# Helper Functions
# =============================================================================


def make_paragraph(text: str) -> Paragraph:
    """Create a simple paragraph with text."""
    return Paragraph(content=[Run(content=[Text(value=text)])])


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
# ConversionConfig Tests
# =============================================================================


class TestConversionConfigDefaults:
    """Tests for ConversionConfig default values."""

    def test_default_style_mode(self) -> None:
        """Default style mode is inline."""
        config = ConversionConfig()
        assert config.style_mode == "inline"

    def test_default_use_semantic_tags(self) -> None:
        """Default is to use semantic tags."""
        config = ConversionConfig()
        assert config.use_semantic_tags is True

    def test_default_preserve_whitespace(self) -> None:
        """Default is not to preserve whitespace."""
        config = ConversionConfig()
        assert config.preserve_whitespace is False

    def test_default_include_default_styles(self) -> None:
        """Default is to include default styles."""
        config = ConversionConfig()
        assert config.include_default_styles is True

    def test_default_title(self) -> None:
        """Default title is empty."""
        config = ConversionConfig()
        assert config.title == ""

    def test_default_language(self) -> None:
        """Default language is English."""
        config = ConversionConfig()
        assert config.language == "en"

    def test_default_fragment_only(self) -> None:
        """Default is full document, not fragment."""
        config = ConversionConfig()
        assert config.fragment_only is False

    def test_default_custom_css(self) -> None:
        """Default custom CSS is None."""
        config = ConversionConfig()
        assert config.custom_css is None

    def test_default_css_files(self) -> None:
        """Default CSS files is empty list."""
        config = ConversionConfig()
        assert config.css_files == []

    def test_default_use_css_variables(self) -> None:
        """Default is not to use CSS variables."""
        config = ConversionConfig()
        assert config.use_css_variables is False

    def test_default_responsive(self) -> None:
        """Default is responsive design."""
        config = ConversionConfig()
        assert config.responsive is True

    def test_default_include_print_styles(self) -> None:
        """Default is not to include print styles."""
        config = ConversionConfig()
        assert config.include_print_styles is False

    def test_default_text_formatting(self) -> None:
        """Default text formatting is plain."""
        config = ConversionConfig()
        assert config.text_formatting == "plain"

    def test_default_table_mode(self) -> None:
        """Default table mode is auto."""
        config = ConversionConfig()
        assert config.table_mode == "auto"

    def test_default_paragraph_separator(self) -> None:
        """Default paragraph separator is double newline."""
        config = ConversionConfig()
        assert config.paragraph_separator == "\n\n"

    def test_default_preserve_empty_paragraphs(self) -> None:
        """Default is to preserve empty paragraphs."""
        config = ConversionConfig()
        assert config.preserve_empty_paragraphs is True


class TestConversionConfigCustomization:
    """Tests for ConversionConfig customization."""

    def test_custom_style_mode(self) -> None:
        """Custom style mode."""
        config = ConversionConfig(style_mode="class")
        assert config.style_mode == "class"

    def test_custom_semantic_tags(self) -> None:
        """Custom semantic tags setting."""
        config = ConversionConfig(use_semantic_tags=False)
        assert config.use_semantic_tags is False

    def test_custom_title(self) -> None:
        """Custom title."""
        config = ConversionConfig(title="My Document")
        assert config.title == "My Document"

    def test_custom_language(self) -> None:
        """Custom language."""
        config = ConversionConfig(language="de")
        assert config.language == "de"

    def test_custom_css(self) -> None:
        """Custom CSS."""
        config = ConversionConfig(custom_css="body { color: red; }")
        assert config.custom_css == "body { color: red; }"

    def test_custom_css_files(self) -> None:
        """Custom CSS files."""
        config = ConversionConfig(css_files=["style.css", "theme.css"])
        assert config.css_files == ["style.css", "theme.css"]

    def test_custom_text_formatting(self) -> None:
        """Custom text formatting."""
        config = ConversionConfig(text_formatting="markdown")
        assert config.text_formatting == "markdown"

    def test_custom_table_mode(self) -> None:
        """Custom table mode."""
        config = ConversionConfig(table_mode="ascii")
        assert config.table_mode == "ascii"

    def test_custom_paragraph_separator(self) -> None:
        """Custom paragraph separator."""
        config = ConversionConfig(paragraph_separator="\n")
        assert config.paragraph_separator == "\n"


# =============================================================================
# docx_to_html with Document Model Tests
# =============================================================================


class TestDocxToHtmlWithModel:
    """Tests for docx_to_html with Document model input."""

    def test_none_document(self) -> None:
        """None document returns empty HTML."""
        result = docx_to_html(None)

        assert isinstance(result, str)
        assert "<!DOCTYPE html>" in result

    def test_empty_document(self) -> None:
        """Empty document returns minimal HTML."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)

        assert isinstance(result, str)
        assert "<!DOCTYPE html>" in result

    def test_simple_paragraph_document(self) -> None:
        """Document with simple paragraph."""
        doc = make_document([make_paragraph("Hello World")])
        result = docx_to_html(doc)

        assert "Hello World" in result
        assert "<p" in result

    def test_multiple_paragraphs(self) -> None:
        """Document with multiple paragraphs."""
        doc = make_document(
            [
                make_paragraph("First paragraph"),
                make_paragraph("Second paragraph"),
            ]
        )
        result = docx_to_html(doc)

        assert "First paragraph" in result
        assert "Second paragraph" in result

    def test_document_with_table(self) -> None:
        """Document with table."""
        table = make_table([["A", "B"], ["C", "D"]])
        doc = make_document(tables=[table])
        result = docx_to_html(doc)

        assert "<table" in result
        assert "A" in result
        assert "D" in result

    def test_fragment_only_mode(self) -> None:
        """Fragment mode skips document wrapper."""
        doc = make_document([make_paragraph("Content")])
        config = ConversionConfig(fragment_only=True)
        result = docx_to_html(doc, config=config)

        assert "<!DOCTYPE html>" not in result
        assert "Content" in result

    def test_custom_title(self) -> None:
        """Custom title in output."""
        doc = make_document([make_paragraph("Content")])
        config = ConversionConfig(title="My Title")
        result = docx_to_html(doc, config=config)

        assert "<title>My Title</title>" in result


# =============================================================================
# docx_to_text with Document Model Tests
# =============================================================================


class TestDocxToTextWithModel:
    """Tests for docx_to_text with Document model input."""

    def test_none_document(self) -> None:
        """None document returns empty string."""
        result = docx_to_text(None)

        assert result == ""

    def test_empty_document(self) -> None:
        """Empty document returns empty string."""
        doc = Document(body=Body(content=[]))
        result = docx_to_text(doc)

        assert result == ""

    def test_simple_paragraph_document(self) -> None:
        """Document with simple paragraph."""
        doc = make_document([make_paragraph("Hello World")])
        result = docx_to_text(doc)

        assert result == "Hello World"

    def test_multiple_paragraphs(self) -> None:
        """Document with multiple paragraphs."""
        doc = make_document(
            [
                make_paragraph("First"),
                make_paragraph("Second"),
            ]
        )
        result = docx_to_text(doc)

        assert "First" in result
        assert "Second" in result

    def test_document_with_table(self) -> None:
        """Document with table."""
        table = make_table([["A", "B"]])
        doc = make_document(tables=[table])
        result = docx_to_text(doc)

        assert "A" in result
        assert "B" in result

    def test_markdown_mode(self) -> None:
        """Markdown formatting mode."""
        doc = make_document([make_paragraph("Text")])
        config = ConversionConfig(text_formatting="markdown")
        result = docx_to_text(doc, config=config)

        assert "Text" in result


# =============================================================================
# Output File Tests
# =============================================================================


class TestOutputFiles:
    """Tests for output file writing."""

    def test_html_output_file(self) -> None:
        """HTML output to file."""
        doc = make_document([make_paragraph("Content")])

        with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as f:
            output_path = f.name

        try:
            result = docx_to_html(doc, output_path=output_path)

            assert Path(output_path).exists()
            file_content = Path(output_path).read_text()
            assert file_content == result
        finally:
            Path(output_path).unlink()

    def test_text_output_file(self) -> None:
        """Text output to file."""
        doc = make_document([make_paragraph("Content")])

        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            output_path = f.name

        try:
            result = docx_to_text(doc, output_path=output_path)

            assert Path(output_path).exists()
            file_content = Path(output_path).read_text()
            assert file_content == result
        finally:
            Path(output_path).unlink()

    def test_output_path_as_path_object(self) -> None:
        """Output path as Path object."""
        doc = make_document([make_paragraph("Content")])

        with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as f:
            output_path = Path(f.name)

        try:
            docx_to_html(doc, output_path=output_path)
            assert output_path.exists()
        finally:
            output_path.unlink()


# =============================================================================
# Edge Cases
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_unicode_content(self) -> None:
        """Unicode content preserved."""
        doc = make_document([make_paragraph("Hello 世界 🌍")])

        html = docx_to_html(doc)
        text = docx_to_text(doc)

        assert "Hello 世界 🌍" in html
        assert "Hello 世界 🌍" in text

    def test_empty_paragraph(self) -> None:
        """Empty paragraph handling."""
        doc = make_document([Paragraph(content=[])])

        html = docx_to_html(doc)
        text = docx_to_text(doc)

        assert isinstance(html, str)
        assert isinstance(text, str)

    def test_whitespace_only_paragraph(self) -> None:
        """Whitespace-only paragraph."""
        doc = make_document([make_paragraph("   ")])

        html = docx_to_html(doc)
        text = docx_to_text(doc)

        assert isinstance(html, str)
        assert isinstance(text, str)

    def test_very_long_content(self) -> None:
        """Very long content handling."""
        long_text = "A" * 10000
        doc = make_document([make_paragraph(long_text)])

        html = docx_to_html(doc)
        text = docx_to_text(doc)

        assert long_text in html
        assert long_text in text


# =============================================================================
# API Consistency Tests
# =============================================================================


class TestApiConsistency:
    """Tests for API consistency between formats."""

    def test_same_config_type(self) -> None:
        """Same ConversionConfig works for both formats."""
        doc = make_document([make_paragraph("Content")])
        config = ConversionConfig(title="Test")

        html = docx_to_html(doc, config=config)
        text = docx_to_text(doc, config=config)

        assert len(html) > 0
        assert len(text) > 0

    def test_consistent_output_types(self) -> None:
        """Both functions return strings."""
        doc = make_document([make_paragraph("Content")])

        html = docx_to_html(doc)
        text = docx_to_text(doc)

        assert isinstance(html, str)
        assert isinstance(text, str)
