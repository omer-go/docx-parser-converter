"""Shared pytest fixtures for all tests."""

from pathlib import Path

import pytest


@pytest.fixture
def fixtures_path() -> Path:
    """Return the path to the test fixtures directory."""
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def text_formatting_fixtures(fixtures_path: Path) -> Path:
    """Return path to text formatting fixtures."""
    return fixtures_path / "text_formatting"


@pytest.fixture
def paragraph_formatting_fixtures(fixtures_path: Path) -> Path:
    """Return path to paragraph formatting fixtures."""
    return fixtures_path / "paragraph_formatting"


@pytest.fixture
def lists_numbering_fixtures(fixtures_path: Path) -> Path:
    """Return path to lists/numbering fixtures."""
    return fixtures_path / "lists_numbering"


@pytest.fixture
def tables_fixtures(fixtures_path: Path) -> Path:
    """Return path to tables fixtures."""
    return fixtures_path / "tables"


@pytest.fixture
def comprehensive_fixtures(fixtures_path: Path) -> Path:
    """Return path to comprehensive fixtures."""
    return fixtures_path / "comprehensive"


@pytest.fixture
def sample_docx_path(comprehensive_fixtures: Path) -> Path:
    """Return path to a sample comprehensive DOCX file."""
    return comprehensive_fixtures / "comprehensive.docx"


@pytest.fixture
def sample_docx_bytes(sample_docx_path: Path) -> bytes:
    """Return the contents of a sample DOCX file as bytes."""
    return sample_docx_path.read_bytes()


@pytest.fixture
def invalid_zip_bytes() -> bytes:
    """Return bytes that are not a valid ZIP file."""
    return b"This is not a ZIP file"


@pytest.fixture
def empty_bytes() -> bytes:
    """Return empty bytes."""
    return b""
