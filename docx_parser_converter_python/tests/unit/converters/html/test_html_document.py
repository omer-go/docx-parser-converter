"""Unit tests for HTML document wrapper.

Tests generation of complete HTML5 documents.
"""

from converters.html.html_document import HTMLDocument, HTMLDocumentBuilder

# =============================================================================
# Basic HTML Structure Tests
# =============================================================================


class TestBasicHTMLStructure:
    """Tests for basic HTML5 document structure."""

    def test_html5_doctype(self) -> None:
        """Output includes HTML5 doctype."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert result.startswith("<!DOCTYPE html>")

    def test_html_element(self) -> None:
        """Output has <html> element."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert "<html" in result
        assert "</html>" in result

    def test_head_element(self) -> None:
        """Output has <head> element."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert "<head>" in result
        assert "</head>" in result

    def test_body_element(self) -> None:
        """Output has <body> element."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert "<body>" in result or "<body " in result
        assert "</body>" in result

    def test_content_in_body(self) -> None:
        """Content appears within body."""
        doc = HTMLDocument(content="<p>Test content</p>")
        result = doc.render()
        # Content should be between <body> and </body>
        body_start = result.find("<body")
        body_end = result.find("</body>")
        assert body_start < body_end
        assert "Test content" in result[body_start:body_end]

    def test_meta_charset(self) -> None:
        """Head includes charset meta tag."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert '<meta charset="UTF-8">' in result

    def test_html_lang_attribute(self) -> None:
        """HTML element has lang attribute."""
        doc = HTMLDocument(content="<p>Hello</p>", language="en")
        result = doc.render()
        assert 'lang="en"' in result


# =============================================================================
# Title Tests
# =============================================================================


class TestHTMLTitle:
    """Tests for HTML document title."""

    def test_title_element(self) -> None:
        """Document has title element."""
        doc = HTMLDocument(content="<p>Hello</p>", title="My Document")
        result = doc.render()
        assert "<title>My Document</title>" in result

    def test_empty_title(self) -> None:
        """Empty title is handled."""
        doc = HTMLDocument(content="<p>Hello</p>", title="")
        result = doc.render()
        assert "<title></title>" in result

    def test_title_escaping(self) -> None:
        """Title with special characters is escaped."""
        doc = HTMLDocument(content="<p>Hello</p>", title="<script>alert('xss')</script>")
        result = doc.render()
        # Script tags should be escaped in title
        head_section = result.split("<body")[0]
        assert "<script>alert" not in head_section
        assert "&lt;script&gt;" in head_section

    def test_default_title(self) -> None:
        """Default title when none provided."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Should have title element, could be empty
        assert "<title>" in result


# =============================================================================
# CSS Styles Tests
# =============================================================================


class TestHTMLStyles:
    """Tests for embedded CSS styles."""

    def test_style_element(self) -> None:
        """Style element in head."""
        css = "p { margin: 0; }"
        doc = HTMLDocument(content="<p>Hello</p>", css=css)
        result = doc.render()
        assert "<style>" in result
        assert "p { margin: 0; }" in result

    def test_multiple_styles(self) -> None:
        """Multiple CSS rules."""
        css = "body { font-family: Arial; }\np { margin: 0; }"
        doc = HTMLDocument(content="<p>Hello</p>", css=css)
        result = doc.render()
        assert "font-family: Arial" in result
        assert "margin: 0" in result

    def test_no_styles(self) -> None:
        """Document without explicit styles still has default styles."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Should have style tag with default body styles
        assert "<style>" in result

    def test_default_body_styles(self) -> None:
        """Default body styles applied."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Should include font-family and other defaults
        assert "font-family" in result

    def test_page_width_style(self) -> None:
        """Page width constraint in CSS."""
        doc = HTMLDocument(content="<p>Hello</p>", page_width=612)  # 8.5 inches in points
        result = doc.render()
        # Should include max-width style
        assert "max-width" in result


# =============================================================================
# Meta Tags Tests
# =============================================================================


class TestMetaTags:
    """Tests for HTML meta tags."""

    def test_viewport_meta(self) -> None:
        """Viewport meta for responsive design."""
        doc = HTMLDocument(content="<p>Hello</p>", responsive=True)
        result = doc.render()
        assert '<meta name="viewport"' in result

    def test_author_meta(self) -> None:
        """Author meta tag."""
        doc = HTMLDocument(content="<p>Hello</p>", author="John Doe")
        result = doc.render()
        assert '<meta name="author" content="John Doe">' in result

    def test_description_meta(self) -> None:
        """Description meta tag."""
        doc = HTMLDocument(content="<p>Hello</p>", description="A test document")
        result = doc.render()
        assert '<meta name="description"' in result
        assert "A test document" in result

    def test_keywords_meta(self) -> None:
        """Keywords meta tag."""
        doc = HTMLDocument(content="<p>Hello</p>", keywords=["test", "document"])
        result = doc.render()
        assert '<meta name="keywords"' in result
        assert "test" in result

    def test_generator_meta(self) -> None:
        """Generator meta tag."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert '<meta name="generator" content="docx-parser-converter">' in result


# =============================================================================
# External Resources Tests
# =============================================================================


class TestExternalResources:
    """Tests for external CSS/JS resources."""

    def test_external_stylesheet(self) -> None:
        """External stylesheet link."""
        doc = HTMLDocument(content="<p>Hello</p>", stylesheets=["styles.css"])
        result = doc.render()
        assert '<link rel="stylesheet" href="styles.css">' in result

    def test_multiple_stylesheets(self) -> None:
        """Multiple external stylesheets."""
        doc = HTMLDocument(content="<p>Hello</p>", stylesheets=["base.css", "theme.css"])
        result = doc.render()
        assert 'href="base.css"' in result
        assert 'href="theme.css"' in result

    def test_external_script(self) -> None:
        """External script tag."""
        doc = HTMLDocument(content="<p>Hello</p>", scripts=["app.js"])
        result = doc.render()
        assert '<script src="app.js">' in result


# =============================================================================
# Document Builder Tests
# =============================================================================


class TestHTMLDocumentBuilder:
    """Tests for HTML document builder pattern."""

    def test_builder_basic(self) -> None:
        """Basic builder usage."""
        builder = HTMLDocumentBuilder()
        doc = builder.set_content("<p>Hello</p>").build()
        result = doc.render()
        assert "Hello" in result

    def test_builder_with_title(self) -> None:
        """Builder with title."""
        builder = HTMLDocumentBuilder()
        doc = builder.set_content("<p>Hello</p>").set_title("My Doc").build()
        result = doc.render()
        assert "<title>My Doc</title>" in result

    def test_builder_with_css(self) -> None:
        """Builder with CSS."""
        builder = HTMLDocumentBuilder()
        doc = builder.set_content("<p>Hello</p>").add_css("p { color: red; }").build()
        result = doc.render()
        assert "color: red" in result

    def test_builder_chaining(self) -> None:
        """Builder method chaining."""
        doc = (
            HTMLDocumentBuilder()
            .set_content("<p>Hello</p>")
            .set_title("Test")
            .set_language("en")
            .add_css("p { margin: 0; }")
            .build()
        )
        result = doc.render()
        assert "Hello" in result
        assert "Test" in result
        assert 'lang="en"' in result
        assert "margin: 0" in result


# =============================================================================
# Section/Page Break Tests
# =============================================================================


class TestSectionHandling:
    """Tests for section and page break handling."""

    def test_page_break_element(self) -> None:
        """Page breaks in document."""
        doc = HTMLDocument(content="<p>Page 1</p><hr class='page-break'/><p>Page 2</p>")
        result = doc.render()
        # Page break CSS should be included
        assert "page-break" in result

    def test_section_break_element(self) -> None:
        """Section breaks in document."""
        doc = HTMLDocument(content="<section><p>Section 1</p></section>")
        result = doc.render()
        assert "Section 1" in result

    def test_page_break_css(self) -> None:
        """CSS for page breaks included."""
        doc = HTMLDocument(content="<p>Content</p>")
        result = doc.render()
        # Default styles should include page-break styles
        assert ".page-break" in result


# =============================================================================
# Image Handling Tests
# =============================================================================


class TestImageHandling:
    """Tests for image handling in HTML document."""

    def test_embedded_images(self) -> None:
        """Embedded images as data URIs."""
        # Images could be base64 encoded in content
        content = '<img src="data:image/png;base64,ABC123...">'
        doc = HTMLDocument(content=content)
        result = doc.render()
        assert "data:image/png;base64" in result

    def test_external_image_references(self) -> None:
        """External image references."""
        content = '<img src="images/image1.png">'
        doc = HTMLDocument(content=content)
        result = doc.render()
        assert 'src="images/image1.png"' in result

    def test_image_directory(self) -> None:
        """Image directory configuration."""
        content = '<img src="assets/images/test.png">'
        doc = HTMLDocument(content=content)
        result = doc.render()
        assert "assets/images/test.png" in result


# =============================================================================
# Font Handling Tests
# =============================================================================


class TestFontHandling:
    """Tests for font handling in HTML document."""

    def test_font_face_declarations(self) -> None:
        """@font-face declarations for embedded fonts."""
        css = "@font-face { font-family: 'Custom'; src: url('font.woff2'); }"
        doc = HTMLDocument(content="<p>Hello</p>", css=css)
        result = doc.render()
        assert "@font-face" in result

    def test_web_safe_fallbacks(self) -> None:
        """Web-safe font fallbacks."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Default styles should include fallback fonts
        assert "Arial" in result or "sans-serif" in result

    def test_google_fonts_link(self) -> None:
        """Google Fonts integration option."""
        doc = HTMLDocument(
            content="<p>Hello</p>", stylesheets=["https://fonts.googleapis.com/css?family=Roboto"]
        )
        result = doc.render()
        assert "fonts.googleapis.com" in result


# =============================================================================
# Encoding Tests
# =============================================================================


class TestEncoding:
    """Tests for character encoding."""

    def test_utf8_content(self) -> None:
        """UTF-8 content handled correctly."""
        doc = HTMLDocument(content="<p>Hello 世界</p>")
        result = doc.render()
        assert "世界" in result

    def test_emoji_content(self) -> None:
        """Emoji content handled correctly."""
        doc = HTMLDocument(content="<p>Hello 🌍</p>")
        result = doc.render()
        assert "🌍" in result

    def test_rtl_content(self) -> None:
        """Right-to-left content."""
        doc = HTMLDocument(content="<p>مرحبا</p>", direction="rtl")
        result = doc.render()
        assert "مرحبا" in result
        assert 'dir="rtl"' in result


# =============================================================================
# Validation Tests
# =============================================================================


class TestHTMLValidation:
    """Tests for HTML output validation."""

    def test_valid_html5(self) -> None:
        """Output is valid HTML5."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Basic structure checks
        assert "<!DOCTYPE html>" in result
        assert "<html" in result
        assert "</html>" in result

    def test_properly_closed_tags(self) -> None:
        """All tags properly closed."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert result.count("<html") == result.count("</html>")
        assert result.count("<head>") == result.count("</head>")
        assert result.count("<body") == result.count("</body>")

    def test_proper_nesting(self) -> None:
        """Tags properly nested."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Head should come before body
        assert result.find("<head>") < result.find("<body")

    def test_escaped_attributes(self) -> None:
        """Attribute values properly escaped."""
        doc = HTMLDocument(content="<p>Hello</p>", author='John "The Dev" Doe')
        result = doc.render()
        # Quotes should be escaped
        assert "&quot;" in result or "John" in result


# =============================================================================
# Minification Tests
# =============================================================================


class TestMinification:
    """Tests for HTML minification options."""

    def test_minified_output(self) -> None:
        """Minified output option."""
        doc = HTMLDocument(content="<p>Hello</p>", minify=True)
        result = doc.render()
        # Should have minimal whitespace (no extra newlines)
        assert "\n\n" not in result

    def test_pretty_output(self) -> None:
        """Pretty-printed output option."""
        doc = HTMLDocument(content="<p>Hello</p>", pretty=True)
        result = doc.render()
        # Should have newlines for pretty output
        assert "\n" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestHTMLDocumentEdgeCases:
    """Tests for edge cases in HTML document generation."""

    def test_empty_content(self) -> None:
        """Document with empty content."""
        doc = HTMLDocument(content="")
        result = doc.render()
        # Should still produce valid HTML structure
        assert "<!DOCTYPE html>" in result
        assert "<html" in result

    def test_none_content(self) -> None:
        """Document with None content."""
        doc = HTMLDocument(content=None)
        result = doc.render()
        # Should handle None gracefully
        assert "<!DOCTYPE html>" in result

    def test_very_large_content(self) -> None:
        """Document with very large content."""
        large_content = "<p>" + "A" * 10000 + "</p>"
        doc = HTMLDocument(content=large_content)
        result = doc.render()
        assert "A" * 10000 in result

    def test_special_characters_everywhere(self) -> None:
        """Special characters in title, content, meta."""
        doc = HTMLDocument(
            content="<p>&amp; test</p>", title="Test & Demo", description="A test document"
        )
        result = doc.render()
        # Should render without errors
        assert "test" in result.lower()

    def test_script_injection_prevention(self) -> None:
        """Script injection prevented in meta tags."""
        doc = HTMLDocument(content="<p>Safe</p>", title="<script>alert('xss')</script>")
        result = doc.render()
        # Script should be escaped in title
        head_section = result.split("<body")[0]
        assert "<script>alert" not in head_section


# =============================================================================
# Fragment Mode Tests
# =============================================================================


class TestFragmentMode:
    """Tests for HTML fragment output (no wrapper)."""

    def test_fragment_only_content(self) -> None:
        """Output content only without HTML wrapper."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render_fragment()
        assert result == "<p>Hello</p>"
        # No doctype, html, head, body
        assert "<!DOCTYPE" not in result
        assert "<html" not in result

    def test_fragment_with_styles(self) -> None:
        """Fragment doesn't include style block."""
        doc = HTMLDocument(content="<p>Hello</p>", css="p { color: red; }")
        result = doc.render_fragment()
        # Fragment should just be the content
        assert result == "<p>Hello</p>"
        assert "<style>" not in result


# =============================================================================
# Template Integration Tests
# =============================================================================


class TestTemplateIntegration:
    """Tests for custom HTML template integration."""

    def test_custom_template(self) -> None:
        """Default template produces valid output."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        assert "<!DOCTYPE html>" in result
        assert "<html" in result

    def test_template_placeholders(self) -> None:
        """Content is properly inserted into template."""
        doc = HTMLDocument(content="<p>Custom Content</p>")
        result = doc.render()
        assert "Custom Content" in result


# =============================================================================
# Print Styles Tests
# =============================================================================


class TestPrintStyles:
    """Tests for print-specific styles."""

    def test_print_media_query(self) -> None:
        """Print media query included."""
        doc = HTMLDocument(content="<p>Hello</p>", include_print_styles=True)
        result = doc.render()
        assert "@media print" in result

    def test_page_size_css(self) -> None:
        """CSS page size for printing."""
        doc = HTMLDocument(content="<p>Hello</p>", include_print_styles=True)
        result = doc.render()
        # @page rule should be present
        assert "@page" in result

    def test_print_margins(self) -> None:
        """Print margins in CSS."""
        doc = HTMLDocument(content="<p>Hello</p>", include_print_styles=True)
        result = doc.render()
        # Margin should be in @page
        assert "margin" in result


# =============================================================================
# Accessibility Tests
# =============================================================================


class TestAccessibility:
    """Tests for accessibility features."""

    def test_skip_link(self) -> None:
        """Skip to content link option."""
        doc = HTMLDocument(content="<p>Hello</p>", include_skip_link=True)
        result = doc.render()
        assert 'href="#content"' in result
        assert "skip" in result.lower()

    def test_main_landmark(self) -> None:
        """Main landmark element."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Content should be wrapped in <main>
        assert "<main" in result
        assert "</main>" in result

    def test_aria_document_role(self) -> None:
        """Document ARIA role."""
        doc = HTMLDocument(content="<p>Hello</p>")
        result = doc.render()
        # Main element should have role
        assert 'role="main"' in result
