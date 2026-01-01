"""Unit tests for run parsers (run content, run properties, run).

Tests cover:
- Run content elements: text, break, tab, symbols, fields
- Run properties: fonts, formatting, effects
- Complete run parsing
"""

from models.document.run_content import (
    Break,
    CarriageReturn,
    NoBreakHyphen,
    SoftHyphen,
    TabChar,
    Text,
)
from parsers.document.run_content_parser import (
    parse_break,
    parse_carriage_return,
    parse_endnote_reference,
    parse_field_char,
    parse_footnote_reference,
    parse_instr_text,
    parse_no_break_hyphen,
    parse_run_content_item,
    parse_soft_hyphen,
    parse_symbol,
    parse_tab_char,
    parse_text,
)
from parsers.document.run_parser import parse_run
from parsers.document.run_properties_parser import (
    parse_language,
    parse_run_fonts,
    parse_run_properties,
    parse_underline,
)
from tests.unit.parsers.conftest import make_element

# =============================================================================
# Text Parser Tests (<w:t>)
# =============================================================================


class TestTextParser:
    """Tests for parse_text function.

    XML Element: <w:t>
    Attributes: xml:space
    """

    def test_parse_text_none(self):
        """None input returns None."""
        result = parse_text(None)
        assert result is None

    def test_parse_text_simple(self):
        """Parse simple text content."""
        elem = make_element("<w:t>Hello World</w:t>")
        result = parse_text(elem)
        assert result is not None
        assert result.value == "Hello World"
        assert result.space is None

    def test_parse_text_empty(self):
        """Parse empty text element."""
        elem = make_element("<w:t></w:t>")
        result = parse_text(elem)
        assert result is not None
        assert result.value == ""

    def test_parse_text_preserve_space(self):
        """Parse text with xml:space='preserve'."""
        elem = make_element('<w:t xml:space="preserve">  spaces  </w:t>')
        result = parse_text(elem)
        assert result is not None
        assert result.value == "  spaces  "
        assert result.space == "preserve"

    def test_parse_text_special_characters(self):
        """Parse text with special characters."""
        elem = make_element("<w:t>Text &amp; more &lt;text&gt;</w:t>")
        result = parse_text(elem)
        assert result is not None
        assert result.value == "Text & more <text>"


# =============================================================================
# Break Parser Tests (<w:br>)
# =============================================================================


class TestBreakParser:
    """Tests for parse_break function.

    XML Element: <w:br>
    Attributes: type, clear
    """

    def test_parse_break_none(self):
        """None input returns None."""
        result = parse_break(None)
        assert result is None

    def test_parse_break_line(self):
        """Parse line break (no type attribute)."""
        elem = make_element("<w:br/>")
        result = parse_break(elem)
        assert result is not None
        assert result.type is None
        assert result.clear is None

    def test_parse_break_page(self):
        """Parse page break."""
        elem = make_element('<w:br w:type="page"/>')
        result = parse_break(elem)
        assert result is not None
        assert result.type == "page"

    def test_parse_break_column(self):
        """Parse column break."""
        elem = make_element('<w:br w:type="column"/>')
        result = parse_break(elem)
        assert result is not None
        assert result.type == "column"

    def test_parse_break_text_wrapping(self):
        """Parse text wrapping break with clear."""
        elem = make_element('<w:br w:type="textWrapping" w:clear="all"/>')
        result = parse_break(elem)
        assert result is not None
        assert result.type == "textWrapping"
        assert result.clear == "all"

    def test_parse_break_clear_values(self):
        """Test all clear attribute values."""
        clear_values = ["none", "left", "right", "all"]
        for clear in clear_values:
            elem = make_element(f'<w:br w:type="textWrapping" w:clear="{clear}"/>')
            result = parse_break(elem)
            assert result is not None
            assert result.clear == clear


# =============================================================================
# Tab/CR/Hyphen Parser Tests
# =============================================================================


class TestTabCharParser:
    """Tests for parse_tab_char function."""

    def test_parse_tab_char_none(self):
        """None input returns None."""
        result = parse_tab_char(None)
        assert result is None

    def test_parse_tab_char(self):
        """Parse tab character."""
        elem = make_element("<w:tab/>")
        result = parse_tab_char(elem)
        assert result is not None
        assert isinstance(result, TabChar)


class TestCarriageReturnParser:
    """Tests for parse_carriage_return function."""

    def test_parse_cr_none(self):
        """None input returns None."""
        result = parse_carriage_return(None)
        assert result is None

    def test_parse_cr(self):
        """Parse carriage return."""
        elem = make_element("<w:cr/>")
        result = parse_carriage_return(elem)
        assert result is not None
        assert isinstance(result, CarriageReturn)


class TestSoftHyphenParser:
    """Tests for parse_soft_hyphen function."""

    def test_parse_soft_hyphen_none(self):
        """None input returns None."""
        result = parse_soft_hyphen(None)
        assert result is None

    def test_parse_soft_hyphen(self):
        """Parse soft hyphen."""
        elem = make_element("<w:softHyphen/>")
        result = parse_soft_hyphen(elem)
        assert result is not None
        assert isinstance(result, SoftHyphen)


class TestNoBreakHyphenParser:
    """Tests for parse_no_break_hyphen function."""

    def test_parse_no_break_hyphen_none(self):
        """None input returns None."""
        result = parse_no_break_hyphen(None)
        assert result is None

    def test_parse_no_break_hyphen(self):
        """Parse no-break hyphen."""
        elem = make_element("<w:noBreakHyphen/>")
        result = parse_no_break_hyphen(elem)
        assert result is not None
        assert isinstance(result, NoBreakHyphen)


# =============================================================================
# Symbol Parser Tests (<w:sym>)
# =============================================================================


class TestSymbolParser:
    """Tests for parse_symbol function.

    XML Element: <w:sym>
    Attributes: font, char
    """

    def test_parse_symbol_none(self):
        """None input returns None."""
        result = parse_symbol(None)
        assert result is None

    def test_parse_symbol(self):
        """Parse symbol element."""
        elem = make_element('<w:sym w:font="Wingdings" w:char="F0FC"/>')
        result = parse_symbol(elem)
        assert result is not None
        assert result.font == "Wingdings"
        assert result.char == "F0FC"

    def test_parse_symbol_symbol_font(self):
        """Parse symbol with Symbol font."""
        elem = make_element('<w:sym w:font="Symbol" w:char="F0B7"/>')
        result = parse_symbol(elem)
        assert result is not None
        assert result.font == "Symbol"


# =============================================================================
# Field Character Parser Tests (<w:fldChar>)
# =============================================================================


class TestFieldCharParser:
    """Tests for parse_field_char function.

    XML Element: <w:fldChar>
    Attributes: fldCharType, dirty
    """

    def test_parse_field_char_none(self):
        """None input returns None."""
        result = parse_field_char(None)
        assert result is None

    def test_parse_field_char_begin(self):
        """Parse field begin character."""
        elem = make_element('<w:fldChar w:fldCharType="begin"/>')
        result = parse_field_char(elem)
        assert result is not None
        assert result.fld_char_type == "begin"

    def test_parse_field_char_separate(self):
        """Parse field separate character."""
        elem = make_element('<w:fldChar w:fldCharType="separate"/>')
        result = parse_field_char(elem)
        assert result is not None
        assert result.fld_char_type == "separate"

    def test_parse_field_char_end(self):
        """Parse field end character."""
        elem = make_element('<w:fldChar w:fldCharType="end"/>')
        result = parse_field_char(elem)
        assert result is not None
        assert result.fld_char_type == "end"

    def test_parse_field_char_dirty(self):
        """Parse field with dirty flag."""
        elem = make_element('<w:fldChar w:fldCharType="begin" w:dirty="1"/>')
        result = parse_field_char(elem)
        assert result is not None
        assert result.dirty is True


# =============================================================================
# Instruction Text Parser Tests (<w:instrText>)
# =============================================================================


class TestInstrTextParser:
    """Tests for parse_instr_text function.

    XML Element: <w:instrText>
    Attributes: xml:space
    """

    def test_parse_instr_text_none(self):
        """None input returns None."""
        result = parse_instr_text(None)
        assert result is None

    def test_parse_instr_text_page(self):
        """Parse PAGE field instruction."""
        elem = make_element('<w:instrText xml:space="preserve"> PAGE </w:instrText>')
        result = parse_instr_text(elem)
        assert result is not None
        assert result.value == " PAGE "
        assert result.space == "preserve"

    def test_parse_instr_text_hyperlink(self):
        """Parse HYPERLINK field instruction."""
        elem = make_element('<w:instrText>HYPERLINK "http://example.com"</w:instrText>')
        result = parse_instr_text(elem)
        assert result is not None
        assert "HYPERLINK" in result.value


# =============================================================================
# Footnote/Endnote Reference Parser Tests
# =============================================================================


class TestFootnoteReferenceParser:
    """Tests for parse_footnote_reference function."""

    def test_parse_footnote_reference_none(self):
        """None input returns None."""
        result = parse_footnote_reference(None)
        assert result is None

    def test_parse_footnote_reference(self):
        """Parse footnote reference."""
        elem = make_element('<w:footnoteReference w:id="1"/>')
        result = parse_footnote_reference(elem)
        assert result is not None
        assert result.id == 1


class TestEndnoteReferenceParser:
    """Tests for parse_endnote_reference function."""

    def test_parse_endnote_reference_none(self):
        """None input returns None."""
        result = parse_endnote_reference(None)
        assert result is None

    def test_parse_endnote_reference(self):
        """Parse endnote reference."""
        elem = make_element('<w:endnoteReference w:id="2"/>')
        result = parse_endnote_reference(elem)
        assert result is not None
        assert result.id == 2


# =============================================================================
# Run Content Item Parser Tests (Dispatcher)
# =============================================================================


class TestRunContentItemParser:
    """Tests for parse_run_content_item function."""

    def test_parse_run_content_item_none(self):
        """None input returns None."""
        result = parse_run_content_item(None)
        assert result is None

    def test_parse_run_content_item_text(self):
        """Dispatch to text parser."""
        elem = make_element("<w:t>Hello</w:t>")
        result = parse_run_content_item(elem)
        assert result is not None
        assert isinstance(result, Text)

    def test_parse_run_content_item_break(self):
        """Dispatch to break parser."""
        elem = make_element("<w:br/>")
        result = parse_run_content_item(elem)
        assert result is not None
        assert isinstance(result, Break)

    def test_parse_run_content_item_unknown(self):
        """Unknown element returns None."""
        elem = make_element("<w:unknown/>")
        result = parse_run_content_item(elem)
        assert result is None


# =============================================================================
# Run Fonts Parser Tests (<w:rFonts>)
# =============================================================================


class TestRunFontsParser:
    """Tests for parse_run_fonts function.

    XML Element: <w:rFonts>
    Attributes: ascii, hAnsi, eastAsia, cs, hint
    """

    def test_parse_run_fonts_none(self):
        """None input returns None."""
        result = parse_run_fonts(None)
        assert result is None

    def test_parse_run_fonts_ascii(self):
        """Parse fonts with ascii only."""
        elem = make_element('<w:rFonts w:ascii="Arial"/>')
        result = parse_run_fonts(elem)
        assert result is not None
        assert result.ascii == "Arial"

    def test_parse_run_fonts_all(self):
        """Parse fonts with all attributes."""
        elem = make_element(
            '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="SimSun" '
            'w:cs="Arial" w:hint="eastAsia"/>'
        )
        result = parse_run_fonts(elem)
        assert result is not None
        assert result.ascii == "Arial"
        assert result.h_ansi == "Arial"
        assert result.east_asia == "SimSun"
        assert result.cs == "Arial"
        assert result.hint == "eastAsia"

    def test_parse_run_fonts_hint_values(self):
        """Test all hint values."""
        hints = ["default", "eastAsia", "cs", "ascii", "hAnsi"]
        for hint in hints:
            elem = make_element(f'<w:rFonts w:hint="{hint}"/>')
            result = parse_run_fonts(elem)
            assert result is not None
            assert result.hint == hint


# =============================================================================
# Language Parser Tests (<w:lang>)
# =============================================================================


class TestLanguageParser:
    """Tests for parse_language function.

    XML Element: <w:lang>
    Attributes: val, eastAsia, bidi
    """

    def test_parse_language_none(self):
        """None input returns None."""
        result = parse_language(None)
        assert result is None

    def test_parse_language_val(self):
        """Parse language with val only."""
        elem = make_element('<w:lang w:val="en-US"/>')
        result = parse_language(elem)
        assert result is not None
        assert result.val == "en-US"

    def test_parse_language_all(self):
        """Parse language with all attributes."""
        elem = make_element('<w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/>')
        result = parse_language(elem)
        assert result is not None
        assert result.val == "en-US"
        assert result.east_asia == "zh-CN"
        assert result.bidi == "ar-SA"


# =============================================================================
# Underline Parser Tests (<w:u>)
# =============================================================================


class TestUnderlineParser:
    """Tests for parse_underline function.

    XML Element: <w:u>
    Attributes: val, color, themeColor
    """

    def test_parse_underline_none(self):
        """None input returns None."""
        result = parse_underline(None)
        assert result is None

    def test_parse_underline_single(self):
        """Parse single underline."""
        elem = make_element('<w:u w:val="single"/>')
        result = parse_underline(elem)
        assert result is not None
        assert result.val == "single"

    def test_parse_underline_with_color(self):
        """Parse underline with color."""
        elem = make_element('<w:u w:val="single" w:color="FF0000"/>')
        result = parse_underline(elem)
        assert result is not None
        assert result.val == "single"
        assert result.color == "FF0000"

    def test_parse_underline_with_theme_color(self):
        """Parse underline with theme color."""
        elem = make_element('<w:u w:val="double" w:themeColor="accent1"/>')
        result = parse_underline(elem)
        assert result is not None
        assert result.val == "double"
        assert result.theme_color == "accent1"

    def test_parse_underline_styles(self):
        """Test various underline style values."""
        styles = [
            "single",
            "words",
            "double",
            "thick",
            "dotted",
            "dottedHeavy",
            "dash",
            "dashedHeavy",
            "dashLong",
            "dashLongHeavy",
            "dotDash",
            "dashDotHeavy",
            "dotDotDash",
            "dashDotDotHeavy",
            "wave",
            "wavyHeavy",
            "wavyDouble",
            "none",
        ]
        for style in styles:
            elem = make_element(f'<w:u w:val="{style}"/>')
            result = parse_underline(elem)
            assert result is not None
            assert result.val == style


# =============================================================================
# Run Properties Parser Tests (<w:rPr>)
# =============================================================================


class TestRunPropertiesParser:
    """Tests for parse_run_properties function.

    XML Element: <w:rPr>
    Children: rStyle, rFonts, b, bCs, i, iCs, caps, smallCaps, strike, dstrike,
              outline, shadow, emboss, imprint, vanish, color, spacing, w, kern,
              position, sz, szCs, highlight, u, effect, bdr, shd, vertAlign, lang
    """

    def test_parse_run_properties_none(self):
        """None input returns None."""
        result = parse_run_properties(None)
        assert result is None

    def test_parse_run_properties_empty(self):
        """Parse empty rPr element."""
        elem = make_element("<w:rPr/>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.b is None
        assert result.i is None

    def test_parse_run_properties_bold(self):
        """Parse bold run property."""
        elem = make_element("<w:rPr><w:b/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.b is True

    def test_parse_run_properties_bold_explicit_false(self):
        """Parse bold with explicit false."""
        elem = make_element('<w:rPr><w:b w:val="0"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.b is False

    def test_parse_run_properties_italic(self):
        """Parse italic run property."""
        elem = make_element("<w:rPr><w:i/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.i is True

    def test_parse_run_properties_bold_italic(self):
        """Parse bold and italic together."""
        elem = make_element("<w:rPr><w:b/><w:i/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.b is True
        assert result.i is True

    def test_parse_run_properties_style(self):
        """Parse run with style reference."""
        elem = make_element('<w:rPr><w:rStyle w:val="Strong"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.r_style == "Strong"

    def test_parse_run_properties_size(self):
        """Parse font size (half-points)."""
        elem = make_element('<w:rPr><w:sz w:val="24"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.sz == 24  # 12pt in half-points

    def test_parse_run_properties_color(self):
        """Parse text color."""
        elem = make_element('<w:rPr><w:color w:val="FF0000"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.color is not None
        assert result.color.val == "FF0000"

    def test_parse_run_properties_highlight(self):
        """Parse highlight color."""
        elem = make_element('<w:rPr><w:highlight w:val="yellow"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.highlight == "yellow"

    def test_parse_run_properties_highlight_colors(self):
        """Test all highlight color values."""
        colors = [
            "black",
            "blue",
            "cyan",
            "darkBlue",
            "darkCyan",
            "darkGray",
            "darkGreen",
            "darkMagenta",
            "darkRed",
            "darkYellow",
            "green",
            "lightGray",
            "magenta",
            "none",
            "red",
            "white",
            "yellow",
        ]
        for color in colors:
            elem = make_element(f'<w:rPr><w:highlight w:val="{color}"/></w:rPr>')
            result = parse_run_properties(elem)
            assert result is not None
            assert result.highlight == color

    def test_parse_run_properties_caps(self):
        """Parse all caps."""
        elem = make_element("<w:rPr><w:caps/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.caps is True

    def test_parse_run_properties_small_caps(self):
        """Parse small caps."""
        elem = make_element("<w:rPr><w:smallCaps/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.small_caps is True

    def test_parse_run_properties_strike(self):
        """Parse strikethrough."""
        elem = make_element("<w:rPr><w:strike/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.strike is True

    def test_parse_run_properties_dstrike(self):
        """Parse double strikethrough."""
        elem = make_element("<w:rPr><w:dstrike/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.dstrike is True

    def test_parse_run_properties_effects(self):
        """Parse text effects (outline, shadow, emboss, imprint)."""
        elem = make_element("""
            <w:rPr>
                <w:outline/>
                <w:shadow/>
                <w:emboss/>
                <w:imprint/>
            </w:rPr>
        """)
        result = parse_run_properties(elem)
        assert result is not None
        assert result.outline is True
        assert result.shadow is True
        assert result.emboss is True
        assert result.imprint is True

    def test_parse_run_properties_vanish(self):
        """Parse hidden text."""
        elem = make_element("<w:rPr><w:vanish/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.vanish is True

    def test_parse_run_properties_spec_vanish(self):
        """Parse special vanish."""
        elem = make_element("<w:rPr><w:specVanish/></w:rPr>")
        result = parse_run_properties(elem)
        assert result is not None
        assert result.spec_vanish is True

    def test_parse_run_properties_vert_align(self):
        """Parse vertical alignment (superscript/subscript)."""
        elem = make_element('<w:rPr><w:vertAlign w:val="superscript"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.vert_align == "superscript"

    def test_parse_run_properties_vert_align_values(self):
        """Test all vertical alignment values."""
        alignments = ["baseline", "superscript", "subscript"]
        for align in alignments:
            elem = make_element(f'<w:rPr><w:vertAlign w:val="{align}"/></w:rPr>')
            result = parse_run_properties(elem)
            assert result is not None
            assert result.vert_align == align

    def test_parse_run_properties_spacing(self):
        """Parse character spacing."""
        elem = make_element('<w:rPr><w:spacing w:val="20"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.spacing == 20

    def test_parse_run_properties_w(self):
        """Parse character width scale."""
        elem = make_element('<w:rPr><w:w w:val="150"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.w == 150  # 150%

    def test_parse_run_properties_kern(self):
        """Parse kerning threshold."""
        elem = make_element('<w:rPr><w:kern w:val="24"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.kern == 24

    def test_parse_run_properties_position(self):
        """Parse vertical position (raised/lowered)."""
        elem = make_element('<w:rPr><w:position w:val="6"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.position == 6

    def test_parse_run_properties_negative_position(self):
        """Parse negative position (lowered)."""
        elem = make_element('<w:rPr><w:position w:val="-6"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.position == -6

    def test_parse_run_properties_fonts(self):
        """Parse font family."""
        elem = make_element('<w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.r_fonts is not None
        assert result.r_fonts.ascii == "Times New Roman"

    def test_parse_run_properties_underline(self):
        """Parse underline."""
        elem = make_element('<w:rPr><w:u w:val="single"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.u is not None
        assert result.u.val == "single"

    def test_parse_run_properties_border(self):
        """Parse character border."""
        elem = make_element('<w:rPr><w:bdr w:val="single" w:sz="4" w:color="000000"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.bdr is not None
        assert result.bdr.val == "single"

    def test_parse_run_properties_shading(self):
        """Parse character shading."""
        elem = make_element('<w:rPr><w:shd w:val="clear" w:fill="FFFF00"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.shd is not None
        assert result.shd.fill == "FFFF00"

    def test_parse_run_properties_language(self):
        """Parse language settings."""
        elem = make_element('<w:rPr><w:lang w:val="en-US"/></w:rPr>')
        result = parse_run_properties(elem)
        assert result is not None
        assert result.lang is not None
        assert result.lang.val == "en-US"

    def test_parse_run_properties_comprehensive(self):
        """Parse comprehensive run properties."""
        elem = make_element("""
            <w:rPr>
                <w:rStyle w:val="Emphasis"/>
                <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                <w:b/>
                <w:i/>
                <w:u w:val="single"/>
                <w:sz w:val="28"/>
                <w:color w:val="0000FF"/>
                <w:highlight w:val="yellow"/>
            </w:rPr>
        """)
        result = parse_run_properties(elem)
        assert result is not None
        assert result.r_style == "Emphasis"
        assert result.r_fonts is not None
        assert result.r_fonts.ascii == "Arial"
        assert result.b is True
        assert result.i is True
        assert result.u is not None
        assert result.u.val == "single"
        assert result.sz == 28
        assert result.color is not None
        assert result.color.val == "0000FF"
        assert result.highlight == "yellow"


# =============================================================================
# Run Parser Tests (<w:r>)
# =============================================================================


class TestRunParser:
    """Tests for parse_run function.

    XML Element: <w:r>
    Children: rPr, t, br, tab, cr, sym, fldChar, instrText, etc.
    """

    def test_parse_run_none(self):
        """None input returns None."""
        result = parse_run(None)
        assert result is None

    def test_parse_run_simple_text(self):
        """Parse run with simple text."""
        elem = make_element("<w:r><w:t>Hello World</w:t></w:r>")
        result = parse_run(elem)
        assert result is not None
        assert len(result.content) == 1
        assert isinstance(result.content[0], Text)
        assert result.content[0].value == "Hello World"

    def test_parse_run_with_properties(self):
        """Parse run with properties and text."""
        elem = make_element("""
            <w:r>
                <w:rPr><w:b/></w:rPr>
                <w:t>Bold text</w:t>
            </w:r>
        """)
        result = parse_run(elem)
        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr.b is True
        assert len(result.content) == 1
        assert result.content[0].value == "Bold text"

    def test_parse_run_multiple_content(self):
        """Parse run with multiple content elements."""
        elem = make_element("""
            <w:r>
                <w:t>Before</w:t>
                <w:tab/>
                <w:t>After</w:t>
            </w:r>
        """)
        result = parse_run(elem)
        assert result is not None
        assert len(result.content) == 3
        assert isinstance(result.content[0], Text)
        assert isinstance(result.content[1], TabChar)
        assert isinstance(result.content[2], Text)

    def test_parse_run_with_break(self):
        """Parse run with line break."""
        elem = make_element("""
            <w:r>
                <w:t>Line 1</w:t>
                <w:br/>
                <w:t>Line 2</w:t>
            </w:r>
        """)
        result = parse_run(elem)
        assert result is not None
        assert len(result.content) == 3
        assert isinstance(result.content[1], Break)

    def test_parse_run_empty(self):
        """Parse empty run."""
        elem = make_element("<w:r/>")
        result = parse_run(elem)
        assert result is not None
        assert result.r_pr is None
        assert len(result.content) == 0

    def test_parse_run_properties_only(self):
        """Parse run with only properties (no content)."""
        elem = make_element("""
            <w:r>
                <w:rPr><w:i/></w:rPr>
            </w:r>
        """)
        result = parse_run(elem)
        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr.i is True
        assert len(result.content) == 0
