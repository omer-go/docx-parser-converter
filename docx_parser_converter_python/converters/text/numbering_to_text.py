"""Numbering to text converter.

Provides number formatting utilities and numbering prefix generation for plain text.
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


def format_number(value: int, num_fmt: str) -> str:
    """Format a number according to the specified format.

    Args:
        value: Numeric value
        num_fmt: Format type (decimal, lowerLetter, upperLetter,
                 lowerRoman, upperRoman, bullet, ordinal, ordinalText,
                 cardinalText, decimalZero, none)

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
# Numbering to Text Converter Class
# =============================================================================


class NumberingToTextConverter:
    """Converter for numbering/list prefixes to plain text."""

    def __init__(self) -> None:
        """Initialize numbering converter."""
        pass

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
            # For bullets, just return the bullet character (no suffix)
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
