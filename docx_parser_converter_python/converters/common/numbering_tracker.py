"""Numbering tracker for list counter management.

Tracks numbering counters for lists, handles number formatting,
multi-level numbering, and list restarts.
"""

from collections import defaultdict

from models.numbering.level import Level
from models.numbering.numbering import Numbering


class NumberingTracker:
    """Tracks numbering counters and formats list numbers.

    Maintains counters per (numId, ilvl) pair, handles different
    number formats, multi-level numbering, and level restarts.
    """

    def __init__(self, numbering: Numbering | None) -> None:
        """Initialize the numbering tracker.

        Args:
            numbering: Numbering definitions from the document
        """
        self._numbering = numbering

        # Maps: abstract_num_id -> AbstractNumbering
        self._abstract_num_map: dict[int, dict[int, Level]] = {}

        # Maps: num_id -> (abstract_num_id, lvl_overrides)
        self._num_instance_map: dict[int, tuple[int, dict[int, int]]] = {}

        # Counters: (num_id, ilvl) -> current_value
        self._counters: dict[tuple[int, int], int] = defaultdict(int)

        # Track last level used per numId for restart logic
        self._last_level: dict[int, int] = {}

        self._build_lookup_maps()

    def _build_lookup_maps(self) -> None:
        """Build lookup maps from numbering definitions."""
        if self._numbering is None:
            return

        # Build abstract numbering map: abstract_num_id -> {ilvl -> Level}
        if self._numbering.abstract_num:
            for abstract_num in self._numbering.abstract_num:
                if abstract_num.abstract_num_id is not None:
                    level_map: dict[int, Level] = {}
                    if abstract_num.lvl:
                        for level in abstract_num.lvl:
                            if level.ilvl is not None:
                                level_map[level.ilvl] = level
                    self._abstract_num_map[abstract_num.abstract_num_id] = level_map

        # Build numbering instance map: num_id -> (abstract_num_id, overrides)
        if self._numbering.num:
            for num_instance in self._numbering.num:
                if num_instance.num_id is None or num_instance.abstract_num_id is None:
                    continue

                # Collect start overrides
                overrides: dict[int, int] = {}
                if num_instance.lvl_override:
                    for override in num_instance.lvl_override:
                        if override.ilvl is not None and override.start_override is not None:
                            overrides[override.ilvl] = override.start_override

                self._num_instance_map[num_instance.num_id] = (
                    num_instance.abstract_num_id,
                    overrides,
                )

    def get_level(self, num_id: int, ilvl: int) -> Level | None:
        """Get level properties for a numbering instance.

        Args:
            num_id: Numbering instance ID
            ilvl: Level index (0-based)

        Returns:
            Level properties or None if not found
        """
        if num_id not in self._num_instance_map:
            return None

        abstract_num_id, _ = self._num_instance_map[num_id]

        if abstract_num_id not in self._abstract_num_map:
            return None

        level_map = self._abstract_num_map[abstract_num_id]
        return level_map.get(ilvl)

    def get_number(self, num_id: int, ilvl: int) -> str:
        """Get formatted number for a list item and increment counter.

        Args:
            num_id: Numbering instance ID
            ilvl: Level index (0-based)

        Returns:
            Formatted number string, or empty string if not found
        """
        level = self.get_level(num_id, ilvl)
        if level is None:
            return ""

        # Check for level restart
        self._handle_level_restart(num_id, ilvl, level)

        # Get or initialize counter
        counter_key = (num_id, ilvl)
        if counter_key not in self._counters:
            # Initialize with start value (considering overrides)
            start_value = self._get_start_value(num_id, ilvl, level)
            self._counters[counter_key] = start_value
        else:
            # Increment counter
            num_fmt = level.num_fmt or "decimal"
            if num_fmt != "bullet":
                self._counters[counter_key] += 1

        # Track last level
        self._last_level[num_id] = ilvl

        # Format the number
        return self._format_number(num_id, ilvl, level)

    def _get_start_value(self, num_id: int, ilvl: int, level: Level) -> int:
        """Get the starting value for a level, considering overrides.

        Args:
            num_id: Numbering instance ID
            ilvl: Level index
            level: Level definition

        Returns:
            Starting value for the counter
        """
        # Check for start override
        if num_id in self._num_instance_map:
            _, overrides = self._num_instance_map[num_id]
            if ilvl in overrides:
                return overrides[ilvl]

        # Use level start or default to 1
        return level.start or 1

    def _handle_level_restart(self, num_id: int, ilvl: int, level: Level) -> None:
        """Handle level restart logic based on lvlRestart.

        Args:
            num_id: Numbering instance ID
            ilvl: Current level index
            level: Level definition
        """
        if num_id not in self._last_level:
            return

        last_ilvl = self._last_level[num_id]

        # Check if we need to restart based on lvlRestart
        if level.lvl_restart is not None:
            restart_level = level.lvl_restart
            if last_ilvl <= restart_level and last_ilvl < ilvl:
                # Higher level was used, restart this level
                counter_key = (num_id, ilvl)
                if counter_key in self._counters:
                    del self._counters[counter_key]

        # Default behavior: higher level resets lower levels
        if last_ilvl < ilvl:
            # Moving to a deeper level - no reset needed for current level
            pass
        elif last_ilvl > ilvl:
            # Moving to a higher level - reset all lower levels
            for lower_ilvl in range(ilvl + 1, 10):
                lower_key = (num_id, lower_ilvl)
                if lower_key in self._counters:
                    del self._counters[lower_key]

    def _format_number(self, num_id: int, ilvl: int, level: Level) -> str:
        """Format the number according to lvlText pattern.

        Args:
            num_id: Numbering instance ID
            ilvl: Level index
            level: Level definition

        Returns:
            Formatted number string
        """
        num_fmt = level.num_fmt or "decimal"
        lvl_text = level.lvl_text or f"%{ilvl + 1}"

        if num_fmt == "bullet":
            # For bullets, return the text directly (it's the bullet character)
            return lvl_text

        # Replace placeholders %1, %2, etc. with formatted numbers
        result = lvl_text
        for placeholder_level in range(10):
            placeholder = f"%{placeholder_level + 1}"
            if placeholder in result:
                counter_key = (num_id, placeholder_level)
                counter_value = self._counters.get(counter_key, 1)

                # Get format for this level
                level_def = self.get_level(num_id, placeholder_level)
                level_fmt = level_def.num_fmt if level_def else "decimal"
                level_fmt = level_fmt or "decimal"

                formatted = self._format_value(counter_value, level_fmt)
                result = result.replace(placeholder, formatted)

        return result

    def _format_value(self, value: int, num_fmt: str) -> str:
        """Format a numeric value according to the number format.

        Args:
            value: Numeric value to format
            num_fmt: Format type (decimal, lowerLetter, etc.)

        Returns:
            Formatted string
        """
        if num_fmt == "decimal":
            return str(value)
        elif num_fmt == "lowerLetter":
            return self._to_letter(value, lowercase=True)
        elif num_fmt == "upperLetter":
            return self._to_letter(value, lowercase=False)
        elif num_fmt == "lowerRoman":
            return self._to_roman(value, lowercase=True)
        elif num_fmt == "upperRoman":
            return self._to_roman(value, lowercase=False)
        elif num_fmt == "bullet":
            return ""
        else:
            # Default to decimal for unknown formats
            return str(value)

    def _to_letter(self, value: int, lowercase: bool = True) -> str:
        """Convert a number to letter format (a, b, ..., z, aa, ab, ...).

        Args:
            value: Numeric value (1-based)
            lowercase: Whether to use lowercase letters

        Returns:
            Letter string
        """
        result = ""
        while value > 0:
            value -= 1
            result = chr(ord("a" if lowercase else "A") + (value % 26)) + result
            value //= 26
        return result

    def _to_roman(self, value: int, lowercase: bool = True) -> str:
        """Convert a number to Roman numeral format.

        Args:
            value: Numeric value
            lowercase: Whether to use lowercase

        Returns:
            Roman numeral string
        """
        if value <= 0:
            return str(value)

        values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        numerals = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]

        result = ""
        for i, v in enumerate(values):
            while value >= v:
                result += numerals[i]
                value -= v

        return result.lower() if lowercase else result

    def reset(self) -> None:
        """Reset all counters to initial state."""
        self._counters.clear()
        self._last_level.clear()
