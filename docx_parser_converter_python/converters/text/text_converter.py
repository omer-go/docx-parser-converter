"""Main text converter.

Provides the main entry point for converting DOCX documents to plain text.
"""

from dataclasses import dataclass
from typing import Literal

from converters.text.paragraph_to_text import ParagraphToTextConverter
from converters.text.table_to_text import TableMode, TableToTextConverter
from models.document.document import Document
from models.document.paragraph import Paragraph
from models.document.table import Table
from models.numbering.numbering import Numbering
from models.styles.styles import Styles

# =============================================================================
# Configuration
# =============================================================================


@dataclass
class TextConverterConfig:
    """Configuration for text converter."""

    formatting: Literal["plain", "markdown"] = "plain"
    table_mode: TableMode = "auto"
    paragraph_separator: str = "\n\n"
    preserve_empty_paragraphs: bool = True


# =============================================================================
# Main Entry Point
# =============================================================================


def document_to_text(
    doc: Document | None,
    config: TextConverterConfig | None = None,
) -> str:
    """Convert a Document to plain text.

    Args:
        doc: Document element or None
        config: Optional configuration

    Returns:
        Plain text content
    """
    if doc is None:
        return ""

    converter = TextConverter(config=config)
    return converter.convert(doc)


# =============================================================================
# Text Converter Class
# =============================================================================


class TextConverter:
    """Main converter for Document elements to plain text."""

    def __init__(
        self,
        config: TextConverterConfig | None = None,
        styles: Styles | None = None,
        numbering: Numbering | None = None,
        hyperlink_urls: dict[str, str] | None = None,
    ) -> None:
        """Initialize text converter.

        Args:
            config: Converter configuration
            styles: Document styles (for style resolution)
            numbering: Document numbering definitions
            hyperlink_urls: Dict mapping rId to URL
        """
        self.config = config or TextConverterConfig()
        self.styles = styles
        self.numbering = numbering
        self.hyperlink_urls = hyperlink_urls or {}

        # Track numbering counters
        self._numbering_counters: dict[tuple[int, int], int] = {}

        # Initialize sub-converters
        use_markdown = self.config.formatting == "markdown"
        self._paragraph_converter = ParagraphToTextConverter(
            use_markdown=use_markdown,
            hyperlink_urls=self.hyperlink_urls,
        )
        self._table_converter = TableToTextConverter(
            mode=self.config.table_mode,
        )

    def convert(self, doc: Document | None) -> str:
        """Convert a Document to text.

        Args:
            doc: Document element or None

        Returns:
            Plain text content
        """
        if doc is None:
            return ""

        if doc.body is None:
            return ""

        # Reset numbering counters
        self._numbering_counters.clear()

        parts: list[str] = []

        for content in doc.body.content:
            text = self._convert_content(content)
            parts.append(text)

        # Join with paragraph separator and clean up
        result = self.config.paragraph_separator.join(parts)

        # Remove excessive newlines
        while "\n\n\n" in result:
            result = result.replace("\n\n\n", "\n\n")

        return result.strip()

    def _convert_content(self, content: Paragraph | Table) -> str:
        """Convert body content element.

        Args:
            content: Paragraph or Table

        Returns:
            Text representation
        """
        if isinstance(content, Paragraph):
            return self._convert_paragraph(content)
        elif isinstance(content, Table):
            return self._table_converter.convert(content)
        else:
            return ""

    def _convert_paragraph(self, para: Paragraph) -> str:
        """Convert a paragraph with numbering support.

        Args:
            para: Paragraph element

        Returns:
            Text representation
        """
        # Update numbering counters and get prefix
        prefix_info = self._get_numbering_prefix(para)

        # Create paragraph-specific converter with numbering info
        converter = ParagraphToTextConverter(
            use_markdown=self.config.formatting == "markdown",
            hyperlink_urls=self.hyperlink_urls,
            numbering_prefixes={prefix_info[0]: (prefix_info[1], prefix_info[2])}
            if prefix_info[0]
            else {},
        )

        return converter.convert(para)

    def _get_numbering_prefix(self, para: Paragraph) -> tuple[tuple[int, int] | None, str, str]:
        """Get numbering prefix for paragraph.

        Args:
            para: Paragraph element

        Returns:
            Tuple of (key, prefix, suffix) or (None, "", "")
        """
        if not para.p_pr or not para.p_pr.num_pr:
            return (None, "", "")

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return (None, "", "")

        key = (num_pr.num_id, num_pr.ilvl)

        # Increment counter
        current = self._numbering_counters.get(key, 0) + 1
        self._numbering_counters[key] = current

        # Get format from numbering definitions
        num_fmt = "decimal"
        lvl_text = "%1."
        suff = "\t"

        if self.numbering:
            # Find the numbering instance
            for num_instance in self.numbering.num:
                if num_instance.num_id == num_pr.num_id:
                    # Find the abstract numbering
                    for abstract in self.numbering.abstract_num:
                        if abstract.abstract_num_id == num_instance.abstract_num_id:
                            # Find the level
                            for level in abstract.lvl:
                                if level.ilvl == num_pr.ilvl:
                                    num_fmt = level.num_fmt or "decimal"
                                    lvl_text = level.lvl_text or "%1."
                                    suff = level.suff or "tab"
                                    break
                            break
                    break

        # Format the prefix
        if num_fmt == "bullet":
            prefix = lvl_text if lvl_text else "•"
        else:
            from converters.text.numbering_to_text import format_number

            formatted = format_number(current, num_fmt)
            if "%1" in lvl_text:
                prefix = lvl_text.replace("%1", formatted)
            else:
                prefix = formatted + lvl_text

        # Get suffix
        if suff == "tab":
            suffix = "\t"
        elif suff == "space":
            suffix = " "
        else:
            suffix = ""

        return (key, prefix, suffix)
