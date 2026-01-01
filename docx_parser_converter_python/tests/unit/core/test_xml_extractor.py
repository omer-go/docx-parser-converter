"""Tests for xml_extractor module."""

from pathlib import Path

import pytest
from lxml.etree import _Element as Element

from core.constants import WORD_NS
from core.docx_reader import open_docx
from core.xml_extractor import (
    extract_document_xml,
    extract_external_hyperlinks,
    extract_numbering_xml,
    extract_relationships,
    extract_styles_xml,
    extract_xml,
    extract_xml_safe,
    get_body_element,
    iter_paragraphs,
    iter_tables,
)


class TestExtractXml:
    """Tests for extract_xml function."""

    def test_extract_document_xml(self, sample_docx_path: Path) -> None:
        """Extract document.xml successfully."""
        with open_docx(sample_docx_path) as zf:
            doc = extract_xml(zf, "word/document.xml")
            assert isinstance(doc, Element)
            assert doc.tag == f"{WORD_NS}document"

    def test_extract_nonexistent_part_raises(self, sample_docx_path: Path) -> None:
        """Extracting nonexistent part raises KeyError."""
        with open_docx(sample_docx_path) as zf:
            with pytest.raises(KeyError):
                extract_xml(zf, "word/nonexistent.xml")


class TestExtractXmlSafe:
    """Tests for extract_xml_safe function."""

    def test_extract_existing_part(self, sample_docx_path: Path) -> None:
        """Extract existing part returns element."""
        with open_docx(sample_docx_path) as zf:
            doc = extract_xml_safe(zf, "word/document.xml")
            assert doc is not None
            assert isinstance(doc, Element)

    def test_extract_nonexistent_returns_none(self, sample_docx_path: Path) -> None:
        """Extract nonexistent part returns None."""
        with open_docx(sample_docx_path) as zf:
            result = extract_xml_safe(zf, "word/nonexistent.xml")
            assert result is None


class TestExtractDocumentXml:
    """Tests for extract_document_xml function."""

    def test_extracts_document(self, sample_docx_path: Path) -> None:
        """Extracts document element."""
        with open_docx(sample_docx_path) as zf:
            doc = extract_document_xml(zf)
            assert doc.tag == f"{WORD_NS}document"


class TestExtractStylesXml:
    """Tests for extract_styles_xml function."""

    def test_extracts_styles_if_present(self, sample_docx_path: Path) -> None:
        """Extracts styles element if present."""
        with open_docx(sample_docx_path) as zf:
            styles = extract_styles_xml(zf)
            # Most DOCX files have styles.xml
            if styles is not None:
                assert styles.tag == f"{WORD_NS}styles"


class TestExtractNumberingXml:
    """Tests for extract_numbering_xml function."""

    def test_extracts_numbering_if_present(self, lists_numbering_fixtures: Path) -> None:
        """Extracts numbering element if present."""
        docx_path = lists_numbering_fixtures / "lists_basic.docx"
        if docx_path.exists():
            with open_docx(docx_path) as zf:
                numbering = extract_numbering_xml(zf)
                if numbering is not None:
                    assert numbering.tag == f"{WORD_NS}numbering"


class TestExtractRelationships:
    """Tests for extract_relationships function."""

    def test_returns_dict(self, sample_docx_path: Path) -> None:
        """Returns a dictionary of relationships."""
        with open_docx(sample_docx_path) as zf:
            rels = extract_relationships(zf)
            assert isinstance(rels, dict)

    def test_relationships_have_rid_keys(self, sample_docx_path: Path) -> None:
        """Relationship keys start with rId."""
        with open_docx(sample_docx_path) as zf:
            rels = extract_relationships(zf)
            for key in rels:
                assert key.startswith("rId")


class TestExtractExternalHyperlinks:
    """Tests for extract_external_hyperlinks function."""

    def test_returns_dict(self, sample_docx_path: Path) -> None:
        """Returns a dictionary."""
        with open_docx(sample_docx_path) as zf:
            links = extract_external_hyperlinks(zf)
            assert isinstance(links, dict)


class TestGetBodyElement:
    """Tests for get_body_element function."""

    def test_gets_body_from_document(self, sample_docx_path: Path) -> None:
        """Gets body element from document."""
        with open_docx(sample_docx_path) as zf:
            doc = extract_document_xml(zf)
            body = get_body_element(doc)
            assert body is not None
            assert body.tag == f"{WORD_NS}body"


class TestIterParagraphs:
    """Tests for iter_paragraphs function."""

    def test_iterates_paragraphs(self, sample_docx_path: Path) -> None:
        """Iterates over paragraph elements."""
        with open_docx(sample_docx_path) as zf:
            doc = extract_document_xml(zf)
            body = get_body_element(doc)
            assert body is not None

            paragraphs = iter_paragraphs(body)
            assert isinstance(paragraphs, list)
            assert len(paragraphs) > 0

            for p in paragraphs:
                assert p.tag == f"{WORD_NS}p"


class TestIterTables:
    """Tests for iter_tables function."""

    def test_iterates_tables(self, tables_fixtures: Path) -> None:
        """Iterates over table elements."""
        docx_path = tables_fixtures / "tables_basic.docx"
        if docx_path.exists():
            with open_docx(docx_path) as zf:
                doc = extract_document_xml(zf)
                body = get_body_element(doc)
                assert body is not None

                tables = iter_tables(body)
                assert isinstance(tables, list)
                # Tables fixture should have at least one table
                assert len(tables) > 0

                for tbl in tables:
                    assert tbl.tag == f"{WORD_NS}tbl"
