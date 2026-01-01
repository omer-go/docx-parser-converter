"""DOCX file reading and validation utilities.

This module provides functions for opening and validating DOCX files.
It handles reading from file paths, bytes, and file-like objects.
"""

import io
import logging
import zipfile
from pathlib import Path
from typing import BinaryIO

from core.constants import (
    CONTENT_TYPES_PATH,
    DOCUMENT_XML_PATH,
    LOGGER_NAME,
)
from core.exceptions import (
    DocxEncryptedError,
    DocxMissingPartError,
    DocxNotFoundError,
    DocxReadError,
    DocxValidationError,
)

logger = logging.getLogger(LOGGER_NAME)


def open_docx(source: str | Path | bytes | BinaryIO) -> zipfile.ZipFile:
    """Open a DOCX file and return a ZipFile handle.

    This function accepts multiple input types for flexibility:
    - File path as string or Path object
    - Raw bytes containing the DOCX content
    - File-like object (BinaryIO) opened in binary mode

    The returned ZipFile should be used as a context manager or
    explicitly closed when done.

    Args:
        source: The DOCX file to open. Can be:
            - str: Path to the file
            - Path: pathlib.Path to the file
            - bytes: Raw DOCX content
            - BinaryIO: File-like object in binary mode

    Returns:
        A ZipFile object for reading the DOCX contents.

    Raises:
        DocxNotFoundError: If the file path doesn't exist.
        DocxReadError: If the file cannot be read or is not a valid ZIP.
        DocxValidationError: If the file is not a valid DOCX.

    Example:
        >>> with open_docx("document.docx") as zf:
        ...     print(zf.namelist())
    """
    try:
        if isinstance(source, (str, Path)):
            return _open_from_path(source)
        elif isinstance(source, bytes):
            return _open_from_bytes(source)
        else:
            # Assume BinaryIO
            return _open_from_file_like(source)
    except (DocxNotFoundError, DocxReadError, DocxValidationError):
        # Re-raise our custom exceptions
        raise
    except Exception as e:
        raise DocxReadError("Unexpected error opening DOCX", e) from e


def _open_from_path(path: str | Path) -> zipfile.ZipFile:
    """Open DOCX from file path.

    Args:
        path: Path to the DOCX file.

    Returns:
        ZipFile object for reading.

    Raises:
        DocxNotFoundError: If the file doesn't exist.
        DocxReadError: If the file cannot be read.
    """
    path = Path(path)

    if not path.exists():
        raise DocxNotFoundError(str(path))

    if not path.is_file():
        raise DocxReadError(f"Not a file: {path}")

    try:
        return zipfile.ZipFile(path, "r")
    except zipfile.BadZipFile as e:
        raise DocxReadError(f"Invalid ZIP archive: {path}", e) from e
    except PermissionError as e:
        raise DocxReadError(f"Permission denied: {path}", e) from e
    except OSError as e:
        raise DocxReadError(f"Cannot read file: {path}", e) from e


def _open_from_bytes(data: bytes) -> zipfile.ZipFile:
    """Open DOCX from raw bytes.

    Args:
        data: Raw bytes containing DOCX content.

    Returns:
        ZipFile object for reading.

    Raises:
        DocxReadError: If the bytes are not a valid ZIP archive.
    """
    if not data:
        raise DocxReadError("Empty bytes provided")

    try:
        return zipfile.ZipFile(io.BytesIO(data), "r")
    except zipfile.BadZipFile as e:
        raise DocxReadError("Invalid ZIP archive in bytes", e) from e


def _open_from_file_like(file_obj: BinaryIO) -> zipfile.ZipFile:
    """Open DOCX from file-like object.

    Args:
        file_obj: File-like object in binary mode.

    Returns:
        ZipFile object for reading.

    Raises:
        DocxReadError: If the file object cannot be read as ZIP.
    """
    try:
        return zipfile.ZipFile(file_obj, "r")
    except zipfile.BadZipFile as e:
        raise DocxReadError("Invalid ZIP archive in file object", e) from e
    except Exception as e:
        raise DocxReadError("Cannot read from file object", e) from e


def validate_docx(zf: zipfile.ZipFile) -> None:
    """Validate that a ZipFile is a valid DOCX document.

    Performs the following checks:
    1. Required parts are present (document.xml, [Content_Types].xml)
    2. File is not encrypted

    Args:
        zf: An open ZipFile to validate.

    Raises:
        DocxMissingPartError: If required parts are missing.
        DocxEncryptedError: If the document is encrypted.
        DocxValidationError: For other validation failures.
    """
    namelist = zf.namelist()

    # Check for required parts
    if DOCUMENT_XML_PATH not in namelist:
        raise DocxMissingPartError(DOCUMENT_XML_PATH)

    if CONTENT_TYPES_PATH not in namelist:
        raise DocxMissingPartError(CONTENT_TYPES_PATH)

    # Check for encryption
    # Encrypted DOCX files have EncryptedPackage instead of normal parts
    if "EncryptedPackage" in namelist or "EncryptionInfo" in namelist:
        raise DocxEncryptedError()

    # Additional check: look for encryption marker in content types
    try:
        content_types = zf.read(CONTENT_TYPES_PATH).decode("utf-8")
        if "encrypted" in content_types.lower():
            raise DocxEncryptedError()
    except UnicodeDecodeError as e:
        # If content types can't be decoded, something is wrong
        raise DocxValidationError(
            "Invalid [Content_Types].xml", "File contains non-UTF-8 content"
        ) from e

    logger.debug("DOCX validation passed")


def is_valid_docx(source: str | Path | bytes | BinaryIO) -> bool:
    """Check if a source is a valid DOCX file without raising exceptions.

    This is a convenience function that wraps open_docx and validate_docx,
    returning True if the file is valid, False otherwise.

    Args:
        source: The DOCX file to check (path, bytes, or file-like object).

    Returns:
        True if the source is a valid DOCX file, False otherwise.

    Example:
        >>> if is_valid_docx("document.docx"):
        ...     print("Valid DOCX!")
    """
    try:
        with open_docx(source) as zf:
            validate_docx(zf)
        return True
    except Exception:
        return False


def list_docx_parts(zf: zipfile.ZipFile) -> list[str]:
    """List all parts (files) in a DOCX archive.

    Args:
        zf: An open ZipFile.

    Returns:
        List of part names in the archive.
    """
    return zf.namelist()


def has_part(zf: zipfile.ZipFile, part_name: str) -> bool:
    """Check if a part exists in the DOCX archive.

    Args:
        zf: An open ZipFile.
        part_name: The part name to check (e.g., "word/styles.xml").

    Returns:
        True if the part exists, False otherwise.
    """
    return part_name in zf.namelist()
