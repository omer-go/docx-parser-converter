"""Unit tests for model merging utilities.

Tests deep merging of Pydantic models and property dictionaries.
"""

from core.model_utils import deep_merge, merge_chain, merge_properties

# =============================================================================
# Basic Merge Tests
# =============================================================================


class TestBasicMerge:
    """Tests for basic property merging."""

    def test_merge_empty_dicts(self) -> None:
        """Merging two empty dicts returns empty dict."""
        result = merge_properties({}, {})
        assert result == {}

    def test_merge_with_empty_base(self) -> None:
        """Merging into empty base copies all override properties."""
        base: dict[str, int] = {}
        override = {"a": 1, "b": 2}
        result = merge_properties(base, override)
        assert result == {"a": 1, "b": 2}

    def test_merge_with_empty_override(self) -> None:
        """Merging with empty override returns base unchanged."""
        base = {"a": 1, "b": 2}
        override: dict[str, int] = {}
        result = merge_properties(base, override)
        assert result == {"a": 1, "b": 2}

    def test_merge_non_overlapping(self) -> None:
        """Merging non-overlapping properties combines them."""
        base = {"a": 1, "b": 2}
        override = {"c": 3, "d": 4}
        result = merge_properties(base, override)
        assert result == {"a": 1, "b": 2, "c": 3, "d": 4}

    def test_override_replaces_base(self) -> None:
        """Override values replace base values."""
        base = {"a": 1, "b": 2}
        override = {"a": 10}
        result = merge_properties(base, override)
        assert result == {"a": 10, "b": 2}


# =============================================================================
# None Handling Tests
# =============================================================================


class TestNoneHandling:
    """Tests for None value handling."""

    def test_none_base_returns_override(self) -> None:
        """None base returns override directly."""
        result = merge_properties(None, {"a": 1})
        assert result == {"a": 1}

    def test_none_override_returns_base(self) -> None:
        """None override returns base directly."""
        result = merge_properties({"a": 1}, None)
        assert result == {"a": 1}

    def test_both_none_returns_none(self) -> None:
        """Both None returns None."""
        result = merge_properties(None, None)
        assert result is None

    def test_none_value_does_not_override(self) -> None:
        """None value in override does NOT override base."""
        base = {"a": 1, "b": 2}
        override = {"a": None}
        result = merge_properties(base, override)
        assert result is not None
        # None should not override existing value
        assert result["a"] == 1
        assert result["b"] == 2

    def test_explicit_none_option(self) -> None:
        """Optional flag to allow None to override."""
        base = {"a": 1}
        override = {"a": None}
        result = merge_properties(base, override, allow_none_override=True)
        assert result is not None
        assert result["a"] is None


# =============================================================================
# Deep Merge Tests
# =============================================================================


class TestDeepMerge:
    """Tests for deep/nested property merging."""

    def test_merge_nested_dicts(self) -> None:
        """Nested dicts are merged recursively."""
        base = {"outer": {"a": 1, "b": 2}}
        override = {"outer": {"b": 20, "c": 3}}
        result = deep_merge(base, override)
        assert result == {"outer": {"a": 1, "b": 20, "c": 3}}

    def test_merge_deeply_nested(self) -> None:
        """Very deep nesting is handled correctly."""
        base = {"l1": {"l2": {"l3": {"a": 1}}}}
        override = {"l1": {"l2": {"l3": {"b": 2}}}}
        result = deep_merge(base, override)
        assert result == {"l1": {"l2": {"l3": {"a": 1, "b": 2}}}}

    def test_override_nested_with_flat(self) -> None:
        """Flat value overrides nested dict."""
        base = {"a": {"nested": "value"}}
        override = {"a": "flat"}
        result = deep_merge(base, override)
        assert result == {"a": "flat"}

    def test_nested_with_flat_base(self) -> None:
        """Nested dict replaces flat value."""
        base = {"a": "flat"}
        override = {"a": {"nested": "value"}}
        result = deep_merge(base, override)
        assert result == {"a": {"nested": "value"}}

    def test_partial_nested_override(self) -> None:
        """Override only some nested properties."""
        base = {
            "spacing": {"before": 100, "after": 200, "line": 240},
            "jc": "left",
        }
        override = {
            "spacing": {"before": 150},  # Only override before
        }
        result = deep_merge(base, override)
        assert result is not None
        assert result["spacing"]["before"] == 150
        assert result["spacing"]["after"] == 200
        assert result["spacing"]["line"] == 240
        assert result["jc"] == "left"


# =============================================================================
# Style Property Merge Tests
# =============================================================================


class TestStylePropertyMerge:
    """Tests for merging style-specific properties."""

    def test_merge_paragraph_properties(self) -> None:
        """Merge paragraph properties."""
        base = {
            "jc": "left",
            "spacing": {"before": 0, "after": 200},
            "ind": {"left": 0},
        }
        override = {
            "jc": "center",
            "spacing": {"before": 240},
            "keep_next": True,
        }
        result = merge_properties(base, override)
        assert result is not None
        assert result["jc"] == "center"
        assert result["spacing"]["before"] == 240
        assert result["spacing"]["after"] == 200  # Preserved from base
        assert result["ind"]["left"] == 0  # Preserved
        assert result["keep_next"] is True  # New from override

    def test_merge_run_properties(self) -> None:
        """Merge run properties."""
        base = {
            "sz": 24,
            "r_fonts": {"ascii": "Calibri", "h_ansi": "Calibri"},
            "b": False,
        }
        override = {
            "sz": 32,
            "b": True,
            "i": True,
        }
        result = merge_properties(base, override)
        assert result is not None
        assert result["sz"] == 32
        assert result["r_fonts"]["ascii"] == "Calibri"  # Preserved
        assert result["b"] is True
        assert result["i"] is True

    def test_merge_border_properties(self) -> None:
        """Merge border properties."""
        base = {
            "top": {"val": "single", "sz": 4, "color": "auto"},
            "bottom": {"val": "single", "sz": 4, "color": "auto"},
        }
        override = {
            "top": {"sz": 8},  # Only change size
            "left": {"val": "single", "sz": 4, "color": "auto"},
        }
        result = deep_merge(base, override)
        assert result is not None
        assert result["top"]["val"] == "single"  # Preserved
        assert result["top"]["sz"] == 8  # Overridden
        assert result["top"]["color"] == "auto"  # Preserved
        assert result["bottom"]["val"] == "single"  # Preserved
        assert result["left"]["val"] == "single"  # New


# =============================================================================
# List Handling Tests
# =============================================================================


class TestListHandling:
    """Tests for list value handling."""

    def test_list_replaced_not_merged(self) -> None:
        """Lists are replaced, not merged."""
        base = {"items": [1, 2, 3]}
        override = {"items": [4, 5]}
        result = merge_properties(base, override)
        assert result is not None
        assert result["items"] == [4, 5]

    def test_list_preserved_when_not_overridden(self) -> None:
        """Lists are preserved when not in override."""
        base = {"items": [1, 2, 3], "other": "value"}
        override = {"other": "new"}
        result = merge_properties(base, override)
        assert result is not None
        assert result["items"] == [1, 2, 3]

    def test_empty_list_overrides(self) -> None:
        """Empty list can override non-empty list."""
        base = {"items": [1, 2, 3]}
        override = {"items": []}
        result = merge_properties(base, override)
        assert result is not None
        assert result["items"] == []


# =============================================================================
# Type Preservation Tests
# =============================================================================


class TestTypePreservation:
    """Tests for type preservation during merge."""

    def test_preserves_bool_type(self) -> None:
        """Boolean values preserve type."""
        base = {"flag": False}
        override = {"flag": True}
        result = merge_properties(base, override)
        assert result is not None
        assert result["flag"] is True
        assert isinstance(result["flag"], bool)

    def test_preserves_int_type(self) -> None:
        """Integer values preserve type."""
        base = {"count": 0}
        override = {"count": 42}
        result = merge_properties(base, override)
        assert result is not None
        assert result["count"] == 42
        assert isinstance(result["count"], int)

    def test_preserves_string_type(self) -> None:
        """String values preserve type."""
        base = {"name": "old"}
        override = {"name": "new"}
        result = merge_properties(base, override)
        assert result is not None
        assert result["name"] == "new"
        assert isinstance(result["name"], str)

    def test_different_types_override(self) -> None:
        """Override can change value type."""
        base = {"value": 123}
        override = {"value": "string"}
        result = merge_properties(base, override)
        assert result is not None
        assert result["value"] == "string"


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestMergeEdgeCases:
    """Tests for edge cases in merging."""

    def test_merge_does_not_modify_originals(self) -> None:
        """Merge creates new dict, doesn't modify originals."""
        base = {"a": 1, "nested": {"b": 2}}
        override = {"a": 10, "nested": {"c": 3}}
        base_copy = {"a": 1, "nested": {"b": 2}}
        override_copy = {"a": 10, "nested": {"c": 3}}

        deep_merge(base, override)

        # Originals unchanged
        assert base == base_copy
        assert override == override_copy

    def test_merge_with_special_keys(self) -> None:
        """Merge works with special key names."""
        base = {"__init__": 1, "class": 2, "123": 3}
        override = {"__init__": 10}
        result = merge_properties(base, override)
        assert result is not None
        assert result["__init__"] == 10
        assert result["class"] == 2
        assert result["123"] == 3

    def test_merge_empty_string_key(self) -> None:
        """Merge works with empty string key."""
        base = {"": "empty_key", "a": 1}
        override = {"": "new_empty"}
        result = merge_properties(base, override)
        assert result is not None
        assert result[""] == "new_empty"

    def test_very_deep_nesting(self) -> None:
        """Handle very deep nesting without stack overflow."""
        # Build a deeply nested structure
        base: dict[str, dict] = {"l1": {}}
        override: dict[str, dict] = {"l1": {}}
        current_base = base["l1"]
        current_override = override["l1"]

        for i in range(50):
            current_base[f"l{i + 2}"] = {}
            current_override[f"l{i + 2}"] = {}
            current_base = current_base[f"l{i + 2}"]
            current_override = current_override[f"l{i + 2}"]

        current_base["value"] = "base"
        current_override["value"] = "override"

        result = deep_merge(base, override)
        assert result is not None
        # Navigate to the deepest level
        current = result
        for i in range(51):
            current = current[f"l{i + 1}"]
        assert current["value"] == "override"


# =============================================================================
# Chain Merge Tests
# =============================================================================


class TestChainMerge:
    """Tests for merging chains of properties (like style inheritance)."""

    def test_merge_chain_of_three(self) -> None:
        """Merge a chain of three property sets."""
        defaults = {"a": 1, "b": 1, "c": 1}
        style = {"b": 2, "c": 2}
        direct = {"c": 3}

        result = merge_chain([defaults, style, direct])
        assert result["a"] == 1  # From defaults
        assert result["b"] == 2  # From style
        assert result["c"] == 3  # From direct

    def test_merge_chain_with_none(self) -> None:
        """Merge chain handles None entries."""
        defaults = {"a": 1}
        style = None
        direct = {"b": 2}

        result = merge_chain([defaults, style, direct])
        assert result["a"] == 1
        assert result["b"] == 2

    def test_merge_chain_respects_order(self) -> None:
        """Later entries in chain take precedence."""
        props = [
            {"val": 1},
            {"val": 2},
            {"val": 3},
        ]
        result = merge_chain(props)
        assert result["val"] == 3
