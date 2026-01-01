"""Numbering to HTML converter.

Provides number formatting utilities and numbering prefix generation.
"""


# =============================================================================
# Number Format Constants
# =============================================================================

ROMAN_VALUES = [
    (1000, "M"),
    (900, "CM"),
    (500, "D"),
    (400, "CD"),
    (100, "C"),
    (90, "XC"),
    (50, "L"),
    (40, "XL"),
    (10, "X"),
    (9, "IX"),
    (5, "V"),
    (4, "IV"),
    (1, "I"),
]

ORDINAL_SUFFIXES = {
    1: "st",
    2: "nd",
    3: "rd",
}

ORDINAL_TEXT = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
]

CARDINAL_TEXT = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
    "Twenty",
]

CHICAGO_SYMBOLS = ["*", "†", "‡", "§"]


# =============================================================================
# Number Format Functions
# =============================================================================


def to_roman(value: int, lowercase: bool = True) -> str:
    """Convert a number to Roman numeral format.

    Args:
        value: Numeric value
        lowercase: Whether to use lowercase

    Returns:
        Roman numeral string
    """
    if value <= 0:
        return str(value)

    result = ""
    for val, numeral in ROMAN_VALUES:
        while value >= val:
            result += numeral
            value -= val

    return result.lower() if lowercase else result


def to_letter(value: int, lowercase: bool = True) -> str:
    """Convert a number to letter format (a, b, ..., z, aa, ab, ...).

    Args:
        value: Numeric value (1-based)
        lowercase: Whether to use lowercase letters

    Returns:
        Letter string
    """
    if value <= 0:
        return ""

    result = ""
    while value > 0:
        value -= 1
        result = chr(ord("a" if lowercase else "A") + (value % 26)) + result
        value //= 26
    return result


def to_ordinal(value: int) -> str:
    """Convert a number to ordinal format (1st, 2nd, 3rd...).

    Args:
        value: Numeric value

    Returns:
        Ordinal string
    """
    if value <= 0:
        return str(value)

    # Special case for 11, 12, 13
    if 11 <= value % 100 <= 13:
        return f"{value}th"

    suffix = ORDINAL_SUFFIXES.get(value % 10, "th")
    return f"{value}{suffix}"


def to_ordinal_text(value: int) -> str:
    """Convert a number to ordinal text (First, Second, Third...).

    Args:
        value: Numeric value

    Returns:
        Ordinal text string
    """
    if 1 <= value < len(ORDINAL_TEXT):
        return ORDINAL_TEXT[value]
    return to_ordinal(value)


def to_cardinal_text(value: int) -> str:
    """Convert a number to cardinal text (One, Two, Three...).

    Args:
        value: Numeric value

    Returns:
        Cardinal text string
    """
    if 1 <= value < len(CARDINAL_TEXT):
        return CARDINAL_TEXT[value]
    return str(value)


def to_decimal_zero(value: int, width: int = 2) -> str:
    """Convert a number to zero-padded decimal (01, 02...).

    Args:
        value: Numeric value
        width: Minimum width (default 2)

    Returns:
        Zero-padded decimal string
    """
    return str(value).zfill(width)


def to_chicago(value: int) -> str:
    """Convert a number to Chicago footnote format (*, †, ‡, §...).

    Args:
        value: Numeric value (1-based)

    Returns:
        Chicago symbol string
    """
    if value <= 0:
        return ""

    idx = (value - 1) % len(CHICAGO_SYMBOLS)
    repeat = ((value - 1) // len(CHICAGO_SYMBOLS)) + 1
    return CHICAGO_SYMBOLS[idx] * repeat


def format_number(value: int, num_fmt: str) -> str:
    """Format a number according to the specified format.

    Args:
        value: Numeric value
        num_fmt: Format type (decimal, lowerLetter, upperLetter,
                 lowerRoman, upperRoman, bullet, ordinal, ordinalText,
                 cardinalText, decimalZero, none, chicago)

    Returns:
        Formatted string
    """
    if num_fmt == "decimal":
        return str(value)
    elif num_fmt == "lowerLetter":
        return to_letter(value, lowercase=True)
    elif num_fmt == "upperLetter":
        return to_letter(value, lowercase=False)
    elif num_fmt == "lowerRoman":
        return to_roman(value, lowercase=True)
    elif num_fmt == "upperRoman":
        return to_roman(value, lowercase=False)
    elif num_fmt == "bullet":
        return "•"
    elif num_fmt == "ordinal":
        return to_ordinal(value)
    elif num_fmt == "ordinalText":
        return to_ordinal_text(value)
    elif num_fmt == "cardinalText":
        return to_cardinal_text(value)
    elif num_fmt == "decimalZero":
        return to_decimal_zero(value)
    elif num_fmt == "none":
        return ""
    elif num_fmt == "chicago":
        return to_chicago(value)
    else:
        # Default to decimal for unknown formats
        return str(value)


# =============================================================================
# Level Text Template Functions
# =============================================================================


def apply_level_text(
    lvl_text: str,
    counters: dict[int, int],
    num_fmts: dict[int, str] | None = None,
) -> str:
    """Apply counter values to a level text template.

    Replaces placeholders like %1, %2 with formatted counter values.

    Args:
        lvl_text: Level text template (e.g., "%1.%2")
        counters: Dict mapping level index to counter value
        num_fmts: Dict mapping level index to number format

    Returns:
        Formatted string with placeholders replaced
    """
    result = lvl_text
    num_fmts = num_fmts or {}

    for level_idx in range(10):
        placeholder = f"%{level_idx + 1}"
        if placeholder in result:
            counter_value = counters.get(level_idx, 1)
            num_fmt = num_fmts.get(level_idx, "decimal")
            formatted = format_number(counter_value, num_fmt)
            result = result.replace(placeholder, formatted)

    return result


# =============================================================================
# Suffix Handling
# =============================================================================


def get_suffix(suff: str | None) -> str:
    """Get the suffix string for a list number.

    Args:
        suff: Suffix type ('tab', 'space', 'nothing')

    Returns:
        Suffix string
    """
    if suff == "tab":
        return "\t"
    elif suff == "space":
        return " "
    elif suff == "nothing":
        return ""
    else:
        # Default to tab
        return "\t"


# =============================================================================
# CSS Counter Generation
# =============================================================================


def generate_css_counter_style(
    name: str,
    num_fmt: str,
    lvl_text: str = "",
) -> str:
    """Generate CSS counter-style declaration.

    Args:
        name: Counter name
        num_fmt: Number format
        lvl_text: Level text pattern

    Returns:
        CSS counter-style rule
    """
    # Map num_fmt to CSS counter styles
    css_style = "decimal"
    if num_fmt == "lowerLetter":
        css_style = "lower-alpha"
    elif num_fmt == "upperLetter":
        css_style = "upper-alpha"
    elif num_fmt == "lowerRoman":
        css_style = "lower-roman"
    elif num_fmt == "upperRoman":
        css_style = "upper-roman"
    elif num_fmt == "bullet":
        css_style = "disc"

    return css_style


def generate_counter_reset_css(counter_names: list[str]) -> str:
    """Generate CSS counter-reset rule.

    Args:
        counter_names: List of counter names to reset

    Returns:
        CSS counter-reset value
    """
    return " ".join(f"{name} 0" for name in counter_names)


def generate_counter_content_css(
    lvl_text: str,
    level_counters: list[tuple[str, str]],
) -> str:
    """Generate CSS content property for counter display.

    Args:
        lvl_text: Level text template
        level_counters: List of (counter_name, css_style) tuples

    Returns:
        CSS content value
    """
    # This is simplified - full implementation would parse lvl_text
    # and generate proper counter() calls
    if not level_counters:
        return f'"{lvl_text}"'

    parts = []
    remaining = lvl_text

    for idx, (counter_name, css_style) in enumerate(level_counters):
        placeholder = f"%{idx + 1}"
        if placeholder in remaining:
            before, after = remaining.split(placeholder, 1)
            if before:
                parts.append(f'"{before}"')
            parts.append(f"counter({counter_name}, {css_style})")
            remaining = after

    if remaining:
        parts.append(f'"{remaining}"')

    return " ".join(parts)


# =============================================================================
# HTML List Generation
# =============================================================================


def get_list_type(num_fmt: str) -> str:
    """Get HTML list type for a number format.

    Args:
        num_fmt: Number format

    Returns:
        'ol' for ordered, 'ul' for unordered
    """
    if num_fmt == "bullet":
        return "ul"
    return "ol"


def get_list_style_type(num_fmt: str) -> str:
    """Get CSS list-style-type for a number format.

    Args:
        num_fmt: Number format

    Returns:
        CSS list-style-type value
    """
    style_map = {
        "decimal": "decimal",
        "lowerLetter": "lower-alpha",
        "upperLetter": "upper-alpha",
        "lowerRoman": "lower-roman",
        "upperRoman": "upper-roman",
        "bullet": "disc",
        "none": "none",
    }
    return style_map.get(num_fmt, "decimal")


# =============================================================================
# Numbering to HTML Converter Class
# =============================================================================


class NumberingToHTMLConverter:
    """Converter for numbering/list prefixes to HTML."""

    def __init__(
        self,
        *,
        use_native_lists: bool = False,
        use_css_counters: bool = False,
        use_inline_prefix: bool = True,
    ) -> None:
        """Initialize numbering converter.

        Args:
            use_native_lists: Use HTML ol/ul/li elements
            use_css_counters: Use CSS counters for numbering
            use_inline_prefix: Use inline span prefix (default)
        """
        self.use_native_lists = use_native_lists
        self.use_css_counters = use_css_counters
        self.use_inline_prefix = use_inline_prefix

    def format_prefix(
        self,
        value: int,
        num_fmt: str,
        lvl_text: str = "%1.",
        suff: str | None = "tab",
    ) -> str:
        """Format a numbering prefix.

        Args:
            value: Counter value
            num_fmt: Number format
            lvl_text: Level text template
            suff: Suffix type

        Returns:
            Formatted prefix string
        """
        if num_fmt == "bullet":
            # For bullets, just return the bullet character
            return lvl_text if lvl_text else "•"

        # Format the number
        formatted = format_number(value, num_fmt)

        # Apply level text template if it contains placeholder
        if "%1" in lvl_text:
            prefix = lvl_text.replace("%1", formatted)
        else:
            # Just use the formatted number with lvl_text as suffix
            prefix = formatted + lvl_text

        # Add suffix
        suffix = get_suffix(suff)
        return prefix + suffix

    def format_multi_level_prefix(
        self,
        counters: dict[int, int],
        num_fmts: dict[int, str],
        lvl_text: str,
        suff: str | None = "tab",
    ) -> str:
        """Format a multi-level numbering prefix.

        Args:
            counters: Dict mapping level index to counter value
            num_fmts: Dict mapping level index to number format
            lvl_text: Level text template (e.g., "%1.%2")
            suff: Suffix type

        Returns:
            Formatted prefix string
        """
        prefix = apply_level_text(lvl_text, counters, num_fmts)
        suffix = get_suffix(suff)
        return prefix + suffix

    def generate_css(
        self,
        num_fmt: str,
        level: int = 0,
    ) -> dict[str, str]:
        """Generate CSS for a numbering level.

        Args:
            num_fmt: Number format
            level: Level index

        Returns:
            Dict of CSS property names to values
        """
        css: dict[str, str] = {}

        if self.use_css_counters:
            counter_name = f"list-{level}"
            # css_style could be used for ::before pseudo-element content
            _ = generate_css_counter_style(counter_name, num_fmt)
            css["counter-increment"] = counter_name
            # content would be set on ::before pseudo-element
        else:
            list_style = get_list_style_type(num_fmt)
            css["list-style-type"] = list_style

        return css
