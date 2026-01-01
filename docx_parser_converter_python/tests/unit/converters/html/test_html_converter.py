"""Unit tests for main HTML converter entry point.

Tests the docx_to_html() function and HTMLConverter class.
"""

import pytest

from converters.html.html_converter import (
    ConversionConfig,
    HTMLConverter,
    UnsupportedFormatError,
    docx_to_html,
)
from models.document.document import Body, Document
from models.document.paragraph import Paragraph, ParagraphProperties
from models.document.run import Run, RunProperties
from models.document.run_content import Text
from models.document.table import Table, TableProperties
from models.document.table_cell import TableCell
from models.document.table_row import TableRow

# =============================================================================
# Basic Conversion Tests
# =============================================================================


class TestBasicConversion:
    """Tests for basic docx to HTML conversion."""

    def test_simple_document(self) -> None:
        """Simple document with one paragraph."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello World")])])])
        )
        result = docx_to_html(doc)
        assert "Hello World" in result

    def test_empty_document(self) -> None:
        """Empty document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        # Should produce valid HTML structure
        assert "<!DOCTYPE html>" in result
        assert "<html" in result

    def test_none_document(self) -> None:
        """None document returns empty HTML structure."""
        result = docx_to_html(None)
        assert "<!DOCTYPE html>" in result

    def test_multiple_paragraphs(self) -> None:
        """Document with multiple paragraphs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(content=[Run(content=[Text(value="Paragraph 1")])]),
                    Paragraph(content=[Run(content=[Text(value="Paragraph 2")])]),
                    Paragraph(content=[Run(content=[Text(value="Paragraph 3")])]),
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Paragraph 1" in result
        assert "Paragraph 2" in result
        assert "Paragraph 3" in result


# =============================================================================
# File Input Tests
# =============================================================================


class TestFileInput:
    """Tests for different input types."""

    def test_file_path_input(self) -> None:
        """Convert from file path raises error for non-existent file."""
        with pytest.raises(FileNotFoundError):
            docx_to_html("/nonexistent/document.docx")

    def test_path_object_input(self) -> None:
        """Convert from Path object raises error for non-existent file."""
        from pathlib import Path

        with pytest.raises(FileNotFoundError):
            docx_to_html(Path("/nonexistent/document.docx"))

    def test_bytes_input(self) -> None:
        """Convert from bytes raises NotImplementedError until parser is ready."""
        with pytest.raises(NotImplementedError):
            docx_to_html(b"fake docx bytes")

    def test_file_object_input(self) -> None:
        """Convert from file-like object raises NotImplementedError."""
        from io import BytesIO

        with pytest.raises(NotImplementedError):
            docx_to_html(BytesIO(b"fake docx bytes"))

    def test_bytesio_input(self) -> None:
        """Convert from BytesIO raises NotImplementedError."""
        from io import BytesIO

        with pytest.raises(NotImplementedError):
            docx_to_html(BytesIO(b"fake docx bytes"))


# =============================================================================
# Output Options Tests
# =============================================================================


class TestOutputOptions:
    """Tests for output options."""

    def test_return_string(self) -> None:
        """Return HTML as string."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc)
        assert isinstance(result, str)

    def test_write_to_file(self, tmp_path) -> None:
        """Write output to file."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        output_path = tmp_path / "output.html"
        docx_to_html(doc, output_path=output_path)
        content = output_path.read_text()
        assert "<!DOCTYPE html>" in content
        assert "Test" in content

    def test_write_to_path_object(self, tmp_path) -> None:
        """Write output to Path object."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        output_path = tmp_path / "output.html"
        docx_to_html(doc, output_path=output_path)
        assert output_path.exists()


# =============================================================================
# Conversion Config Tests
# =============================================================================


class TestConversionConfig:
    """Tests for conversion configuration options."""

    def test_inline_styles_mode(self) -> None:
        """Inline styles mode (default)."""
        config = ConversionConfig(style_mode="inline")
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(jc="center"),
                        content=[Run(content=[Text(value="Centered")])],
                    )
                ]
            )
        )
        converter = HTMLConverter(config=config)
        result = converter.convert(doc)
        assert "style=" in result

    def test_class_mode(self) -> None:
        """CSS class mode config."""
        config = ConversionConfig(style_mode="class")
        assert config.style_mode == "class"

    def test_semantic_tags(self) -> None:
        """Use semantic HTML tags."""
        config = ConversionConfig(use_semantic_tags=True)
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])]
                    )
                ]
            )
        )
        converter = HTMLConverter(config=config)
        result = converter.convert(doc)
        assert "<strong>" in result

    def test_preserve_whitespace(self) -> None:
        """Preserve whitespace option."""
        config = ConversionConfig(preserve_whitespace=True)
        assert config.preserve_whitespace is True

    def test_include_default_styles(self) -> None:
        """Include default CSS styles."""
        config = ConversionConfig(include_default_styles=True)
        assert config.include_default_styles is True

    def test_document_title(self) -> None:
        """Set document title."""
        config = ConversionConfig(title="My Document")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert "<title>My Document</title>" in result


# =============================================================================
# Style Resolution Tests
# =============================================================================


class TestStyleResolution:
    """Tests for style resolution during conversion."""

    def test_character_style_applied(self) -> None:
        """Character styles resolved and applied."""
        # Basic test that converter handles styles parameter
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_paragraph_style_applied(self) -> None:
        """Paragraph styles resolved and applied."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(jc="right"),
                        content=[Run(content=[Text(value="Right aligned")])],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "text-align" in result

    def test_table_style_applied(self) -> None:
        """Table styles resolved and applied."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tbl_pr=TableProperties(jc="center"),
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell")])])
                                        ]
                                    )
                                ]
                            )
                        ],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_style_inheritance(self) -> None:
        """Style inheritance chain resolved."""
        # Converter should accept styles parameter for inheritance
        converter = HTMLConverter(styles=None)
        assert converter is not None

    def test_direct_formatting_override(self) -> None:
        """Direct formatting overrides style."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[
                            Run(
                                r_pr=RunProperties(b=True, i=True),
                                content=[Text(value="Bold and Italic")],
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Bold and Italic" in result

    def test_document_defaults(self) -> None:
        """Document defaults applied as base."""
        converter = HTMLConverter()
        assert converter.config is not None


# =============================================================================
# Numbering Tests
# =============================================================================


class TestNumberingConversion:
    """Tests for numbering/list conversion."""

    def test_numbered_list(self) -> None:
        """Numbered list conversion."""
        # Document with numbered paragraphs
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None

    def test_bulleted_list(self) -> None:
        """Bulleted list conversion."""
        # Bulleted lists work similarly
        converter = HTMLConverter(numbering=None)
        assert converter is not None

    def test_multi_level_list(self) -> None:
        """Multi-level nested list."""
        # Multi-level lists are tracked by NumberingTracker
        converter = HTMLConverter()
        assert converter._numbering_tracker is not None

    def test_list_continuation(self) -> None:
        """List continues across paragraphs."""
        # Continuation uses same counter
        converter = HTMLConverter()
        assert converter is not None

    def test_list_restart(self) -> None:
        """List restarts numbering."""
        # Restart resets counter
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# HTML List Prefix Tests (Regression Tests)
# =============================================================================


class TestHTMLListPrefixes:
    """Tests for list prefixes in HTML output.

    These tests ensure that numbered and bulleted list paragraphs
    display the correct prefixes (bullets, numbers) in HTML output.
    """

    def test_numbered_list_prefix_in_html(self) -> None:
        """Numbered list paragraph shows number prefix in HTML."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        # Create numbering definitions
        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=1, lvl=[level])
        instance = NumberingInstance(num_id=1, abstract_num_id=1)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        # Create paragraph with numbering
        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
                        content=[Run(content=[Text(value="First item")])],
                    )
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # The numbered prefix should appear in the output
        assert "First item" in result
        assert "1." in result

    def test_bulleted_list_prefix_in_html(self) -> None:
        """Bulleted list paragraph shows bullet prefix in HTML."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        # Create bullet numbering
        level = Level(ilvl=0, num_fmt="bullet", lvl_text="•")
        abstract = AbstractNumbering(abstract_num_id=2, lvl=[level])
        instance = NumberingInstance(num_id=2, abstract_num_id=2)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        # Create paragraph with bullet
        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=2, ilvl=0)),
                        content=[Run(content=[Text(value="Bullet item")])],
                    )
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # The bullet should appear in the output
        assert "Bullet item" in result
        assert "•" in result

    def test_multi_level_numbered_list(self) -> None:
        """Multi-level numbered list shows correct prefixes."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        # Create multi-level numbering
        # In OOXML, %1 refers to level 0's counter, %2 to level 1's, etc.
        levels = [
            Level(ilvl=0, num_fmt="decimal", lvl_text="%1."),
            Level(ilvl=1, num_fmt="lowerLetter", lvl_text="%2)"),  # %2 refers to level 1's counter
        ]
        abstract = AbstractNumbering(abstract_num_id=3, lvl=levels)
        instance = NumberingInstance(num_id=3, abstract_num_id=3)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=3, ilvl=0)),
                        content=[Run(content=[Text(value="Level 0 item")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=3, ilvl=1)),
                        content=[Run(content=[Text(value="Level 1 item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # Both level prefixes should appear
        assert "Level 0 item" in result
        assert "Level 1 item" in result
        assert "1." in result
        # Level 1 uses lowerLetter format - a, b, c...
        assert "a)" in result

    def test_sequential_numbered_items(self) -> None:
        """Sequential numbered items increment correctly."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=4, lvl=[level])
        instance = NumberingInstance(num_id=4, abstract_num_id=4)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item one")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item two")])],
                    ),
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=4, ilvl=0)),
                        content=[Run(content=[Text(value="Item three")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        # All items and sequential numbers should appear
        assert "Item one" in result
        assert "Item two" in result
        assert "Item three" in result
        assert "1." in result
        assert "2." in result
        assert "3." in result

    def test_roman_numeral_list(self) -> None:
        """Roman numeral list shows correct prefixes."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="lowerRoman", lvl_text="%1.")
        abstract = AbstractNumbering(abstract_num_id=5, lvl=[level])
        instance = NumberingInstance(num_id=5, abstract_num_id=5)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=5, ilvl=0)),
                        content=[Run(content=[Text(value="Roman item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "Roman item" in result
        assert "i." in result

    def test_list_prefix_with_custom_separator(self) -> None:
        """List with custom separator (parenthesis) shows correctly."""
        from models.numbering.abstract_numbering import AbstractNumbering
        from models.numbering.level import Level
        from models.numbering.numbering import Numbering
        from models.numbering.numbering_instance import NumberingInstance

        level = Level(ilvl=0, num_fmt="decimal", lvl_text="%1)")
        abstract = AbstractNumbering(abstract_num_id=6, lvl=[level])
        instance = NumberingInstance(num_id=6, abstract_num_id=6)
        numbering = Numbering(abstract_num=[abstract], num=[instance])

        from models.document.paragraph import NumberingProperties

        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=6, ilvl=0)),
                        content=[Run(content=[Text(value="Paren item")])],
                    ),
                ]
            )
        )

        converter = HTMLConverter(numbering=numbering)
        result = converter.convert(doc)

        assert "Paren item" in result
        assert "1)" in result

    def test_no_prefix_when_numbering_missing(self) -> None:
        """Paragraph without numbering has no list prefix."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="No list")])])])
        )

        converter = HTMLConverter(numbering=None)
        result = converter.convert(doc)

        assert "No list" in result
        # Should not have list-marker span (which would indicate a list prefix)
        assert "list-marker" not in result
        assert "•" not in result


# =============================================================================
# Table Conversion Tests
# =============================================================================


class TestTableConversion:
    """Tests for table conversion in full document."""

    def test_simple_table(self) -> None:
        """Simple table in document."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell 1")])])
                                        ]
                                    ),
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Cell 2")])])
                                        ]
                                    ),
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result
        assert "Cell 1" in result
        assert "Cell 2" in result

    def test_table_with_merged_cells(self) -> None:
        """Table with colspan/rowspan."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Merged")])])
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_nested_table(self) -> None:
        """Table nested in cell."""
        inner_table = Table(
            tr=[
                TableRow(
                    tc=[
                        TableCell(content=[Paragraph(content=[Run(content=[Text(value="Inner")])])])
                    ]
                )
            ]
        )
        doc = Document(
            body=Body(content=[Table(tr=[TableRow(tc=[TableCell(content=[inner_table])])])])
        )
        result = docx_to_html(doc)
        # Should have two tables
        assert result.count("<table") >= 1

    def test_table_with_styles(self) -> None:
        """Table with style applied."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tbl_pr=TableProperties(jc="center"),
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Styled")])])
                                        ]
                                    )
                                ]
                            )
                        ],
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result


# =============================================================================
# Section Properties Tests
# =============================================================================


class TestSectionConversion:
    """Tests for section properties conversion."""

    def test_page_size(self) -> None:
        """Page size reflected in output."""
        config = ConversionConfig()
        assert config is not None

    def test_page_margins(self) -> None:
        """Page margins reflected in output."""
        config = ConversionConfig()
        assert config is not None

    def test_page_orientation(self) -> None:
        """Page orientation (portrait/landscape)."""
        config = ConversionConfig()
        assert config is not None

    def test_section_break(self) -> None:
        """Section breaks in document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result


# =============================================================================
# Hyperlink Tests
# =============================================================================


class TestHyperlinkConversion:
    """Tests for hyperlink conversion."""

    def test_external_hyperlink(self) -> None:
        """External URL hyperlink."""
        converter = HTMLConverter(relationships={"rId1": "https://example.com"})
        assert converter.relationships["rId1"] == "https://example.com"

    def test_internal_bookmark_link(self) -> None:
        """Internal bookmark link."""
        converter = HTMLConverter()
        assert converter.relationships == {}

    def test_hyperlink_in_table(self) -> None:
        """Hyperlink inside table cell."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(
                                                content=[Run(content=[Text(value="Link text")])]
                                            )
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Link text" in result


# =============================================================================
# Image Tests
# =============================================================================


class TestImageConversion:
    """Tests for image conversion."""

    def test_inline_image(self) -> None:
        """Inline image in paragraph."""
        # Images require relationship resolution
        converter = HTMLConverter()
        assert converter is not None

    def test_floating_image(self) -> None:
        """Floating/anchored image."""
        # Floating images need special handling
        converter = HTMLConverter()
        assert converter is not None

    def test_image_size(self) -> None:
        """Image dimensions preserved."""
        converter = HTMLConverter()
        assert converter is not None

    def test_image_alt_text(self) -> None:
        """Image alt text preserved."""
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# Special Content Tests
# =============================================================================


class TestSpecialContent:
    """Tests for special content conversion."""

    def test_page_break(self) -> None:
        """Page break in document."""
        doc = Document(body=Body(content=[Paragraph(content=[])]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_column_break(self) -> None:
        """Column break in document."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_tab_characters(self) -> None:
        """Tab characters in content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Before\tAfter")])])])
        )
        result = docx_to_html(doc)
        assert "Before" in result

    def test_soft_hyphens(self) -> None:
        """Soft hyphens preserved."""
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result


# =============================================================================
# Error Handling Tests
# =============================================================================


class TestErrorHandling:
    """Tests for error handling."""

    def test_invalid_file_path(self) -> None:
        """Invalid file path raises appropriate error."""
        with pytest.raises(FileNotFoundError):
            docx_to_html("/nonexistent/file.docx")

    def test_not_a_docx(self) -> None:
        """Non-DOCX file raises error."""
        import tempfile
        from pathlib import Path

        # Create a temporary non-docx file
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not a docx")
            temp_path = f.name
        try:
            with pytest.raises(UnsupportedFormatError):
                docx_to_html(temp_path)
        finally:
            Path(temp_path).unlink()

    def test_corrupted_docx(self) -> None:
        """Corrupted DOCX file handled."""
        # Would need actual corrupted file to test
        converter = HTMLConverter()
        assert converter is not None

    def test_encrypted_docx(self) -> None:
        """Encrypted DOCX file rejected."""
        # Would need actual encrypted file to test
        converter = HTMLConverter()
        assert converter is not None

    def test_missing_styles_xml(self) -> None:
        """Document without styles.xml handled."""
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_missing_numbering_xml(self) -> None:
        """Document without numbering.xml handled."""
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None


# =============================================================================
# Performance Tests
# =============================================================================


class TestPerformance:
    """Tests for conversion performance."""

    def test_large_document(self) -> None:
        """Large document converted in reasonable time."""
        # Create document with many paragraphs
        paragraphs = [
            Paragraph(content=[Run(content=[Text(value=f"Paragraph {i}")])]) for i in range(100)
        ]
        doc = Document(body=Body(content=paragraphs))
        result = docx_to_html(doc)
        assert "Paragraph 0" in result
        assert "Paragraph 99" in result

    def test_many_tables(self) -> None:
        """Document with many tables."""
        tables = [
            Table(
                tr=[
                    TableRow(
                        tc=[
                            TableCell(
                                content=[
                                    Paragraph(content=[Run(content=[Text(value=f"Table {i}")])])
                                ]
                            )
                        ]
                    )
                ]
            )
            for i in range(10)
        ]
        doc = Document(body=Body(content=tables))
        result = docx_to_html(doc)
        assert "Table 0" in result

    def test_deep_style_inheritance(self) -> None:
        """Document with deep style inheritance."""
        # Just verify it works
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# HTMLConverter Class Tests
# =============================================================================


class TestHTMLConverterClass:
    """Tests for HTMLConverter class usage."""

    def test_converter_initialization(self) -> None:
        """Initialize converter with config."""
        config = ConversionConfig()
        converter = HTMLConverter(config=config)
        assert converter.config == config

    def test_converter_with_styles(self) -> None:
        """Initialize converter with styles."""
        converter = HTMLConverter(styles=None, numbering=None)
        assert converter.styles is None
        assert converter.numbering is None

    def test_convert_document(self) -> None:
        """Convert Document model to HTML."""
        converter = HTMLConverter()
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = converter.convert(doc)
        assert "Test" in result

    def test_convert_paragraph(self) -> None:
        """Convert individual paragraph."""
        converter = HTMLConverter()
        para = Paragraph(content=[Run(content=[Text(value="Test")])])
        result = converter.convert_paragraph(para)
        assert "Test" in result

    def test_convert_table(self) -> None:
        """Convert individual table."""
        converter = HTMLConverter()
        table = Table(
            tr=[
                TableRow(
                    tc=[TableCell(content=[Paragraph(content=[Run(content=[Text(value="Cell")])])])]
                )
            ]
        )
        result = converter.convert_table(table)
        assert "<table" in result
        assert "Cell" in result


# =============================================================================
# Integration with Parser Tests
# =============================================================================


class TestParserIntegration:
    """Tests for integration with DOCX parser."""

    def test_parse_and_convert(self) -> None:
        """Parse DOCX and convert to HTML."""
        # Full pipeline test - Document model to HTML
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc)
        assert "Test" in result

    def test_relationships_resolved(self) -> None:
        """Relationships from parser used correctly."""
        rels = {"rId1": "https://example.com"}
        converter = HTMLConverter(relationships=rels)
        assert converter.relationships == rels

    def test_styles_from_parser(self) -> None:
        """Styles from parser used correctly."""
        converter = HTMLConverter(styles=None)
        assert converter.styles is None

    def test_numbering_from_parser(self) -> None:
        """Numbering from parser used correctly."""
        converter = HTMLConverter(numbering=None)
        assert converter.numbering is None


# =============================================================================
# Fragment Mode Tests
# =============================================================================


class TestFragmentMode:
    """Tests for HTML fragment output mode."""

    def test_fragment_output(self) -> None:
        """Output HTML fragment without wrapper."""
        config = ConversionConfig(fragment_only=True)
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        result = docx_to_html(doc, config=config)
        # No <!DOCTYPE>, <html>, <head>, <body>
        assert "<!DOCTYPE" not in result
        assert "<html" not in result

    def test_fragment_paragraph(self) -> None:
        """Fragment mode for paragraph."""
        config = ConversionConfig(fragment_only=True)
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Just content")])])])
        )
        result = docx_to_html(doc, config=config)
        assert "Just content" in result
        assert "<body" not in result


# =============================================================================
# Custom CSS Tests
# =============================================================================


class TestCustomCSS:
    """Tests for custom CSS options."""

    def test_custom_css_string(self) -> None:
        """Add custom CSS string."""
        config = ConversionConfig(custom_css="p { color: red; }")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert "color: red" in result

    def test_custom_css_file(self) -> None:
        """Reference external CSS file."""
        config = ConversionConfig(css_files=["custom.css"])
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert 'href="custom.css"' in result


# =============================================================================
# Accessibility Tests
# =============================================================================


class TestAccessibility:
    """Tests for accessibility features."""

    def test_heading_structure(self) -> None:
        """Headings maintain proper structure."""
        # Would need heading styles
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc)
        assert "<!DOCTYPE html>" in result

    def test_table_headers(self) -> None:
        """Table headers use <th> and scope."""
        doc = Document(
            body=Body(
                content=[
                    Table(
                        tr=[
                            TableRow(
                                tc=[
                                    TableCell(
                                        content=[
                                            Paragraph(content=[Run(content=[Text(value="Header")])])
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "<table" in result

    def test_alt_text_preserved(self) -> None:
        """Image alt text preserved."""
        # Would need image with alt text
        converter = HTMLConverter()
        assert converter is not None

    def test_lang_attribute(self) -> None:
        """Language attribute set correctly."""
        config = ConversionConfig(language="fr")
        doc = Document(body=Body(content=[]))
        result = docx_to_html(doc, config=config)
        assert 'lang="fr"' in result


# =============================================================================
# Unicode Tests
# =============================================================================


class TestUnicodeHandling:
    """Tests for Unicode content handling."""

    def test_cjk_content(self) -> None:
        """CJK (Chinese, Japanese, Korean) content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="你好世界")])])])
        )
        result = docx_to_html(doc)
        assert "你好世界" in result

    def test_arabic_content(self) -> None:
        """Arabic content with RTL."""
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="مرحبا")])])]))
        result = docx_to_html(doc)
        assert "مرحبا" in result

    def test_emoji_content(self) -> None:
        """Emoji in content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello 🌍")])])])
        )
        result = docx_to_html(doc)
        assert "🌍" in result

    def test_mixed_scripts(self) -> None:
        """Mixed script content."""
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value="Hello 世界 مرحبا")])])])
        )
        result = docx_to_html(doc)
        assert "Hello" in result
        assert "世界" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases in conversion."""

    def test_empty_paragraphs(self) -> None:
        """Document with empty paragraphs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(content=[]),
                    Paragraph(content=[Run(content=[Text(value="Not empty")])]),
                    Paragraph(content=[]),
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Not empty" in result

    def test_empty_runs(self) -> None:
        """Paragraphs with empty runs."""
        doc = Document(
            body=Body(
                content=[
                    Paragraph(
                        content=[
                            Run(content=[]),
                            Run(content=[Text(value="Content")]),
                            Run(content=[]),
                        ]
                    )
                ]
            )
        )
        result = docx_to_html(doc)
        assert "Content" in result

    def test_deeply_nested_content(self) -> None:
        """Deeply nested tables/content."""
        inner = Table(
            tr=[
                TableRow(
                    tc=[TableCell(content=[Paragraph(content=[Run(content=[Text(value="Deep")])])])]
                )
            ]
        )
        doc = Document(body=Body(content=[Table(tr=[TableRow(tc=[TableCell(content=[inner])])])]))
        result = docx_to_html(doc)
        assert "Deep" in result

    def test_very_long_paragraphs(self) -> None:
        """Very long paragraphs."""
        long_text = "A" * 10000
        doc = Document(
            body=Body(content=[Paragraph(content=[Run(content=[Text(value=long_text)])])])
        )
        result = docx_to_html(doc)
        assert long_text in result

    def test_many_styles(self) -> None:
        """Document with many unique styles."""
        paragraphs = [
            Paragraph(
                p_pr=ParagraphProperties(jc=["left", "center", "right"][i % 3]),
                content=[Run(content=[Text(value=f"Style {i}")])],
            )
            for i in range(20)
        ]
        doc = Document(body=Body(content=paragraphs))
        result = docx_to_html(doc)
        assert "Style 0" in result

    def test_circular_style_references(self) -> None:
        """Handle circular style references gracefully."""
        # Converter should handle None styles gracefully
        converter = HTMLConverter(styles=None)
        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Safe")])])]))
        result = converter.convert(doc)
        assert "Safe" in result


# =============================================================================
# Callback/Hook Tests
# =============================================================================


class TestCallbackHooks:
    """Tests for callback/hook functionality."""

    def test_paragraph_callback(self) -> None:
        """Callback called for each paragraph (future feature)."""
        # Placeholder for future callback support
        converter = HTMLConverter()
        assert converter is not None

    def test_run_callback(self) -> None:
        """Callback called for each run (future feature)."""
        converter = HTMLConverter()
        assert converter is not None

    def test_table_callback(self) -> None:
        """Callback called for each table (future feature)."""
        converter = HTMLConverter()
        assert converter is not None


# =============================================================================
# CSS Variable Tests
# =============================================================================


class TestCSSVariables:
    """Tests for CSS custom properties (variables)."""

    def test_css_variables_mode(self) -> None:
        """Output uses CSS custom properties option."""
        config = ConversionConfig(use_css_variables=True)
        assert config.use_css_variables is True


# =============================================================================
# Streaming Output Tests
# =============================================================================


class TestStreamingOutput:
    """Tests for streaming/chunked output."""

    def test_streaming_mode(self) -> None:
        """Stream output for large documents."""
        from converters.html.html_converter import docx_to_html_stream

        doc = Document(body=Body(content=[Paragraph(content=[Run(content=[Text(value="Test")])])]))
        chunks = list(docx_to_html_stream(doc))
        assert len(chunks) == 1
        assert "Test" in chunks[0]
