"""HTML document wrapper.

Generates complete HTML5 documents with proper structure and styling.
"""

from html import escape

# =============================================================================
# Default Styles
# =============================================================================


DEFAULT_BODY_STYLES = """
body {
    font-family: 'Calibri', 'Arial', sans-serif;
    line-height: 1.5;
    margin: 0 auto;
    padding: 20px;
}
"""

PAGE_BREAK_STYLES = """
.page-break {
    page-break-after: always;
    break-after: page;
}

@media print {
    .page-break {
        page-break-after: always;
    }
}
"""

PRINT_STYLES_TEMPLATE = """
@media print {{
    body {{
        margin: 0;
        padding: 0;
    }}
    @page {{
        size: {page_size};
        margin: {margin};
    }}
}}
"""


# =============================================================================
# HTML Document Class
# =============================================================================


class HTMLDocument:
    """Represents an HTML5 document.

    Generates complete HTML5 documents with proper structure,
    meta tags, styles, and content.
    """

    def __init__(
        self,
        content: str | None = None,
        *,
        title: str | None = None,
        language: str = "en",
        css: str | None = None,
        author: str | None = None,
        description: str | None = None,
        keywords: list[str] | None = None,
        stylesheets: list[str] | None = None,
        scripts: list[str] | None = None,
        responsive: bool = True,
        page_width: float | None = None,
        direction: str | None = None,
        minify: bool = False,
        pretty: bool = False,
        include_print_styles: bool = False,
        include_skip_link: bool = False,
        include_generator_meta: bool = True,
    ) -> None:
        """Initialize HTML document.

        Args:
            content: HTML content for body
            title: Document title
            language: HTML lang attribute (default: "en")
            css: Embedded CSS styles
            author: Author meta tag content
            description: Description meta tag content
            keywords: Keywords for meta tag
            stylesheets: External stylesheet URLs
            scripts: External script URLs
            responsive: Include viewport meta tag
            page_width: Page width in points for max-width
            direction: Text direction (ltr, rtl)
            minify: Minify output
            pretty: Pretty-print output with indentation
            include_print_styles: Include print media query styles
            include_skip_link: Include skip to content link
            include_generator_meta: Include generator meta tag
        """
        self.content = content or ""
        self.title = title
        self.language = language
        self.css = css
        self.author = author
        self.description = description
        self.keywords = keywords or []
        self.stylesheets = stylesheets or []
        self.scripts = scripts or []
        self.responsive = responsive
        self.page_width = page_width
        self.direction = direction
        self.minify = minify
        self.pretty = pretty
        self.include_print_styles = include_print_styles
        self.include_skip_link = include_skip_link
        self.include_generator_meta = include_generator_meta

    def _build_head(self) -> str:
        """Build the <head> section.

        Returns:
            HTML head content
        """
        parts = []

        # Charset
        parts.append('<meta charset="UTF-8">')

        # Viewport for responsive
        if self.responsive:
            parts.append(
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            )

        # Title
        title_text = escape(self.title) if self.title else ""
        parts.append(f"<title>{title_text}</title>")

        # Author meta
        if self.author:
            parts.append(f'<meta name="author" content="{escape(self.author)}">')

        # Description meta
        if self.description:
            parts.append(
                f'<meta name="description" content="{escape(self.description)}">'
            )

        # Keywords meta
        if self.keywords:
            keywords_str = ", ".join(self.keywords)
            parts.append(f'<meta name="keywords" content="{escape(keywords_str)}">')

        # Generator meta
        if self.include_generator_meta:
            parts.append(
                '<meta name="generator" content="docx-parser-converter">'
            )

        # External stylesheets
        for stylesheet in self.stylesheets:
            parts.append(f'<link rel="stylesheet" href="{escape(stylesheet)}">')

        # Embedded styles
        styles = self._build_styles()
        if styles:
            parts.append(f"<style>{styles}</style>")

        # External scripts
        for script in self.scripts:
            parts.append(f'<script src="{escape(script)}"></script>')

        if self.pretty:
            return "\n    ".join(parts)
        return "".join(parts)

    def _build_styles(self) -> str:
        """Build embedded CSS styles.

        Returns:
            CSS content
        """
        parts = []

        # Default body styles
        parts.append(DEFAULT_BODY_STYLES.strip())

        # Page width constraint
        if self.page_width:
            # Convert points to pixels (approximate)
            max_width_px = int(self.page_width * 1.33)
            parts.append(f"body {{ max-width: {max_width_px}px; }}")

        # RTL direction
        if self.direction == "rtl":
            parts.append("body { direction: rtl; }")

        # Page break styles
        parts.append(PAGE_BREAK_STYLES.strip())

        # Print styles
        if self.include_print_styles:
            print_css = PRINT_STYLES_TEMPLATE.format(
                page_size="A4",
                margin="1in",
            ).strip()
            parts.append(print_css)

        # Custom CSS
        if self.css:
            parts.append(self.css)

        return "\n".join(parts)

    def _build_body_attrs(self) -> str:
        """Build body element attributes.

        Returns:
            Attribute string
        """
        attrs = []

        if self.direction:
            attrs.append(f'dir="{self.direction}"')

        if attrs:
            return " " + " ".join(attrs)
        return ""

    def render(self) -> str:
        """Render the complete HTML5 document.

        Returns:
            Complete HTML5 document string
        """
        parts = []

        # Doctype
        parts.append("<!DOCTYPE html>")

        # HTML element with lang
        html_attrs = f'lang="{self.language}"'
        if self.direction:
            html_attrs += f' dir="{self.direction}"'
        parts.append(f"<html {html_attrs}>")

        # Head
        parts.append("<head>")
        parts.append(self._build_head())
        parts.append("</head>")

        # Body
        body_attrs = self._build_body_attrs()
        parts.append(f"<body{body_attrs}>")

        # Skip link for accessibility
        if self.include_skip_link:
            parts.append('<a href="#content" class="skip-link">Skip to content</a>')

        # Main content wrapper
        parts.append('<main id="content" role="main">')
        parts.append(self.content)
        parts.append("</main>")

        parts.append("</body>")
        parts.append("</html>")

        if self.minify:
            # Remove extra whitespace for minified output
            result = "".join(parts)
            return result.replace("\n", "").replace("  ", " ")

        if self.pretty:
            # Add newlines for pretty output
            return "\n".join(parts)

        return "".join(parts)

    def render_fragment(self) -> str:
        """Render only the content without HTML wrapper.

        Returns:
            Content HTML string
        """
        return self.content


# =============================================================================
# HTML Document Builder
# =============================================================================


class HTMLDocumentBuilder:
    """Builder for HTMLDocument with fluent interface.

    Provides a convenient way to construct HTMLDocument instances
    with method chaining.
    """

    def __init__(self) -> None:
        """Initialize builder with default values."""
        self._content: str | None = None
        self._title: str | None = None
        self._language: str = "en"
        self._css_parts: list[str] = []
        self._author: str | None = None
        self._description: str | None = None
        self._keywords: list[str] = []
        self._stylesheets: list[str] = []
        self._scripts: list[str] = []
        self._responsive: bool = True
        self._page_width: float | None = None
        self._direction: str | None = None
        self._minify: bool = False
        self._pretty: bool = False
        self._include_print_styles: bool = False
        self._include_skip_link: bool = False

    def set_content(self, content: str) -> "HTMLDocumentBuilder":
        """Set the document content.

        Args:
            content: HTML content for body

        Returns:
            Self for chaining
        """
        self._content = content
        return self

    def set_title(self, title: str) -> "HTMLDocumentBuilder":
        """Set the document title.

        Args:
            title: Document title

        Returns:
            Self for chaining
        """
        self._title = title
        return self

    def set_language(self, language: str) -> "HTMLDocumentBuilder":
        """Set the document language.

        Args:
            language: HTML lang attribute value

        Returns:
            Self for chaining
        """
        self._language = language
        return self

    def add_css(self, css: str) -> "HTMLDocumentBuilder":
        """Add CSS styles.

        Args:
            css: CSS rules to add

        Returns:
            Self for chaining
        """
        self._css_parts.append(css)
        return self

    def set_author(self, author: str) -> "HTMLDocumentBuilder":
        """Set the author meta tag.

        Args:
            author: Author name

        Returns:
            Self for chaining
        """
        self._author = author
        return self

    def set_description(self, description: str) -> "HTMLDocumentBuilder":
        """Set the description meta tag.

        Args:
            description: Description text

        Returns:
            Self for chaining
        """
        self._description = description
        return self

    def add_keyword(self, keyword: str) -> "HTMLDocumentBuilder":
        """Add a keyword.

        Args:
            keyword: Keyword to add

        Returns:
            Self for chaining
        """
        self._keywords.append(keyword)
        return self

    def set_keywords(self, keywords: list[str]) -> "HTMLDocumentBuilder":
        """Set all keywords.

        Args:
            keywords: List of keywords

        Returns:
            Self for chaining
        """
        self._keywords = keywords
        return self

    def add_stylesheet(self, url: str) -> "HTMLDocumentBuilder":
        """Add an external stylesheet.

        Args:
            url: Stylesheet URL

        Returns:
            Self for chaining
        """
        self._stylesheets.append(url)
        return self

    def add_script(self, url: str) -> "HTMLDocumentBuilder":
        """Add an external script.

        Args:
            url: Script URL

        Returns:
            Self for chaining
        """
        self._scripts.append(url)
        return self

    def set_responsive(self, responsive: bool) -> "HTMLDocumentBuilder":
        """Set responsive mode.

        Args:
            responsive: Include viewport meta tag

        Returns:
            Self for chaining
        """
        self._responsive = responsive
        return self

    def set_page_width(self, width: float) -> "HTMLDocumentBuilder":
        """Set page width.

        Args:
            width: Page width in points

        Returns:
            Self for chaining
        """
        self._page_width = width
        return self

    def set_direction(self, direction: str) -> "HTMLDocumentBuilder":
        """Set text direction.

        Args:
            direction: Text direction (ltr, rtl)

        Returns:
            Self for chaining
        """
        self._direction = direction
        return self

    def set_minify(self, minify: bool) -> "HTMLDocumentBuilder":
        """Set minification mode.

        Args:
            minify: Minify output

        Returns:
            Self for chaining
        """
        self._minify = minify
        return self

    def set_pretty(self, pretty: bool) -> "HTMLDocumentBuilder":
        """Set pretty-print mode.

        Args:
            pretty: Pretty-print output

        Returns:
            Self for chaining
        """
        self._pretty = pretty
        return self

    def enable_print_styles(self) -> "HTMLDocumentBuilder":
        """Enable print media query styles.

        Returns:
            Self for chaining
        """
        self._include_print_styles = True
        return self

    def enable_skip_link(self) -> "HTMLDocumentBuilder":
        """Enable skip to content link.

        Returns:
            Self for chaining
        """
        self._include_skip_link = True
        return self

    def build(self) -> HTMLDocument:
        """Build the HTMLDocument instance.

        Returns:
            HTMLDocument instance
        """
        css = "\n".join(self._css_parts) if self._css_parts else None

        return HTMLDocument(
            content=self._content,
            title=self._title,
            language=self._language,
            css=css,
            author=self._author,
            description=self._description,
            keywords=self._keywords if self._keywords else None,
            stylesheets=self._stylesheets if self._stylesheets else None,
            scripts=self._scripts if self._scripts else None,
            responsive=self._responsive,
            page_width=self._page_width,
            direction=self._direction,
            minify=self._minify,
            pretty=self._pretty,
            include_print_styles=self._include_print_styles,
            include_skip_link=self._include_skip_link,
        )
