"""Run to HTML converter.

Converts Run elements to HTML span elements with appropriate styling.
"""

from html import escape
from typing import Any

from converters.html.css_generator import CSSGenerator, run_properties_to_css
from models.document.run import Run, RunProperties
from models.document.run_content import (
    Break,
    CarriageReturn,
    FieldChar,
    InstrText,
    NoBreakHyphen,
    SoftHyphen,
    Symbol,
    TabChar,
    Text,
)

# =============================================================================
# Run Content Conversion Functions
# =============================================================================


def text_to_html(text: Text) -> str:
    """Convert Text element to HTML.

    Args:
        text: Text model instance

    Returns:
        HTML-escaped text content
    """
    content = text.value or ""

    # HTML escape the content
    html = escape(content)

    # Handle space preservation
    if text.space == "preserve":
        # Convert multiple spaces to non-breaking spaces
        # Replace runs of 2+ spaces with alternating nbsp
        result = []
        i = 0
        while i < len(html):
            if html[i] == " ":
                # Count consecutive spaces
                space_count = 0
                while i < len(html) and html[i] == " ":
                    space_count += 1
                    i += 1
                # Use &nbsp; for all but first space in a run
                if space_count > 1:
                    result.append(" ")
                    result.extend(["&nbsp;"] * (space_count - 1))
                else:
                    result.append(" ")
            else:
                result.append(html[i])
                i += 1
        html = "".join(result)

    return html


def break_to_html(br: Break) -> str:
    """Convert Break element to HTML.

    Args:
        br: Break model instance

    Returns:
        HTML break representation
    """
    break_type = br.type or ""

    if break_type == "page":
        # Page break - use horizontal rule with page-break style
        return '<hr class="page-break" style="page-break-after: always; visibility: hidden; margin: 0; padding: 0; height: 0; border: none;">'
    elif break_type == "column":
        # Column break
        return '<span class="column-break" style="break-after: column;"></span>'
    else:
        # Default line break (textWrapping or empty)
        return "<br>"


def tab_to_html(tab: TabChar) -> str:
    """Convert TabChar element to HTML.

    Args:
        tab: TabChar model instance

    Returns:
        HTML tab representation
    """
    # Tab characters can be represented as spaces or styled span
    # Using a span with tab styling for better fidelity
    return '<span class="tab" style="display: inline-block; min-width: 4ch;"></span>'


def carriage_return_to_html(cr: CarriageReturn) -> str:
    """Convert CarriageReturn element to HTML.

    Args:
        cr: CarriageReturn model instance

    Returns:
        HTML line break
    """
    return "<br>"


def soft_hyphen_to_html(shy: SoftHyphen) -> str:
    """Convert SoftHyphen element to HTML.

    Args:
        shy: SoftHyphen model instance

    Returns:
        HTML soft hyphen entity
    """
    return "&shy;"


def no_break_hyphen_to_html(nbh: NoBreakHyphen) -> str:
    """Convert NoBreakHyphen element to HTML.

    Args:
        nbh: NoBreakHyphen model instance

    Returns:
        HTML non-breaking hyphen
    """
    # Unicode non-breaking hyphen
    return "&#8209;"


def symbol_to_html(sym: Symbol) -> str:
    """Convert Symbol element to HTML.

    Args:
        sym: Symbol model instance

    Returns:
        HTML representation of symbol
    """
    # Symbol has char (hex code) and font attributes
    if sym.char:
        try:
            # Convert hex char code to character
            char_code = int(sym.char, 16)
            char = chr(char_code)
            # Escape and optionally wrap with font style
            if sym.font:
                return f'<span style="font-family: {escape(sym.font)};">{escape(char)}</span>'
            return escape(char)
        except (ValueError, TypeError):
            pass
    return ""


def field_char_to_html(fc: FieldChar) -> str:
    """Convert FieldChar element to HTML.

    Field characters are typically not rendered directly.

    Args:
        fc: FieldChar model instance

    Returns:
        Empty string (fields are complex and usually hidden)
    """
    return ""


def instr_text_to_html(it: InstrText) -> str:
    """Convert InstrText element to HTML.

    Instruction text is typically not rendered directly.

    Args:
        it: InstrText model instance

    Returns:
        Empty string (instruction text is usually hidden)
    """
    return ""


def run_content_to_html(content: Any) -> str:
    """Convert a run content element to HTML.

    Args:
        content: Run content element (Text, Break, TabChar, etc.)

    Returns:
        HTML representation of the content
    """
    if isinstance(content, Text):
        return text_to_html(content)
    elif isinstance(content, Break):
        return break_to_html(content)
    elif isinstance(content, TabChar):
        return tab_to_html(content)
    elif isinstance(content, CarriageReturn):
        return carriage_return_to_html(content)
    elif isinstance(content, SoftHyphen):
        return soft_hyphen_to_html(content)
    elif isinstance(content, NoBreakHyphen):
        return no_break_hyphen_to_html(content)
    elif isinstance(content, Symbol):
        return symbol_to_html(content)
    elif isinstance(content, FieldChar):
        return field_char_to_html(content)
    elif isinstance(content, InstrText):
        return instr_text_to_html(content)
    else:
        # Unknown content type - try to get text representation
        return ""


# =============================================================================
# Run Conversion Functions
# =============================================================================


def run_to_html(
    run: Run | None,
    *,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
) -> str:
    """Convert Run element to HTML.

    Args:
        run: Run model instance
        use_semantic_tags: Use semantic tags (<strong>, <em>) instead of spans
        css_generator: CSS generator instance (uses default if not provided)

    Returns:
        HTML representation of the run
    """
    if run is None:
        return ""

    if not run.content:
        return ""

    # Convert all content
    content_html = "".join(run_content_to_html(c) for c in run.content)

    # If no content after conversion, return empty
    if not content_html:
        return ""

    # If no properties, return content without wrapper
    if run.r_pr is None:
        return content_html

    # Generate CSS from properties
    gen = css_generator or CSSGenerator()
    css_props = run_properties_to_css(run.r_pr)

    # Check if we should use semantic tags
    if use_semantic_tags:
        content_html = _apply_semantic_tags(content_html, run.r_pr, css_props)

    # If no CSS properties remain, return content
    if not css_props:
        return content_html

    # Wrap in span with inline styles
    style = gen.generate_inline_style(css_props)
    if style:
        return f'<span style="{style}">{content_html}</span>'

    return content_html


def _apply_semantic_tags(
    content: str,
    r_pr: RunProperties,
    css_props: dict[str, str],
) -> str:
    """Apply semantic HTML tags based on run properties.

    This modifies css_props in place, removing properties that are
    handled by semantic tags.

    Args:
        content: HTML content to wrap
        r_pr: Run properties
        css_props: CSS properties dict (modified in place)

    Returns:
        Content wrapped in appropriate semantic tags
    """
    result = content

    # Bold -> <strong>
    if r_pr.b is True:
        result = f"<strong>{result}</strong>"
        css_props.pop("font-weight", None)

    # Italic -> <em>
    if r_pr.i is True:
        result = f"<em>{result}</em>"
        css_props.pop("font-style", None)

    # Strikethrough -> <del> or <s>
    if r_pr.strike is True or r_pr.dstrike is True:
        result = f"<del>{result}</del>"
        # Only remove if this was the only text-decoration
        if "text-decoration" in css_props:
            decoration = css_props["text-decoration"]
            if decoration == "line-through":
                css_props.pop("text-decoration")
            elif "line-through" in decoration:
                # Remove line-through but keep other decorations
                css_props["text-decoration"] = decoration.replace("line-through", "").strip()
                if not css_props["text-decoration"]:
                    css_props.pop("text-decoration")

    # Underline -> <u> (deprecated but simple)
    # Note: We don't use <u> by default since it's semantically different
    # The underline stays as CSS text-decoration

    # Superscript -> <sup>
    if r_pr.vert_align == "superscript":
        result = f"<sup>{result}</sup>"
        css_props.pop("vertical-align", None)
        css_props.pop("font-size", None)

    # Subscript -> <sub>
    if r_pr.vert_align == "subscript":
        result = f"<sub>{result}</sub>"
        css_props.pop("vertical-align", None)
        css_props.pop("font-size", None)

    return result


# =============================================================================
# Run to HTML Converter Class
# =============================================================================


class RunToHTMLConverter:
    """Converter for Run elements to HTML."""

    def __init__(
        self,
        *,
        use_semantic_tags: bool = True,
        use_classes: bool = False,
        css_generator: CSSGenerator | None = None,
    ) -> None:
        """Initialize run converter.

        Args:
            use_semantic_tags: Use semantic tags (<strong>, <em>)
            use_classes: Use CSS classes instead of inline styles
            css_generator: CSS generator instance
        """
        self.use_semantic_tags = use_semantic_tags
        self.use_classes = use_classes
        self.css_generator = css_generator or CSSGenerator()

    def convert(self, run: Run | None) -> str:
        """Convert Run to HTML.

        Args:
            run: Run model instance

        Returns:
            HTML representation
        """
        return run_to_html(
            run,
            use_semantic_tags=self.use_semantic_tags,
            css_generator=self.css_generator,
        )

    def convert_content(self, content: Any) -> str:
        """Convert run content element to HTML.

        Args:
            content: Run content element

        Returns:
            HTML representation
        """
        return run_content_to_html(content)
