"""Tests for docx_reader module."""

import io
import zipfile
from pathlib import Path

import pytest

from core.docx_reader import (
    has_part,
    is_valid_docx,
    list_docx_parts,
    open_docx,
    validate_docx,
)
from core.exceptions import (
    DocxEncryptedError,
    DocxMissingPartError,
    DocxNotFoundError,
    DocxReadError,
)


class TestOpenDocx:
    """Tests for open_docx function."""

    def test_open_from_path_string(self, sample_docx_path: Path) -> None:
        """Open DOCX from string path."""
        with open_docx(str(sample_docx_path)) as zf:
            assert isinstance(zf, zipfile.ZipFile)
            assert "word/document.xml" in zf.namelist()

    def test_open_from_path_object(self, sample_docx_path: Path) -> None:
        """Open DOCX from Path object."""
        with open_docx(sample_docx_path) as zf:
            assert isinstance(zf, zipfile.ZipFile)
            assert "word/document.xml" in zf.namelist()

    def test_open_from_bytes(self, sample_docx_bytes: bytes) -> None:
        """Open DOCX from bytes."""
        with open_docx(sample_docx_bytes) as zf:
            assert isinstance(zf, zipfile.ZipFile)
            assert "word/document.xml" in zf.namelist()

    def test_open_from_file_like(self, sample_docx_path: Path) -> None:
        """Open DOCX from file-like object."""
        with open(sample_docx_path, "rb") as f:
            with open_docx(f) as zf:
                assert isinstance(zf, zipfile.ZipFile)
                assert "word/document.xml" in zf.namelist()

    def test_open_from_bytes_io(self, sample_docx_bytes: bytes) -> None:
        """Open DOCX from BytesIO object."""
        bio = io.BytesIO(sample_docx_bytes)
        with open_docx(bio) as zf:
            assert isinstance(zf, zipfile.ZipFile)
            assert "word/document.xml" in zf.namelist()

    def test_open_nonexistent_file(self) -> None:
        """Opening nonexistent file raises DocxNotFoundError."""
        with pytest.raises(DocxNotFoundError) as exc_info:
            open_docx("/path/to/nonexistent/file.docx")
        assert "/path/to/nonexistent/file.docx" in str(exc_info.value)

    def test_open_invalid_zip_bytes(self, invalid_zip_bytes: bytes) -> None:
        """Opening invalid ZIP bytes raises DocxReadError."""
        with pytest.raises(DocxReadError) as exc_info:
            open_docx(invalid_zip_bytes)
        assert "Invalid ZIP" in str(exc_info.value)

    def test_open_empty_bytes(self, empty_bytes: bytes) -> None:
        """Opening empty bytes raises DocxReadError."""
        with pytest.raises(DocxReadError) as exc_info:
            open_docx(empty_bytes)
        assert "Empty bytes" in str(exc_info.value)


class TestValidateDocx:
    """Tests for validate_docx function."""

    def test_valid_docx(self, sample_docx_path: Path) -> None:
        """Valid DOCX passes validation."""
        with open_docx(sample_docx_path) as zf:
            # Should not raise
            validate_docx(zf)

    def test_missing_document_xml(self, tmp_path: Path) -> None:
        """DOCX without document.xml fails validation."""
        # Create a ZIP without document.xml
        zip_path = tmp_path / "invalid.docx"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("[Content_Types].xml", "<Types/>")

        with open_docx(zip_path) as zf:
            with pytest.raises(DocxMissingPartError) as exc_info:
                validate_docx(zf)
            assert "word/document.xml" in str(exc_info.value)

    def test_missing_content_types(self, tmp_path: Path) -> None:
        """DOCX without [Content_Types].xml fails validation."""
        # Create a ZIP without content types
        zip_path = tmp_path / "invalid.docx"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("word/document.xml", "<document/>")

        with open_docx(zip_path) as zf:
            with pytest.raises(DocxMissingPartError) as exc_info:
                validate_docx(zf)
            assert "[Content_Types].xml" in str(exc_info.value)

    def test_encrypted_docx(self, tmp_path: Path) -> None:
        """Encrypted DOCX fails validation."""
        # Create a ZIP with encryption marker
        zip_path = tmp_path / "encrypted.docx"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("EncryptedPackage", "encrypted content")
            zf.writestr("[Content_Types].xml", "<Types/>")
            zf.writestr("word/document.xml", "<document/>")

        with open_docx(zip_path) as zf:
            with pytest.raises(DocxEncryptedError):
                validate_docx(zf)


class TestIsValidDocx:
    """Tests for is_valid_docx function."""

    def test_valid_docx_returns_true(self, sample_docx_path: Path) -> None:
        """Valid DOCX returns True."""
        assert is_valid_docx(sample_docx_path) is True

    def test_valid_docx_bytes_returns_true(self, sample_docx_bytes: bytes) -> None:
        """Valid DOCX bytes returns True."""
        assert is_valid_docx(sample_docx_bytes) is True

    def test_invalid_returns_false(self, invalid_zip_bytes: bytes) -> None:
        """Invalid content returns False."""
        assert is_valid_docx(invalid_zip_bytes) is False

    def test_nonexistent_returns_false(self) -> None:
        """Nonexistent file returns False."""
        assert is_valid_docx("/nonexistent/file.docx") is False


class TestListDocxParts:
    """Tests for list_docx_parts function."""

    def test_lists_all_parts(self, sample_docx_path: Path) -> None:
        """Lists all parts in the archive."""
        with open_docx(sample_docx_path) as zf:
            parts = list_docx_parts(zf)
            assert "word/document.xml" in parts
            assert "[Content_Types].xml" in parts


class TestHasPart:
    """Tests for has_part function."""

    def test_existing_part_returns_true(self, sample_docx_path: Path) -> None:
        """Existing part returns True."""
        with open_docx(sample_docx_path) as zf:
            assert has_part(zf, "word/document.xml") is True

    def test_nonexistent_part_returns_false(self, sample_docx_path: Path) -> None:
        """Nonexistent part returns False."""
        with open_docx(sample_docx_path) as zf:
            assert has_part(zf, "word/nonexistent.xml") is False
