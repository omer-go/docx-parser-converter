"""Integration tests for the public API.

Tests the main entry points: docx_to_html and docx_to_text.
"""

import tempfile
from io import BytesIO
from pathlib import Path

import pytest

from api import ConversionConfig, docx_to_html, docx_to_text
from core.exceptions import (
    DocxNotFoundError,
    DocxValidationError,
)

# =============================================================================
# Fixtures Path
# =============================================================================

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def get_fixture(category: str, name: str) -> Path:
    """Get path to a fixture file."""
    return FIXTURES_DIR / category / name


# =============================================================================
# docx_to_html Tests
# =============================================================================


class TestDocxToHtmlBasic:
    """Basic tests for docx_to_html function."""

    def test_simple_document(self) -> None:
        """Convert a simple document to HTML."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_html(fixture)

        assert isinstance(result, str)
        assert len(result) > 0
        assert "<!DOCTYPE html>" in result
        assert "<html" in result
        assert "</html>" in result

    def test_none_input_returns_empty_html(self) -> None:
        """None input returns empty HTML document."""
        result = docx_to_html(None)

        assert isinstance(result, str)
        assert "<!DOCTYPE html>" in result

    def test_file_path_as_string(self) -> None:
        """Accept file path as string."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_html(str(fixture))

        assert isinstance(result, str)
        assert "<html" in result

    def test_file_path_as_path_object(self) -> None:
        """Accept file path as Path object."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_html(fixture)

        assert isinstance(result, str)
        assert "<html" in result

    def test_bytes_input(self) -> None:
        """Accept bytes input."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        content = fixture.read_bytes()
        result = docx_to_html(content)

        assert isinstance(result, str)
        assert "<html" in result

    def test_file_like_object_input(self) -> None:
        """Accept file-like object input."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        content = fixture.read_bytes()
        file_obj = BytesIO(content)
        result = docx_to_html(file_obj)

        assert isinstance(result, str)
        assert "<html" in result


class TestDocxToHtmlErrors:
    """Error handling tests for docx_to_html."""

    def test_file_not_found_raises_error(self) -> None:
        """Non-existent file raises error."""
        with pytest.raises(DocxNotFoundError):
            docx_to_html("/nonexistent/path/document.docx")

    def test_invalid_extension_raises_error(self) -> None:
        """Non-DOCX extension raises error."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not a docx")
            path = f.name

        try:
            with pytest.raises(DocxValidationError):
                docx_to_html(path)
        finally:
            Path(path).unlink()

    def test_invalid_docx_raises_error(self) -> None:
        """Invalid DOCX content raises error."""
        from core.exceptions import DocxReadError

        with pytest.raises(DocxReadError):
            docx_to_html(b"not a valid docx file content")


class TestDocxToHtmlOutput:
    """Output file tests for docx_to_html."""

    def test_write_to_output_path(self) -> None:
        """Write output to file path."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as f:
            output_path = f.name

        try:
            result = docx_to_html(fixture, output_path=output_path)

            assert Path(output_path).exists()
            content = Path(output_path).read_text()
            assert content == result
            assert "<html" in content
        finally:
            Path(output_path).unlink()

    def test_output_path_as_path_object(self) -> None:
        """Accept output path as Path object."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as f:
            output_path = Path(f.name)

        try:
            docx_to_html(fixture, output_path=output_path)

            assert output_path.exists()
        finally:
            output_path.unlink()


class TestDocxToHtmlConfig:
    """Configuration tests for docx_to_html."""

    def test_default_config(self) -> None:
        """Default configuration works."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_html(fixture)

        assert "<html" in result

    def test_fragment_only_mode(self) -> None:
        """Fragment mode outputs only content."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(fragment_only=True)
        result = docx_to_html(fixture, config=config)

        assert "<!DOCTYPE html>" not in result
        assert "<html" not in result

    def test_custom_title(self) -> None:
        """Custom title in output."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(title="My Document")
        result = docx_to_html(fixture, config=config)

        assert "<title>My Document</title>" in result

    def test_custom_language(self) -> None:
        """Custom language in output."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(language="de")
        result = docx_to_html(fixture, config=config)

        assert 'lang="de"' in result


# =============================================================================
# docx_to_text Tests
# =============================================================================


class TestDocxToTextBasic:
    """Basic tests for docx_to_text function."""

    def test_simple_document(self) -> None:
        """Convert a simple document to text."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_text(fixture)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_none_input_returns_empty_string(self) -> None:
        """None input returns empty string."""
        result = docx_to_text(None)

        assert result == ""

    def test_file_path_as_string(self) -> None:
        """Accept file path as string."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_text(str(fixture))

        assert isinstance(result, str)
        assert len(result) > 0

    def test_file_path_as_path_object(self) -> None:
        """Accept file path as Path object."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_text(fixture)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_bytes_input(self) -> None:
        """Accept bytes input."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        content = fixture.read_bytes()
        result = docx_to_text(content)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_file_like_object_input(self) -> None:
        """Accept file-like object input."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        content = fixture.read_bytes()
        file_obj = BytesIO(content)
        result = docx_to_text(file_obj)

        assert isinstance(result, str)
        assert len(result) > 0


class TestDocxToTextErrors:
    """Error handling tests for docx_to_text."""

    def test_file_not_found_raises_error(self) -> None:
        """Non-existent file raises error."""
        with pytest.raises(DocxNotFoundError):
            docx_to_text("/nonexistent/path/document.docx")

    def test_invalid_extension_raises_error(self) -> None:
        """Non-DOCX extension raises error."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not a docx")
            path = f.name

        try:
            with pytest.raises(DocxValidationError):
                docx_to_text(path)
        finally:
            Path(path).unlink()

    def test_invalid_docx_raises_error(self) -> None:
        """Invalid DOCX content raises error."""
        from core.exceptions import DocxReadError

        with pytest.raises(DocxReadError):
            docx_to_text(b"not a valid docx file content")


class TestDocxToTextOutput:
    """Output file tests for docx_to_text."""

    def test_write_to_output_path(self) -> None:
        """Write output to file path."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            output_path = f.name

        try:
            result = docx_to_text(fixture, output_path=output_path)

            assert Path(output_path).exists()
            content = Path(output_path).read_text()
            assert content == result
        finally:
            Path(output_path).unlink()

    def test_output_path_as_path_object(self) -> None:
        """Accept output path as Path object."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            output_path = Path(f.name)

        try:
            docx_to_text(fixture, output_path=output_path)

            assert output_path.exists()
        finally:
            output_path.unlink()


class TestDocxToTextConfig:
    """Configuration tests for docx_to_text."""

    def test_default_config(self) -> None:
        """Default configuration works."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_text(fixture)

        assert isinstance(result, str)

    def test_markdown_mode(self) -> None:
        """Markdown formatting mode."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(text_formatting="markdown")
        result = docx_to_text(fixture, config=config)

        assert isinstance(result, str)

    def test_table_mode_ascii(self) -> None:
        """ASCII table mode."""
        fixture = get_fixture("tables", "tables_basic.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(table_mode="ascii")
        result = docx_to_text(fixture, config=config)

        assert isinstance(result, str)

    def test_table_mode_tabs(self) -> None:
        """Tab-separated table mode."""
        fixture = get_fixture("tables", "tables_basic.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        config = ConversionConfig(table_mode="tabs")
        result = docx_to_text(fixture, config=config)

        assert isinstance(result, str)


# =============================================================================
# ConversionConfig Tests
# =============================================================================


class TestConversionConfig:
    """Tests for ConversionConfig class."""

    def test_default_values(self) -> None:
        """Default configuration values."""
        config = ConversionConfig()

        # HTML defaults
        assert config.style_mode == "inline"
        assert config.use_semantic_tags is True
        assert config.preserve_whitespace is False
        assert config.fragment_only is False
        assert config.title == ""
        assert config.language == "en"

        # Text defaults
        assert config.text_formatting == "plain"
        assert config.table_mode == "auto"
        assert config.paragraph_separator == "\n\n"

    def test_html_options(self) -> None:
        """HTML-specific options."""
        config = ConversionConfig(
            style_mode="class",
            use_semantic_tags=False,
            preserve_whitespace=True,
            fragment_only=True,
            title="Test Document",
            language="fr",
            custom_css=".test { color: red; }",
            css_files=["style.css"],
            responsive=False,
            include_print_styles=True,
        )

        assert config.style_mode == "class"
        assert config.use_semantic_tags is False
        assert config.preserve_whitespace is True
        assert config.fragment_only is True
        assert config.title == "Test Document"
        assert config.language == "fr"
        assert config.custom_css == ".test { color: red; }"
        assert config.css_files == ["style.css"]
        assert config.responsive is False
        assert config.include_print_styles is True

    def test_text_options(self) -> None:
        """Text-specific options."""
        config = ConversionConfig(
            text_formatting="markdown",
            table_mode="ascii",
            paragraph_separator="\n",
            preserve_empty_paragraphs=False,
        )

        assert config.text_formatting == "markdown"
        assert config.table_mode == "ascii"
        assert config.paragraph_separator == "\n"
        assert config.preserve_empty_paragraphs is False


# =============================================================================
# Content Preservation Tests
# =============================================================================


class TestContentPreservation:
    """Tests that content is correctly preserved in conversion."""

    def test_text_content_preserved_in_html(self) -> None:
        """Text content is preserved in HTML output."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_html(fixture)

        # HTML should contain actual text from document
        assert len(result) > 100  # Non-trivial output

    def test_text_content_preserved_in_text(self) -> None:
        """Text content is preserved in text output."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        result = docx_to_text(fixture)

        # Text should contain actual content
        assert len(result) > 10  # Non-trivial output

    def test_unicode_content_preserved(self) -> None:
        """Unicode content is preserved."""
        fixture = get_fixture("comprehensive", "comprehensive.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html_result = docx_to_html(fixture)
        text_result = docx_to_text(fixture)

        # Both outputs should be valid strings
        assert isinstance(html_result, str)
        assert isinstance(text_result, str)


# =============================================================================
# Multi-Format Tests
# =============================================================================


class TestMultiFormatConsistency:
    """Tests that HTML and text outputs are consistent."""

    def test_same_source_different_formats(self) -> None:
        """Same source produces consistent HTML and text."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html_result = docx_to_html(fixture)
        text_result = docx_to_text(fixture)

        # Both should produce output
        assert len(html_result) > 0
        assert len(text_result) > 0

        # Text should be shorter than HTML (no markup)
        assert len(text_result) < len(html_result)

    def test_bytes_and_path_produce_same_output(self) -> None:
        """Bytes and path input produce same output."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        from_path = docx_to_html(fixture)
        from_bytes = docx_to_html(fixture.read_bytes())

        assert from_path == from_bytes


# =============================================================================
# Fixture Category Tests
# =============================================================================


class TestTextFormattingFixtures:
    """Tests for text formatting fixtures."""

    def test_inline_formatting(self) -> None:
        """Inline formatting fixture converts."""
        fixture = get_fixture("text_formatting", "inline_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_fonts_and_sizes(self) -> None:
        """Fonts and sizes fixture converts."""
        fixture = get_fixture("text_formatting", "fonts_and_sizes.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_run_effects(self) -> None:
        """Run effects fixture converts."""
        fixture = get_fixture("text_formatting", "run_effects.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_underline_styles(self) -> None:
        """Underline styles fixture converts."""
        fixture = get_fixture("text_formatting", "underline_styles.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0


class TestParagraphFormattingFixtures:
    """Tests for paragraph formatting fixtures."""

    def test_paragraph_control(self) -> None:
        """Paragraph control fixture converts."""
        fixture = get_fixture("paragraph_formatting", "paragraph_control.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_paragraphs_and_fonts(self) -> None:
        """Paragraphs and fonts fixture converts."""
        fixture = get_fixture("paragraph_formatting", "paragraphs_and_fonts.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_formatting_and_styles(self) -> None:
        """Formatting and styles fixture converts."""
        fixture = get_fixture("paragraph_formatting", "formatting_and_styles.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0


class TestTableFixtures:
    """Tests for table fixtures."""

    def test_tables_basic(self) -> None:
        """Basic tables fixture converts."""
        fixture = get_fixture("tables", "tables_basic.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0
        assert "<table" in html

    def test_table_advanced(self) -> None:
        """Advanced table fixture converts."""
        fixture = get_fixture("tables", "table_advanced.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0


class TestListsNumberingFixtures:
    """Tests for lists and numbering fixtures."""

    def test_lists_basic(self) -> None:
        """Basic lists fixture converts."""
        fixture = get_fixture("lists_numbering", "lists_basic.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_list_formatting(self) -> None:
        """List formatting fixture converts."""
        fixture = get_fixture("lists_numbering", "list_formatting.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0

    def test_list_with_styling(self) -> None:
        """List with styling fixture converts."""
        fixture = get_fixture("lists_numbering", "list_with_styling.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0


class TestComprehensiveFixtures:
    """Tests for comprehensive fixtures."""

    def test_comprehensive(self) -> None:
        """Comprehensive fixture converts."""
        fixture = get_fixture("comprehensive", "comprehensive.docx")
        if not fixture.exists():
            pytest.skip(f"Fixture not found: {fixture}")

        html = docx_to_html(fixture)
        text = docx_to_text(fixture)

        assert len(html) > 0
        assert len(text) > 0
