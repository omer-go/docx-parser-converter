"""Paragraph to HTML converter.

Converts Paragraph elements to HTML p tags with appropriate styling.
"""

from html import escape
from typing import TYPE_CHECKING, Any

from converters.html.css_generator import (
    CSSGenerator,
    paragraph_properties_to_css,
    run_properties_to_css,
)
from converters.html.run_to_html import run_to_html
from models.document.hyperlink import BookmarkEnd, BookmarkStart, Hyperlink
from models.document.paragraph import Paragraph, ParagraphProperties
from models.document.run import Run, RunProperties

if TYPE_CHECKING:
    from converters.common.style_resolver import StyleResolver

# =============================================================================
# Hyperlink and Bookmark Conversion
# =============================================================================


def hyperlink_to_html(
    hyperlink: Hyperlink,
    *,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert Hyperlink element to HTML anchor.

    Args:
        hyperlink: Hyperlink model instance
        relationships: Dict mapping r:id to URL
        use_semantic_tags: Use semantic tags for run content
        css_generator: CSS generator instance
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML anchor element
    """
    if hyperlink is None:
        return ""

    # Get URL from relationship or anchor
    href = ""
    if hyperlink.anchor:
        href = f"#{escape(hyperlink.anchor)}"
    elif hyperlink.r_id and relationships:
        url = relationships.get(hyperlink.r_id, "")
        href = escape(url) if url else ""
    elif hyperlink.r_id:
        # No relationship provided, use r_id as placeholder
        href = f"#missing-{escape(hyperlink.r_id)}"

    # Convert content (runs)
    content_html = "".join(
        run_to_html(
            item,
            use_semantic_tags=use_semantic_tags,
            css_generator=css_generator,
            style_resolver=style_resolver,
        )
        if isinstance(item, Run)
        else ""
        for item in hyperlink.content
    )

    # Build anchor tag
    attrs = [f'href="{href}"']
    if hyperlink.tooltip:
        attrs.append(f'title="{escape(hyperlink.tooltip)}"')

    return f"<a {' '.join(attrs)}>{content_html}</a>"


def bookmark_start_to_html(bookmark: BookmarkStart) -> str:
    """Convert BookmarkStart to HTML anchor element.

    Args:
        bookmark: BookmarkStart model instance

    Returns:
        HTML anchor element with id
    """
    if bookmark is None or not bookmark.name:
        return ""

    return f'<a id="{escape(bookmark.name)}"></a>'


def bookmark_end_to_html(bookmark: BookmarkEnd) -> str:
    """Convert BookmarkEnd to HTML.

    Bookmark end elements are not rendered visibly.

    Args:
        bookmark: BookmarkEnd model instance

    Returns:
        Empty string (bookmark ends are invisible)
    """
    return ""


# =============================================================================
# Paragraph Content Conversion
# =============================================================================


def paragraph_content_to_html(
    content: Any,
    *,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert a paragraph content item to HTML.

    Args:
        content: Content item (Run, Hyperlink, BookmarkStart, BookmarkEnd)
        relationships: Dict mapping r:id to URL for hyperlinks
        use_semantic_tags: Use semantic tags (<strong>, <em>)
        css_generator: CSS generator instance
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML representation of the content
    """
    if isinstance(content, Run):
        return run_to_html(
            content,
            use_semantic_tags=use_semantic_tags,
            css_generator=css_generator,
            style_resolver=style_resolver,
        )
    elif isinstance(content, Hyperlink):
        return hyperlink_to_html(
            content,
            relationships=relationships,
            use_semantic_tags=use_semantic_tags,
            css_generator=css_generator,
            style_resolver=style_resolver,
        )
    elif isinstance(content, BookmarkStart):
        return bookmark_start_to_html(content)
    elif isinstance(content, BookmarkEnd):
        return bookmark_end_to_html(content)
    else:
        return ""


# =============================================================================
# Paragraph Conversion Functions
# =============================================================================


def paragraph_to_html(
    para: Paragraph | None,
    *,
    relationships: dict[str, str] | None = None,
    numbering_prefix: str | None = None,
    use_semantic_tags: bool = True,
    use_headings: bool = False,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert Paragraph element to HTML.

    Args:
        para: Paragraph model instance
        relationships: Dict mapping r:id to URL for hyperlinks
        numbering_prefix: List number/bullet prefix to prepend
        use_semantic_tags: Use semantic tags (<strong>, <em>)
        use_headings: Use heading tags (<h1>-<h6>) for outline levels
        css_generator: CSS generator instance
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML representation of the paragraph
    """
    if para is None:
        return ""

    gen = css_generator or CSSGenerator()

    # Convert all content
    content_parts = [
        paragraph_content_to_html(
            item,
            relationships=relationships,
            use_semantic_tags=use_semantic_tags,
            css_generator=gen,
            style_resolver=style_resolver,
        )
        for item in para.content
    ]
    content_html = "".join(content_parts)

    # Add numbering prefix if provided
    if numbering_prefix:
        content_html = f'<span class="list-marker">{escape(numbering_prefix)}</span>{content_html}'

    # Determine tag to use
    tag = _get_paragraph_tag(para.p_pr, use_headings)

    # Generate CSS from direct paragraph properties
    css_props = paragraph_properties_to_css(para.p_pr)

    # Resolve paragraph style if present and merge with direct formatting
    if style_resolver and para.p_pr and para.p_pr.p_style:
        # Resolve the paragraph style
        style = style_resolver.resolve_style(para.p_pr.p_style)
        if style and style.p_pr:
            # Convert style's paragraph properties dict to model, then to CSS
            if isinstance(style.p_pr, dict):
                style_p_pr = ParagraphProperties(**style.p_pr)
            else:
                style_p_pr = style.p_pr
            style_css = paragraph_properties_to_css(style_p_pr)
            # Merge: direct formatting overrides style
            css_props = {**style_css, **css_props}

        # Also check for run properties in the paragraph style (affects default text style)
        if style and style.r_pr:
            # Convert style's run properties dict to model, then to CSS
            if isinstance(style.r_pr, dict):
                style_r_pr = RunProperties(**style.r_pr)
            else:
                style_r_pr = style.r_pr
            style_r_css = run_properties_to_css(style_r_pr)
            # Merge run properties into paragraph CSS (for inheritable properties like color, font)
            css_props = {**style_r_css, **css_props}

    # Handle special attributes
    extra_attrs: list[str] = []

    # BiDi/RTL
    if para.p_pr and para.p_pr.bidi:
        extra_attrs.append('dir="rtl"')

    # Generate style attribute
    style_attr = gen.generate_inline_style(css_props)

    # Build opening tag
    attrs = []
    if style_attr:
        attrs.append(f'style="{style_attr}"')
    attrs.extend(extra_attrs)

    attr_str = f" {' '.join(attrs)}" if attrs else ""

    # Empty paragraph still gets a tag (for spacing)
    return f"<{tag}{attr_str}>{content_html}</{tag}>"


def _get_paragraph_tag(p_pr: ParagraphProperties | None, use_headings: bool) -> str:
    """Determine the HTML tag for a paragraph.

    Args:
        p_pr: Paragraph properties
        use_headings: Whether to use heading tags for outline levels

    Returns:
        HTML tag name ('p', 'h1'-'h6', etc.)
    """
    if not use_headings or p_pr is None:
        return "p"

    if p_pr.outline_lvl is not None:
        level = p_pr.outline_lvl
        if 0 <= level <= 5:
            return f"h{level + 1}"
        elif level > 5:
            return "h6"

    return "p"


# =============================================================================
# Paragraph to HTML Converter Class
# =============================================================================


class ParagraphToHTMLConverter:
    """Converter for Paragraph elements to HTML."""

    def __init__(
        self,
        *,
        use_semantic_tags: bool = True,
        use_classes: bool = False,
        use_headings: bool = False,
        use_inline_styles: bool = True,
        css_generator: CSSGenerator | None = None,
    ) -> None:
        """Initialize paragraph converter.

        Args:
            use_semantic_tags: Use semantic tags (<strong>, <em>)
            use_classes: Use CSS classes instead of inline styles
            use_headings: Use heading tags for outline levels
            use_inline_styles: Use inline styles (if False, only classes)
            css_generator: CSS generator instance
        """
        self.use_semantic_tags = use_semantic_tags
        self.use_classes = use_classes
        self.use_headings = use_headings
        self.use_inline_styles = use_inline_styles
        self.css_generator = css_generator or CSSGenerator()
        self.relationships: dict[str, str] = {}

    def set_relationships(self, relationships: dict[str, str]) -> None:
        """Set the relationship map for hyperlinks.

        Args:
            relationships: Dict mapping r:id to URL
        """
        self.relationships = relationships

    def convert(
        self,
        para: Paragraph | None,
        *,
        numbering_prefix: str | None = None,
    ) -> str:
        """Convert Paragraph to HTML.

        Args:
            para: Paragraph model instance
            numbering_prefix: List number/bullet prefix

        Returns:
            HTML representation
        """
        return paragraph_to_html(
            para,
            relationships=self.relationships,
            numbering_prefix=numbering_prefix,
            use_semantic_tags=self.use_semantic_tags,
            use_headings=self.use_headings,
            css_generator=self.css_generator,
        )

    def convert_content(
        self,
        content: Any,
    ) -> str:
        """Convert paragraph content item to HTML.

        Args:
            content: Content item

        Returns:
            HTML representation
        """
        return paragraph_content_to_html(
            content,
            relationships=self.relationships,
            use_semantic_tags=self.use_semantic_tags,
            css_generator=self.css_generator,
        )
