"""Unit tests for styles parsers."""

from parsers.styles.document_defaults_parser import (
    parse_document_defaults,
    parse_paragraph_properties_default,
    parse_run_properties_default,
)
from parsers.styles.latent_styles_parser import (
    parse_latent_style_exception,
    parse_latent_styles,
)
from parsers.styles.style_parser import parse_style, parse_table_style_properties
from parsers.styles.styles_parser import parse_styles
from tests.unit.parsers.conftest import make_element

# =============================================================================
# LatentStyleException Parser Tests
# =============================================================================


class TestLatentStyleExceptionParser:
    """Tests for parse_latent_style_exception."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_latent_style_exception(None)
        assert result is None

    def test_minimal_exception(self) -> None:
        """Test latent style exception with only name."""
        xml = '<w:lsdException w:name="Normal"/>'
        element = make_element(xml)
        result = parse_latent_style_exception(element)

        assert result is not None
        assert result.name == "Normal"
        assert result.locked is None
        assert result.ui_priority is None
        assert result.semi_hidden is None
        assert result.unhide_when_used is None
        assert result.q_format is None

    def test_all_attributes(self) -> None:
        """Test latent style exception with all attributes.

        Note: The current parser implementation uses parse_toggle(element) for
        attribute-based toggles, which checks for presence rather than value.
        This is a known limitation - all toggle attributes return True if present.
        """
        xml = """<w:lsdException
            w:name="heading 1"
            w:locked="0"
            w:uiPriority="9"
            w:semiHidden="0"
            w:unhideWhenUsed="0"
            w:qFormat="1"/>"""
        element = make_element(xml)
        result = parse_latent_style_exception(element)

        assert result is not None
        assert result.name == "heading 1"
        # Note: parse_toggle returns True when attribute is present (regardless of value)
        assert result.locked is True  # attribute present = True
        assert result.ui_priority == 9
        assert result.semi_hidden is True  # attribute present = True
        assert result.unhide_when_used is True  # attribute present = True
        assert result.q_format is True

    def test_hidden_style(self) -> None:
        """Test latent style exception for a hidden style."""
        xml = """<w:lsdException
            w:name="Placeholder Text"
            w:semiHidden="1"
            w:unhideWhenUsed="1"
            w:uiPriority="99"/>"""
        element = make_element(xml)
        result = parse_latent_style_exception(element)

        assert result is not None
        assert result.name == "Placeholder Text"
        assert result.semi_hidden is True
        assert result.unhide_when_used is True
        assert result.ui_priority == 99


# =============================================================================
# LatentStyles Parser Tests
# =============================================================================


class TestLatentStylesParser:
    """Tests for parse_latent_styles."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_latent_styles(None)
        assert result is None

    def test_empty_latent_styles(self) -> None:
        """Test empty latent styles element."""
        xml = "<w:latentStyles/>"
        element = make_element(xml)
        result = parse_latent_styles(element)

        assert result is not None
        assert result.def_locked_state is None
        assert result.def_ui_priority is None
        assert result.def_semi_hidden is None
        assert result.def_unhide_when_used is None
        assert result.def_q_format is None
        assert result.count is None
        assert result.lsd_exception == []

    def test_with_defaults_only(self) -> None:
        """Test latent styles with default attributes only.

        Note: Same limitation as lsdException - toggle attributes return True
        when present regardless of value.
        """
        xml = """<w:latentStyles
            w:defLockedState="0"
            w:defUIPriority="99"
            w:defSemiHidden="0"
            w:defUnhideWhenUsed="0"
            w:defQFormat="0"
            w:count="376"/>"""
        element = make_element(xml)
        result = parse_latent_styles(element)

        assert result is not None
        # Note: parse_toggle returns True when attribute is present (regardless of value)
        assert result.def_locked_state is True
        assert result.def_ui_priority == 99
        assert result.def_semi_hidden is True
        assert result.def_unhide_when_used is True
        assert result.def_q_format is True
        assert result.count == 376
        assert result.lsd_exception == []

    def test_with_exceptions(self) -> None:
        """Test latent styles with exception elements."""
        xml = """<w:latentStyles w:defUIPriority="99" w:count="376">
            <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>
            <w:lsdException w:name="heading 1" w:uiPriority="9" w:qFormat="1"/>
            <w:lsdException w:name="heading 2" w:uiPriority="9" w:semiHidden="1"/>
        </w:latentStyles>"""
        element = make_element(xml)
        result = parse_latent_styles(element)

        assert result is not None
        assert result.count == 376
        assert len(result.lsd_exception) == 3
        assert result.lsd_exception[0].name == "Normal"
        assert result.lsd_exception[0].ui_priority == 0
        assert result.lsd_exception[1].name == "heading 1"
        assert result.lsd_exception[2].semi_hidden is True


# =============================================================================
# RunPropertiesDefault Parser Tests
# =============================================================================


class TestRunPropertiesDefaultParser:
    """Tests for parse_run_properties_default."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_run_properties_default(None)
        assert result is None

    def test_empty_default(self) -> None:
        """Test empty run properties default."""
        xml = "<w:rPrDefault/>"
        element = make_element(xml)
        result = parse_run_properties_default(element)

        assert result is not None
        assert result.r_pr is None

    def test_with_run_properties(self) -> None:
        """Test run properties default with nested rPr."""
        xml = """<w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                <w:sz w:val="24"/>
                <w:szCs w:val="24"/>
            </w:rPr>
        </w:rPrDefault>"""
        element = make_element(xml)
        result = parse_run_properties_default(element)

        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr["r_fonts"]["ascii"] == "Times New Roman"
        assert result.r_pr["sz"] == 24

    def test_with_language_settings(self) -> None:
        """Test run properties default with language settings."""
        xml = """<w:rPrDefault>
            <w:rPr>
                <w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/>
            </w:rPr>
        </w:rPrDefault>"""
        element = make_element(xml)
        result = parse_run_properties_default(element)

        assert result is not None
        assert result.r_pr is not None
        assert result.r_pr["lang"]["val"] == "en-US"


# =============================================================================
# ParagraphPropertiesDefault Parser Tests
# =============================================================================


class TestParagraphPropertiesDefaultParser:
    """Tests for parse_paragraph_properties_default."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_paragraph_properties_default(None)
        assert result is None

    def test_empty_default(self) -> None:
        """Test empty paragraph properties default."""
        xml = "<w:pPrDefault/>"
        element = make_element(xml)
        result = parse_paragraph_properties_default(element)

        assert result is not None
        assert result.p_pr is None

    def test_with_spacing(self) -> None:
        """Test paragraph properties default with spacing."""
        xml = """<w:pPrDefault>
            <w:pPr>
                <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
            </w:pPr>
        </w:pPrDefault>"""
        element = make_element(xml)
        result = parse_paragraph_properties_default(element)

        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr["spacing"]["after"] == 160
        assert result.p_pr["spacing"]["line"] == 259


# =============================================================================
# DocumentDefaults Parser Tests
# =============================================================================


class TestDocumentDefaultsParser:
    """Tests for parse_document_defaults."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_document_defaults(None)
        assert result is None

    def test_empty_defaults(self) -> None:
        """Test empty document defaults."""
        xml = "<w:docDefaults/>"
        element = make_element(xml)
        result = parse_document_defaults(element)

        assert result is not None
        assert result.r_pr_default is None
        assert result.p_pr_default is None

    def test_with_run_default_only(self) -> None:
        """Test document defaults with only run properties default."""
        xml = """<w:docDefaults>
            <w:rPrDefault>
                <w:rPr>
                    <w:sz w:val="22"/>
                </w:rPr>
            </w:rPrDefault>
        </w:docDefaults>"""
        element = make_element(xml)
        result = parse_document_defaults(element)

        assert result is not None
        assert result.r_pr_default is not None
        assert result.r_pr_default.r_pr is not None
        assert result.p_pr_default is None

    def test_with_both_defaults(self) -> None:
        """Test document defaults with both run and paragraph defaults."""
        xml = """<w:docDefaults>
            <w:rPrDefault>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri"/>
                    <w:sz w:val="22"/>
                </w:rPr>
            </w:rPrDefault>
            <w:pPrDefault>
                <w:pPr>
                    <w:spacing w:after="200" w:line="276" w:lineRule="auto"/>
                </w:pPr>
            </w:pPrDefault>
        </w:docDefaults>"""
        element = make_element(xml)
        result = parse_document_defaults(element)

        assert result is not None
        assert result.r_pr_default is not None
        assert result.r_pr_default.r_pr is not None
        assert result.r_pr_default.r_pr["r_fonts"]["ascii"] == "Calibri"
        assert result.p_pr_default is not None
        assert result.p_pr_default.p_pr is not None
        assert result.p_pr_default.p_pr["spacing"]["after"] == 200


# =============================================================================
# TableStyleProperties Parser Tests
# =============================================================================


class TestTableStylePropertiesParser:
    """Tests for parse_table_style_properties."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_table_style_properties(None)
        assert result is None

    def test_missing_type_returns_none(self) -> None:
        """Test that missing type attribute returns None."""
        xml = "<w:tblStylePr/>"
        element = make_element(xml)
        result = parse_table_style_properties(element)
        assert result is None

    def test_first_row_condition(self) -> None:
        """Test table style properties for first row."""
        xml = """<w:tblStylePr w:type="firstRow">
            <w:rPr>
                <w:b/>
                <w:color w:val="FFFFFF"/>
            </w:rPr>
            <w:tcPr>
                <w:shd w:val="clear" w:fill="4472C4"/>
            </w:tcPr>
        </w:tblStylePr>"""
        element = make_element(xml)
        result = parse_table_style_properties(element)

        assert result is not None
        assert result.type == "firstRow"
        assert result.r_pr is not None
        assert result.r_pr["b"] is True
        assert result.tc_pr is not None
        assert result.tc_pr["shd"]["fill"] == "4472C4"

    def test_last_column_condition(self) -> None:
        """Test table style properties for last column."""
        xml = """<w:tblStylePr w:type="lastCol">
            <w:rPr>
                <w:b/>
            </w:rPr>
        </w:tblStylePr>"""
        element = make_element(xml)
        result = parse_table_style_properties(element)

        assert result is not None
        assert result.type == "lastCol"
        assert result.r_pr is not None
        assert result.p_pr is None
        assert result.tbl_pr is None
        assert result.tr_pr is None
        assert result.tc_pr is None

    def test_band1_horizontal(self) -> None:
        """Test table style properties for banded row."""
        xml = """<w:tblStylePr w:type="band1Horz">
            <w:tcPr>
                <w:shd w:val="clear" w:fill="D9E2F3"/>
            </w:tcPr>
        </w:tblStylePr>"""
        element = make_element(xml)
        result = parse_table_style_properties(element)

        assert result is not None
        assert result.type == "band1Horz"
        assert result.tc_pr is not None

    def test_all_condition_types(self) -> None:
        """Test all valid condition types."""
        condition_types = [
            "wholeTable",
            "firstRow",
            "lastRow",
            "firstCol",
            "lastCol",
            "band1Vert",
            "band2Vert",
            "band1Horz",
            "band2Horz",
            "neCell",
            "nwCell",
            "seCell",
            "swCell",
        ]
        for cond_type in condition_types:
            xml = f'<w:tblStylePr w:type="{cond_type}"/>'
            element = make_element(xml)
            result = parse_table_style_properties(element)

            assert result is not None
            assert result.type == cond_type


# =============================================================================
# Style Parser Tests
# =============================================================================


class TestStyleParser:
    """Tests for parse_style."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_style(None)
        assert result is None

    def test_missing_type_returns_none(self) -> None:
        """Test that missing type returns None."""
        xml = '<w:style w:styleId="Normal"/>'
        element = make_element(xml)
        result = parse_style(element)
        assert result is None

    def test_missing_style_id_returns_none(self) -> None:
        """Test that missing styleId returns None."""
        xml = '<w:style w:type="paragraph"/>'
        element = make_element(xml)
        result = parse_style(element)
        assert result is None

    def test_minimal_paragraph_style(self) -> None:
        """Test minimal paragraph style."""
        xml = '<w:style w:type="paragraph" w:styleId="Normal"/>'
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.type == "paragraph"
        assert result.style_id == "Normal"
        assert result.name is None
        assert result.based_on is None
        assert result.default is None

    def test_complete_paragraph_style(self) -> None:
        """Test paragraph style with all common elements."""
        xml = """<w:style w:type="paragraph" w:styleId="Heading1" w:default="0">
            <w:name w:val="heading 1"/>
            <w:aliases w:val="H1,Heading One"/>
            <w:basedOn w:val="Normal"/>
            <w:next w:val="Normal"/>
            <w:link w:val="Heading1Char"/>
            <w:uiPriority w:val="9"/>
            <w:qFormat/>
            <w:rsid w:val="00A1B2C3"/>
            <w:pPr>
                <w:spacing w:before="240" w:after="0"/>
                <w:outlineLvl w:val="0"/>
            </w:pPr>
            <w:rPr>
                <w:b/>
                <w:sz w:val="32"/>
            </w:rPr>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.type == "paragraph"
        assert result.style_id == "Heading1"
        assert result.name == "heading 1"
        assert result.aliases == "H1,Heading One"
        assert result.based_on == "Normal"
        assert result.next == "Normal"
        assert result.link == "Heading1Char"
        assert result.ui_priority == 9
        assert result.q_format is True
        assert result.rsid == "00A1B2C3"
        assert result.p_pr is not None
        assert result.r_pr is not None

    def test_character_style(self) -> None:
        """Test character style."""
        xml = """<w:style w:type="character" w:styleId="BoldEmphasis">
            <w:name w:val="Bold Emphasis"/>
            <w:basedOn w:val="DefaultParagraphFont"/>
            <w:uiPriority w:val="22"/>
            <w:rPr>
                <w:b/>
                <w:i/>
            </w:rPr>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.type == "character"
        assert result.style_id == "BoldEmphasis"
        assert result.r_pr is not None
        assert result.r_pr["b"] is True
        assert result.r_pr["i"] is True

    def test_table_style(self) -> None:
        """Test table style with conditional formatting."""
        xml = """<w:style w:type="table" w:styleId="TableGrid">
            <w:name w:val="Table Grid"/>
            <w:basedOn w:val="TableNormal"/>
            <w:uiPriority w:val="39"/>
            <w:tblPr>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="auto"/>
                    <w:left w:val="single" w:sz="4" w:color="auto"/>
                    <w:bottom w:val="single" w:sz="4" w:color="auto"/>
                    <w:right w:val="single" w:sz="4" w:color="auto"/>
                    <w:insideH w:val="single" w:sz="4" w:color="auto"/>
                    <w:insideV w:val="single" w:sz="4" w:color="auto"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tblStylePr w:type="firstRow">
                <w:rPr>
                    <w:b/>
                </w:rPr>
            </w:tblStylePr>
            <w:tblStylePr w:type="lastRow">
                <w:rPr>
                    <w:b/>
                </w:rPr>
            </w:tblStylePr>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.type == "table"
        assert result.style_id == "TableGrid"
        assert result.tbl_pr is not None
        assert result.tbl_style_pr is not None
        assert len(result.tbl_style_pr) == 2
        assert result.tbl_style_pr[0].type == "firstRow"
        assert result.tbl_style_pr[1].type == "lastRow"

    def test_default_style(self) -> None:
        """Test default style flag."""
        xml = '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"/>'
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.default is True

    def test_custom_style(self) -> None:
        """Test custom style flag."""
        xml = '<w:style w:type="paragraph" w:styleId="MyStyle" w:customStyle="1"/>'
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.custom_style is True

    def test_hidden_style(self) -> None:
        """Test hidden style properties."""
        xml = """<w:style w:type="paragraph" w:styleId="HiddenStyle">
            <w:name w:val="Hidden Style"/>
            <w:hidden/>
            <w:semiHidden/>
            <w:unhideWhenUsed/>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.hidden is True
        assert result.semi_hidden is True
        assert result.unhide_when_used is True

    def test_locked_style(self) -> None:
        """Test locked style."""
        xml = """<w:style w:type="paragraph" w:styleId="LockedStyle">
            <w:name w:val="Locked Style"/>
            <w:locked/>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.locked is True

    def test_auto_redefine(self) -> None:
        """Test auto-redefine style."""
        xml = """<w:style w:type="paragraph" w:styleId="AutoStyle">
            <w:name w:val="Auto Style"/>
            <w:autoRedefine/>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.auto_redefine is True

    def test_personal_styles(self) -> None:
        """Test personal style flags (for email)."""
        xml = """<w:style w:type="paragraph" w:styleId="PersonalStyle">
            <w:name w:val="Personal Style"/>
            <w:personal/>
            <w:personalCompose/>
            <w:personalReply/>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.personal is True
        assert result.personal_compose is True
        assert result.personal_reply is True

    def test_numbering_style(self) -> None:
        """Test numbering style."""
        xml = """<w:style w:type="numbering" w:styleId="BulletList">
            <w:name w:val="Bullet List"/>
            <w:uiPriority w:val="99"/>
        </w:style>"""
        element = make_element(xml)
        result = parse_style(element)

        assert result is not None
        assert result.type == "numbering"
        assert result.style_id == "BulletList"

    def test_all_style_types(self) -> None:
        """Test all valid style types."""
        style_types = ["paragraph", "character", "table", "numbering"]
        for style_type in style_types:
            xml = f'<w:style w:type="{style_type}" w:styleId="Test{style_type.title()}"/>'
            element = make_element(xml)
            result = parse_style(element)

            assert result is not None
            assert result.type == style_type


# =============================================================================
# Styles Parser Tests
# =============================================================================


class TestStylesParser:
    """Tests for parse_styles."""

    def test_none_input(self) -> None:
        """Test that None input returns None."""
        result = parse_styles(None)
        assert result is None

    def test_empty_styles(self) -> None:
        """Test empty styles element."""
        xml = "<w:styles/>"
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None
        assert result.doc_defaults is None
        assert result.latent_styles is None
        assert result.style == []

    def test_with_doc_defaults_only(self) -> None:
        """Test styles with document defaults only."""
        xml = """<w:styles>
            <w:docDefaults>
                <w:rPrDefault>
                    <w:rPr>
                        <w:sz w:val="22"/>
                    </w:rPr>
                </w:rPrDefault>
            </w:docDefaults>
        </w:styles>"""
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None
        assert result.doc_defaults is not None
        assert result.latent_styles is None
        assert result.style == []

    def test_with_latent_styles_only(self) -> None:
        """Test styles with latent styles only."""
        xml = """<w:styles>
            <w:latentStyles w:defUIPriority="99" w:count="376">
                <w:lsdException w:name="Normal" w:uiPriority="0"/>
            </w:latentStyles>
        </w:styles>"""
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None
        assert result.doc_defaults is None
        assert result.latent_styles is not None
        assert result.latent_styles.count == 376
        assert result.style == []

    def test_with_styles_only(self) -> None:
        """Test styles with style definitions only."""
        xml = """<w:styles>
            <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
                <w:name w:val="Normal"/>
            </w:style>
            <w:style w:type="paragraph" w:styleId="Heading1">
                <w:name w:val="heading 1"/>
                <w:basedOn w:val="Normal"/>
            </w:style>
        </w:styles>"""
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None
        assert result.doc_defaults is None
        assert result.latent_styles is None
        assert len(result.style) == 2
        assert result.style[0].style_id == "Normal"
        assert result.style[1].style_id == "Heading1"

    def test_complete_styles_document(self) -> None:
        """Test complete styles document with all sections."""
        xml = """<w:styles>
            <w:docDefaults>
                <w:rPrDefault>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:sz w:val="22"/>
                    </w:rPr>
                </w:rPrDefault>
                <w:pPrDefault>
                    <w:pPr>
                        <w:spacing w:after="200" w:line="276" w:lineRule="auto"/>
                    </w:pPr>
                </w:pPrDefault>
            </w:docDefaults>
            <w:latentStyles w:defUIPriority="99" w:defSemiHidden="0" w:count="376">
                <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>
                <w:lsdException w:name="heading 1" w:uiPriority="9" w:qFormat="1"/>
            </w:latentStyles>
            <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
                <w:name w:val="Normal"/>
                <w:qFormat/>
            </w:style>
            <w:style w:type="paragraph" w:styleId="Heading1">
                <w:name w:val="heading 1"/>
                <w:basedOn w:val="Normal"/>
                <w:next w:val="Normal"/>
                <w:link w:val="Heading1Char"/>
                <w:uiPriority w:val="9"/>
                <w:qFormat/>
                <w:pPr>
                    <w:spacing w:before="240"/>
                    <w:outlineLvl w:val="0"/>
                </w:pPr>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="32"/>
                </w:rPr>
            </w:style>
            <w:style w:type="character" w:styleId="Heading1Char">
                <w:name w:val="Heading 1 Char"/>
                <w:basedOn w:val="DefaultParagraphFont"/>
                <w:link w:val="Heading1"/>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="32"/>
                </w:rPr>
            </w:style>
            <w:style w:type="table" w:styleId="TableGrid">
                <w:name w:val="Table Grid"/>
                <w:basedOn w:val="TableNormal"/>
                <w:tblPr>
                    <w:tblBorders>
                        <w:top w:val="single" w:sz="4" w:color="auto"/>
                    </w:tblBorders>
                </w:tblPr>
            </w:style>
        </w:styles>"""
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None

        # Document defaults
        assert result.doc_defaults is not None
        assert result.doc_defaults.r_pr_default is not None
        assert result.doc_defaults.p_pr_default is not None

        # Latent styles
        assert result.latent_styles is not None
        assert result.latent_styles.count == 376
        assert len(result.latent_styles.lsd_exception) == 2

        # Styles
        assert len(result.style) == 4

        # Paragraph styles
        normal = result.style[0]
        assert normal.type == "paragraph"
        assert normal.style_id == "Normal"
        assert normal.default is True

        heading1 = result.style[1]
        assert heading1.type == "paragraph"
        assert heading1.style_id == "Heading1"
        assert heading1.based_on == "Normal"
        assert heading1.link == "Heading1Char"

        # Character style
        heading1_char = result.style[2]
        assert heading1_char.type == "character"
        assert heading1_char.style_id == "Heading1Char"

        # Table style
        table_grid = result.style[3]
        assert table_grid.type == "table"
        assert table_grid.style_id == "TableGrid"
        assert table_grid.tbl_pr is not None

    def test_filters_invalid_styles(self) -> None:
        """Test that styles without required attributes are filtered."""
        xml = """<w:styles>
            <w:style w:type="paragraph" w:styleId="Valid">
                <w:name w:val="Valid Style"/>
            </w:style>
            <w:style w:type="paragraph">
                <!-- Missing styleId - should be filtered -->
            </w:style>
            <w:style w:styleId="NoType">
                <!-- Missing type - should be filtered -->
            </w:style>
        </w:styles>"""
        element = make_element(xml)
        result = parse_styles(element)

        assert result is not None
        assert len(result.style) == 1
        assert result.style[0].style_id == "Valid"
