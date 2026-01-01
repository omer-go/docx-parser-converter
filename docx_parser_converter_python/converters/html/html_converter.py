"""Main HTML converter entry point.

Provides the docx_to_html() function and HTMLConverter class for
converting DOCX documents to HTML.
"""

from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import BinaryIO

from converters.common.numbering_tracker import NumberingTracker
from converters.common.style_resolver import StyleResolver
from converters.html.css_generator import CSSGenerator
from converters.html.html_document import HTMLDocumentBuilder
from converters.html.paragraph_to_html import paragraph_to_html
from converters.html.run_to_html import run_to_html
from converters.html.table_to_html import table_to_html
from models.document.document import Document
from models.document.paragraph import Paragraph
from models.document.run import Run
from models.document.table import Table
from models.numbering.numbering import Numbering
from models.styles.styles import Styles

# =============================================================================
# Configuration
# =============================================================================


@dataclass
class ConversionConfig:
    """Configuration options for HTML conversion.

    Attributes:
        style_mode: Style output mode ("inline", "class", "none")
        use_semantic_tags: Use semantic HTML tags (<strong>, <em>, etc.)
        preserve_whitespace: Preserve whitespace in content
        include_default_styles: Include default CSS styles in output
        title: Document title for HTML output
        language: Document language (default: "en")
        fragment_only: Output HTML fragment without document wrapper
        custom_css: Custom CSS to include in document
        css_files: External CSS files to reference
        use_css_variables: Use CSS custom properties
        responsive: Include viewport meta for responsive design
        include_print_styles: Include print media query styles
    """

    style_mode: str = "inline"
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


# =============================================================================
# Exceptions
# =============================================================================


class ConversionError(Exception):
    """Base exception for conversion errors."""

    pass


class InvalidDocumentError(ConversionError):
    """Raised when the document is invalid or corrupted."""

    pass


class UnsupportedFormatError(ConversionError):
    """Raised when the file format is not supported."""

    pass


# =============================================================================
# HTMLConverter Class
# =============================================================================


class HTMLConverter:
    """Converts DOCX documents to HTML.

    Provides methods for converting Document models and individual
    elements to HTML.
    """

    def __init__(
        self,
        config: ConversionConfig | None = None,
        *,
        styles: Styles | None = None,
        numbering: Numbering | None = None,
        relationships: dict[str, str] | None = None,
    ) -> None:
        """Initialize HTML converter.

        Args:
            config: Conversion configuration options
            styles: Document styles for style resolution
            numbering: Document numbering definitions
            relationships: Relationship map for hyperlinks
        """
        self.config = config or ConversionConfig()
        self.styles = styles
        self.numbering = numbering
        self.relationships = relationships or {}
        self.css_generator = CSSGenerator()

        # Create numbering tracker for list counter management
        self._numbering_tracker = NumberingTracker(numbering)

        # Create style resolver for style inheritance
        doc_defaults = styles.doc_defaults if styles else None
        self.style_resolver = StyleResolver(styles, doc_defaults)

    def convert(self, document: Document | None) -> str:
        """Convert Document model to complete HTML.

        Args:
            document: Document model to convert

        Returns:
            Complete HTML string
        """
        if document is None:
            return self._wrap_content("")

        # Reset numbering tracker for new document
        self._numbering_tracker.reset()

        # Convert body content
        content_parts = []
        if document.body and document.body.content:
            for element in document.body.content:
                if isinstance(element, Paragraph):
                    html = self.convert_paragraph(element)
                    content_parts.append(html)
                elif isinstance(element, Table):
                    html = self.convert_table(element)
                    content_parts.append(html)

        content_html = "".join(content_parts)

        if self.config.fragment_only:
            return content_html

        return self._wrap_content(content_html)

    def convert_paragraph(self, paragraph: Paragraph | None) -> str:
        """Convert Paragraph model to HTML.

        Args:
            paragraph: Paragraph model to convert

        Returns:
            HTML string
        """
        # Get numbering prefix and indentation if applicable
        numbering_prefix = self._get_numbering_prefix(paragraph)
        numbering_indent_pt = self._get_numbering_indentation(paragraph)

        return paragraph_to_html(
            paragraph,
            relationships=self.relationships,
            numbering_prefix=numbering_prefix,
            numbering_indent_pt=numbering_indent_pt,
            use_semantic_tags=self.config.use_semantic_tags,
            css_generator=self.css_generator,
            style_resolver=self.style_resolver,
        )

    def convert_table(self, table: Table | None) -> str:
        """Convert Table model to HTML.

        Args:
            table: Table model to convert

        Returns:
            HTML string
        """
        return table_to_html(
            table,
            relationships=self.relationships,
            use_semantic_tags=self.config.use_semantic_tags,
            css_generator=self.css_generator,
            style_resolver=self.style_resolver,
        )

    def convert_run(self, run: Run | None) -> str:
        """Convert Run model to HTML.

        Args:
            run: Run model to convert

        Returns:
            HTML string
        """
        return run_to_html(
            run,
            use_semantic_tags=self.config.use_semantic_tags,
            css_generator=self.css_generator,
            style_resolver=self.style_resolver,
        )

    def _get_numbering_prefix(self, para: Paragraph | None) -> str | None:
        """Get numbering prefix for paragraph.

        Uses NumberingTracker for proper handling of start values,
        multi-level placeholders, and different number formats.

        Args:
            para: Paragraph element

        Returns:
            Numbering prefix string or None
        """
        if para is None or para.p_pr is None or para.p_pr.num_pr is None:
            return None

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return None

        # Get the formatted number from the numbering tracker
        prefix = self._numbering_tracker.get_number(num_pr.num_id, num_pr.ilvl)
        if not prefix:
            return None

        # Get suffix from level definition
        level = self._numbering_tracker.get_level(num_pr.num_id, num_pr.ilvl)
        suff = level.suff if level and level.suff else "tab"

        # Get suffix
        if suff == "tab":
            suffix = "\t"
        elif suff == "space":
            suffix = " "
        else:
            suffix = ""

        return prefix + suffix

    def _get_numbering_indentation(self, para: Paragraph | None) -> float | None:
        """Get left indentation in points from numbering level.

        Args:
            para: Paragraph element

        Returns:
            Left indentation in points, or None if not applicable
        """
        if para is None or para.p_pr is None or para.p_pr.num_pr is None:
            return None

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return None

        # Get level definition
        level = self._numbering_tracker.get_level(num_pr.num_id, num_pr.ilvl)
        if level is None or level.p_pr is None:
            return None

        # Extract indentation from level's paragraph properties
        # The level parser stores indentation directly in p_pr (not nested under "ind")
        p_pr = level.p_pr
        if isinstance(p_pr, dict) and "left" in p_pr:
            left_twips = p_pr["left"]
            if isinstance(left_twips, (int, float)):
                # Convert twips to points (1 point = 20 twips)
                return left_twips / 20
        return None

    def _wrap_content(self, content: str) -> str:
        """Wrap content in HTML document structure.

        Args:
            content: HTML content to wrap

        Returns:
            Complete HTML document
        """
        builder = HTMLDocumentBuilder()
        builder.set_content(content)
        builder.set_title(self.config.title)
        builder.set_language(self.config.language)
        builder.set_responsive(self.config.responsive)

        if self.config.custom_css:
            builder.add_css(self.config.custom_css)

        for css_file in self.config.css_files:
            builder.add_stylesheet(css_file)

        if self.config.include_print_styles:
            builder.enable_print_styles()

        doc = builder.build()
        return doc.render()


# =============================================================================
# Main Conversion Function
# =============================================================================


def docx_to_html(
    source: str | Path | bytes | BinaryIO | Document | None,
    *,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None,
    styles: Styles | None = None,
    numbering: Numbering | None = None,
    relationships: dict[str, str] | None = None,
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
        output_path: Optional path to write HTML output
        config: Conversion configuration options
        styles: Optional Styles model for style resolution
        numbering: Optional Numbering model for list formatting
        relationships: Optional relationship map for hyperlinks

    Returns:
        HTML string

    Raises:
        FileNotFoundError: If file path doesn't exist
        InvalidDocumentError: If document is corrupted or invalid
        UnsupportedFormatError: If file is not a valid DOCX
    """
    config = config or ConversionConfig()

    # Handle None input
    if source is None:
        result = ""
        if not config.fragment_only:
            converter = HTMLConverter(config=config)
            result = converter._wrap_content("")
        if output_path:
            _write_output(result, output_path)
        return result

    # If source is already a Document model, convert directly
    if isinstance(source, Document):
        converter = HTMLConverter(
            config=config,
            styles=styles,
            numbering=numbering,
            relationships=relationships,
        )
        result = converter.convert(source)
        if output_path:
            _write_output(result, output_path)
        return result

    # Handle file path input
    if isinstance(source, (str, Path)):
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if not path.suffix.lower() == ".docx":
            raise UnsupportedFormatError(f"Unsupported file format: {path.suffix}")

        # For file paths, we'd need to parse the DOCX first
        # This will be implemented when parsers are complete
        raise NotImplementedError("File path input requires DOCX parser")

    # Handle bytes input
    if isinstance(source, bytes):
        # This will be implemented when parsers are complete
        raise NotImplementedError("Bytes input requires DOCX parser")

    # Handle file-like object
    if hasattr(source, "read"):
        # This will be implemented when parsers are complete
        raise NotImplementedError("File object input requires DOCX parser")

    raise TypeError(f"Unsupported source type: {type(source)}")


def docx_to_html_stream(
    source: str | Path | bytes | BinaryIO | Document,
    *,
    config: ConversionConfig | None = None,
) -> Iterator[str]:
    """Convert DOCX document to HTML in streaming mode.

    Yields HTML chunks for large documents to reduce memory usage.

    Args:
        source: Input document
        config: Conversion configuration

    Yields:
        HTML string chunks
    """
    config = config or ConversionConfig()

    # For now, just convert and yield the whole thing
    # True streaming would yield paragraph by paragraph
    result = docx_to_html(source, config=config)
    yield result


# =============================================================================
# Helper Functions
# =============================================================================


def _write_output(content: str, output_path: str | Path) -> None:
    """Write HTML content to file.

    Args:
        content: HTML content to write
        output_path: Path to write to
    """
    path = Path(output_path)
    path.write_text(content, encoding="utf-8")
