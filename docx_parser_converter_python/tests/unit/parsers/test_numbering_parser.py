"""Unit tests for numbering parsers.

Tests cover:
- Level definitions
- Abstract numbering definitions
- Level overrides
- Numbering instances
- Complete numbering parsing
"""

from parsers.numbering.abstract_numbering_parser import parse_abstract_numbering
from parsers.numbering.level_parser import parse_level
from parsers.numbering.numbering_instance_parser import (
    parse_level_override,
    parse_numbering_instance,
)
from parsers.numbering.numbering_parser import parse_numbering
from tests.unit.parsers.conftest import make_element

# =============================================================================
# Level Parser Tests (<w:lvl>)
# =============================================================================


class TestLevelParser:
    """Tests for parse_level function.

    XML Element: <w:lvl>
    Attributes: ilvl, tplc
    Children: start, numFmt, lvlRestart, pStyle, isLgl, suff, lvlText,
              lvlPicBulletId, lvlJc, pPr, rPr
    """

    def test_parse_level_none(self):
        """None input returns None."""
        result = parse_level(None)
        assert result is None

    def test_parse_level_no_ilvl(self):
        """Missing required ilvl returns None."""
        elem = make_element('<w:lvl><w:start w:val="1"/></w:lvl>')
        result = parse_level(elem)
        assert result is None

    def test_parse_level_minimal(self):
        """Parse minimal level with only ilvl."""
        elem = make_element('<w:lvl w:ilvl="0"/>')
        result = parse_level(elem)
        assert result is not None
        assert result.ilvl == 0

    def test_parse_level_decimal(self):
        """Parse decimal numbered level."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:start w:val="1"/>
                <w:numFmt w:val="decimal"/>
                <w:lvlText w:val="%1."/>
                <w:lvlJc w:val="left"/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.ilvl == 0
        assert result.start == 1
        assert result.num_fmt == "decimal"
        assert result.lvl_text == "%1."
        assert result.lvl_jc == "left"

    def test_parse_level_bullet(self):
        """Parse bullet level."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:numFmt w:val="bullet"/>
                <w:lvlText w:val=""/>
                <w:lvlJc w:val="left"/>
                <w:rPr>
                    <w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>
                </w:rPr>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.num_fmt == "bullet"
        assert result.r_pr is not None
        assert result.r_pr["r_fonts"]["ascii"] == "Symbol"

    def test_parse_level_num_formats(self):
        """Test various number format values."""
        num_fmts = [
            "decimal",
            "upperRoman",
            "lowerRoman",
            "upperLetter",
            "lowerLetter",
            "bullet",
            "none",
            "ordinal",
            "cardinalText",
        ]
        for num_fmt in num_fmts:
            elem = make_element(f'''
                <w:lvl w:ilvl="0">
                    <w:numFmt w:val="{num_fmt}"/>
                </w:lvl>
            ''')
            result = parse_level(elem)
            assert result is not None
            assert result.num_fmt == num_fmt

    def test_parse_level_with_indentation(self):
        """Parse level with paragraph indentation."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:numFmt w:val="decimal"/>
                <w:pPr>
                    <w:ind w:left="720" w:hanging="360"/>
                </w:pPr>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["left"] == 720
        assert result.p_pr["hanging"] == 360

    def test_parse_level_suffix(self):
        """Parse level suffix."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:suff w:val="tab"/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.suff == "tab"

    def test_parse_level_suffix_values(self):
        """Test all suffix values."""
        suffixes = ["tab", "space", "nothing"]
        for suff in suffixes:
            elem = make_element(f'''
                <w:lvl w:ilvl="0">
                    <w:suff w:val="{suff}"/>
                </w:lvl>
            ''')
            result = parse_level(elem)
            assert result is not None
            assert result.suff == suff

    def test_parse_level_justification(self):
        """Test level justification values."""
        justifications = ["left", "center", "right"]
        for jc in justifications:
            elem = make_element(f'''
                <w:lvl w:ilvl="0">
                    <w:lvlJc w:val="{jc}"/>
                </w:lvl>
            ''')
            result = parse_level(elem)
            assert result is not None
            assert result.lvl_jc == jc

    def test_parse_level_restart(self):
        """Parse level restart setting."""
        elem = make_element("""
            <w:lvl w:ilvl="1">
                <w:lvlRestart w:val="0"/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.lvl_restart == 0

    def test_parse_level_p_style(self):
        """Parse level with associated paragraph style."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:pStyle w:val="Heading1"/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.p_style == "Heading1"

    def test_parse_level_is_lgl(self):
        """Parse legal numbering style."""
        elem = make_element("""
            <w:lvl w:ilvl="0">
                <w:isLgl/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.is_lgl is True

    def test_parse_level_tplc(self):
        """Parse level template code."""
        elem = make_element('<w:lvl w:ilvl="0" w:tplc="04090001"/>')
        result = parse_level(elem)
        assert result is not None
        assert result.tplc == "04090001"

    def test_parse_level_multilevel_text(self):
        """Parse multilevel numbering text."""
        elem = make_element("""
            <w:lvl w:ilvl="2">
                <w:numFmt w:val="decimal"/>
                <w:lvlText w:val="%1.%2.%3"/>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.lvl_text == "%1.%2.%3"

    def test_parse_level_comprehensive(self):
        """Parse comprehensive level definition."""
        elem = make_element("""
            <w:lvl w:ilvl="0" w:tplc="04090001">
                <w:start w:val="1"/>
                <w:numFmt w:val="decimal"/>
                <w:lvlText w:val="%1."/>
                <w:lvlJc w:val="left"/>
                <w:suff w:val="tab"/>
                <w:pPr>
                    <w:ind w:left="720" w:hanging="360"/>
                </w:pPr>
                <w:rPr>
                    <w:b/>
                </w:rPr>
            </w:lvl>
        """)
        result = parse_level(elem)
        assert result is not None
        assert result.ilvl == 0
        assert result.tplc == "04090001"
        assert result.start == 1
        assert result.num_fmt == "decimal"
        assert result.lvl_text == "%1."
        assert result.lvl_jc == "left"
        assert result.suff == "tab"
        assert result.p_pr is not None
        assert result.p_pr["left"] == 720
        assert result.r_pr is not None
        assert result.r_pr["b"] is True


# =============================================================================
# Abstract Numbering Parser Tests (<w:abstractNum>)
# =============================================================================


class TestAbstractNumberingParser:
    """Tests for parse_abstract_numbering function.

    XML Element: <w:abstractNum>
    Attributes: abstractNumId
    Children: nsid, multiLevelType, tmpl, name, styleLink, numStyleLink, lvl
    """

    def test_parse_abstract_numbering_none(self):
        """None input returns None."""
        result = parse_abstract_numbering(None)
        assert result is None

    def test_parse_abstract_numbering_no_id(self):
        """Missing required abstractNumId returns None."""
        elem = make_element('<w:abstractNum><w:nsid w:val="00000001"/></w:abstractNum>')
        result = parse_abstract_numbering(elem)
        assert result is None

    def test_parse_abstract_numbering_minimal(self):
        """Parse minimal abstract numbering."""
        elem = make_element('<w:abstractNum w:abstractNumId="0"/>')
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.abstract_num_id == 0
        assert len(result.lvl) == 0

    def test_parse_abstract_numbering_with_nsid(self):
        """Parse abstract numbering with NSID."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:nsid w:val="12345678"/>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.nsid == "12345678"

    def test_parse_abstract_numbering_multi_level_type(self):
        """Parse abstract numbering with multi-level type."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:multiLevelType w:val="multilevel"/>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.multi_level_type == "multilevel"

    def test_parse_abstract_numbering_multi_level_types(self):
        """Test all multi-level type values."""
        types = ["singleLevel", "multilevel", "hybridMultilevel"]
        for mlt in types:
            elem = make_element(f'''
                <w:abstractNum w:abstractNumId="0">
                    <w:multiLevelType w:val="{mlt}"/>
                </w:abstractNum>
            ''')
            result = parse_abstract_numbering(elem)
            assert result is not None
            assert result.multi_level_type == mlt

    def test_parse_abstract_numbering_with_levels(self):
        """Parse abstract numbering with levels."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:multiLevelType w:val="hybridMultilevel"/>
                <w:lvl w:ilvl="0">
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1."/>
                </w:lvl>
                <w:lvl w:ilvl="1">
                    <w:numFmt w:val="lowerLetter"/>
                    <w:lvlText w:val="%2."/>
                </w:lvl>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert len(result.lvl) == 2
        assert result.lvl[0].num_fmt == "decimal"
        assert result.lvl[1].num_fmt == "lowerLetter"

    def test_parse_abstract_numbering_style_link(self):
        """Parse abstract numbering with style link."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:styleLink w:val="ListNumber"/>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.style_link == "ListNumber"

    def test_parse_abstract_numbering_name(self):
        """Parse abstract numbering with name."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:name w:val="MyList"/>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.name == "MyList"

    def test_parse_abstract_numbering_comprehensive(self):
        """Parse comprehensive abstract numbering."""
        elem = make_element("""
            <w:abstractNum w:abstractNumId="0">
                <w:nsid w:val="ABCD1234"/>
                <w:multiLevelType w:val="multilevel"/>
                <w:tmpl w:val="12345678"/>
                <w:name w:val="Legal Outline"/>
                <w:lvl w:ilvl="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1"/>
                    <w:lvlJc w:val="left"/>
                </w:lvl>
                <w:lvl w:ilvl="1">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1.%2"/>
                    <w:lvlJc w:val="left"/>
                </w:lvl>
            </w:abstractNum>
        """)
        result = parse_abstract_numbering(elem)
        assert result is not None
        assert result.abstract_num_id == 0
        assert result.nsid == "ABCD1234"
        assert result.multi_level_type == "multilevel"
        assert result.tmpl == "12345678"
        assert result.name == "Legal Outline"
        assert len(result.lvl) == 2


# =============================================================================
# Level Override Parser Tests (<w:lvlOverride>)
# =============================================================================


class TestLevelOverrideParser:
    """Tests for parse_level_override function.

    XML Element: <w:lvlOverride>
    Attributes: ilvl
    Children: startOverride, lvl
    """

    def test_parse_level_override_none(self):
        """None input returns None."""
        result = parse_level_override(None)
        assert result is None

    def test_parse_level_override_no_ilvl(self):
        """Missing required ilvl returns None."""
        elem = make_element('<w:lvlOverride><w:startOverride w:val="5"/></w:lvlOverride>')
        result = parse_level_override(elem)
        assert result is None

    def test_parse_level_override_start(self):
        """Parse level override with start override."""
        elem = make_element("""
            <w:lvlOverride w:ilvl="0">
                <w:startOverride w:val="5"/>
            </w:lvlOverride>
        """)
        result = parse_level_override(elem)
        assert result is not None
        assert result.ilvl == 0
        assert result.start_override == 5

    def test_parse_level_override_with_level(self):
        """Parse level override with full level replacement."""
        elem = make_element("""
            <w:lvlOverride w:ilvl="0">
                <w:lvl w:ilvl="0">
                    <w:numFmt w:val="upperRoman"/>
                    <w:lvlText w:val="%1."/>
                </w:lvl>
            </w:lvlOverride>
        """)
        result = parse_level_override(elem)
        assert result is not None
        assert result.ilvl == 0
        assert result.lvl is not None
        assert result.lvl.num_fmt == "upperRoman"


# =============================================================================
# Numbering Instance Parser Tests (<w:num>)
# =============================================================================


class TestNumberingInstanceParser:
    """Tests for parse_numbering_instance function.

    XML Element: <w:num>
    Attributes: numId
    Children: abstractNumId, lvlOverride
    """

    def test_parse_numbering_instance_none(self):
        """None input returns None."""
        result = parse_numbering_instance(None)
        assert result is None

    def test_parse_numbering_instance_no_num_id(self):
        """Missing required numId returns None."""
        elem = make_element('<w:num><w:abstractNumId w:val="0"/></w:num>')
        result = parse_numbering_instance(elem)
        assert result is None

    def test_parse_numbering_instance_minimal(self):
        """Parse minimal numbering instance."""
        elem = make_element("""
            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
            </w:num>
        """)
        result = parse_numbering_instance(elem)
        assert result is not None
        assert result.num_id == 1
        assert result.abstract_num_id == 0

    def test_parse_numbering_instance_with_override(self):
        """Parse numbering instance with level override."""
        elem = make_element("""
            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
                <w:lvlOverride w:ilvl="0">
                    <w:startOverride w:val="10"/>
                </w:lvlOverride>
            </w:num>
        """)
        result = parse_numbering_instance(elem)
        assert result is not None
        assert result.num_id == 1
        assert result.lvl_override is not None
        assert len(result.lvl_override) == 1
        assert result.lvl_override[0].start_override == 10

    def test_parse_numbering_instance_multiple_overrides(self):
        """Parse numbering instance with multiple level overrides."""
        elem = make_element("""
            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
                <w:lvlOverride w:ilvl="0">
                    <w:startOverride w:val="5"/>
                </w:lvlOverride>
                <w:lvlOverride w:ilvl="1">
                    <w:startOverride w:val="1"/>
                </w:lvlOverride>
            </w:num>
        """)
        result = parse_numbering_instance(elem)
        assert result is not None
        assert result.lvl_override is not None
        assert len(result.lvl_override) == 2


# =============================================================================
# Numbering Parser Tests (<w:numbering>)
# =============================================================================


class TestNumberingParser:
    """Tests for parse_numbering function.

    XML Element: <w:numbering>
    Children: abstractNum, num
    """

    def test_parse_numbering_none(self):
        """None input returns None."""
        result = parse_numbering(None)
        assert result is None

    def test_parse_numbering_empty(self):
        """Parse empty numbering."""
        elem = make_element("<w:numbering/>")
        result = parse_numbering(elem)
        assert result is not None
        assert len(result.abstract_num) == 0
        assert len(result.num) == 0

    def test_parse_numbering_with_abstract_num(self):
        """Parse numbering with abstract numbering."""
        elem = make_element("""
            <w:numbering>
                <w:abstractNum w:abstractNumId="0">
                    <w:multiLevelType w:val="hybridMultilevel"/>
                    <w:lvl w:ilvl="0">
                        <w:numFmt w:val="bullet"/>
                    </w:lvl>
                </w:abstractNum>
            </w:numbering>
        """)
        result = parse_numbering(elem)
        assert result is not None
        assert len(result.abstract_num) == 1
        assert result.abstract_num[0].abstract_num_id == 0

    def test_parse_numbering_with_num(self):
        """Parse numbering with numbering instance."""
        elem = make_element("""
            <w:numbering>
                <w:abstractNum w:abstractNumId="0">
                    <w:lvl w:ilvl="0">
                        <w:numFmt w:val="decimal"/>
                    </w:lvl>
                </w:abstractNum>
                <w:num w:numId="1">
                    <w:abstractNumId w:val="0"/>
                </w:num>
            </w:numbering>
        """)
        result = parse_numbering(elem)
        assert result is not None
        assert len(result.abstract_num) == 1
        assert len(result.num) == 1
        assert result.num[0].abstract_num_id == 0

    def test_parse_numbering_comprehensive(self):
        """Parse comprehensive numbering with multiple definitions."""
        elem = make_element("""
            <w:numbering>
                <w:abstractNum w:abstractNumId="0">
                    <w:multiLevelType w:val="hybridMultilevel"/>
                    <w:lvl w:ilvl="0">
                        <w:numFmt w:val="bullet"/>
                        <w:lvlText w:val=""/>
                    </w:lvl>
                </w:abstractNum>
                <w:abstractNum w:abstractNumId="1">
                    <w:multiLevelType w:val="multilevel"/>
                    <w:lvl w:ilvl="0">
                        <w:numFmt w:val="decimal"/>
                        <w:lvlText w:val="%1."/>
                    </w:lvl>
                    <w:lvl w:ilvl="1">
                        <w:numFmt w:val="decimal"/>
                        <w:lvlText w:val="%1.%2"/>
                    </w:lvl>
                </w:abstractNum>
                <w:num w:numId="1">
                    <w:abstractNumId w:val="0"/>
                </w:num>
                <w:num w:numId="2">
                    <w:abstractNumId w:val="1"/>
                </w:num>
                <w:num w:numId="3">
                    <w:abstractNumId w:val="1"/>
                    <w:lvlOverride w:ilvl="0">
                        <w:startOverride w:val="5"/>
                    </w:lvlOverride>
                </w:num>
            </w:numbering>
        """)
        result = parse_numbering(elem)
        assert result is not None
        assert len(result.abstract_num) == 2
        assert len(result.num) == 3
        assert result.num[2].lvl_override is not None
        assert result.num[2].lvl_override[0].start_override == 5
