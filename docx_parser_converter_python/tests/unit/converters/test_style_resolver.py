"""Unit tests for StyleResolver class.

Tests style inheritance resolution, property merging, and edge cases.
"""

import logging

import pytest

from converters.common.style_resolver import StyleResolver
from models.styles.document_defaults import (
    DocumentDefaults,
    ParagraphPropertiesDefault,
    RunPropertiesDefault,
)
from models.styles.style import Style
from models.styles.styles import Styles

# =============================================================================
# Test Fixtures
# =============================================================================


@pytest.fixture
def empty_styles() -> Styles:
    """Empty styles with no definitions."""
    return Styles()


@pytest.fixture
def simple_styles() -> Styles:
    """Styles with simple definitions (no inheritance)."""
    return Styles(
        style=[
            Style(
                type="paragraph",
                style_id="Normal",
                name="Normal",
                default=True,
                p_pr={"jc": "left"},
                r_pr={"sz": 24},
            ),
            Style(
                type="paragraph",
                style_id="Title",
                name="Title",
                p_pr={"jc": "center", "spacing": {"before": 240}},
                r_pr={"b": True, "sz": 56},
            ),
            Style(
                type="character",
                style_id="Strong",
                name="Strong",
                r_pr={"b": True},
            ),
        ]
    )


@pytest.fixture
def inherited_styles() -> Styles:
    """Styles with inheritance chain."""
    return Styles(
        style=[
            Style(
                type="paragraph",
                style_id="Normal",
                name="Normal",
                default=True,
                p_pr={"jc": "left", "spacing": {"after": 200}},
                r_pr={"sz": 24, "r_fonts": {"ascii": "Calibri"}},
            ),
            Style(
                type="paragraph",
                style_id="Heading1",
                name="heading 1",
                based_on="Normal",
                p_pr={"jc": "left", "spacing": {"before": 240, "after": 0}},
                r_pr={"b": True, "sz": 32},
            ),
            Style(
                type="paragraph",
                style_id="Heading2",
                name="heading 2",
                based_on="Heading1",
                r_pr={"sz": 28, "i": True},
            ),
            Style(
                type="paragraph",
                style_id="Heading3",
                name="heading 3",
                based_on="Heading2",
                r_pr={"sz": 24},
            ),
        ]
    )


@pytest.fixture
def circular_styles() -> Styles:
    """Styles with circular reference."""
    return Styles(
        style=[
            Style(
                type="paragraph",
                style_id="StyleA",
                name="Style A",
                based_on="StyleB",
                p_pr={"jc": "center"},
            ),
            Style(
                type="paragraph",
                style_id="StyleB",
                name="Style B",
                based_on="StyleA",
                p_pr={"jc": "right"},
            ),
        ]
    )


@pytest.fixture
def missing_based_on_styles() -> Styles:
    """Styles with missing basedOn reference."""
    return Styles(
        style=[
            Style(
                type="paragraph",
                style_id="Orphan",
                name="Orphan Style",
                based_on="NonExistent",
                p_pr={"jc": "center"},
            ),
        ]
    )


@pytest.fixture
def document_defaults() -> DocumentDefaults:
    """Document defaults for testing."""
    return DocumentDefaults(
        r_pr_default=RunPropertiesDefault(r_pr={"sz": 22, "r_fonts": {"ascii": "Times New Roman"}}),
        p_pr_default=ParagraphPropertiesDefault(p_pr={"spacing": {"after": 160, "line": 259}}),
    )


@pytest.fixture
def table_styles() -> Styles:
    """Styles including table styles."""
    return Styles(
        style=[
            Style(
                type="table",
                style_id="TableNormal",
                name="Normal Table",
                default=True,
                tbl_pr={"tbl_cell_mar": {"top": {"w": 0}, "left": {"w": 108}}},
            ),
            Style(
                type="table",
                style_id="TableGrid",
                name="Table Grid",
                based_on="TableNormal",
                tbl_pr={
                    "tbl_borders": {
                        "top": {"val": "single", "sz": 4},
                        "left": {"val": "single", "sz": 4},
                        "bottom": {"val": "single", "sz": 4},
                        "right": {"val": "single", "sz": 4},
                        "inside_h": {"val": "single", "sz": 4},
                        "inside_v": {"val": "single", "sz": 4},
                    }
                },
            ),
        ]
    )


# =============================================================================
# StyleResolver Initialization Tests
# =============================================================================


class TestStyleResolverInit:
    """Tests for StyleResolver initialization."""

    def test_init_with_empty_styles(self, empty_styles: Styles) -> None:
        """Initialize with empty styles."""
        resolver = StyleResolver(empty_styles)
        assert resolver is not None
        assert len(resolver._style_map) == 0

    def test_init_with_styles(self, simple_styles: Styles) -> None:
        """Initialize with style definitions."""
        resolver = StyleResolver(simple_styles)
        assert len(resolver._style_map) == 3
        assert "Normal" in resolver._style_map
        assert "Title" in resolver._style_map
        assert "Strong" in resolver._style_map

    def test_init_with_document_defaults(
        self, simple_styles: Styles, document_defaults: DocumentDefaults
    ) -> None:
        """Initialize with document defaults."""
        resolver = StyleResolver(simple_styles, document_defaults)
        assert resolver._doc_defaults is not None

    def test_init_with_none(self) -> None:
        """Initialize with None styles."""
        resolver = StyleResolver(None)
        assert resolver is not None
        assert len(resolver._style_map) == 0


# =============================================================================
# Basic Style Resolution Tests
# =============================================================================


class TestBasicStyleResolution:
    """Tests for basic style resolution without inheritance."""

    def test_resolve_existing_style(self, simple_styles: Styles) -> None:
        """Resolve an existing style by ID."""
        resolver = StyleResolver(simple_styles)
        result = resolver.resolve_style("Normal")
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["jc"] == "left"
        assert result.r_pr is not None
        assert result.r_pr["sz"] == 24

    def test_resolve_nonexistent_style_returns_none(self, simple_styles: Styles) -> None:
        """Resolving nonexistent style returns None."""
        resolver = StyleResolver(simple_styles)
        result = resolver.resolve_style("NonExistent")
        assert result is None

    def test_resolve_none_style_id(self, simple_styles: Styles) -> None:
        """Resolving None style ID returns None."""
        resolver = StyleResolver(simple_styles)
        result = resolver.resolve_style(None)
        assert result is None

    def test_resolve_default_paragraph_style(self, simple_styles: Styles) -> None:
        """Resolve default paragraph style."""
        resolver = StyleResolver(simple_styles)
        result = resolver.get_default_paragraph_style()
        assert result is not None
        assert result.style_id == "Normal"

    def test_resolve_character_style(self, simple_styles: Styles) -> None:
        """Resolve character style."""
        resolver = StyleResolver(simple_styles)
        result = resolver.resolve_style("Strong")
        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr["b"] is True


# =============================================================================
# Style Inheritance Tests
# =============================================================================


class TestStyleInheritance:
    """Tests for style inheritance resolution."""

    def test_single_level_inheritance(self, inherited_styles: Styles) -> None:
        """Resolve style with single basedOn."""
        resolver = StyleResolver(inherited_styles)
        result = resolver.resolve_paragraph_properties("Heading1")

        # From Heading1 directly
        assert result["spacing"]["before"] == 240
        assert result["spacing"]["after"] == 0  # Overrides Normal's 200

        # From run properties
        assert result["r_pr"]["b"] is True
        assert result["r_pr"]["sz"] == 32

        # Inherited from Normal
        assert result["jc"] == "left"
        assert result["r_pr"]["r_fonts"]["ascii"] == "Calibri"

    def test_multi_level_inheritance(self, inherited_styles: Styles) -> None:
        """Resolve style with multiple inheritance levels."""
        resolver = StyleResolver(inherited_styles)
        result = resolver.resolve_paragraph_properties("Heading3")

        # From Heading3
        assert result["r_pr"]["sz"] == 24

        # From Heading2
        assert result["r_pr"]["i"] is True

        # From Heading1
        assert result["r_pr"]["b"] is True
        assert result["spacing"]["before"] == 240

        # From Normal (through chain)
        assert result["r_pr"]["r_fonts"]["ascii"] == "Calibri"

    def test_child_overrides_parent(self, inherited_styles: Styles) -> None:
        """Child style properties override parent properties."""
        resolver = StyleResolver(inherited_styles)
        result = resolver.resolve_paragraph_properties("Heading1")

        # spacing.after is 200 in Normal, but 0 in Heading1
        assert result["spacing"]["after"] == 0

    def test_deep_property_merge(self, inherited_styles: Styles) -> None:
        """Test deep merging of nested properties."""
        resolver = StyleResolver(inherited_styles)

        # Heading1 has spacing.before=240, spacing.after=0
        # Normal has spacing.after=200
        # Result should have both before and after from Heading1
        result = resolver.resolve_paragraph_properties("Heading1")
        assert result["spacing"]["before"] == 240
        assert result["spacing"]["after"] == 0


# =============================================================================
# Circular Reference Tests
# =============================================================================


class TestCircularReferences:
    """Tests for circular reference detection and handling."""

    def test_detect_simple_circular_reference(self, circular_styles: Styles) -> None:
        """Detect A -> B -> A circular reference."""
        resolver = StyleResolver(circular_styles)
        # Should not infinite loop
        result = resolver.resolve_style("StyleA")
        assert result is not None
        # Should have properties from StyleA at minimum
        assert result.p_pr is not None
        assert result.p_pr["jc"] == "center"

    def test_circular_reference_breaks_at_detection(self, circular_styles: Styles) -> None:
        """Circular reference breaks at detection point."""
        resolver = StyleResolver(circular_styles)
        result = resolver.resolve_style("StyleB")
        # Should have StyleB's properties
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["jc"] == "right"

    def test_self_reference(self) -> None:
        """Style referencing itself."""
        styles = Styles(
            style=[
                Style(
                    type="paragraph",
                    style_id="SelfRef",
                    name="Self Reference",
                    based_on="SelfRef",
                    p_pr={"jc": "center"},
                ),
            ]
        )
        resolver = StyleResolver(styles)
        result = resolver.resolve_style("SelfRef")
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["jc"] == "center"


# =============================================================================
# Missing Reference Tests
# =============================================================================


class TestMissingReferences:
    """Tests for handling missing basedOn references."""

    def test_missing_based_on_uses_own_properties(self, missing_based_on_styles: Styles) -> None:
        """Style with missing basedOn uses its own properties."""
        resolver = StyleResolver(missing_based_on_styles)
        result = resolver.resolve_style("Orphan")
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["jc"] == "center"

    def test_missing_based_on_logs_warning(
        self, missing_based_on_styles: Styles, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Missing basedOn logs a warning."""
        resolver = StyleResolver(missing_based_on_styles)
        with caplog.at_level(logging.WARNING):
            resolver.resolve_paragraph_properties("Orphan")
        assert "NonExistent" in caplog.text


# =============================================================================
# Document Defaults Integration Tests
# =============================================================================


class TestDocumentDefaultsIntegration:
    """Tests for document defaults integration."""

    def test_defaults_applied_before_styles(
        self, simple_styles: Styles, document_defaults: DocumentDefaults
    ) -> None:
        """Document defaults applied before style properties."""
        resolver = StyleResolver(simple_styles, document_defaults)
        result = resolver.resolve_paragraph_properties("Normal")

        # From Normal style
        assert result["jc"] == "left"

    def test_style_overrides_defaults(
        self, simple_styles: Styles, document_defaults: DocumentDefaults
    ) -> None:
        """Style properties override document defaults."""
        resolver = StyleResolver(simple_styles, document_defaults)
        result = resolver.resolve_run_properties("Normal")

        # Normal has sz=24, defaults have sz=22
        # Style should win
        assert result["sz"] == 24

    def test_defaults_fill_missing_properties(self, document_defaults: DocumentDefaults) -> None:
        """Defaults fill in properties not set by style."""
        styles = Styles(
            style=[
                Style(
                    type="paragraph",
                    style_id="Minimal",
                    name="Minimal",
                    p_pr={"jc": "center"},
                    # No r_pr specified
                ),
            ]
        )
        resolver = StyleResolver(styles, document_defaults)
        result = resolver.resolve_run_properties("Minimal")

        # Should get font from defaults
        assert result["r_fonts"]["ascii"] == "Times New Roman"


# =============================================================================
# Direct Formatting Override Tests
# =============================================================================


class TestDirectFormattingOverride:
    """Tests for direct formatting override behavior."""

    def test_direct_overrides_style(self, simple_styles: Styles) -> None:
        """Direct formatting overrides style properties."""
        resolver = StyleResolver(simple_styles)
        style_props = resolver.resolve_paragraph_properties("Normal")

        # Merge with direct formatting
        direct_props = {"jc": "right", "spacing": {"before": 100}}
        result = resolver.merge_with_direct(style_props, direct_props)

        assert result["jc"] == "right"  # From direct
        assert result["spacing"]["before"] == 100  # From direct

    def test_direct_none_does_not_override(self, simple_styles: Styles) -> None:
        """Direct formatting with None values doesn't override."""
        resolver = StyleResolver(simple_styles)
        style_props = resolver.resolve_paragraph_properties("Normal")

        direct_props = {"jc": None}  # Explicit None
        result = resolver.merge_with_direct(style_props, direct_props)

        assert result["jc"] == "left"  # From style, not overridden

    def test_merge_order_defaults_style_direct(
        self, simple_styles: Styles, document_defaults: DocumentDefaults
    ) -> None:
        """Merge order: defaults -> style -> direct."""
        resolver = StyleResolver(simple_styles, document_defaults)

        # All three levels set different values
        direct_props = {"jc": "both"}
        result = resolver.resolve_with_direct("Normal", direct_props)

        # Direct wins
        assert result["jc"] == "both"


# =============================================================================
# Style Type Resolution Tests
# =============================================================================


class TestStyleTypeResolution:
    """Tests for different style types."""

    def test_resolve_paragraph_style(self, inherited_styles: Styles) -> None:
        """Resolve paragraph style correctly."""
        resolver = StyleResolver(inherited_styles)
        result = resolver.resolve_paragraph_properties("Heading1")
        assert "jc" in result
        assert "spacing" in result

    def test_resolve_character_style(self, simple_styles: Styles) -> None:
        """Resolve character style correctly."""
        resolver = StyleResolver(simple_styles)
        result = resolver.resolve_run_properties("Strong")
        assert result["b"] is True

    def test_resolve_table_style(self, table_styles: Styles) -> None:
        """Resolve table style with inheritance."""
        resolver = StyleResolver(table_styles)
        result = resolver.resolve_table_properties("TableGrid")

        # From TableGrid
        assert "tbl_borders" in result

        # From TableNormal (base)
        assert "tbl_cell_mar" in result

    def test_paragraph_style_includes_run_properties(self, inherited_styles: Styles) -> None:
        """Paragraph style resolution includes run properties."""
        resolver = StyleResolver(inherited_styles)
        p_props, r_props = resolver.resolve_paragraph_style_full("Heading1")

        assert p_props["jc"] == "left"
        assert r_props["b"] is True
        assert r_props["sz"] == 32


# =============================================================================
# Caching Tests
# =============================================================================


class TestStyleCaching:
    """Tests for style resolution caching."""

    def test_resolved_styles_are_cached(self, inherited_styles: Styles) -> None:
        """Resolved styles are cached for performance."""
        resolver = StyleResolver(inherited_styles)

        # First resolution
        result1 = resolver.resolve_style("Heading1")

        # Second resolution should use cache
        result2 = resolver.resolve_style("Heading1")

        # Should be same object (cached)
        assert result1 is result2

    def test_cache_cleared_on_reset(self, inherited_styles: Styles) -> None:
        """Cache can be cleared."""
        resolver = StyleResolver(inherited_styles)
        resolver.resolve_style("Heading1")

        resolver.clear_cache()

        assert len(resolver._cache) == 0


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestStyleResolverEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_empty_style_properties(self) -> None:
        """Handle style with no properties."""
        styles = Styles(
            style=[
                Style(
                    type="paragraph",
                    style_id="Empty",
                    name="Empty Style",
                ),
            ]
        )
        resolver = StyleResolver(styles)
        result = resolver.resolve_style("Empty")
        assert result is not None
        assert result.p_pr is None
        assert result.r_pr is None

    def test_style_with_only_paragraph_properties(self) -> None:
        """Handle style with only paragraph properties."""
        styles = Styles(
            style=[
                Style(
                    type="paragraph",
                    style_id="POnly",
                    name="Paragraph Only",
                    p_pr={"jc": "center"},
                ),
            ]
        )
        resolver = StyleResolver(styles)
        p_props = resolver.resolve_paragraph_properties("POnly")
        r_props = resolver.resolve_run_properties("POnly")

        assert p_props["jc"] == "center"
        assert r_props == {}

    def test_style_with_only_run_properties(self) -> None:
        """Handle style with only run properties."""
        styles = Styles(
            style=[
                Style(
                    type="character",
                    style_id="ROnly",
                    name="Run Only",
                    r_pr={"b": True},
                ),
            ]
        )
        resolver = StyleResolver(styles)
        r_props = resolver.resolve_run_properties("ROnly")
        assert r_props["b"] is True

    def test_very_deep_inheritance(self) -> None:
        """Handle very deep inheritance chain (10+ levels)."""
        styles = []
        for i in range(15):
            based_on = f"Level{i - 1}" if i > 0 else None
            styles.append(
                Style(
                    type="paragraph",
                    style_id=f"Level{i}",
                    name=f"Level {i}",
                    based_on=based_on,
                    p_pr={"outline_lvl": i},
                )
            )

        styles_obj = Styles(style=styles)
        resolver = StyleResolver(styles_obj)
        result = resolver.resolve_paragraph_properties("Level14")

        # Should have accumulated all levels (last one wins)
        assert result["outline_lvl"] == 14

    def test_linked_paragraph_character_styles(self) -> None:
        """Handle linked paragraph and character styles."""
        styles = Styles(
            style=[
                Style(
                    type="paragraph",
                    style_id="Heading1",
                    name="heading 1",
                    link="Heading1Char",
                    p_pr={"outline_lvl": 0},
                    r_pr={"b": True, "sz": 32},
                ),
                Style(
                    type="character",
                    style_id="Heading1Char",
                    name="Heading 1 Char",
                    link="Heading1",
                    r_pr={"b": True, "sz": 32},
                ),
            ]
        )
        resolver = StyleResolver(styles)

        # Both should resolve to same run properties
        p_r_props = resolver.resolve_run_properties("Heading1")
        c_r_props = resolver.resolve_run_properties("Heading1Char")

        assert p_r_props["b"] == c_r_props["b"]
        assert p_r_props["sz"] == c_r_props["sz"]
