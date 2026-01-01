"""Style resolver for DOCX style inheritance.

Resolves style inheritance chains, merges document defaults,
and handles direct formatting overrides.
"""

import logging
from typing import Any

from core.model_utils import deep_merge, merge_chain
from models.styles.document_defaults import DocumentDefaults
from models.styles.style import Style
from models.styles.styles import Styles

logger = logging.getLogger(__name__)


class StyleResolver:
    """Resolves style inheritance and merges properties.

    Handles style chains (basedOn), document defaults, and direct
    formatting to produce the final resolved properties.
    """

    def __init__(
        self,
        styles: Styles | None,
        document_defaults: DocumentDefaults | None = None,
    ) -> None:
        """Initialize the style resolver.

        Args:
            styles: Style definitions from the document
            document_defaults: Document default properties
        """
        self._styles = styles
        self._doc_defaults = document_defaults

        # Maps: style_id -> Style
        self._style_map: dict[str, Style] = {}

        # Cache for resolved styles
        self._cache: dict[str, Style] = {}

        # Cache for resolved properties
        self._p_pr_cache: dict[str, dict[str, Any]] = {}
        self._r_pr_cache: dict[str, dict[str, Any]] = {}
        self._tbl_pr_cache: dict[str, dict[str, Any]] = {}

        self._build_style_map()

    def _build_style_map(self) -> None:
        """Build lookup map from style definitions."""
        if self._styles is None or self._styles.style is None:
            return

        for style in self._styles.style:
            if style.style_id is not None:
                self._style_map[style.style_id] = style

    def resolve_style(self, style_id: str | None) -> Style | None:
        """Resolve a style by ID, including inheritance.

        Args:
            style_id: The style ID to resolve

        Returns:
            The resolved style, or None if not found
        """
        if style_id is None:
            return None

        if style_id not in self._style_map:
            return None

        # Check cache
        if style_id in self._cache:
            return self._cache[style_id]

        style = self._style_map[style_id]

        # Resolve the style (store in cache)
        # For now, just return the style directly
        # The property resolution handles inheritance
        self._cache[style_id] = style

        return style

    def get_default_paragraph_style(self) -> Style | None:
        """Get the default paragraph style.

        Returns:
            The default paragraph style, or None if not found
        """
        for style in self._style_map.values():
            if style.type == "paragraph" and style.default:
                return style
        return None

    def resolve_paragraph_properties(self, style_id: str | None) -> dict[str, Any]:
        """Resolve paragraph properties for a style.

        Includes inherited properties from basedOn chain and
        document defaults.

        Args:
            style_id: The style ID to resolve

        Returns:
            Merged paragraph properties dict
        """
        if style_id is None:
            return self._get_default_p_pr()

        # Check cache
        if style_id in self._p_pr_cache:
            return self._p_pr_cache[style_id]

        # Get inheritance chain
        chain = self._get_style_chain(style_id, "paragraph")

        # Build properties from chain (defaults -> parent -> ... -> child)
        p_pr_chain: list[dict[str, Any] | None] = []
        r_pr_chain: list[dict[str, Any] | None] = []

        # Add document defaults first
        p_pr_chain.append(self._get_default_p_pr())
        r_pr_chain.append(self._get_default_r_pr())

        # Add each style in the chain (parent to child order)
        for style in reversed(chain):
            p_pr_chain.append(style.p_pr)
            r_pr_chain.append(style.r_pr)

        # Merge the chain
        p_pr = merge_chain(p_pr_chain)
        r_pr = merge_chain(r_pr_chain)

        # Add run properties to the result
        if r_pr:
            p_pr["r_pr"] = r_pr

        self._p_pr_cache[style_id] = p_pr
        return p_pr

    def resolve_run_properties(self, style_id: str | None) -> dict[str, Any]:
        """Resolve run properties for a style.

        Includes inherited properties from basedOn chain and
        document defaults.

        Args:
            style_id: The style ID to resolve

        Returns:
            Merged run properties dict
        """
        if style_id is None:
            return self._get_default_r_pr()

        # Check cache
        if style_id in self._r_pr_cache:
            return self._r_pr_cache[style_id]

        # Check if style exists
        if style_id not in self._style_map:
            return self._get_default_r_pr()

        # Get inheritance chain
        style = self._style_map[style_id]
        if style.type == "character":
            chain = self._get_style_chain(style_id, "character")
        else:
            chain = self._get_style_chain(style_id, "paragraph")

        # Build properties from chain
        r_pr_chain: list[dict[str, Any] | None] = []

        # Add document defaults first
        r_pr_chain.append(self._get_default_r_pr())

        # Add each style in the chain
        for s in reversed(chain):
            r_pr_chain.append(s.r_pr)

        # Merge the chain
        r_pr = merge_chain(r_pr_chain)

        self._r_pr_cache[style_id] = r_pr
        return r_pr

    def resolve_table_properties(self, style_id: str | None) -> dict[str, Any]:
        """Resolve table properties for a style.

        Includes inherited properties from basedOn chain.

        Args:
            style_id: The style ID to resolve

        Returns:
            Merged table properties dict
        """
        if style_id is None:
            return {}

        # Check cache
        if style_id in self._tbl_pr_cache:
            return self._tbl_pr_cache[style_id]

        # Get inheritance chain
        chain = self._get_style_chain(style_id, "table")

        # Build properties from chain
        tbl_pr_chain: list[dict[str, Any] | None] = []

        for style in reversed(chain):
            tbl_pr_chain.append(style.tbl_pr)

        # Merge the chain
        tbl_pr = merge_chain(tbl_pr_chain)

        self._tbl_pr_cache[style_id] = tbl_pr
        return tbl_pr

    def resolve_paragraph_style_full(
        self, style_id: str | None
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Resolve full paragraph style properties.

        Args:
            style_id: The style ID to resolve

        Returns:
            Tuple of (paragraph_properties, run_properties)
        """
        p_pr = self.resolve_paragraph_properties(style_id)

        # Extract r_pr if it was included in p_pr
        r_pr = p_pr.pop("r_pr", {})

        return p_pr, r_pr

    def merge_with_direct(
        self,
        style_props: dict[str, Any],
        direct_props: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """Merge style properties with direct formatting.

        Direct formatting takes precedence over style properties.

        Args:
            style_props: Resolved style properties
            direct_props: Direct formatting properties

        Returns:
            Merged properties
        """
        result = deep_merge(style_props, direct_props)
        return result if result is not None else style_props

    def resolve_with_direct(
        self,
        style_id: str | None,
        direct_props: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """Resolve style then merge with direct formatting.

        Args:
            style_id: The style ID to resolve
            direct_props: Direct formatting properties

        Returns:
            Merged properties (defaults -> style -> direct)
        """
        style_props = self.resolve_paragraph_properties(style_id)
        return self.merge_with_direct(style_props, direct_props)

    def clear_cache(self) -> None:
        """Clear all cached resolutions."""
        self._cache.clear()
        self._p_pr_cache.clear()
        self._r_pr_cache.clear()
        self._tbl_pr_cache.clear()

    def _get_style_chain(
        self,
        style_id: str,
        style_type: str,
        visited: set[str] | None = None,
    ) -> list[Style]:
        """Get the inheritance chain for a style.

        Args:
            style_id: The style ID to start from
            style_type: Expected style type (paragraph, character, table)
            visited: Set of visited style IDs for circular detection

        Returns:
            List of styles from child to parent
        """
        if visited is None:
            visited = set()

        chain: list[Style] = []

        if style_id not in self._style_map:
            return chain

        # Check for circular reference
        if style_id in visited:
            logger.warning(f"Circular style reference detected: {style_id}")
            return chain

        visited.add(style_id)
        style = self._style_map[style_id]
        chain.append(style)

        # Follow basedOn chain
        if style.based_on:
            if style.based_on not in self._style_map:
                logger.warning(f"Style '{style_id}' references missing style '{style.based_on}'")
            else:
                parent_chain = self._get_style_chain(style.based_on, style_type, visited)
                chain.extend(parent_chain)

        return chain

    def _get_default_p_pr(self) -> dict[str, Any]:
        """Get default paragraph properties from document defaults.

        Returns:
            Default paragraph properties
        """
        if (
            self._doc_defaults is None
            or self._doc_defaults.p_pr_default is None
            or self._doc_defaults.p_pr_default.p_pr is None
        ):
            return {}
        return dict(self._doc_defaults.p_pr_default.p_pr)

    def _get_default_r_pr(self) -> dict[str, Any]:
        """Get default run properties from document defaults.

        Returns:
            Default run properties
        """
        if (
            self._doc_defaults is None
            or self._doc_defaults.r_pr_default is None
            or self._doc_defaults.r_pr_default.r_pr is None
        ):
            return {}
        return dict(self._doc_defaults.r_pr_default.r_pr)
