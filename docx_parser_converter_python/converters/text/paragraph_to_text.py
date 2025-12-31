"""Paragraph to text converter.

Converts Paragraph elements to plain text or markdown.
"""

from typing import Any

from converters.text.run_to_text import RunToTextConverter
from models.document.hyperlink import Hyperlink
from models.document.paragraph import Paragraph
from models.document.run import Run

# =============================================================================
# Constants
# =============================================================================


# Twips per space character (approximate, assuming 720 twips = 1/2 inch)
TWIPS_PER_SPACE = 144


# =============================================================================
# Paragraph to Text Converter
# =============================================================================


def paragraph_to_text(para: Paragraph | None) -> str:
    """Convert a Paragraph to plain text.

    Args:
        para: Paragraph element or None

    Returns:
        Plain text content
    """
    if para is None:
        return ""

    converter = ParagraphToTextConverter()
    return converter.convert(para)


class ParagraphToTextConverter:
    """Converter for Paragraph elements to plain text or markdown."""

    def __init__(
        self,
        *,
        use_markdown: bool = False,
        hyperlink_urls: dict[str, str] | None = None,
        numbering_prefixes: dict[tuple[int, int], tuple[str, str]] | None = None,
        render_indentation: bool = False,
    ) -> None:
        """Initialize paragraph converter.

        Args:
            use_markdown: Whether to use markdown formatting
            hyperlink_urls: Dict mapping rId to URL for hyperlink rendering
            numbering_prefixes: Dict mapping (num_id, ilvl) to (prefix, suffix)
            render_indentation: Whether to render indentation as spaces
        """
        self.use_markdown = use_markdown
        self.hyperlink_urls = hyperlink_urls or {}
        self.numbering_prefixes = numbering_prefixes or {}
        self.render_indentation = render_indentation
        self._run_converter = RunToTextConverter(use_markdown=use_markdown)

    def convert(self, para: Paragraph | None) -> str:
        """Convert a Paragraph to text.

        Args:
            para: Paragraph element or None

        Returns:
            Text content
        """
        if para is None:
            return ""

        parts: list[str] = []

        # Add numbering prefix if present
        prefix = self._get_numbering_prefix(para)
        if prefix:
            parts.append(prefix)

        # Add indentation if enabled
        if self.render_indentation:
            indent = self._get_indentation_spaces(para)
            if indent:
                parts.append(indent)

        # Convert paragraph content
        for content in para.content:
            text = self._convert_content(content)
            if text:
                parts.append(text)

        return "".join(parts)

    def _convert_content(self, content: Any) -> str:
        """Convert paragraph content element.

        Args:
            content: Paragraph content (Run or Hyperlink)

        Returns:
            Text representation
        """
        if isinstance(content, Run):
            return self._run_converter.convert(content)
        elif isinstance(content, Hyperlink):
            return self._convert_hyperlink(content)
        else:
            return ""

    def _convert_hyperlink(self, hyperlink: Hyperlink) -> str:
        """Convert a Hyperlink to text.

        Args:
            hyperlink: Hyperlink element

        Returns:
            Text representation
        """
        # Extract text from hyperlink runs
        text_parts = []
        for content in hyperlink.content:
            if isinstance(content, Run):
                text = self._run_converter.convert(content)
                if text:
                    text_parts.append(text)

        link_text = "".join(text_parts)

        # In markdown mode, render as [text](url) if URL is available
        if self.use_markdown and hyperlink.r_id:
            url = self.hyperlink_urls.get(hyperlink.r_id)
            if url:
                return f"[{link_text}]({url})"

        return link_text

    def _get_numbering_prefix(self, para: Paragraph) -> str:
        """Get numbering prefix for paragraph.

        Args:
            para: Paragraph element

        Returns:
            Numbering prefix string or empty
        """
        if not para.p_pr or not para.p_pr.num_pr:
            return ""

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return ""

        key = (num_pr.num_id, num_pr.ilvl)
        if key in self.numbering_prefixes:
            prefix, suffix = self.numbering_prefixes[key]
            return prefix + suffix

        return ""

    def _get_indentation_spaces(self, para: Paragraph) -> str:
        """Get indentation as spaces.

        Args:
            para: Paragraph element

        Returns:
            Space characters for indentation
        """
        if not para.p_pr or not para.p_pr.ind:
            return ""

        ind = para.p_pr.ind

        # Calculate spaces from first line indentation
        if ind.first_line:
            try:
                twips = int(ind.first_line)
                spaces = max(1, twips // TWIPS_PER_SPACE)
                return " " * spaces
            except ValueError:
                pass

        return ""
