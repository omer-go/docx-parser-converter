"""Public API for DOCX to HTML/Text conversion.

This module provides the main entry points for converting DOCX files:
- docx_to_html: Convert DOCX to HTML
- docx_to_text: Convert DOCX to plain text
- ConversionConfig: Configuration options for conversion
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import BinaryIO, Literal

from converters.html.html_converter import ConversionConfig as HTMLConversionConfig
from converters.html.html_converter import HTMLConverter
from converters.text.text_converter import TextConverter, TextConverterConfig
from core.docx_reader import open_docx, validate_docx
from core.exceptions import DocxNotFoundError, DocxReadError, DocxValidationError
from core.xml_extractor import (
    extract_document_xml,
    extract_external_hyperlinks,
    extract_numbering_xml,
    extract_styles_xml,
)
from models.document.document import Document
from parsers.document import parse_document
from parsers.numbering import parse_numbering
from parsers.styles import parse_styles

# =============================================================================
# Configuration
# =============================================================================


@dataclass
class ConversionConfig:
    """Configuration options for DOCX conversion.

    This unified configuration class supports both HTML and text conversion.
    Options are grouped by their target format.

    HTML Options:
        style_mode: How to output styles ("inline", "class", "none")
        use_semantic_tags: Use <strong>, <em> instead of <b>, <i>
        preserve_whitespace: Preserve whitespace in content
        include_default_styles: Include default CSS styles
        title: Document title for HTML output
        language: Document language (e.g., "en", "de")
        fragment_only: Output HTML fragment without document wrapper
        custom_css: Custom CSS to include in document
        css_files: External CSS files to reference
        use_css_variables: Use CSS custom properties
        responsive: Include viewport meta for responsive design
        include_print_styles: Include print media query styles

    Text Options:
        text_formatting: Text output format ("plain", "markdown")
        table_mode: Table rendering ("auto", "ascii", "tabs", "plain")
        paragraph_separator: Separator between paragraphs
        preserve_empty_paragraphs: Preserve empty paragraphs as blank lines
    """

    # HTML options
    style_mode: Literal["inline", "class", "none"] = "inline"
    use_semantic_tags: bool = True
    preserve_whitespace: bool = False
    include_default_styles: bool = True
    title: str = ""
    language: str = "en"
    fragment_only: bool = False
    custom_css: str | None = None
    css_files: list[str] = field(default_factory=list)
    use_css_variables: bool = False
    responsive: bool = True
    include_print_styles: bool = False

    # Text options
    text_formatting: Literal["plain", "markdown"] = "plain"
    table_mode: Literal["auto", "ascii", "tabs", "plain"] = "auto"
    paragraph_separator: str = "\n\n"
    preserve_empty_paragraphs: bool = True

    def to_html_config(self) -> HTMLConversionConfig:
        """Convert to HTML-specific configuration."""
        return HTMLConversionConfig(
            style_mode=self.style_mode,
            use_semantic_tags=self.use_semantic_tags,
            preserve_whitespace=self.preserve_whitespace,
            include_default_styles=self.include_default_styles,
            title=self.title,
            language=self.language,
            fragment_only=self.fragment_only,
            custom_css=self.custom_css,
            css_files=self.css_files,
            use_css_variables=self.use_css_variables,
            responsive=self.responsive,
            include_print_styles=self.include_print_styles,
        )

    def to_text_config(self) -> TextConverterConfig:
        """Convert to text-specific configuration."""
        return TextConverterConfig(
            formatting=self.text_formatting,
            table_mode=self.table_mode,
            paragraph_separator=self.paragraph_separator,
            preserve_empty_paragraphs=self.preserve_empty_paragraphs,
        )


# =============================================================================
# DOCX Parsing
# =============================================================================


def _parse_docx(
    source: str | Path | bytes | BinaryIO,
) -> tuple[Document | None, dict]:
    """Parse DOCX file and extract all necessary components.

    Args:
        source: Input DOCX file (path, bytes, or file-like object)

    Returns:
        Tuple of (Document, metadata dict with styles, numbering, relationships)

    Raises:
        DocxNotFoundError: If file doesn't exist
        DocxReadError: If file cannot be read
        DocxValidationError: If file is not a valid DOCX
    """
    # Validate input for file paths
    if isinstance(source, (str, Path)):
        path = Path(source)
        if not path.suffix.lower() == ".docx":
            raise DocxValidationError(
                f"Unsupported file format: {path.suffix}", "Expected .docx file"
            )

    try:
        with open_docx(source) as zf:
            # Validate the DOCX structure
            validate_docx(zf)

            # Extract XML parts
            doc_xml = extract_document_xml(zf)
            styles_xml = extract_styles_xml(zf)
            numbering_xml = extract_numbering_xml(zf)
            relationships = extract_external_hyperlinks(zf)

            # Parse to Pydantic models
            document = parse_document(doc_xml)
            styles = parse_styles(styles_xml) if styles_xml is not None else None
            numbering = parse_numbering(numbering_xml) if numbering_xml is not None else None

            return document, {
                "styles": styles,
                "numbering": numbering,
                "relationships": relationships,
            }
    except (DocxNotFoundError, DocxReadError, DocxValidationError):
        # Re-raise our custom exceptions as-is
        raise
    except Exception as e:
        # Wrap unknown exceptions
        raise DocxValidationError("Invalid DOCX content", str(e)) from e


# =============================================================================
# HTML Conversion
# =============================================================================


def docx_to_html(
    source: str | Path | bytes | BinaryIO | Document | None,
    *,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None,
) -> str:
    """Convert DOCX document to HTML.

    This is the main entry point for converting DOCX documents to HTML.
    Accepts various input types and produces HTML output.

    Args:
        source: Input document. Can be:
            - File path as string or Path
            - Bytes content of DOCX file
            - File-like object (BinaryIO)
            - Document model instance
            - None (returns empty HTML document)
        output_path: Optional path to write HTML output
        config: Conversion configuration options

    Returns:
        HTML string

    Raises:
        DocxNotFoundError: If file path doesn't exist
        DocxReadError: If file cannot be read
        DocxValidationError: If file is not a valid DOCX

    Example:
        >>> html = docx_to_html("document.docx")
        >>> html = docx_to_html("document.docx", output_path="output.html")
        >>> html = docx_to_html("document.docx", config=ConversionConfig(title="My Doc"))
    """
    config = config or ConversionConfig()
    html_config = config.to_html_config()

    # Handle None input
    if source is None:
        converter = HTMLConverter(config=html_config)
        result = converter.convert(None)
        if output_path:
            _write_output(result, output_path)
        return result

    # Handle Document model input directly
    if isinstance(source, Document):
        converter = HTMLConverter(config=html_config)
        result = converter.convert(source)
        if output_path:
            _write_output(result, output_path)
        return result

    # Parse DOCX file
    document, metadata = _parse_docx(source)

    # Convert to HTML
    converter = HTMLConverter(
        config=html_config,
        styles=metadata["styles"],
        numbering=metadata["numbering"],
        relationships=metadata["relationships"],
    )
    result = converter.convert(document)

    if output_path:
        _write_output(result, output_path)

    return result


# =============================================================================
# Text Conversion
# =============================================================================


def docx_to_text(
    source: str | Path | bytes | BinaryIO | Document | None,
    *,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None,
) -> str:
    """Convert DOCX document to plain text.

    This is the main entry point for converting DOCX documents to plain text.
    Accepts various input types and produces text output.

    Args:
        source: Input document. Can be:
            - File path as string or Path
            - Bytes content of DOCX file
            - File-like object (BinaryIO)
            - Document model instance
            - None (returns empty string)
        output_path: Optional path to write text output
        config: Conversion configuration options

    Returns:
        Plain text string

    Raises:
        DocxNotFoundError: If file path doesn't exist
        DocxReadError: If file cannot be read
        DocxValidationError: If file is not a valid DOCX

    Example:
        >>> text = docx_to_text("document.docx")
        >>> text = docx_to_text("document.docx", output_path="output.txt")
        >>> text = docx_to_text("document.docx", config=ConversionConfig(text_formatting="markdown"))
    """
    config = config or ConversionConfig()
    text_config = config.to_text_config()

    # Handle None input
    if source is None:
        return ""

    # Handle Document model input directly
    if isinstance(source, Document):
        converter = TextConverter(config=text_config)
        result = converter.convert(source)
        if output_path:
            _write_output(result, output_path)
        return result

    # Parse DOCX file
    document, metadata = _parse_docx(source)

    # Convert to text
    converter = TextConverter(
        config=text_config,
        styles=metadata["styles"],
        numbering=metadata["numbering"],
        hyperlink_urls=metadata["relationships"],
    )
    result = converter.convert(document)

    if output_path:
        _write_output(result, output_path)

    return result


# =============================================================================
# Helper Functions
# =============================================================================


def _write_output(content: str, output_path: str | Path) -> None:
    """Write content to output file.

    Args:
        content: Content to write
        output_path: Path to write to
    """
    path = Path(output_path)
    path.write_text(content, encoding="utf-8")
