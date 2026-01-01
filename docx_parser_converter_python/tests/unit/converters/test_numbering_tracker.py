"""Unit tests for NumberingTracker class.

Tests numbering counter tracking, formatting, and edge cases.
"""

import pytest

from converters.common.numbering_tracker import NumberingTracker
from models.numbering.abstract_numbering import AbstractNumbering
from models.numbering.level import Level
from models.numbering.level_override import LevelOverride
from models.numbering.numbering import Numbering
from models.numbering.numbering_instance import NumberingInstance

# =============================================================================
# Test Fixtures
# =============================================================================


@pytest.fixture
def simple_numbering() -> Numbering:
    """Simple single-level decimal numbering."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(
                        ilvl=0,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.",
                        lvl_jc="left",
                    ),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
        ],
    )


@pytest.fixture
def bullet_numbering() -> Numbering:
    """Bullet list numbering."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(
                        ilvl=0,
                        num_fmt="bullet",
                        lvl_text="•",
                        lvl_jc="left",
                    ),
                    Level(
                        ilvl=1,
                        num_fmt="bullet",
                        lvl_text="◦",
                        lvl_jc="left",
                    ),
                    Level(
                        ilvl=2,
                        num_fmt="bullet",
                        lvl_text="▪",
                        lvl_jc="left",
                    ),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
        ],
    )


@pytest.fixture
def multi_level_numbering() -> Numbering:
    """Multi-level numbering (1., 1.1., 1.1.1.)."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                multi_level_type="multilevel",
                lvl=[
                    Level(
                        ilvl=0,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.",
                        lvl_jc="left",
                    ),
                    Level(
                        ilvl=1,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.%2.",
                        lvl_jc="left",
                    ),
                    Level(
                        ilvl=2,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.%2.%3.",
                        lvl_jc="left",
                    ),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
        ],
    )


@pytest.fixture
def various_formats_numbering() -> Numbering:
    """Numbering with various format types."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="decimal", lvl_text="%1."),
                ],
            ),
            AbstractNumbering(
                abstract_num_id=1,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="lowerLetter", lvl_text="%1)"),
                ],
            ),
            AbstractNumbering(
                abstract_num_id=2,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="upperLetter", lvl_text="%1."),
                ],
            ),
            AbstractNumbering(
                abstract_num_id=3,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="lowerRoman", lvl_text="%1."),
                ],
            ),
            AbstractNumbering(
                abstract_num_id=4,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="upperRoman", lvl_text="(%1)"),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
            NumberingInstance(num_id=2, abstract_num_id=1),
            NumberingInstance(num_id=3, abstract_num_id=2),
            NumberingInstance(num_id=4, abstract_num_id=3),
            NumberingInstance(num_id=5, abstract_num_id=4),
        ],
    )


@pytest.fixture
def restart_numbering() -> Numbering:
    """Numbering with lvlRestart settings."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(
                        ilvl=0,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.",
                    ),
                    Level(
                        ilvl=1,
                        start=1,
                        num_fmt="lowerLetter",
                        lvl_text="%2)",
                        lvl_restart=0,  # Restart when level 0 increments
                    ),
                    Level(
                        ilvl=2,
                        start=1,
                        num_fmt="lowerRoman",
                        lvl_text="%3.",
                        lvl_restart=1,  # Restart when level 1 increments
                    ),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
        ],
    )


@pytest.fixture
def override_numbering() -> Numbering:
    """Numbering with level overrides."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(
                        ilvl=0,
                        start=1,
                        num_fmt="decimal",
                        lvl_text="%1.",
                    ),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
            NumberingInstance(
                num_id=2,
                abstract_num_id=0,
                lvl_override=[
                    LevelOverride(ilvl=0, start_override=10),
                ],
            ),
        ],
    )


@pytest.fixture
def multiple_lists_numbering() -> Numbering:
    """Multiple independent lists."""
    return Numbering(
        abstract_num=[
            AbstractNumbering(
                abstract_num_id=0,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="decimal", lvl_text="%1."),
                ],
            ),
            AbstractNumbering(
                abstract_num_id=1,
                lvl=[
                    Level(ilvl=0, start=1, num_fmt="upperLetter", lvl_text="%1."),
                ],
            ),
        ],
        num=[
            NumberingInstance(num_id=1, abstract_num_id=0),
            NumberingInstance(num_id=2, abstract_num_id=1),
            NumberingInstance(num_id=3, abstract_num_id=0),  # Different num, same abstract
        ],
    )


# =============================================================================
# NumberingTracker Initialization Tests
# =============================================================================


class TestNumberingTrackerInit:
    """Tests for NumberingTracker initialization."""

    def test_init_with_numbering(self, simple_numbering: Numbering) -> None:
        """Initialize with numbering definitions."""
        tracker = NumberingTracker(simple_numbering)
        assert tracker is not None

    def test_init_with_empty_numbering(self) -> None:
        """Initialize with empty numbering."""
        tracker = NumberingTracker(Numbering())
        assert tracker is not None

    def test_init_with_none(self) -> None:
        """Initialize with None numbering."""
        tracker = NumberingTracker(None)
        assert tracker is not None

    def test_init_builds_lookup_maps(self, simple_numbering: Numbering) -> None:
        """Initialization builds abstract num and num instance maps."""
        tracker = NumberingTracker(simple_numbering)
        assert 0 in tracker._abstract_num_map
        assert 1 in tracker._num_instance_map


# =============================================================================
# Basic Counter Tests
# =============================================================================


class TestBasicCounter:
    """Tests for basic counter functionality."""

    def test_first_item_returns_start_value(self, simple_numbering: Numbering) -> None:
        """First item in list returns configured start value."""
        tracker = NumberingTracker(simple_numbering)
        result = tracker.get_number(num_id=1, ilvl=0)
        assert result == "1."

    def test_second_item_increments(self, simple_numbering: Numbering) -> None:
        """Second item increments the counter."""
        tracker = NumberingTracker(simple_numbering)
        tracker.get_number(num_id=1, ilvl=0)  # "1."
        result = tracker.get_number(num_id=1, ilvl=0)
        assert result == "2."

    def test_counter_continues_incrementing(self, simple_numbering: Numbering) -> None:
        """Counter continues incrementing with each call."""
        tracker = NumberingTracker(simple_numbering)
        results = []
        for _ in range(5):
            results.append(tracker.get_number(num_id=1, ilvl=0))
        assert results == ["1.", "2.", "3.", "4.", "5."]

    def test_custom_start_value(self) -> None:
        """List starting at value other than 1."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=5, num_fmt="decimal", lvl_text="%1."),
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "5."
        assert tracker.get_number(num_id=1, ilvl=0) == "6."


# =============================================================================
# Number Format Tests
# =============================================================================


class TestNumberFormats:
    """Tests for different number formats."""

    def test_decimal_format(self, various_formats_numbering: Numbering) -> None:
        """Test decimal format (1, 2, 3...)."""
        tracker = NumberingTracker(various_formats_numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "1."
        assert tracker.get_number(num_id=1, ilvl=0) == "2."
        assert tracker.get_number(num_id=1, ilvl=0) == "3."

    def test_lower_letter_format(self, various_formats_numbering: Numbering) -> None:
        """Test lowerLetter format (a, b, c...)."""
        tracker = NumberingTracker(various_formats_numbering)
        assert tracker.get_number(num_id=2, ilvl=0) == "a)"
        assert tracker.get_number(num_id=2, ilvl=0) == "b)"
        assert tracker.get_number(num_id=2, ilvl=0) == "c)"

    def test_upper_letter_format(self, various_formats_numbering: Numbering) -> None:
        """Test upperLetter format (A, B, C...)."""
        tracker = NumberingTracker(various_formats_numbering)
        assert tracker.get_number(num_id=3, ilvl=0) == "A."
        assert tracker.get_number(num_id=3, ilvl=0) == "B."
        assert tracker.get_number(num_id=3, ilvl=0) == "C."

    def test_lower_roman_format(self, various_formats_numbering: Numbering) -> None:
        """Test lowerRoman format (i, ii, iii...)."""
        tracker = NumberingTracker(various_formats_numbering)
        assert tracker.get_number(num_id=4, ilvl=0) == "i."
        assert tracker.get_number(num_id=4, ilvl=0) == "ii."
        assert tracker.get_number(num_id=4, ilvl=0) == "iii."

    def test_upper_roman_format(self, various_formats_numbering: Numbering) -> None:
        """Test upperRoman format (I, II, III...)."""
        tracker = NumberingTracker(various_formats_numbering)
        assert tracker.get_number(num_id=5, ilvl=0) == "(I)"
        assert tracker.get_number(num_id=5, ilvl=0) == "(II)"
        assert tracker.get_number(num_id=5, ilvl=0) == "(III)"

    def test_bullet_format(self, bullet_numbering: Numbering) -> None:
        """Test bullet format (no counter increment)."""
        tracker = NumberingTracker(bullet_numbering)
        # Bullets should always return the same symbol
        assert tracker.get_number(num_id=1, ilvl=0) == "•"
        assert tracker.get_number(num_id=1, ilvl=0) == "•"

    def test_letter_wraps_after_z(self) -> None:
        """Test letter format wraps (z -> aa -> ab...)."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=26, num_fmt="lowerLetter", lvl_text="%1)"),
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "z)"
        assert tracker.get_number(num_id=1, ilvl=0) == "aa)"
        assert tracker.get_number(num_id=1, ilvl=0) == "ab)"


# =============================================================================
# Multi-Level Tests
# =============================================================================


class TestMultiLevel:
    """Tests for multi-level numbering."""

    def test_nested_level_format(self, multi_level_numbering: Numbering) -> None:
        """Test nested level text format (%1.%2.)."""
        tracker = NumberingTracker(multi_level_numbering)

        # Level 0
        assert tracker.get_number(num_id=1, ilvl=0) == "1."

        # Level 1 (nested)
        assert tracker.get_number(num_id=1, ilvl=1) == "1.1."
        assert tracker.get_number(num_id=1, ilvl=1) == "1.2."

        # Level 2 (double nested)
        assert tracker.get_number(num_id=1, ilvl=2) == "1.2.1."

    def test_higher_level_resets_lower(self, multi_level_numbering: Numbering) -> None:
        """Higher level increments reset lower levels."""
        tracker = NumberingTracker(multi_level_numbering)

        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=1)  # 1.1.
        tracker.get_number(num_id=1, ilvl=1)  # 1.2.

        # Back to level 0
        tracker.get_number(num_id=1, ilvl=0)  # 2.

        # Level 1 should reset
        assert tracker.get_number(num_id=1, ilvl=1) == "2.1."

    def test_three_level_deep(self, multi_level_numbering: Numbering) -> None:
        """Test three levels of nesting."""
        tracker = NumberingTracker(multi_level_numbering)

        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=1)  # 1.1.
        tracker.get_number(num_id=1, ilvl=2)  # 1.1.1.
        tracker.get_number(num_id=1, ilvl=2)  # 1.1.2.
        tracker.get_number(num_id=1, ilvl=1)  # 1.2.
        assert tracker.get_number(num_id=1, ilvl=2) == "1.2.1."


# =============================================================================
# Level Restart Tests
# =============================================================================


class TestLevelRestart:
    """Tests for lvlRestart behavior."""

    def test_restart_on_parent_increment(self, restart_numbering: Numbering) -> None:
        """Level restarts when parent level increments."""
        tracker = NumberingTracker(restart_numbering)

        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=1)  # a)
        tracker.get_number(num_id=1, ilvl=1)  # b)

        tracker.get_number(num_id=1, ilvl=0)  # 2.
        # lvlRestart=0 means restart on level 0 change
        assert tracker.get_number(num_id=1, ilvl=1) == "a)"

    def test_restart_respects_lvl_restart_value(self, restart_numbering: Numbering) -> None:
        """lvlRestart specifies which level triggers restart."""
        tracker = NumberingTracker(restart_numbering)

        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=1)  # a)
        tracker.get_number(num_id=1, ilvl=2)  # i.
        tracker.get_number(num_id=1, ilvl=2)  # ii.

        # Level 1 increments (lvlRestart=1 for level 2)
        tracker.get_number(num_id=1, ilvl=1)  # b)
        assert tracker.get_number(num_id=1, ilvl=2) == "i."


# =============================================================================
# Start Override Tests
# =============================================================================


class TestStartOverride:
    """Tests for startOverride in numbering instances."""

    def test_start_override_changes_start(self, override_numbering: Numbering) -> None:
        """startOverride changes the starting number."""
        tracker = NumberingTracker(override_numbering)

        # num_id=1 uses default start=1
        assert tracker.get_number(num_id=1, ilvl=0) == "1."

        # num_id=2 has startOverride=10
        assert tracker.get_number(num_id=2, ilvl=0) == "10."
        assert tracker.get_number(num_id=2, ilvl=0) == "11."

    def test_different_instances_independent(self, override_numbering: Numbering) -> None:
        """Different num instances maintain independent counters."""
        tracker = NumberingTracker(override_numbering)

        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=0)  # 2.
        tracker.get_number(num_id=2, ilvl=0)  # 10.

        # num_id=1 should continue from where it was
        assert tracker.get_number(num_id=1, ilvl=0) == "3."


# =============================================================================
# Multiple Lists Tests
# =============================================================================


class TestMultipleLists:
    """Tests for multiple independent lists."""

    def test_different_num_ids_independent(self, multiple_lists_numbering: Numbering) -> None:
        """Different numIds maintain independent counters."""
        tracker = NumberingTracker(multiple_lists_numbering)

        assert tracker.get_number(num_id=1, ilvl=0) == "1."
        assert tracker.get_number(num_id=2, ilvl=0) == "A."
        assert tracker.get_number(num_id=1, ilvl=0) == "2."
        assert tracker.get_number(num_id=2, ilvl=0) == "B."

    def test_same_abstract_different_num_independent(
        self, multiple_lists_numbering: Numbering
    ) -> None:
        """Same abstractNum but different numIds are independent."""
        tracker = NumberingTracker(multiple_lists_numbering)

        # num_id=1 and num_id=3 both use abstract_num_id=0
        assert tracker.get_number(num_id=1, ilvl=0) == "1."
        assert tracker.get_number(num_id=3, ilvl=0) == "1."
        assert tracker.get_number(num_id=1, ilvl=0) == "2."
        assert tracker.get_number(num_id=3, ilvl=0) == "2."


# =============================================================================
# Edge Cases Tests
# =============================================================================


class TestNumberingTrackerEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_invalid_num_id_returns_empty(self, simple_numbering: Numbering) -> None:
        """Invalid numId returns empty string."""
        tracker = NumberingTracker(simple_numbering)
        result = tracker.get_number(num_id=999, ilvl=0)
        assert result == ""

    def test_invalid_level_returns_empty(self, simple_numbering: Numbering) -> None:
        """Invalid level returns empty string."""
        tracker = NumberingTracker(simple_numbering)
        result = tracker.get_number(num_id=1, ilvl=9)
        assert result == ""

    def test_none_num_fmt_defaults_to_decimal(self) -> None:
        """Missing numFmt defaults to decimal."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=1, lvl_text="%1."),  # No numFmt
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "1."

    def test_none_start_defaults_to_1(self) -> None:
        """Missing start defaults to 1."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, num_fmt="decimal", lvl_text="%1."),  # No start
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "1."

    def test_none_lvl_text_uses_number_only(self) -> None:
        """Missing lvlText uses just the number."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=1, num_fmt="decimal"),  # No lvlText
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        result = tracker.get_number(num_id=1, ilvl=0)
        assert "1" in result

    def test_reset_counters(self, simple_numbering: Numbering) -> None:
        """Counters can be reset."""
        tracker = NumberingTracker(simple_numbering)
        tracker.get_number(num_id=1, ilvl=0)  # 1.
        tracker.get_number(num_id=1, ilvl=0)  # 2.

        tracker.reset()

        assert tracker.get_number(num_id=1, ilvl=0) == "1."

    def test_get_level_properties(self, simple_numbering: Numbering) -> None:
        """Can retrieve level properties for indentation etc."""
        tracker = NumberingTracker(simple_numbering)
        level = tracker.get_level(num_id=1, ilvl=0)

        assert level is not None
        assert level.num_fmt == "decimal"
        assert level.lvl_text == "%1."


# =============================================================================
# Roman Numeral Edge Cases
# =============================================================================


class TestRomanNumerals:
    """Tests for Roman numeral formatting edge cases."""

    def test_roman_1_to_10(self) -> None:
        """Test Roman numerals 1-10."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=1, num_fmt="lowerRoman", lvl_text="%1."),
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        expected = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."]
        for exp in expected:
            assert tracker.get_number(num_id=1, ilvl=0) == exp

    def test_roman_larger_numbers(self) -> None:
        """Test Roman numerals for larger numbers."""
        numbering = Numbering(
            abstract_num=[
                AbstractNumbering(
                    abstract_num_id=0,
                    lvl=[
                        Level(ilvl=0, start=50, num_fmt="upperRoman", lvl_text="%1."),
                    ],
                ),
            ],
            num=[NumberingInstance(num_id=1, abstract_num_id=0)],
        )
        tracker = NumberingTracker(numbering)
        assert tracker.get_number(num_id=1, ilvl=0) == "L."
        assert tracker.get_number(num_id=1, ilvl=0) == "LI."
