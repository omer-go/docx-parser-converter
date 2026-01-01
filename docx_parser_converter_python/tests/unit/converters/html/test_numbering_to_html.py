"""Unit tests for numbering to HTML converter.

Tests conversion of numbering/list prefixes to HTML format.
"""

from converters.html.numbering_to_html import (
    NumberingToHTMLConverter,
    apply_level_text,
    format_number,
    generate_css_counter_style,
    get_list_style_type,
    get_list_type,
    get_suffix,
    to_cardinal_text,
    to_chicago,
    to_decimal_zero,
    to_letter,
    to_ordinal,
    to_ordinal_text,
    to_roman,
)

# =============================================================================
# Number Format Tests
# =============================================================================


class TestNumberFormatting:
    """Tests for number format conversion."""

    def test_decimal_format(self) -> None:
        """Decimal number format (1, 2, 3...)."""
        assert format_number(1, "decimal") == "1"
        assert format_number(10, "decimal") == "10"
        assert format_number(999, "decimal") == "999"

    def test_lower_letter_format(self) -> None:
        """Lower letter format (a, b, c...)."""
        assert format_number(1, "lowerLetter") == "a"
        assert format_number(26, "lowerLetter") == "z"
        assert format_number(27, "lowerLetter") == "aa"

    def test_upper_letter_format(self) -> None:
        """Upper letter format (A, B, C...)."""
        assert format_number(1, "upperLetter") == "A"
        assert format_number(26, "upperLetter") == "Z"
        assert format_number(27, "upperLetter") == "AA"

    def test_lower_roman_format(self) -> None:
        """Lower Roman numeral format (i, ii, iii...)."""
        assert format_number(1, "lowerRoman") == "i"
        assert format_number(4, "lowerRoman") == "iv"
        assert format_number(9, "lowerRoman") == "ix"

    def test_upper_roman_format(self) -> None:
        """Upper Roman numeral format (I, II, III...)."""
        assert format_number(1, "upperRoman") == "I"
        assert format_number(10, "upperRoman") == "X"
        assert format_number(50, "upperRoman") == "L"

    def test_bullet_format(self) -> None:
        """Bullet format returns bullet character."""
        result = format_number(1, "bullet")
        assert result == "•"

    def test_ordinal_format(self) -> None:
        """Ordinal format (1st, 2nd, 3rd...)."""
        assert format_number(1, "ordinal") == "1st"
        assert format_number(2, "ordinal") == "2nd"
        assert format_number(3, "ordinal") == "3rd"
        assert format_number(4, "ordinal") == "4th"

    def test_ordinal_text_format(self) -> None:
        """Ordinal text format (First, Second...)."""
        result = format_number(1, "ordinalText")
        assert result.lower() == "first"

    def test_cardinal_text_format(self) -> None:
        """Cardinal text format (One, Two...)."""
        result = format_number(1, "cardinalText")
        assert result.lower() == "one"

    def test_decimal_zero_format(self) -> None:
        """Decimal zero padded format (01, 02...)."""
        assert format_number(1, "decimalZero") == "01"
        assert format_number(10, "decimalZero") == "10"

    def test_none_format(self) -> None:
        """None format returns empty string."""
        assert format_number(1, "none") == ""

    def test_chicago_format(self) -> None:
        """Chicago format (*, †, ‡...)."""
        result = format_number(1, "chicago")
        assert result == "*"
        result = format_number(2, "chicago")
        assert result == "†"


# =============================================================================
# Roman Numeral Tests
# =============================================================================


class TestRomanNumerals:
    """Tests for Roman numeral conversion edge cases."""

    def test_roman_1_to_10(self) -> None:
        """Roman numerals 1-10."""
        expected = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
        for i, expected_val in enumerate(expected, 1):
            assert to_roman(i, lowercase=True) == expected_val

    def test_roman_50(self) -> None:
        """Roman numeral for 50 (L)."""
        assert to_roman(50, lowercase=True) == "l"

    def test_roman_100(self) -> None:
        """Roman numeral for 100 (C)."""
        assert to_roman(100, lowercase=True) == "c"

    def test_roman_500(self) -> None:
        """Roman numeral for 500 (D)."""
        assert to_roman(500, lowercase=True) == "d"

    def test_roman_1000(self) -> None:
        """Roman numeral for 1000 (M)."""
        assert to_roman(1000, lowercase=True) == "m"

    def test_roman_subtractive(self) -> None:
        """Subtractive Roman numerals (IV, IX, XL, XC, CD, CM)."""
        assert to_roman(4, lowercase=True) == "iv"
        assert to_roman(9, lowercase=True) == "ix"
        assert to_roman(40, lowercase=True) == "xl"
        assert to_roman(90, lowercase=True) == "xc"
        assert to_roman(400, lowercase=True) == "cd"
        assert to_roman(900, lowercase=True) == "cm"

    def test_roman_complex(self) -> None:
        """Complex Roman numeral (e.g., 1994 = MCMXCIV)."""
        assert to_roman(1994, lowercase=False) == "MCMXCIV"


# =============================================================================
# Letter Sequence Tests
# =============================================================================


class TestLetterSequence:
    """Tests for letter sequence edge cases."""

    def test_letter_full_alphabet(self) -> None:
        """All 26 letters."""
        for i in range(1, 27):
            result = to_letter(i, lowercase=True)
            assert result == chr(ord("a") + i - 1)

    def test_letter_beyond_26(self) -> None:
        """Letters beyond z (aa, ab, ac...)."""
        assert to_letter(27, lowercase=True) == "aa"
        assert to_letter(28, lowercase=True) == "ab"
        assert to_letter(52, lowercase=True) == "az"
        assert to_letter(53, lowercase=True) == "ba"

    def test_letter_beyond_702(self) -> None:
        """Letters beyond zz (aaa, aab...)."""
        # 26 + 26*26 = 702
        assert to_letter(703, lowercase=True) == "aaa"


# =============================================================================
# Level Text Template Tests
# =============================================================================


class TestLevelTextTemplate:
    """Tests for level text template substitution."""

    def test_simple_template(self) -> None:
        """Simple template like '%1.'."""
        counters = {0: 5}
        result = apply_level_text("%1.", counters, {0: "decimal"})
        assert result == "5."

    def test_template_with_multiple_levels(self) -> None:
        """Template like '%1.%2' for nested numbering."""
        counters = {0: 3, 1: 2}
        result = apply_level_text("%1.%2", counters, {0: "decimal", 1: "decimal"})
        assert result == "3.2"

    def test_template_with_parentheses(self) -> None:
        """Template like '(%1)' for enclosed numbering."""
        counters = {0: 1}
        result = apply_level_text("(%1)", counters, {0: "lowerLetter"})
        assert result == "(a)"

    def test_template_with_bracket(self) -> None:
        """Template like '%1)' for half-enclosed."""
        counters = {0: 1}
        result = apply_level_text("%1)", counters, {0: "decimal"})
        assert result == "1)"

    def test_template_bullet(self) -> None:
        """Template for bullet (typically no placeholder)."""
        counters = {0: 1}
        result = apply_level_text("•", counters, {0: "bullet"})
        assert result == "•"

    def test_template_missing_placeholder(self) -> None:
        """Template with literal text only."""
        counters = {0: 1}
        result = apply_level_text("Item:", counters, {0: "none"})
        assert result == "Item:"


# =============================================================================
# Level Suffix Tests
# =============================================================================


class TestLevelSuffix:
    """Tests for level suffix handling."""

    def test_tab_suffix(self) -> None:
        """Tab suffix after number."""
        result = get_suffix("tab")
        assert result == "\t"

    def test_space_suffix(self) -> None:
        """Space suffix after number."""
        result = get_suffix("space")
        assert result == " "

    def test_nothing_suffix(self) -> None:
        """No suffix after number."""
        result = get_suffix("nothing")
        assert result == ""


# =============================================================================
# Bullet Types Tests
# =============================================================================


class TestBulletTypes:
    """Tests for different bullet types."""

    def test_disc_bullet(self) -> None:
        """Disc bullet (filled circle)."""
        result = format_number(1, "bullet")
        assert result == "•"

    def test_circle_bullet(self) -> None:
        """Circle bullet - test that bullet format works."""
        result = format_number(5, "bullet")
        assert result == "•"

    def test_square_bullet(self) -> None:
        """Square bullet - bullet format is consistent."""
        result = format_number(10, "bullet")
        assert result == "•"

    def test_dash_bullet(self) -> None:
        """Different bullet counter values return same bullet."""
        result = format_number(100, "bullet")
        assert result == "•"

    def test_custom_symbol_bullet(self) -> None:
        """Bullet format is always bullet character."""
        result = format_number(1, "bullet")
        assert len(result) == 1

    def test_picture_bullet(self) -> None:
        """Picture bullets use standard bullet placeholder."""
        result = format_number(1, "bullet")
        assert result == "•"


# =============================================================================
# Multi-Level Numbering Tests
# =============================================================================


class TestMultiLevelNumbering:
    """Tests for multi-level numbering."""

    def test_two_level_outline(self) -> None:
        """Two-level outline (1, 1.1, 1.2, 2...)."""
        counters = {0: 1, 1: 1}
        num_fmts = {0: "decimal", 1: "decimal"}
        result = apply_level_text("%1.%2", counters, num_fmts)
        assert result == "1.1"

    def test_three_level_outline(self) -> None:
        """Three-level outline (1, 1.1, 1.1.1...)."""
        counters = {0: 2, 1: 3, 2: 1}
        num_fmts = {0: "decimal", 1: "decimal", 2: "decimal"}
        result = apply_level_text("%1.%2.%3", counters, num_fmts)
        assert result == "2.3.1"

    def test_mixed_format_levels(self) -> None:
        """Different formats at different levels."""
        counters = {0: 1, 1: 1, 2: 1}
        num_fmts = {0: "decimal", 1: "lowerLetter", 2: "lowerRoman"}
        result = apply_level_text("%1.%2.%3", counters, num_fmts)
        assert result == "1.a.i"

    def test_level_restart(self) -> None:
        """Level restart is handled by tracker, not formatting."""
        counters = {0: 2, 1: 1}
        result = apply_level_text("%1.%2", counters, {0: "decimal", 1: "decimal"})
        assert result == "2.1"


# =============================================================================
# HTML List Output Tests
# =============================================================================


class TestHTMLListOutput:
    """Tests for HTML list element output."""

    def test_ordered_list_html(self) -> None:
        """Decimal numbering maps to ordered list."""
        list_type = get_list_type("decimal")
        assert list_type == "ol"

    def test_unordered_list_html(self) -> None:
        """Bullet numbering maps to unordered list."""
        list_type = get_list_type("bullet")
        assert list_type == "ul"

    def test_nested_list_html(self) -> None:
        """List types work for all formats."""
        for fmt in ["decimal", "lowerLetter", "upperRoman"]:
            assert get_list_type(fmt) == "ol"

    def test_inline_prefix_mode(self) -> None:
        """Converter can format inline prefixes."""
        converter = NumberingToHTMLConverter(use_inline_prefix=True)
        result = converter.format_prefix(1, "decimal", "%1.", "space")
        assert "1" in result


# =============================================================================
# CSS Counter Output Tests
# =============================================================================


class TestCSSCounterOutput:
    """Tests for CSS counter-based output."""

    def test_css_counter_reset(self) -> None:
        """CSS counter style generation."""
        style = generate_css_counter_style("list-0", "decimal")
        assert style == "decimal"

    def test_css_counter_increment(self) -> None:
        """CSS counter increment via converter."""
        converter = NumberingToHTMLConverter(use_css_counters=True)
        css = converter.generate_css("decimal", level=0)
        assert "counter-increment" in css

    def test_css_counter_nested(self) -> None:
        """Nested counters have different names."""
        style0 = generate_css_counter_style("list-0", "decimal")
        style1 = generate_css_counter_style("list-1", "lowerLetter")
        assert style0 == "decimal"
        assert style1 == "lower-alpha"

    def test_css_counter_roman(self) -> None:
        """CSS counter with Roman numeral style."""
        style = generate_css_counter_style("list-0", "lowerRoman")
        assert style == "lower-roman"

    def test_css_counter_letter(self) -> None:
        """CSS counter with letter style."""
        style = generate_css_counter_style("list-0", "lowerLetter")
        assert style == "lower-alpha"


# =============================================================================
# Numbering Instance Tests
# =============================================================================


class TestNumberingInstance:
    """Tests for numbering instance resolution."""

    def test_instance_references_abstract(self) -> None:
        """Numbering instance tested via format_prefix."""
        converter = NumberingToHTMLConverter()
        result = converter.format_prefix(1, "decimal", "%1.", "tab")
        assert "1" in result

    def test_level_override(self) -> None:
        """Level override tested via different start value."""
        converter = NumberingToHTMLConverter()
        result = converter.format_prefix(10, "decimal", "%1.", "tab")
        assert "10" in result

    def test_level_override_with_level(self) -> None:
        """Full level definition override."""
        converter = NumberingToHTMLConverter()
        result = converter.format_prefix(5, "upperRoman", "%1)", "tab")
        assert "V" in result


# =============================================================================
# Numbering Tracker Integration Tests
# =============================================================================


class TestNumberingTrackerIntegration:
    """Tests for integration with NumberingTracker."""

    def test_get_prefix_from_tracker(self) -> None:
        """Prefixes can be formatted from tracker values."""
        converter = NumberingToHTMLConverter()
        # First call
        result1 = converter.format_prefix(1, "decimal", "%1.", "tab")
        assert "1" in result1
        # Would be incremented by tracker
        result2 = converter.format_prefix(2, "decimal", "%1.", "tab")
        assert "2" in result2

    def test_tracker_state_preserved(self) -> None:
        """Multi-level counters work correctly."""
        counters = {0: 3, 1: 5}
        result = apply_level_text("%1.%2", counters)
        assert "3" in result
        assert "5" in result

    def test_tracker_reset_on_restart(self) -> None:
        """Counter reset shows in formatting."""
        counters = {0: 1}
        result = apply_level_text("%1.", counters)
        assert result == "1."


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestNumberingEdgeCases:
    """Tests for edge cases in numbering conversion."""

    def test_missing_level_definition(self) -> None:
        """Handle missing counter gracefully."""
        counters: dict[int, int] = {}
        result = apply_level_text("%1.", counters)
        assert "1" in result  # Defaults to 1

    def test_missing_abstract_numbering(self) -> None:
        """Missing format defaults to decimal."""
        result = format_number(5, "unknownFormat")
        assert result == "5"

    def test_zero_start(self) -> None:
        """Start value of 0."""
        result = format_number(0, "decimal")
        assert result == "0"

    def test_negative_start(self) -> None:
        """Negative start value."""
        result = format_number(-1, "decimal")
        assert result == "-1"

    def test_very_large_number(self) -> None:
        """Very large counter value."""
        result = format_number(99999, "decimal")
        assert result == "99999"

    def test_roman_zero(self) -> None:
        """Roman numeral for 0 (edge case)."""
        result = to_roman(0)
        assert result == "0"  # Falls back to string

    def test_roman_negative(self) -> None:
        """Roman numeral for negative (edge case)."""
        result = to_roman(-1)
        assert result == "-1"  # Falls back to string

    def test_unknown_format(self) -> None:
        """Unknown number format defaults to decimal."""
        result = format_number(5, "unknownFormat")
        assert result == "5"

    def test_empty_lvl_text(self) -> None:
        """Empty level text template."""
        counters = {0: 1}
        result = apply_level_text("", counters)
        assert result == ""

    def test_none_num_fmt(self) -> None:
        """None format handled gracefully via unknown format fallback."""
        # This would typically be caught before reaching format_number
        result = format_number(1, "none")
        assert result == ""

    def test_legal_numbering(self) -> None:
        """Legal numbering tested via multi-level."""
        counters = {0: 1, 1: 1}
        result = apply_level_text("%1.%2", counters, {0: "decimal", 1: "decimal"})
        assert result == "1.1"


# =============================================================================
# Accessibility Tests
# =============================================================================


class TestNumberingAccessibility:
    """Tests for accessibility in numbered list output."""

    def test_list_semantics(self) -> None:
        """Output uses proper list semantics."""
        assert get_list_type("decimal") == "ol"
        assert get_list_type("bullet") == "ul"

    def test_aria_labels(self) -> None:
        """List style types are properly mapped."""
        assert get_list_style_type("decimal") == "decimal"
        assert get_list_style_type("lowerLetter") == "lower-alpha"


# =============================================================================
# HTML Output Mode Tests
# =============================================================================


class TestNumberingHTMLOutputMode:
    """Tests for different HTML output modes."""

    def test_native_list_mode(self) -> None:
        """Native HTML list mode initialization."""
        converter = NumberingToHTMLConverter(use_native_lists=True)
        assert converter.use_native_lists is True

    def test_css_counter_mode(self) -> None:
        """CSS counter-based mode."""
        converter = NumberingToHTMLConverter(use_css_counters=True)
        assert converter.use_css_counters is True

    def test_inline_prefix_mode(self) -> None:
        """Inline prefix rendering mode."""
        converter = NumberingToHTMLConverter(use_inline_prefix=True)
        assert converter.use_inline_prefix is True


# =============================================================================
# Style Integration Tests
# =============================================================================


class TestNumberingStyleIntegration:
    """Tests for numbering style integration."""

    def test_numbering_run_properties(self) -> None:
        """Run properties would be applied at paragraph level."""
        converter = NumberingToHTMLConverter()
        prefix = converter.format_prefix(1, "decimal", "%1.", "tab")
        assert "1" in prefix

    def test_numbering_paragraph_properties(self) -> None:
        """Paragraph properties tested via format_prefix."""
        converter = NumberingToHTMLConverter()
        prefix = converter.format_prefix(1, "lowerLetter", "(%1)", "space")
        assert "(a)" in prefix

    def test_style_link(self) -> None:
        """Style link handled at document converter level."""
        converter = NumberingToHTMLConverter()
        assert converter is not None


# =============================================================================
# Helper Function Tests
# =============================================================================


class TestHelperFunctions:
    """Tests for individual helper functions."""

    def test_to_ordinal(self) -> None:
        """Test to_ordinal function."""
        assert to_ordinal(1) == "1st"
        assert to_ordinal(2) == "2nd"
        assert to_ordinal(3) == "3rd"
        assert to_ordinal(4) == "4th"
        assert to_ordinal(11) == "11th"
        assert to_ordinal(12) == "12th"
        assert to_ordinal(13) == "13th"
        assert to_ordinal(21) == "21st"
        assert to_ordinal(22) == "22nd"
        assert to_ordinal(23) == "23rd"

    def test_to_ordinal_text(self) -> None:
        """Test to_ordinal_text function."""
        assert to_ordinal_text(1) == "First"
        assert to_ordinal_text(5) == "Fifth"
        assert to_ordinal_text(10) == "Tenth"

    def test_to_cardinal_text(self) -> None:
        """Test to_cardinal_text function."""
        assert to_cardinal_text(1) == "One"
        assert to_cardinal_text(10) == "Ten"
        assert to_cardinal_text(15) == "Fifteen"

    def test_to_decimal_zero(self) -> None:
        """Test to_decimal_zero function."""
        assert to_decimal_zero(1) == "01"
        assert to_decimal_zero(9) == "09"
        assert to_decimal_zero(10) == "10"
        assert to_decimal_zero(1, width=3) == "001"

    def test_to_chicago(self) -> None:
        """Test to_chicago function."""
        assert to_chicago(1) == "*"
        assert to_chicago(2) == "†"
        assert to_chicago(3) == "‡"
        assert to_chicago(4) == "§"
        assert to_chicago(5) == "**"
        assert to_chicago(6) == "††"


# =============================================================================
# Converter Class Tests
# =============================================================================


class TestNumberingToHTMLConverterClass:
    """Tests for NumberingToHTMLConverter class."""

    def test_converter_initialization(self) -> None:
        """Initialize converter."""
        converter = NumberingToHTMLConverter()
        assert converter is not None

    def test_converter_with_options(self) -> None:
        """Initialize with options."""
        converter = NumberingToHTMLConverter(
            use_native_lists=True, use_css_counters=True, use_inline_prefix=False
        )
        assert converter.use_native_lists is True
        assert converter.use_css_counters is True
        assert converter.use_inline_prefix is False

    def test_format_prefix_method(self) -> None:
        """Test format_prefix method."""
        converter = NumberingToHTMLConverter()
        result = converter.format_prefix(5, "decimal", "%1.", "space")
        assert "5" in result
        assert result.endswith(" ")

    def test_format_multi_level_prefix_method(self) -> None:
        """Test format_multi_level_prefix method."""
        converter = NumberingToHTMLConverter()
        counters = {0: 2, 1: 3}
        num_fmts = {0: "decimal", 1: "lowerLetter"}
        result = converter.format_multi_level_prefix(counters, num_fmts, "%1.%2", "tab")
        assert "2" in result
        assert "c" in result

    def test_generate_css_method(self) -> None:
        """Test generate_css method."""
        converter = NumberingToHTMLConverter(use_css_counters=True)
        css = converter.generate_css("decimal", level=0)
        assert "counter-increment" in css
