"""Unit tests for numbering to text converter.

Tests conversion of numbering/list prefixes to plain text.
"""

from converters.text.numbering_to_text import (
    NumberingToTextConverter,
    apply_level_text,
    format_number,
    get_suffix,
    to_cardinal_text,
    to_letter,
    to_ordinal,
    to_ordinal_text,
    to_roman,
)

# =============================================================================
# Roman Numeral Tests
# =============================================================================


class TestRomanNumerals:
    """Tests for Roman numeral conversion."""

    def test_roman_basic_values(self) -> None:
        """Basic Roman numeral values."""
        assert to_roman(1) == "i"
        assert to_roman(5) == "v"
        assert to_roman(10) == "x"
        assert to_roman(50) == "l"
        assert to_roman(100) == "c"
        assert to_roman(500) == "d"
        assert to_roman(1000) == "m"

    def test_roman_compound_values(self) -> None:
        """Compound Roman numeral values."""
        assert to_roman(4) == "iv"
        assert to_roman(9) == "ix"
        assert to_roman(14) == "xiv"
        assert to_roman(19) == "xix"
        assert to_roman(40) == "xl"
        assert to_roman(90) == "xc"
        assert to_roman(400) == "cd"
        assert to_roman(900) == "cm"

    def test_roman_complex_values(self) -> None:
        """Complex Roman numeral values."""
        assert to_roman(1994) == "mcmxciv"
        assert to_roman(2024) == "mmxxiv"
        assert to_roman(3999) == "mmmcmxcix"

    def test_roman_uppercase(self) -> None:
        """Uppercase Roman numerals."""
        assert to_roman(1, lowercase=False) == "I"
        assert to_roman(10, lowercase=False) == "X"
        assert to_roman(100, lowercase=False) == "C"

    def test_roman_zero_or_negative(self) -> None:
        """Zero or negative values return string representation."""
        assert to_roman(0) == "0"
        assert to_roman(-1) == "-1"


# =============================================================================
# Letter Format Tests
# =============================================================================


class TestLetterFormat:
    """Tests for letter format conversion."""

    def test_letter_basic(self) -> None:
        """Basic letter values."""
        assert to_letter(1) == "a"
        assert to_letter(2) == "b"
        assert to_letter(26) == "z"

    def test_letter_beyond_z(self) -> None:
        """Letter values beyond Z (aa, ab, etc.)."""
        assert to_letter(27) == "aa"
        assert to_letter(28) == "ab"
        assert to_letter(52) == "az"
        assert to_letter(53) == "ba"

    def test_letter_uppercase(self) -> None:
        """Uppercase letter values."""
        assert to_letter(1, lowercase=False) == "A"
        assert to_letter(26, lowercase=False) == "Z"
        assert to_letter(27, lowercase=False) == "AA"

    def test_letter_zero_or_negative(self) -> None:
        """Zero or negative values return empty string."""
        assert to_letter(0) == ""
        assert to_letter(-1) == ""


# =============================================================================
# Ordinal Format Tests
# =============================================================================


class TestOrdinalFormat:
    """Tests for ordinal format conversion."""

    def test_ordinal_basic(self) -> None:
        """Basic ordinal values."""
        assert to_ordinal(1) == "1st"
        assert to_ordinal(2) == "2nd"
        assert to_ordinal(3) == "3rd"
        assert to_ordinal(4) == "4th"

    def test_ordinal_teens(self) -> None:
        """Teen ordinal values (special cases)."""
        assert to_ordinal(11) == "11th"
        assert to_ordinal(12) == "12th"
        assert to_ordinal(13) == "13th"

    def test_ordinal_larger_values(self) -> None:
        """Larger ordinal values."""
        assert to_ordinal(21) == "21st"
        assert to_ordinal(22) == "22nd"
        assert to_ordinal(23) == "23rd"
        assert to_ordinal(100) == "100th"
        assert to_ordinal(101) == "101st"
        assert to_ordinal(111) == "111th"

    def test_ordinal_zero_or_negative(self) -> None:
        """Zero or negative values return string."""
        assert to_ordinal(0) == "0"
        assert to_ordinal(-1) == "-1"


# =============================================================================
# Ordinal Text Tests
# =============================================================================


class TestOrdinalText:
    """Tests for ordinal text conversion."""

    def test_ordinal_text_basic(self) -> None:
        """Basic ordinal text values."""
        assert to_ordinal_text(1) == "First"
        assert to_ordinal_text(2) == "Second"
        assert to_ordinal_text(3) == "Third"
        assert to_ordinal_text(4) == "Fourth"
        assert to_ordinal_text(5) == "Fifth"

    def test_ordinal_text_teens(self) -> None:
        """Teen ordinal text values."""
        assert to_ordinal_text(11) == "Eleventh"
        assert to_ordinal_text(12) == "Twelfth"
        assert to_ordinal_text(13) == "Thirteenth"
        assert to_ordinal_text(20) == "Twentieth"

    def test_ordinal_text_beyond_range(self) -> None:
        """Values beyond range fall back to numeric ordinal."""
        assert to_ordinal_text(21) == "21st"
        assert to_ordinal_text(100) == "100th"


# =============================================================================
# Cardinal Text Tests
# =============================================================================


class TestCardinalText:
    """Tests for cardinal text conversion."""

    def test_cardinal_text_basic(self) -> None:
        """Basic cardinal text values."""
        assert to_cardinal_text(1) == "One"
        assert to_cardinal_text(2) == "Two"
        assert to_cardinal_text(3) == "Three"
        assert to_cardinal_text(10) == "Ten"

    def test_cardinal_text_teens(self) -> None:
        """Teen cardinal text values."""
        assert to_cardinal_text(11) == "Eleven"
        assert to_cardinal_text(12) == "Twelve"
        assert to_cardinal_text(20) == "Twenty"

    def test_cardinal_text_beyond_range(self) -> None:
        """Values beyond range fall back to numeric."""
        assert to_cardinal_text(21) == "21"
        assert to_cardinal_text(100) == "100"


# =============================================================================
# Format Number Tests
# =============================================================================


class TestFormatNumber:
    """Tests for the format_number dispatcher function."""

    def test_format_decimal(self) -> None:
        """Decimal format."""
        assert format_number(1, "decimal") == "1"
        assert format_number(10, "decimal") == "10"
        assert format_number(100, "decimal") == "100"

    def test_format_lower_letter(self) -> None:
        """Lower letter format."""
        assert format_number(1, "lowerLetter") == "a"
        assert format_number(26, "lowerLetter") == "z"

    def test_format_upper_letter(self) -> None:
        """Upper letter format."""
        assert format_number(1, "upperLetter") == "A"
        assert format_number(26, "upperLetter") == "Z"

    def test_format_lower_roman(self) -> None:
        """Lower Roman format."""
        assert format_number(1, "lowerRoman") == "i"
        assert format_number(10, "lowerRoman") == "x"

    def test_format_upper_roman(self) -> None:
        """Upper Roman format."""
        assert format_number(1, "upperRoman") == "I"
        assert format_number(10, "upperRoman") == "X"

    def test_format_bullet(self) -> None:
        """Bullet format returns bullet character."""
        assert format_number(1, "bullet") == "•"
        assert format_number(5, "bullet") == "•"

    def test_format_ordinal(self) -> None:
        """Ordinal format."""
        assert format_number(1, "ordinal") == "1st"
        assert format_number(2, "ordinal") == "2nd"

    def test_format_ordinal_text(self) -> None:
        """Ordinal text format."""
        assert format_number(1, "ordinalText") == "First"
        assert format_number(2, "ordinalText") == "Second"

    def test_format_cardinal_text(self) -> None:
        """Cardinal text format."""
        assert format_number(1, "cardinalText") == "One"
        assert format_number(2, "cardinalText") == "Two"

    def test_format_decimal_zero(self) -> None:
        """Decimal zero format (zero-padded)."""
        assert format_number(1, "decimalZero") == "01"
        assert format_number(10, "decimalZero") == "10"

    def test_format_none(self) -> None:
        """None format returns empty string."""
        assert format_number(1, "none") == ""
        assert format_number(10, "none") == ""

    def test_format_unknown(self) -> None:
        """Unknown format falls back to decimal."""
        assert format_number(5, "unknownFormat") == "5"


# =============================================================================
# Level Text Template Tests
# =============================================================================


class TestApplyLevelText:
    """Tests for level text template application."""

    def test_simple_placeholder(self) -> None:
        """Simple single placeholder."""
        result = apply_level_text("%1.", {0: 1})
        assert result == "1."

    def test_multiple_placeholders(self) -> None:
        """Multiple placeholders in template."""
        result = apply_level_text("%1.%2", {0: 1, 1: 2})
        assert result == "1.2"

    def test_with_number_formats(self) -> None:
        """Placeholders with custom number formats."""
        result = apply_level_text(
            "%1.%2",
            {0: 1, 1: 2},
            {0: "upperRoman", 1: "lowerLetter"},
        )
        assert result == "I.b"

    def test_multilevel_numbering(self) -> None:
        """Multi-level numbering template."""
        result = apply_level_text(
            "%1.%2.%3",
            {0: 1, 1: 2, 2: 3},
            {0: "decimal", 1: "decimal", 2: "decimal"},
        )
        assert result == "1.2.3"

    def test_parenthesis_format(self) -> None:
        """Template with parentheses."""
        result = apply_level_text("(%1)", {0: 1})
        assert result == "(1)"

    def test_missing_counter(self) -> None:
        """Missing counter defaults to 1."""
        result = apply_level_text("%1.%2", {0: 5})
        assert result == "5.1"

    def test_no_placeholders(self) -> None:
        """Template without placeholders."""
        result = apply_level_text("•", {0: 1})
        assert result == "•"


# =============================================================================
# Suffix Tests
# =============================================================================


class TestGetSuffix:
    """Tests for suffix handling."""

    def test_suffix_tab(self) -> None:
        """Tab suffix."""
        assert get_suffix("tab") == "\t"

    def test_suffix_space(self) -> None:
        """Space suffix."""
        assert get_suffix("space") == " "

    def test_suffix_nothing(self) -> None:
        """Nothing suffix."""
        assert get_suffix("nothing") == ""

    def test_suffix_none(self) -> None:
        """None suffix defaults to tab."""
        assert get_suffix(None) == "\t"

    def test_suffix_unknown(self) -> None:
        """Unknown suffix defaults to tab."""
        assert get_suffix("unknown") == "\t"


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestNumberingToTextConverterClass:
    """Tests for NumberingToTextConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = NumberingToTextConverter()
        assert converter is not None

    def test_format_prefix_decimal(self) -> None:
        """Format decimal prefix."""
        converter = NumberingToTextConverter()
        result = converter.format_prefix(1, "decimal", "%1.")
        assert result == "1.\t"

    def test_format_prefix_bullet(self) -> None:
        """Format bullet prefix."""
        converter = NumberingToTextConverter()
        result = converter.format_prefix(1, "bullet", "•")
        assert result == "•"

    def test_format_prefix_with_suffix(self) -> None:
        """Format prefix with custom suffix."""
        converter = NumberingToTextConverter()
        result = converter.format_prefix(1, "decimal", "%1.", suff="space")
        assert result == "1. "

    def test_format_prefix_nothing_suffix(self) -> None:
        """Format prefix with no suffix."""
        converter = NumberingToTextConverter()
        result = converter.format_prefix(1, "decimal", "%1.", suff="nothing")
        assert result == "1."

    def test_format_multi_level_prefix(self) -> None:
        """Format multi-level prefix."""
        converter = NumberingToTextConverter()
        result = converter.format_multi_level_prefix(
            counters={0: 1, 1: 2},
            num_fmts={0: "decimal", 1: "lowerLetter"},
            lvl_text="%1.%2)",
        )
        assert result == "1.b)\t"

    def test_format_multi_level_with_suffix(self) -> None:
        """Format multi-level prefix with custom suffix."""
        converter = NumberingToTextConverter()
        result = converter.format_multi_level_prefix(
            counters={0: 1, 1: 1, 2: 1},
            num_fmts={0: "decimal", 1: "decimal", 2: "decimal"},
            lvl_text="%1.%2.%3",
            suff="space",
        )
        assert result == "1.1.1 "


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestNumberingEdgeCases:
    """Tests for edge cases in numbering conversion."""

    def test_large_numbers(self) -> None:
        """Large number values."""
        assert format_number(1000, "decimal") == "1000"
        assert format_number(1000, "lowerRoman") == "m"
        assert "aa" in to_letter(27)

    def test_empty_level_text(self) -> None:
        """Empty level text template."""
        result = apply_level_text("", {0: 1})
        assert result == ""

    def test_consecutive_placeholders(self) -> None:
        """Consecutive placeholders without separator."""
        result = apply_level_text("%1%2%3", {0: 1, 1: 2, 2: 3})
        assert result == "123"

    def test_repeated_placeholders(self) -> None:
        """Repeated same placeholder."""
        result = apply_level_text("%1-%1", {0: 5})
        assert result == "5-5"

    def test_high_level_placeholders(self) -> None:
        """High level placeholders (up to %9)."""
        counters = {i: i + 1 for i in range(9)}
        result = apply_level_text("%1.%9", counters)
        assert "1." in result
        assert ".9" in result


# =============================================================================
# Integration Tests
# =============================================================================


class TestNumberingIntegration:
    """Integration tests for numbering scenarios."""

    def test_typical_numbered_list(self) -> None:
        """Typical numbered list scenario."""
        converter = NumberingToTextConverter()
        prefixes = [converter.format_prefix(i, "decimal", "%1.") for i in range(1, 6)]
        assert prefixes[0] == "1.\t"
        assert prefixes[4] == "5.\t"

    def test_typical_bulleted_list(self) -> None:
        """Typical bulleted list scenario."""
        converter = NumberingToTextConverter()
        prefix = converter.format_prefix(1, "bullet", "•")
        # Bullet should not have tab suffix (it's the entire marker)
        assert prefix == "•"

    def test_typical_outline_numbering(self) -> None:
        """Typical outline numbering scenario."""
        converter = NumberingToTextConverter()

        # Level 0: I, II, III
        level0 = converter.format_prefix(1, "upperRoman", "%1.")
        assert level0 == "I.\t"

        # Level 1: A, B, C
        level1 = converter.format_prefix(1, "upperLetter", "%1.")
        assert level1 == "A.\t"

        # Level 2: 1, 2, 3
        level2 = converter.format_prefix(1, "decimal", "%1.")
        assert level2 == "1.\t"

    def test_legal_numbering(self) -> None:
        """Legal style numbering (1.1.1)."""
        converter = NumberingToTextConverter()
        result = converter.format_multi_level_prefix(
            counters={0: 1, 1: 2, 2: 3},
            num_fmts={0: "decimal", 1: "decimal", 2: "decimal"},
            lvl_text="%1.%2.%3",
            suff="tab",
        )
        assert result == "1.2.3\t"
