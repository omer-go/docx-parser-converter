"""Tests for exceptions module."""

import pytest

from core.exceptions import (
    DocxEncryptedError,
    DocxInvalidContentTypeError,
    DocxMissingPartError,
    DocxNotFoundError,
    DocxParserError,
    DocxReadError,
    DocxValidationError,
    XmlParseError,
)


class TestDocxParserError:
    """Tests for base DocxParserError."""

    def test_is_exception(self) -> None:
        """DocxParserError is an Exception."""
        assert issubclass(DocxParserError, Exception)

    def test_can_be_raised(self) -> None:
        """Can raise and catch DocxParserError."""
        with pytest.raises(DocxParserError):
            raise DocxParserError("test error")


class TestDocxValidationError:
    """Tests for DocxValidationError."""

    def test_inherits_from_parser_error(self) -> None:
        """DocxValidationError inherits from DocxParserError."""
        assert issubclass(DocxValidationError, DocxParserError)

    def test_message_only(self) -> None:
        """Error with message only."""
        error = DocxValidationError("Test message")
        assert str(error) == "Test message"
        assert error.message == "Test message"
        assert error.details is None

    def test_message_with_details(self) -> None:
        """Error with message and details."""
        error = DocxValidationError("Test message", "More details")
        assert str(error) == "Test message: More details"
        assert error.message == "Test message"
        assert error.details == "More details"


class TestDocxNotFoundError:
    """Tests for DocxNotFoundError."""

    def test_inherits_from_parser_error(self) -> None:
        """DocxNotFoundError inherits from DocxParserError."""
        assert issubclass(DocxNotFoundError, DocxParserError)

    def test_includes_path_in_message(self) -> None:
        """Error message includes the path."""
        error = DocxNotFoundError("/path/to/file.docx")
        assert "/path/to/file.docx" in str(error)
        assert error.path == "/path/to/file.docx"


class TestDocxReadError:
    """Tests for DocxReadError."""

    def test_inherits_from_parser_error(self) -> None:
        """DocxReadError inherits from DocxParserError."""
        assert issubclass(DocxReadError, DocxParserError)

    def test_message_only(self) -> None:
        """Error with message only."""
        error = DocxReadError("Cannot read file")
        assert str(error) == "Cannot read file"
        assert error.original_error is None

    def test_message_with_original_error(self) -> None:
        """Error with original exception."""
        original = ValueError("original")
        error = DocxReadError("Cannot read file", original)
        assert "Cannot read file" in str(error)
        assert "original" in str(error)
        assert error.original_error is original


class TestDocxEncryptedError:
    """Tests for DocxEncryptedError."""

    def test_inherits_from_validation_error(self) -> None:
        """DocxEncryptedError inherits from DocxValidationError."""
        assert issubclass(DocxEncryptedError, DocxValidationError)

    def test_has_descriptive_message(self) -> None:
        """Error has descriptive message."""
        error = DocxEncryptedError()
        assert "Encrypted" in str(error) or "encrypted" in str(error)


class TestDocxMissingPartError:
    """Tests for DocxMissingPartError."""

    def test_inherits_from_validation_error(self) -> None:
        """DocxMissingPartError inherits from DocxValidationError."""
        assert issubclass(DocxMissingPartError, DocxValidationError)

    def test_includes_part_name(self) -> None:
        """Error includes the missing part name."""
        error = DocxMissingPartError("word/document.xml")
        assert "word/document.xml" in str(error)
        assert error.part_name == "word/document.xml"


class TestDocxInvalidContentTypeError:
    """Tests for DocxInvalidContentTypeError."""

    def test_inherits_from_validation_error(self) -> None:
        """DocxInvalidContentTypeError inherits from DocxValidationError."""
        assert issubclass(DocxInvalidContentTypeError, DocxValidationError)

    def test_includes_expected_and_actual(self) -> None:
        """Error includes expected and actual content types."""
        error = DocxInvalidContentTypeError("expected/type", "actual/type")
        assert "expected/type" in str(error)
        assert "actual/type" in str(error)
        assert error.expected == "expected/type"
        assert error.actual == "actual/type"

    def test_handles_none_actual(self) -> None:
        """Error handles None for actual content type."""
        error = DocxInvalidContentTypeError("expected/type", None)
        assert "expected/type" in str(error)
        assert "none" in str(error).lower()


class TestXmlParseError:
    """Tests for XmlParseError."""

    def test_inherits_from_parser_error(self) -> None:
        """XmlParseError inherits from DocxParserError."""
        assert issubclass(XmlParseError, DocxParserError)

    def test_includes_part_name_and_error(self) -> None:
        """Error includes part name and original error."""
        original = ValueError("bad xml")
        error = XmlParseError("word/document.xml", original)
        assert "word/document.xml" in str(error)
        assert "bad xml" in str(error)
        assert error.part_name == "word/document.xml"
        assert error.original_error is original


class TestExceptionHierarchy:
    """Tests for exception hierarchy and catching."""

    def test_catch_all_with_parser_error(self) -> None:
        """All custom exceptions can be caught with DocxParserError."""
        exceptions = [
            DocxParserError("test"),
            DocxValidationError("test"),
            DocxNotFoundError("/path"),
            DocxReadError("test"),
            DocxEncryptedError(),
            DocxMissingPartError("part"),
            DocxInvalidContentTypeError("a", "b"),
            XmlParseError("part", ValueError()),
        ]

        for exc in exceptions:
            with pytest.raises(DocxParserError):
                raise exc
