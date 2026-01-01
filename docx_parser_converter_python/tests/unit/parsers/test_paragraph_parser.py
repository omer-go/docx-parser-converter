"""Unit tests for paragraph parsers.

Tests cover:
- Tab stops
- Numbering properties
- Paragraph properties (alignment, spacing, indentation, borders, etc.)
- Complete paragraph parsing
"""

from models.document.run import Run
from parsers.document.paragraph_parser import parse_paragraph
from parsers.document.paragraph_properties_parser import (
    parse_numbering_properties,
    parse_paragraph_properties,
    parse_tab_stop,
)
from tests.unit.parsers.conftest import make_element

# =============================================================================
# Tab Stop Parser Tests (<w:tab> in <w:tabs>)
# =============================================================================


class TestTabStopParser:
    """Tests for parse_tab_stop function.

    XML Element: <w:tab>
    Attributes: val, pos, leader
    """

    def test_parse_tab_stop_none(self):
        """None input returns None."""
        result = parse_tab_stop(None)
        assert result is None

    def test_parse_tab_stop_left(self):
        """Parse left-aligned tab stop."""
        elem = make_element('<w:tab w:val="left" w:pos="720"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "left"
        assert result.pos == 720

    def test_parse_tab_stop_center(self):
        """Parse center-aligned tab stop."""
        elem = make_element('<w:tab w:val="center" w:pos="4680"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "center"
        assert result.pos == 4680

    def test_parse_tab_stop_right(self):
        """Parse right-aligned tab stop."""
        elem = make_element('<w:tab w:val="right" w:pos="9360"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "right"

    def test_parse_tab_stop_decimal(self):
        """Parse decimal tab stop."""
        elem = make_element('<w:tab w:val="decimal" w:pos="5040"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "decimal"

    def test_parse_tab_stop_with_leader(self):
        """Parse tab stop with leader."""
        elem = make_element('<w:tab w:val="right" w:pos="9360" w:leader="dot"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "right"
        assert result.leader == "dot"

    def test_parse_tab_stop_leader_values(self):
        """Test all leader values."""
        leaders = ["none", "dot", "hyphen", "underscore", "heavy", "middleDot"]
        for leader in leaders:
            elem = make_element(f'<w:tab w:val="right" w:pos="9360" w:leader="{leader}"/>')
            result = parse_tab_stop(elem)
            assert result is not None
            assert result.leader == leader

    def test_parse_tab_stop_types(self):
        """Test all tab stop types."""
        types = ["left", "center", "right", "decimal", "bar", "clear", "num"]
        for ttype in types:
            elem = make_element(f'<w:tab w:val="{ttype}" w:pos="720"/>')
            result = parse_tab_stop(elem)
            assert result is not None
            assert result.val == ttype

    def test_parse_tab_stop_clear(self):
        """Parse clear tab stop (removes inherited tab)."""
        elem = make_element('<w:tab w:val="clear" w:pos="720"/>')
        result = parse_tab_stop(elem)
        assert result is not None
        assert result.val == "clear"


# =============================================================================
# Numbering Properties Parser Tests (<w:numPr>)
# =============================================================================


class TestNumberingPropertiesParser:
    """Tests for parse_numbering_properties function.

    XML Element: <w:numPr>
    Children: ilvl, numId
    """

    def test_parse_numbering_properties_none(self):
        """None input returns None."""
        result = parse_numbering_properties(None)
        assert result is None

    def test_parse_numbering_properties_basic(self):
        """Parse basic numbering properties."""
        elem = make_element("""
            <w:numPr>
                <w:ilvl w:val="0"/>
                <w:numId w:val="1"/>
            </w:numPr>
        """)
        result = parse_numbering_properties(elem)
        assert result is not None
        assert result.ilvl == 0
        assert result.num_id == 1

    def test_parse_numbering_properties_level_2(self):
        """Parse numbering at level 2."""
        elem = make_element("""
            <w:numPr>
                <w:ilvl w:val="2"/>
                <w:numId w:val="5"/>
            </w:numPr>
        """)
        result = parse_numbering_properties(elem)
        assert result is not None
        assert result.ilvl == 2
        assert result.num_id == 5

    def test_parse_numbering_properties_empty(self):
        """Parse empty numbering properties."""
        elem = make_element("<w:numPr/>")
        result = parse_numbering_properties(elem)
        assert result is not None
        assert result.ilvl is None
        assert result.num_id is None

    def test_parse_numbering_properties_only_ilvl(self):
        """Parse with only ilvl (unusual but valid)."""
        elem = make_element("""
            <w:numPr>
                <w:ilvl w:val="1"/>
            </w:numPr>
        """)
        result = parse_numbering_properties(elem)
        assert result is not None
        assert result.ilvl == 1
        assert result.num_id is None


# =============================================================================
# Paragraph Properties Parser Tests (<w:pPr>)
# =============================================================================


class TestParagraphPropertiesParser:
    """Tests for parse_paragraph_properties function.

    XML Element: <w:pPr>
    Children: pStyle, keepNext, keepLines, pageBreakBefore, widowControl,
              suppressLineNumbers, pBdr, shd, tabs, suppressAutoHyphens,
              spacing, ind, jc, outlineLvl, numPr, bidi, rPr,
              textDirection, textAlignment, framePr
    """

    def test_parse_paragraph_properties_none(self):
        """None input returns None."""
        result = parse_paragraph_properties(None)
        assert result is None

    def test_parse_paragraph_properties_empty(self):
        """Parse empty pPr element."""
        elem = make_element("<w:pPr/>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.p_style is None
        assert result.jc is None

    def test_parse_paragraph_properties_style(self):
        """Parse paragraph with style reference."""
        elem = make_element('<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.p_style == "Heading1"

    def test_parse_paragraph_properties_justification(self):
        """Parse paragraph justification."""
        elem = make_element('<w:pPr><w:jc w:val="center"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.jc == "center"

    def test_parse_paragraph_properties_justification_values(self):
        """Test all justification values."""
        alignments = ["left", "center", "right", "both", "distribute", "start", "end"]
        for jc in alignments:
            elem = make_element(f'<w:pPr><w:jc w:val="{jc}"/></w:pPr>')
            result = parse_paragraph_properties(elem)
            assert result is not None
            assert result.jc == jc

    def test_parse_paragraph_properties_keep_next(self):
        """Parse keep with next paragraph."""
        elem = make_element("<w:pPr><w:keepNext/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.keep_next is True

    def test_parse_paragraph_properties_keep_lines(self):
        """Parse keep lines together."""
        elem = make_element("<w:pPr><w:keepLines/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.keep_lines is True

    def test_parse_paragraph_properties_page_break_before(self):
        """Parse page break before."""
        elem = make_element("<w:pPr><w:pageBreakBefore/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.page_break_before is True

    def test_parse_paragraph_properties_widow_control(self):
        """Parse widow control."""
        elem = make_element("<w:pPr><w:widowControl/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.widow_control is True

    def test_parse_paragraph_properties_widow_control_off(self):
        """Parse widow control explicitly off."""
        elem = make_element('<w:pPr><w:widowControl w:val="0"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.widow_control is False

    def test_parse_paragraph_properties_suppress_line_numbers(self):
        """Parse suppress line numbers."""
        elem = make_element("<w:pPr><w:suppressLineNumbers/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.suppress_line_numbers is True

    def test_parse_paragraph_properties_suppress_auto_hyphens(self):
        """Parse suppress auto hyphens."""
        elem = make_element("<w:pPr><w:suppressAutoHyphens/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.suppress_auto_hyphens is True

    def test_parse_paragraph_properties_bidi(self):
        """Parse right-to-left paragraph."""
        elem = make_element("<w:pPr><w:bidi/></w:pPr>")
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.bidi is True

    def test_parse_paragraph_properties_outline_level(self):
        """Parse outline level (for headings)."""
        elem = make_element('<w:pPr><w:outlineLvl w:val="0"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.outline_lvl == 0

    def test_parse_paragraph_properties_outline_levels(self):
        """Test outline levels 0-9."""
        for level in range(10):
            elem = make_element(f'<w:pPr><w:outlineLvl w:val="{level}"/></w:pPr>')
            result = parse_paragraph_properties(elem)
            assert result is not None
            assert result.outline_lvl == level

    def test_parse_paragraph_properties_spacing(self):
        """Parse paragraph spacing."""
        elem = make_element("""
            <w:pPr>
                <w:spacing w:before="240" w:after="120" w:line="276" w:lineRule="auto"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.spacing is not None
        assert result.spacing.before == 240
        assert result.spacing.after == 120
        assert result.spacing.line == 276
        assert result.spacing.line_rule == "auto"

    def test_parse_paragraph_properties_indentation(self):
        """Parse paragraph indentation."""
        elem = make_element("""
            <w:pPr>
                <w:ind w:left="720" w:right="360" w:firstLine="360"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.ind is not None
        assert result.ind.left == 720
        assert result.ind.right == 360
        assert result.ind.first_line == 360

    def test_parse_paragraph_properties_hanging_indent(self):
        """Parse hanging indent."""
        elem = make_element("""
            <w:pPr>
                <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.ind is not None
        assert result.ind.hanging == 360

    def test_parse_paragraph_properties_borders(self):
        """Parse paragraph borders."""
        elem = make_element("""
            <w:pPr>
                <w:pBdr>
                    <w:top w:val="single" w:sz="4" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:color="000000"/>
                </w:pBdr>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.p_bdr is not None
        assert result.p_bdr.top is not None
        assert result.p_bdr.bottom is not None

    def test_parse_paragraph_properties_shading(self):
        """Parse paragraph shading."""
        elem = make_element("""
            <w:pPr>
                <w:shd w:val="clear" w:fill="FFFF00"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.shd is not None
        assert result.shd.fill == "FFFF00"

    def test_parse_paragraph_properties_tabs(self):
        """Parse tab stops."""
        elem = make_element("""
            <w:pPr>
                <w:tabs>
                    <w:tab w:val="left" w:pos="720"/>
                    <w:tab w:val="center" w:pos="4680"/>
                    <w:tab w:val="right" w:pos="9360" w:leader="dot"/>
                </w:tabs>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.tabs is not None
        assert len(result.tabs) == 3
        assert result.tabs[0].val == "left"
        assert result.tabs[1].val == "center"
        assert result.tabs[2].leader == "dot"

    def test_parse_paragraph_properties_numbering(self):
        """Parse numbering properties."""
        elem = make_element("""
            <w:pPr>
                <w:numPr>
                    <w:ilvl w:val="0"/>
                    <w:numId w:val="1"/>
                </w:numPr>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.num_pr is not None
        assert result.num_pr.ilvl == 0
        assert result.num_pr.num_id == 1

    def test_parse_paragraph_properties_text_direction(self):
        """Parse text direction."""
        elem = make_element('<w:pPr><w:textDirection w:val="tbRl"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.text_direction == "tbRl"

    def test_parse_paragraph_properties_text_direction_values(self):
        """Test all text direction values."""
        directions = ["lrTb", "tbRl", "btLr", "lrTbV", "tbRlV", "tbLrV"]
        for direction in directions:
            elem = make_element(f'<w:pPr><w:textDirection w:val="{direction}"/></w:pPr>')
            result = parse_paragraph_properties(elem)
            assert result is not None
            assert result.text_direction == direction

    def test_parse_paragraph_properties_text_alignment(self):
        """Parse vertical text alignment."""
        elem = make_element('<w:pPr><w:textAlignment w:val="center"/></w:pPr>')
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.text_alignment == "center"

    def test_parse_paragraph_properties_frame(self):
        """Parse frame properties."""
        elem = make_element("""
            <w:pPr>
                <w:framePr w:w="5040" w:h="2880" w:wrap="around"
                           w:hAnchor="margin" w:vAnchor="text"
                           w:x="720" w:y="360"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.frame_pr is not None
        assert result.frame_pr["w"] == 5040
        assert result.frame_pr["h"] == 2880
        assert result.frame_pr["wrap"] == "around"

    def test_parse_paragraph_properties_drop_cap(self):
        """Parse drop cap frame."""
        elem = make_element("""
            <w:pPr>
                <w:framePr w:dropCap="drop" w:lines="3"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.frame_pr is not None
        assert result.frame_pr["drop_cap"] == "drop"
        assert result.frame_pr["lines"] == 3

    def test_parse_paragraph_properties_default_run_props(self):
        """Parse default run properties for paragraph."""
        elem = make_element("""
            <w:pPr>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="28"/>
                </w:rPr>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr["b"] is True
        assert result.r_pr["sz"] == 28

    def test_parse_paragraph_properties_comprehensive(self):
        """Parse comprehensive paragraph properties."""
        elem = make_element("""
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:keepNext/>
                <w:keepLines/>
                <w:jc w:val="center"/>
                <w:spacing w:before="240" w:after="120"/>
                <w:ind w:left="720"/>
                <w:outlineLvl w:val="0"/>
                <w:shd w:val="clear" w:fill="E0E0E0"/>
            </w:pPr>
        """)
        result = parse_paragraph_properties(elem)
        assert result is not None
        assert result.p_style == "Heading1"
        assert result.keep_next is True
        assert result.keep_lines is True
        assert result.jc == "center"
        assert result.spacing is not None
        assert result.spacing.before == 240
        assert result.ind is not None
        assert result.ind.left == 720
        assert result.outline_lvl == 0
        assert result.shd is not None
        assert result.shd.fill == "E0E0E0"


# =============================================================================
# Paragraph Parser Tests (<w:p>)
# =============================================================================


class TestParagraphParser:
    """Tests for parse_paragraph function.

    XML Element: <w:p>
    Children: pPr, r, hyperlink, bookmarkStart, bookmarkEnd
    """

    def test_parse_paragraph_none(self):
        """None input returns None."""
        result = parse_paragraph(None)
        assert result is None

    def test_parse_paragraph_empty(self):
        """Parse empty paragraph."""
        elem = make_element("<w:p/>")
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is None
        assert len(result.content) == 0

    def test_parse_paragraph_simple_text(self):
        """Parse paragraph with simple text."""
        elem = make_element("""
            <w:p>
                <w:r>
                    <w:t>Hello World</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert len(result.content) == 1
        assert isinstance(result.content[0], Run)
        assert result.content[0].content[0].value == "Hello World"

    def test_parse_paragraph_with_properties(self):
        """Parse paragraph with properties."""
        elem = make_element("""
            <w:p>
                <w:pPr>
                    <w:jc w:val="center"/>
                </w:pPr>
                <w:r>
                    <w:t>Centered text</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.jc == "center"
        assert len(result.content) == 1

    def test_parse_paragraph_multiple_runs(self):
        """Parse paragraph with multiple runs."""
        elem = make_element("""
            <w:p>
                <w:r>
                    <w:t>First </w:t>
                </w:r>
                <w:r>
                    <w:rPr><w:b/></w:rPr>
                    <w:t>bold</w:t>
                </w:r>
                <w:r>
                    <w:t> third</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert len(result.content) == 3
        assert result.content[0].content[0].value == "First "
        assert result.content[1].r_pr.b is True
        assert result.content[1].content[0].value == "bold"

    def test_parse_paragraph_properties_only(self):
        """Parse paragraph with only properties (no content)."""
        elem = make_element("""
            <w:p>
                <w:pPr>
                    <w:pStyle w:val="Normal"/>
                </w:pPr>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.p_style == "Normal"
        assert len(result.content) == 0

    def test_parse_paragraph_heading(self):
        """Parse heading paragraph."""
        elem = make_element("""
            <w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading1"/>
                    <w:outlineLvl w:val="0"/>
                </w:pPr>
                <w:r>
                    <w:t>Chapter 1</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.p_style == "Heading1"
        assert result.p_pr.outline_lvl == 0

    def test_parse_paragraph_list_item(self):
        """Parse list item paragraph."""
        elem = make_element("""
            <w:p>
                <w:pPr>
                    <w:numPr>
                        <w:ilvl w:val="0"/>
                        <w:numId w:val="1"/>
                    </w:numPr>
                </w:pPr>
                <w:r>
                    <w:t>List item</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.num_pr is not None
        assert result.p_pr.num_pr.ilvl == 0
        assert result.p_pr.num_pr.num_id == 1

    def test_parse_paragraph_with_formatting(self):
        """Parse paragraph with mixed formatting."""
        elem = make_element("""
            <w:p>
                <w:pPr>
                    <w:jc w:val="both"/>
                    <w:spacing w:before="120" w:after="120"/>
                </w:pPr>
                <w:r>
                    <w:t>Normal </w:t>
                </w:r>
                <w:r>
                    <w:rPr><w:i/></w:rPr>
                    <w:t>italic</w:t>
                </w:r>
                <w:r>
                    <w:t> and </w:t>
                </w:r>
                <w:r>
                    <w:rPr><w:b/></w:rPr>
                    <w:t>bold</w:t>
                </w:r>
            </w:p>
        """)
        result = parse_paragraph(elem)
        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.jc == "both"
        assert len(result.content) == 4
        assert result.content[1].r_pr is not None
        assert result.content[1].r_pr.i is True
        assert result.content[3].r_pr is not None
        assert result.content[3].r_pr.b is True
