"""Model merging utilities for style resolution.

Provides functions for deep merging property dictionaries,
used for style inheritance and direct formatting overrides.
"""

from collections.abc import Sequence
from typing import Any


def merge_properties(
    base: dict[str, Any] | None,
    override: dict[str, Any] | None,
    *,
    allow_none_override: bool = False,
) -> dict[str, Any] | None:
    """Merge two property dictionaries with deep merging of nested dicts.

    Override values take precedence over base values. By default, None values
    in the override do NOT replace existing base values (to handle optional
    properties that weren't set).

    Args:
        base: Base property dictionary (or None)
        override: Override property dictionary (or None)
        allow_none_override: If True, None values in override replace base values

    Returns:
        Merged dictionary, or None if both inputs are None
    """
    if base is None and override is None:
        return None

    if base is None:
        return _deep_copy(override) if override else {}

    if override is None:
        return _deep_copy(base)

    result = _deep_copy(base)

    for key, value in override.items():
        if value is None and not allow_none_override:
            # None doesn't override unless explicitly allowed
            continue

        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            # Recursively merge nested dicts
            result[key] = merge_properties(result[key], value)
        else:
            # Override value (handles lists, primitives, and type changes)
            result[key] = _deep_copy(value) if isinstance(value, dict) else value

    return result


def deep_merge(
    base: dict[str, Any] | None,
    override: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Deep merge two dictionaries recursively.

    This is an alias for merge_properties with default settings,
    provided for semantic clarity when doing deep merges.

    Args:
        base: Base dictionary
        override: Override dictionary

    Returns:
        Deeply merged dictionary
    """
    return merge_properties(base, override)


def merge_chain(
    dicts: Sequence[dict[str, Any] | None],
) -> dict[str, Any]:
    """Merge a chain of property dictionaries in order.

    Later entries take precedence over earlier entries.
    Used for style inheritance chains: defaults → parent style → child style → direct.

    Args:
        dicts: List of dictionaries to merge (can contain None entries)

    Returns:
        Merged result dictionary (empty dict if all inputs are None)
    """
    result: dict[str, Any] = {}

    for d in dicts:
        if d is not None:
            merged = merge_properties(result, d)
            if merged is not None:
                result = merged

    return result


def _deep_copy(d: dict[str, Any] | None) -> dict[str, Any]:
    """Create a deep copy of a dictionary.

    Only copies nested dicts, not other mutable types like lists
    (lists are replaced wholesale, not merged).

    Args:
        d: Dictionary to copy

    Returns:
        Deep copy of the dictionary
    """
    if d is None:
        return {}

    result: dict[str, Any] = {}
    for key, value in d.items():
        if isinstance(value, dict):
            result[key] = _deep_copy(value)
        else:
            result[key] = value

    return result
