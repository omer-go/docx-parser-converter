"""Unit tests for paragraph to HTML converter.

Tests conversion of Paragraph elements to HTML p/div tags.
"""

from converters.html.paragraph_to_html import (
    ParagraphToHTMLConverter,
    bookmark_end_to_html,
    bookmark_start_to_html,
    hyperlink_to_html,
    paragraph_content_to_html,
    paragraph_to_html,
)
from models.common.border import Border, ParagraphBorders
from models.common.indentation import Indentation
from models.common.shading import Shading
from models.common.spacing import Spacing
from models.document.hyperlink import BookmarkEnd, BookmarkStart, Hyperlink
from models.document.paragraph import (
    NumberingProperties,
    Paragraph,
    ParagraphProperties,
    TabStop,
)
from models.document.run import Run, RunProperties
from models.document.run_content import Text

# =============================================================================
# Basic Paragraph Conversion Tests
# =============================================================================


class TestBasicParagraphConversion:
    """Tests for basic paragraph to HTML conversion."""

    def test_simple_paragraph(self) -> None:
        """Simple paragraph with text run converts to <p>."""
        para = Paragraph(content=[Run(content=[Text(value="Hello")])])
        result = paragraph_to_html(para)
        assert "<p>" in result
        assert "Hello" in result
        assert "</p>" in result

    def test_empty_paragraph(self) -> None:
        """Empty paragraph returns minimal p tag."""
        para = Paragraph(content=[])
        result = paragraph_to_html(para)
        assert "<p>" in result
        assert "</p>" in result

    def test_none_paragraph(self) -> None:
        """None paragraph returns empty string."""
        result = paragraph_to_html(None)
        assert result == ""

    def test_paragraph_with_multiple_runs(self) -> None:
        """Paragraph with multiple runs."""
        para = Paragraph(
            content=[Run(content=[Text(value="Hello ")]), Run(content=[Text(value="World")])]
        )
        result = paragraph_to_html(para)
        assert "Hello " in result
        assert "World" in result

    def test_paragraph_preserves_run_order(self) -> None:
        """Runs appear in original order."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="First")]),
                Run(content=[Text(value="Second")]),
                Run(content=[Text(value="Third")]),
            ]
        )
        result = paragraph_to_html(para)
        first_pos = result.index("First")
        second_pos = result.index("Second")
        third_pos = result.index("Third")
        assert first_pos < second_pos < third_pos


# =============================================================================
# Paragraph Alignment Tests
# =============================================================================


class TestParagraphAlignment:
    """Tests for paragraph alignment conversion."""

    def test_left_alignment(self) -> None:
        """Left alignment."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="left"), content=[Run(content=[Text(value="Left")])]
        )
        result = paragraph_to_html(para)
        # left is default, may or may not include explicit text-align
        assert "Left" in result

    def test_center_alignment(self) -> None:
        """Center alignment."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="center"), content=[Run(content=[Text(value="Centered")])]
        )
        result = paragraph_to_html(para)
        assert "text-align" in result
        assert "center" in result

    def test_right_alignment(self) -> None:
        """Right alignment."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="right"), content=[Run(content=[Text(value="Right")])]
        )
        result = paragraph_to_html(para)
        assert "text-align" in result
        assert "right" in result

    def test_justify_alignment(self) -> None:
        """Justify alignment."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="both"),
            content=[Run(content=[Text(value="Justified text")])],
        )
        result = paragraph_to_html(para)
        assert "text-align" in result
        assert "justify" in result

    def test_distribute_alignment(self) -> None:
        """Distribute alignment (rare, but should work)."""
        para = Paragraph(
            p_pr=ParagraphProperties(jc="distribute"),
            content=[Run(content=[Text(value="Distributed")])],
        )
        result = paragraph_to_html(para)
        # Distribute typically maps to justify
        assert "Distributed" in result


# =============================================================================
# Paragraph Spacing Tests
# =============================================================================


class TestParagraphSpacing:
    """Tests for paragraph spacing conversion."""

    def test_space_before(self) -> None:
        """Space before paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(before=240)),  # 12pt
            content=[Run(content=[Text(value="Spaced")])],
        )
        result = paragraph_to_html(para)
        assert "margin-top" in result

    def test_space_after(self) -> None:
        """Space after paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(after=240)),  # 12pt
            content=[Run(content=[Text(value="Spaced")])],
        )
        result = paragraph_to_html(para)
        assert "margin-bottom" in result

    def test_line_spacing_single(self) -> None:
        """Single line spacing."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(line=240, line_rule="auto")),
            content=[Run(content=[Text(value="Single spaced")])],
        )
        result = paragraph_to_html(para)
        # Single spacing (1.0) might not add line-height
        assert "Single spaced" in result

    def test_line_spacing_double(self) -> None:
        """Double line spacing."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(line=480, line_rule="auto")),
            content=[Run(content=[Text(value="Double spaced")])],
        )
        result = paragraph_to_html(para)
        assert "line-height" in result

    def test_line_spacing_exact(self) -> None:
        """Exact line spacing."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(line=300, line_rule="exact")),
            content=[Run(content=[Text(value="Exact spacing")])],
        )
        result = paragraph_to_html(para)
        assert "line-height" in result

    def test_line_spacing_at_least(self) -> None:
        """At least line spacing."""
        para = Paragraph(
            p_pr=ParagraphProperties(spacing=Spacing(line=300, line_rule="atLeast")),
            content=[Run(content=[Text(value="At least spacing")])],
        )
        result = paragraph_to_html(para)
        # atLeast uses min-height instead of line-height
        assert "min-height" in result or "line-height" in result


# =============================================================================
# Paragraph Indentation Tests
# =============================================================================


class TestParagraphIndentation:
    """Tests for paragraph indentation conversion."""

    def test_left_indent(self) -> None:
        """Left indentation."""
        para = Paragraph(
            p_pr=ParagraphProperties(ind=Indentation(left=720)),  # 0.5in
            content=[Run(content=[Text(value="Indented")])],
        )
        result = paragraph_to_html(para)
        assert "margin-left" in result

    def test_right_indent(self) -> None:
        """Right indentation."""
        para = Paragraph(
            p_pr=ParagraphProperties(ind=Indentation(right=720)),
            content=[Run(content=[Text(value="Right indented")])],
        )
        result = paragraph_to_html(para)
        assert "margin-right" in result

    def test_first_line_indent(self) -> None:
        """First line indentation."""
        para = Paragraph(
            p_pr=ParagraphProperties(ind=Indentation(first_line=720)),
            content=[Run(content=[Text(value="First line indented paragraph")])],
        )
        result = paragraph_to_html(para)
        assert "text-indent" in result

    def test_hanging_indent(self) -> None:
        """Hanging indentation (negative first line)."""
        para = Paragraph(
            p_pr=ParagraphProperties(ind=Indentation(left=720, hanging=720)),
            content=[Run(content=[Text(value="Hanging indent")])],
        )
        result = paragraph_to_html(para)
        assert "text-indent" in result

    def test_start_end_indent(self) -> None:
        """Start/end indentation (for RTL support)."""
        para = Paragraph(
            p_pr=ParagraphProperties(ind=Indentation(start=720, end=360)),
            content=[Run(content=[Text(value="RTL aware indentation")])],
        )
        result = paragraph_to_html(para)
        # Start/end get converted to left/right in CSS
        assert "RTL aware indentation" in result


# =============================================================================
# Paragraph Border Tests
# =============================================================================


class TestParagraphBorders:
    """Tests for paragraph border conversion."""

    def test_top_border(self) -> None:
        """Top border."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                p_bdr=ParagraphBorders(top=Border(val="single", sz=8, color="000000"))
            ),
            content=[Run(content=[Text(value="Bordered")])],
        )
        result = paragraph_to_html(para)
        assert "border-top" in result

    def test_bottom_border(self) -> None:
        """Bottom border."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                p_bdr=ParagraphBorders(bottom=Border(val="single", sz=8, color="000000"))
            ),
            content=[Run(content=[Text(value="Bordered")])],
        )
        result = paragraph_to_html(para)
        assert "border-bottom" in result

    def test_all_borders(self) -> None:
        """All four borders."""
        border = Border(val="single", sz=8, color="000000")
        para = Paragraph(
            p_pr=ParagraphProperties(
                p_bdr=ParagraphBorders(top=border, bottom=border, left=border, right=border)
            ),
            content=[Run(content=[Text(value="Box border")])],
        )
        result = paragraph_to_html(para)
        assert "border" in result

    def test_bar_border(self) -> None:
        """Bar border (left bar decoration)."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                p_bdr=ParagraphBorders(bar=Border(val="single", sz=8, color="FF0000"))
            ),
            content=[Run(content=[Text(value="With bar")])],
        )
        result = paragraph_to_html(para)
        # Bar is converted to border
        assert "With bar" in result


# =============================================================================
# Paragraph Shading Tests
# =============================================================================


class TestParagraphShading:
    """Tests for paragraph background/shading conversion."""

    def test_fill_color(self) -> None:
        """Background fill color."""
        para = Paragraph(
            p_pr=ParagraphProperties(shd=Shading(fill="FFFF00")),
            content=[Run(content=[Text(value="Yellow background")])],
        )
        result = paragraph_to_html(para)
        assert "background" in result

    def test_pattern_shading(self) -> None:
        """Pattern shading (less common)."""
        para = Paragraph(
            p_pr=ParagraphProperties(shd=Shading(val="pct25", color="000000", fill="FFFFFF")),
            content=[Run(content=[Text(value="Patterned")])],
        )
        result = paragraph_to_html(para)
        assert "Patterned" in result

    def test_clear_shading(self) -> None:
        """Clear/nil shading."""
        para = Paragraph(
            p_pr=ParagraphProperties(shd=Shading(val="clear")),
            content=[Run(content=[Text(value="No shading")])],
        )
        result = paragraph_to_html(para)
        # Should not add background style for clear
        assert "No shading" in result


# =============================================================================
# Hyperlink Tests
# =============================================================================


class TestHyperlinkConversion:
    """Tests for hyperlink conversion within paragraphs."""

    def test_external_hyperlink(self) -> None:
        """External hyperlink with r:id."""
        hyperlink = Hyperlink(r_id="rId1", content=[Run(content=[Text(value="Click here")])])
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para, relationships={"rId1": "https://example.com"})
        assert "<a" in result
        assert "href=" in result
        assert "https://example.com" in result

    def test_internal_anchor_link(self) -> None:
        """Internal link to bookmark."""
        hyperlink = Hyperlink(
            anchor="Section1", content=[Run(content=[Text(value="Go to Section 1")])]
        )
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para)
        assert 'href="#Section1"' in result

    def test_hyperlink_with_tooltip(self) -> None:
        """Hyperlink with tooltip."""
        hyperlink = Hyperlink(
            r_id="rId1", tooltip="Visit our website", content=[Run(content=[Text(value="Link")])]
        )
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para, relationships={"rId1": "https://example.com"})
        assert "title=" in result
        assert "Visit our website" in result

    def test_hyperlink_with_formatted_runs(self) -> None:
        """Hyperlink containing formatted runs."""
        hyperlink = Hyperlink(
            r_id="rId1",
            content=[Run(r_pr=RunProperties(b=True), content=[Text(value="Bold link")])],
        )
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para, relationships={"rId1": "https://example.com"})
        assert "Bold link" in result
        assert "<a" in result

    def test_hyperlink_missing_relationship(self) -> None:
        """Hyperlink with missing relationship ID."""
        hyperlink = Hyperlink(
            r_id="rId999",  # Not in relationships
            content=[Run(content=[Text(value="Broken link")])],
        )
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para, relationships={})
        # Should handle gracefully
        assert "Broken link" in result
        assert "<a" in result

    def test_mixed_content_with_hyperlinks(self) -> None:
        """Paragraph with text before and after hyperlink."""
        para = Paragraph(
            content=[
                Run(content=[Text(value="Click ")]),
                Hyperlink(r_id="rId1", content=[Run(content=[Text(value="here")])]),
                Run(content=[Text(value=" for more.")]),
            ]
        )
        result = paragraph_to_html(para, relationships={"rId1": "https://example.com"})
        assert "Click " in result
        assert "<a" in result
        assert "here" in result
        assert "for more." in result


# =============================================================================
# Bookmark Tests
# =============================================================================


class TestBookmarkConversion:
    """Tests for bookmark conversion."""

    def test_bookmark_start(self) -> None:
        """Bookmark start creates anchor."""
        para = Paragraph(
            content=[
                BookmarkStart(id="0", name="Section1"),
                Run(content=[Text(value="Section content")]),
            ]
        )
        result = paragraph_to_html(para)
        assert 'id="Section1"' in result

    def test_bookmark_end(self) -> None:
        """Bookmark end is typically invisible."""
        para = Paragraph(content=[Run(content=[Text(value="Content")]), BookmarkEnd(id="0")])
        result = paragraph_to_html(para)
        # Bookmark end should not add visible content
        assert "Content" in result

    def test_bookmark_range(self) -> None:
        """Complete bookmark range."""
        para = Paragraph(
            content=[
                BookmarkStart(id="0", name="Important"),
                Run(content=[Text(value="Important content")]),
                BookmarkEnd(id="0"),
            ]
        )
        result = paragraph_to_html(para)
        assert 'id="Important"' in result

    def test_bookmark_start_standalone(self) -> None:
        """Test bookmark_start_to_html function."""
        result = bookmark_start_to_html(BookmarkStart(id="0", name="MyBookmark"))
        assert 'id="MyBookmark"' in result

    def test_bookmark_end_standalone(self) -> None:
        """Test bookmark_end_to_html function."""
        result = bookmark_end_to_html(BookmarkEnd(id="0"))
        assert result == ""


# =============================================================================
# Numbering/List Tests
# =============================================================================


class TestNumberingConversion:
    """Tests for paragraph numbering conversion."""

    def test_numbered_paragraph(self) -> None:
        """Paragraph with numbering prefix."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=0)),
            content=[Run(content=[Text(value="First item")])],
        )
        result = paragraph_to_html(para, numbering_prefix="1. ")
        assert "1." in result

    def test_bulleted_paragraph(self) -> None:
        """Paragraph with bullet prefix."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=2, ilvl=0)),
            content=[Run(content=[Text(value="Bullet item")])],
        )
        result = paragraph_to_html(para, numbering_prefix="• ")
        assert "•" in result

    def test_nested_list_item(self) -> None:
        """Nested list item with indentation."""
        para = Paragraph(
            p_pr=ParagraphProperties(num_pr=NumberingProperties(num_id=1, ilvl=1)),
            content=[Run(content=[Text(value="Nested item")])],
        )
        result = paragraph_to_html(para, numbering_prefix="a. ")
        assert "a." in result
        assert "Nested item" in result

    def test_numbered_paragraph_indentation(self) -> None:
        """List indentation is applied correctly."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                num_pr=NumberingProperties(num_id=1, ilvl=0), ind=Indentation(left=720)
            ),
            content=[Run(content=[Text(value="Indented list")])],
        )
        result = paragraph_to_html(para, numbering_prefix="1. ")
        assert "margin-left" in result


# =============================================================================
# Tab Stop Tests
# =============================================================================


class TestTabStopConversion:
    """Tests for tab stop conversion."""

    def test_left_tab_stop(self) -> None:
        """Left tab stop."""
        para = Paragraph(
            p_pr=ParagraphProperties(tabs=[TabStop(val="left", pos=720)]),
            content=[Run(content=[Text(value="Tab content")])],
        )
        result = paragraph_to_html(para)
        # Tab stops are paragraph properties, content should render
        assert "Tab content" in result

    def test_right_tab_stop(self) -> None:
        """Right tab stop."""
        para = Paragraph(
            p_pr=ParagraphProperties(tabs=[TabStop(val="right", pos=9360)]),
            content=[Run(content=[Text(value="Right aligned")])],
        )
        result = paragraph_to_html(para)
        assert "Right aligned" in result

    def test_center_tab_stop(self) -> None:
        """Center tab stop."""
        para = Paragraph(
            p_pr=ParagraphProperties(tabs=[TabStop(val="center", pos=4680)]),
            content=[Run(content=[Text(value="Centered")])],
        )
        result = paragraph_to_html(para)
        assert "Centered" in result

    def test_decimal_tab_stop(self) -> None:
        """Decimal tab stop (for numbers)."""
        para = Paragraph(
            p_pr=ParagraphProperties(tabs=[TabStop(val="decimal", pos=5760)]),
            content=[Run(content=[Text(value="123.45")])],
        )
        result = paragraph_to_html(para)
        assert "123.45" in result

    def test_tab_leader(self) -> None:
        """Tab with leader character."""
        para = Paragraph(
            p_pr=ParagraphProperties(tabs=[TabStop(val="right", pos=9360, leader="dot")]),
            content=[Run(content=[Text(value="TOC entry")])],
        )
        result = paragraph_to_html(para)
        assert "TOC entry" in result


# =============================================================================
# Page Break Control Tests
# =============================================================================


class TestPageBreakControl:
    """Tests for page break control properties."""

    def test_page_break_before(self) -> None:
        """Page break before paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(page_break_before=True),
            content=[Run(content=[Text(value="New page")])],
        )
        result = paragraph_to_html(para)
        assert "page-break-before" in result

    def test_keep_with_next(self) -> None:
        """Keep with next paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(keep_next=True), content=[Run(content=[Text(value="Heading")])]
        )
        result = paragraph_to_html(para)
        assert "break-after" in result or "page-break-after" in result

    def test_keep_lines_together(self) -> None:
        """Keep lines together."""
        para = Paragraph(
            p_pr=ParagraphProperties(keep_lines=True),
            content=[Run(content=[Text(value="Don't split me")])],
        )
        result = paragraph_to_html(para)
        assert "break-inside" in result or "page-break-inside" in result

    def test_widow_control(self) -> None:
        """Widow/orphan control."""
        para = Paragraph(
            p_pr=ParagraphProperties(widow_control=True),
            content=[Run(content=[Text(value="Protected text")])],
        )
        result = paragraph_to_html(para)
        # Widow control might add orphans/widows CSS or just be noted
        assert "Protected text" in result


# =============================================================================
# Style Reference Tests
# =============================================================================


class TestStyleReference:
    """Tests for paragraph style reference handling."""

    def test_paragraph_style_reference(self) -> None:
        """Paragraph references a style by ID."""
        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Heading1"),
            content=[Run(content=[Text(value="Heading")])],
        )
        result = paragraph_to_html(para)
        # Style reference doesn't directly affect output without style resolver
        assert "Heading" in result

    def test_style_with_direct_override(self) -> None:
        """Direct formatting overrides style properties."""
        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Normal", jc="center"),
            content=[Run(content=[Text(value="Centered")])],
        )
        result = paragraph_to_html(para)
        assert "center" in result


# =============================================================================
# RTL and BiDi Tests
# =============================================================================


class TestBidiSupport:
    """Tests for bidirectional text support."""

    def test_rtl_paragraph(self) -> None:
        """Right-to-left paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(bidi=True), content=[Run(content=[Text(value="مرحبا")])]
        )
        result = paragraph_to_html(para)
        assert 'dir="rtl"' in result

    def test_ltr_paragraph(self) -> None:
        """Explicit left-to-right paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(bidi=False), content=[Run(content=[Text(value="Hello")])]
        )
        result = paragraph_to_html(para)
        # LTR is default, might not need explicit attribute
        assert "Hello" in result


# =============================================================================
# Heading/Outline Level Tests
# =============================================================================


class TestOutlineLevelConversion:
    """Tests for outline level conversion."""

    def test_outline_level_to_heading(self) -> None:
        """Outline level 0 maps to h1."""
        para = Paragraph(
            p_pr=ParagraphProperties(outline_lvl=0),
            content=[Run(content=[Text(value="Main Heading")])],
        )
        result = paragraph_to_html(para, use_headings=True)
        assert "<h1" in result

    def test_outline_level_1(self) -> None:
        """Outline level 1 maps to h2."""
        para = Paragraph(
            p_pr=ParagraphProperties(outline_lvl=1),
            content=[Run(content=[Text(value="Subheading")])],
        )
        result = paragraph_to_html(para, use_headings=True)
        assert "<h2" in result

    def test_outline_level_without_heading_mode(self) -> None:
        """Without use_headings, outline level uses p tag."""
        para = Paragraph(
            p_pr=ParagraphProperties(outline_lvl=0),
            content=[Run(content=[Text(value="Heading as paragraph")])],
        )
        result = paragraph_to_html(para, use_headings=False)
        assert "<p" in result


# =============================================================================
# HTML Output Mode Tests
# =============================================================================


class TestParagraphHTMLOutputMode:
    """Tests for different HTML output modes."""

    def test_inline_style_mode(self) -> None:
        """Inline style mode produces style attribute."""
        converter = ParagraphToHTMLConverter(use_inline_styles=True)
        para = Paragraph(
            p_pr=ParagraphProperties(jc="center"), content=[Run(content=[Text(value="Centered")])]
        )
        result = converter.convert(para)
        assert "style=" in result

    def test_class_mode(self) -> None:
        """Class mode initialization."""
        converter = ParagraphToHTMLConverter(use_classes=True)
        assert converter.use_classes is True

    def test_semantic_tag_mode(self) -> None:
        """Semantic tag mode uses appropriate tags."""
        converter = ParagraphToHTMLConverter(use_semantic_tags=True)
        para = Paragraph(content=[Run(r_pr=RunProperties(b=True), content=[Text(value="Bold")])])
        result = converter.convert(para)
        assert "<strong>" in result


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestParagraphEdgeCases:
    """Tests for edge cases in paragraph conversion."""

    def test_paragraph_with_only_whitespace(self) -> None:
        """Paragraph containing only whitespace."""
        para = Paragraph(content=[Run(content=[Text(value="   ", space="preserve")])])
        result = paragraph_to_html(para)
        assert "<p>" in result

    def test_paragraph_with_empty_run(self) -> None:
        """Paragraph with empty run."""
        para = Paragraph(content=[Run(content=[])])
        result = paragraph_to_html(para)
        assert "<p>" in result

    def test_very_long_paragraph(self) -> None:
        """Paragraph with very long text."""
        long_text = "A" * 10000
        para = Paragraph(content=[Run(content=[Text(value=long_text)])])
        result = paragraph_to_html(para)
        assert long_text in result

    def test_paragraph_with_all_properties(self) -> None:
        """Paragraph with many properties set."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                jc="center", spacing=Spacing(before=240, after=120), ind=Indentation(left=720)
            ),
            content=[Run(content=[Text(value="Complex paragraph")])],
        )
        result = paragraph_to_html(para)
        assert "center" in result
        assert "margin" in result

    def test_unicode_content(self) -> None:
        """Paragraph with Unicode characters."""
        para = Paragraph(content=[Run(content=[Text(value="Hello 世界 🌍")])])
        result = paragraph_to_html(para)
        assert "世界" in result
        assert "🌍" in result

    def test_special_characters_in_content(self) -> None:
        """Paragraph with HTML special characters."""
        para = Paragraph(content=[Run(content=[Text(value="<script>alert('xss')</script>")])])
        result = paragraph_to_html(para)
        assert "&lt;script&gt;" in result
        assert "<script>" not in result

    def test_properties_without_content(self) -> None:
        """Paragraph with properties but no content."""
        para = Paragraph(p_pr=ParagraphProperties(jc="center"), content=[])
        result = paragraph_to_html(para)
        assert "<p" in result
        assert "</p>" in result

    def test_nested_hyperlinks_not_allowed(self) -> None:
        """Hyperlinks shouldn't nest (HTML doesn't allow)."""
        hyperlink = Hyperlink(r_id="rId1", content=[Run(content=[Text(value="Link text")])])
        para = Paragraph(content=[hyperlink])
        result = paragraph_to_html(para, relationships={"rId1": "https://example.com"})
        # Just verify it renders properly
        assert "Link text" in result

    def test_multiple_bookmarks_same_name(self) -> None:
        """Multiple bookmarks - both should render."""
        para = Paragraph(
            content=[
                BookmarkStart(id="0", name="Bookmark1"),
                Run(content=[Text(value="First")]),
                BookmarkStart(id="1", name="Bookmark2"),
                Run(content=[Text(value="Second")]),
            ]
        )
        result = paragraph_to_html(para)
        assert 'id="Bookmark1"' in result
        assert 'id="Bookmark2"' in result

    def test_combined_spacing_and_indentation(self) -> None:
        """Complex spacing and indentation combination."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                spacing=Spacing(before=240, after=120, line=480, line_rule="auto"),
                ind=Indentation(left=720, first_line=360),
            ),
            content=[Run(content=[Text(value="Complex formatting")])],
        )
        result = paragraph_to_html(para)
        assert "margin-top" in result
        assert "margin-bottom" in result
        assert "line-height" in result
        assert "margin-left" in result
        assert "text-indent" in result

    def test_paragraph_default_run_properties(self) -> None:
        """Paragraph with default run properties in pPr."""
        para = Paragraph(
            p_pr=ParagraphProperties(
                r_pr={"b": True}  # Default bold for runs - stored as dict
            ),
            content=[Run(content=[Text(value="Should render")])],
        )
        result = paragraph_to_html(para)
        assert "Should render" in result


# =============================================================================
# Line Numbering Tests
# =============================================================================


class TestLineNumbering:
    """Tests for line numbering suppression."""

    def test_suppress_line_numbers(self) -> None:
        """Suppress line numbers for paragraph."""
        para = Paragraph(
            p_pr=ParagraphProperties(suppress_line_numbers=True),
            content=[Run(content=[Text(value="No line numbers")])],
        )
        result = paragraph_to_html(para)
        assert "No line numbers" in result


# =============================================================================
# Text Direction Tests
# =============================================================================


class TestTextDirection:
    """Tests for text direction properties."""

    def test_text_direction_lr_tb(self) -> None:
        """Left to right, top to bottom (default)."""
        para = Paragraph(content=[Run(content=[Text(value="Normal text")])])
        result = paragraph_to_html(para)
        assert "Normal text" in result

    def test_text_direction_tb_rl(self) -> None:
        """Top to bottom, right to left (vertical)."""
        para = Paragraph(
            p_pr=ParagraphProperties(text_direction="tbRl"),
            content=[Run(content=[Text(value="Vertical")])],
        )
        result = paragraph_to_html(para)
        assert "Vertical" in result


# =============================================================================
# Auto Hyphenation Tests
# =============================================================================


class TestAutoHyphenation:
    """Tests for auto hyphenation suppression."""

    def test_suppress_auto_hyphens(self) -> None:
        """Suppress automatic hyphenation."""
        para = Paragraph(
            p_pr=ParagraphProperties(suppress_auto_hyphens=True),
            content=[Run(content=[Text(value="No auto hyphens")])],
        )
        result = paragraph_to_html(para)
        assert "No auto hyphens" in result


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestParagraphToHTMLConverterClass:
    """Tests for ParagraphToHTMLConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = ParagraphToHTMLConverter()
        assert converter is not None

    def test_converter_with_options(self) -> None:
        """Initialize with options."""
        converter = ParagraphToHTMLConverter(
            use_semantic_tags=False, use_classes=True, use_headings=True
        )
        assert converter.use_semantic_tags is False
        assert converter.use_classes is True
        assert converter.use_headings is True

    def test_set_relationships(self) -> None:
        """Set relationships for hyperlinks."""
        converter = ParagraphToHTMLConverter()
        converter.set_relationships({"rId1": "https://example.com"})
        assert converter.relationships["rId1"] == "https://example.com"

    def test_convert_method(self) -> None:
        """Convert method works."""
        converter = ParagraphToHTMLConverter()
        para = Paragraph(content=[Run(content=[Text(value="Test")])])
        result = converter.convert(para)
        assert "Test" in result

    def test_convert_content_method(self) -> None:
        """Convert content method works."""
        converter = ParagraphToHTMLConverter()
        result = converter.convert_content(Run(content=[Text(value="Test")]))
        assert "Test" in result

    def test_hyperlink_function(self) -> None:
        """Test hyperlink_to_html function directly."""
        hyperlink = Hyperlink(r_id="rId1", content=[Run(content=[Text(value="Link")])])
        result = hyperlink_to_html(hyperlink, relationships={"rId1": "https://example.com"})
        assert "<a" in result
        assert "https://example.com" in result

    def test_paragraph_content_to_html_function(self) -> None:
        """Test paragraph_content_to_html function."""
        run = Run(content=[Text(value="Test")])
        result = paragraph_content_to_html(run)
        assert "Test" in result


# =============================================================================
# Style Resolution Tests (Regression Tests)
# =============================================================================


class TestParagraphStyleResolution:
    """Tests for paragraph style resolution via StyleResolver.

    These tests ensure that when a style_resolver is provided,
    paragraph styles (p_style) are properly resolved and CSS is generated.
    """

    def test_paragraph_style_resolved_with_style_resolver(self) -> None:
        """Paragraph with p_style is resolved when style_resolver is provided."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.style import Style
        from models.styles.styles import Styles

        # Create a style with center alignment
        style = Style(
            style_id="Heading1",
            name="Heading 1",
            type="paragraph",
            p_pr={"jc": "center"},
        )
        styles = Styles(style=[style])
        style_resolver = StyleResolver(styles)

        # Create paragraph referencing the style
        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Heading1"),
            content=[Run(content=[Text(value="Styled heading")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        # The style's center alignment should be applied
        assert "text-align" in result
        assert "center" in result

    def test_paragraph_style_with_indentation(self) -> None:
        """Paragraph style with indentation is resolved."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.style import Style
        from models.styles.styles import Styles

        style = Style(
            style_id="Quote",
            name="Quote",
            type="paragraph",
            p_pr={"ind": {"left": 720, "right": 720}},
        )
        styles = Styles(style=[style])
        style_resolver = StyleResolver(styles)

        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Quote"),
            content=[Run(content=[Text(value="Quoted text")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        # The style's indentation should be applied
        assert "margin-left" in result
        assert "margin-right" in result

    def test_direct_formatting_overrides_style(self) -> None:
        """Direct paragraph formatting overrides style properties."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.style import Style
        from models.styles.styles import Styles

        # Style has left alignment
        style = Style(
            style_id="Normal",
            name="Normal",
            type="paragraph",
            p_pr={"jc": "left"},
        )
        styles = Styles(style=[style])
        style_resolver = StyleResolver(styles)

        # Paragraph has style but also direct right alignment
        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Normal", jc="right"),
            content=[Run(content=[Text(value="Right aligned")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        # Direct formatting (right) should override style (left)
        assert "text-align" in result
        assert "right" in result

    def test_missing_style_handled_gracefully(self) -> None:
        """Reference to missing style is handled gracefully."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.styles import Styles

        styles = Styles(style=[])  # No styles defined
        style_resolver = StyleResolver(styles)

        para = Paragraph(
            p_pr=ParagraphProperties(p_style="NonexistentStyle"),
            content=[Run(content=[Text(value="Content")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        # Should still render content without error
        assert "Content" in result

    def test_none_style_resolver_works(self) -> None:
        """Paragraph renders correctly without style resolver."""
        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Heading1", jc="center"),
            content=[Run(content=[Text(value="Content")])],
        )

        # No style_resolver - direct formatting still applies
        result = paragraph_to_html(para, style_resolver=None)

        assert "Content" in result
        assert "center" in result

    def test_style_with_spacing(self) -> None:
        """Paragraph style with spacing is resolved."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.style import Style
        from models.styles.styles import Styles

        style = Style(
            style_id="Spaced",
            name="Spaced Paragraph",
            type="paragraph",
            p_pr={"spacing": {"before": 240, "after": 120}},
        )
        styles = Styles(style=[style])
        style_resolver = StyleResolver(styles)

        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Spaced"),
            content=[Run(content=[Text(value="Spaced content")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        assert "margin-top" in result
        assert "margin-bottom" in result

    def test_style_with_border(self) -> None:
        """Paragraph style with border is resolved."""
        from converters.common.style_resolver import StyleResolver
        from models.styles.style import Style
        from models.styles.styles import Styles

        style = Style(
            style_id="Boxed",
            name="Boxed",
            type="paragraph",
            p_pr={
                "p_bdr": {
                    "top": {"val": "single", "sz": 8, "color": "000000"},
                    "bottom": {"val": "single", "sz": 8, "color": "000000"},
                }
            },
        )
        styles = Styles(style=[style])
        style_resolver = StyleResolver(styles)

        para = Paragraph(
            p_pr=ParagraphProperties(p_style="Boxed"),
            content=[Run(content=[Text(value="Boxed content")])],
        )

        result = paragraph_to_html(para, style_resolver=style_resolver)

        assert "border" in result
