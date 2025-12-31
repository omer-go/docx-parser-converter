"""Custom exceptions for the docx_parser_converter library.

This module defines all custom exceptions used throughout the library.
All exceptions inherit from DocxParserError for easy catching.
"""


class DocxParserError(Exception):
    """Base exception for all docx_parser_converter errors.

    All custom exceptions in this library inherit from this class,
    allowing users to catch all library-specific errors with a single
    except clause.

    Example:
        try:
            html = docx_to_html("document.docx")
        except DocxParserError as e:
            print(f"Failed to convert document: {e}")
    """

    pass


class DocxValidationError(DocxParserError):
    """Raised when DOCX validation fails.

    This exception is raised when the input file fails validation checks:
    - Not a valid ZIP archive
    - Missing required parts (e.g., document.xml)
    - Incorrect content types
    - Encrypted/password-protected files

    Attributes:
        message: Human-readable error description.
        details: Optional additional details about the validation failure.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        """Initialize validation error.

        Args:
            message: Human-readable error description.
            details: Optional additional details about the failure.
        """
        self.message = message
        self.details = details
        super().__init__(self._format_message())

    def _format_message(self) -> str:
        """Format the error message with optional details."""
        if self.details:
            return f"{self.message}: {self.details}"
        return self.message


class DocxNotFoundError(DocxParserError):
    """Raised when a DOCX file cannot be found.

    Attributes:
        path: The path that was not found.
    """

    def __init__(self, path: str) -> None:
        """Initialize not found error.

        Args:
            path: The path that was not found.
        """
        self.path = path
        super().__init__(f"DOCX file not found: {path}")


class DocxReadError(DocxParserError):
    """Raised when a DOCX file cannot be read.

    This can happen due to:
    - File permissions issues
    - Corrupted ZIP archive
    - I/O errors

    Attributes:
        message: Human-readable error description.
        original_error: The underlying exception that caused this error.
    """

    def __init__(self, message: str, original_error: Exception | None = None) -> None:
        """Initialize read error.

        Args:
            message: Human-readable error description.
            original_error: The underlying exception that caused this error.
        """
        self.message = message
        self.original_error = original_error
        super().__init__(self._format_message())

    def _format_message(self) -> str:
        """Format the error message with optional original error."""
        if self.original_error:
            return f"{self.message}: {self.original_error}"
        return self.message


class DocxEncryptedError(DocxValidationError):
    """Raised when attempting to open an encrypted DOCX file.

    Encrypted/password-protected files are not supported.
    """

    def __init__(self) -> None:
        """Initialize encrypted file error."""
        super().__init__(
            "Encrypted DOCX files are not supported",
            "The file appears to be password-protected. Please remove the password and try again.",
        )


class DocxMissingPartError(DocxValidationError):
    """Raised when a required part is missing from the DOCX archive.

    Attributes:
        part_name: Name of the missing part (e.g., "word/document.xml").
    """

    def __init__(self, part_name: str) -> None:
        """Initialize missing part error.

        Args:
            part_name: Name of the missing part.
        """
        self.part_name = part_name
        super().__init__(
            "Required part missing from DOCX",
            f"Missing: {part_name}",
        )


class DocxInvalidContentTypeError(DocxValidationError):
    """Raised when content type validation fails.

    Attributes:
        expected: Expected content type.
        actual: Actual content type found.
    """

    def __init__(self, expected: str, actual: str | None) -> None:
        """Initialize invalid content type error.

        Args:
            expected: Expected content type.
            actual: Actual content type found (or None if not found).
        """
        self.expected = expected
        self.actual = actual
        super().__init__(
            "Invalid content type",
            f"Expected '{expected}', got '{actual or 'none'}'",
        )


class XmlParseError(DocxParserError):
    """Raised when XML parsing fails.

    This can happen due to malformed XML content within the DOCX archive.

    Attributes:
        part_name: Name of the XML part that failed to parse.
        original_error: The underlying XML parsing exception.
    """

    def __init__(self, part_name: str, original_error: Exception) -> None:
        """Initialize XML parse error.

        Args:
            part_name: Name of the XML part that failed to parse.
            original_error: The underlying XML parsing exception.
        """
        self.part_name = part_name
        self.original_error = original_error
        super().__init__(f"Failed to parse XML in '{part_name}': {original_error}")
