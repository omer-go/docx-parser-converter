"""Run to text converter.

Converts Run elements to plain text or markdown.
"""

from models.document.run import Run, RunProperties
from models.document.run_content import (
    Break,
    CarriageReturn,
    NoBreakHyphen,
    RunContentItem,
    SoftHyphen,
    TabChar,
    Text,
)

# =============================================================================
# Monospace Font Detection
# =============================================================================


MONOSPACE_FONTS = {
    "courier",
    "courier new",
    "consolas",
    "monaco",
    "menlo",
    "lucida console",
    "dejavu sans mono",
    "liberation mono",
    "source code pro",
    "fira code",
    "fira mono",
    "roboto mono",
    "ubuntu mono",
    "andale mono",
}


def is_monospace_font(font_name: str | None) -> bool:
    """Check if a font is a monospace font.

    Args:
        font_name: Font name to check

    Returns:
        True if monospace font
    """
    if not font_name:
        return False
    return font_name.lower() in MONOSPACE_FONTS


# =============================================================================
# Run Content Converters
# =============================================================================


def text_to_text(text: Text) -> str:
    """Convert Text element to string.

    Args:
        text: Text element

    Returns:
        Text content
    """
    return text.value or ""


def break_to_text(br: Break) -> str:
    """Convert Break element to string.

    Args:
        br: Break element

    Returns:
        Newline or page separator
    """
    break_type = br.type or "textWrapping"

    if break_type == "page":
        # Page break - double newline for separation
        return "\n\n"
    elif break_type == "column":
        return "\n"
    else:
        # Line break (textWrapping or default)
        return "\n"


def tab_to_text(tab: TabChar) -> str:
    """Convert TabChar element to string.

    Args:
        tab: TabChar element

    Returns:
        Tab character
    """
    return "\t"


def run_content_to_text(content: RunContentItem) -> str:
    """Convert any run content element to text.

    Args:
        content: Run content element

    Returns:
        Text representation
    """
    if isinstance(content, Text):
        return text_to_text(content)
    elif isinstance(content, Break):
        return break_to_text(content)
    elif isinstance(content, TabChar):
        return tab_to_text(content)
    elif isinstance(content, CarriageReturn):
        return "\n"
    elif isinstance(content, SoftHyphen):
        # Soft hyphen is typically invisible
        return ""
    elif isinstance(content, NoBreakHyphen):
        # Non-breaking hyphen renders as hyphen
        return "-"
    else:
        # Unknown content type - return empty
        return ""


# =============================================================================
# Run to Text Converter
# =============================================================================


def run_to_text(run: Run | None) -> str:
    """Convert a Run to plain text.

    Args:
        run: Run element or None

    Returns:
        Plain text content
    """
    if run is None:
        return ""

    parts = []
    for content in run.content:
        parts.append(run_content_to_text(content))

    return "".join(parts)


# =============================================================================
# Markdown Formatting
# =============================================================================


def apply_markdown_formatting(text: str, r_pr: RunProperties | None) -> str:
    """Apply markdown formatting to text based on run properties.

    Args:
        text: Plain text content
        r_pr: Run properties

    Returns:
        Text with markdown markers
    """
    if not r_pr or not text:
        return text

    result = text

    # Check for bold
    is_bold = r_pr.b is True

    # Check for italic
    is_italic = r_pr.i is True

    # Check for strikethrough
    is_strike = r_pr.strike is True

    # Check for monospace font (code)
    is_code = False
    if r_pr.r_fonts:
        if is_monospace_font(r_pr.r_fonts.ascii):
            is_code = True
        elif is_monospace_font(r_pr.r_fonts.h_ansi):
            is_code = True

    # Apply formatting in order
    if is_strike:
        result = f"~~{result}~~"

    if is_bold and is_italic:
        result = f"***{result}***"
    elif is_bold:
        result = f"**{result}**"
    elif is_italic:
        result = f"*{result}*"

    if is_code and not (is_bold or is_italic or is_strike):
        result = f"`{result}`"

    return result


# =============================================================================
# Run to Text Converter Class
# =============================================================================


class RunToTextConverter:
    """Converter for Run elements to plain text or markdown."""

    def __init__(
        self,
        *,
        use_markdown: bool = False,
    ) -> None:
        """Initialize run converter.

        Args:
            use_markdown: Whether to use markdown formatting
        """
        self.use_markdown = use_markdown

    def convert(self, run: Run | None) -> str:
        """Convert a Run to text.

        Args:
            run: Run element or None

        Returns:
            Text content (with optional markdown formatting)
        """
        if run is None:
            return ""

        # Extract text content
        text = run_to_text(run)

        # Apply markdown formatting if enabled
        if self.use_markdown and text:
            text = apply_markdown_formatting(text, run.r_pr)

        return text

    def convert_content(self, content: RunContentItem) -> str:
        """Convert a single run content element.

        Args:
            content: Run content element

        Returns:
            Text representation
        """
        return run_content_to_text(content)
