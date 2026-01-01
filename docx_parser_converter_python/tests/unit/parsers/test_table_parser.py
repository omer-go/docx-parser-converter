"""Unit tests for table parsers.

Tests cover:
- Table grid and grid columns
- Table cell margins and properties
- Table row height and properties
- Table look and properties
- Complete table parsing
"""

from parsers.document.table_cell_parser import parse_table_cell
from parsers.document.table_cell_properties_parser import (
    parse_table_cell_margins,
    parse_table_cell_properties,
)
from parsers.document.table_grid_parser import parse_table_grid, parse_table_grid_column
from parsers.document.table_parser import parse_table
from parsers.document.table_properties_parser import parse_table_look, parse_table_properties
from parsers.document.table_row_parser import parse_table_row
from parsers.document.table_row_properties_parser import (
    parse_table_row_height,
    parse_table_row_properties,
)
from tests.unit.parsers.conftest import make_element

# =============================================================================
# Table Grid Parser Tests (<w:tblGrid>, <w:gridCol>)
# =============================================================================


class TestTableGridColumnParser:
    """Tests for parse_table_grid_column function.

    XML Element: <w:gridCol>
    Attributes: w
    """

    def test_parse_grid_column_none(self):
        """None input returns None."""
        result = parse_table_grid_column(None)
        assert result is None

    def test_parse_grid_column(self):
        """Parse grid column with width."""
        elem = make_element('<w:gridCol w:w="2880"/>')
        result = parse_table_grid_column(elem)
        assert result is not None
        assert result.w == 2880

    def test_parse_grid_column_no_width(self):
        """Parse grid column without width."""
        elem = make_element("<w:gridCol/>")
        result = parse_table_grid_column(elem)
        assert result is not None
        assert result.w is None


class TestTableGridParser:
    """Tests for parse_table_grid function.

    XML Element: <w:tblGrid>
    Children: gridCol
    """

    def test_parse_table_grid_none(self):
        """None input returns None."""
        result = parse_table_grid(None)
        assert result is None

    def test_parse_table_grid_empty(self):
        """Parse empty table grid."""
        elem = make_element("<w:tblGrid/>")
        result = parse_table_grid(elem)
        assert result is not None
        assert len(result.grid_col) == 0

    def test_parse_table_grid_multiple_columns(self):
        """Parse table grid with multiple columns."""
        elem = make_element("""
            <w:tblGrid>
                <w:gridCol w:w="2880"/>
                <w:gridCol w:w="2880"/>
                <w:gridCol w:w="2880"/>
            </w:tblGrid>
        """)
        result = parse_table_grid(elem)
        assert result is not None
        assert len(result.grid_col) == 3
        assert result.grid_col[0].w == 2880

    def test_parse_table_grid_varied_widths(self):
        """Parse table grid with varied column widths."""
        elem = make_element("""
            <w:tblGrid>
                <w:gridCol w:w="1440"/>
                <w:gridCol w:w="4320"/>
                <w:gridCol w:w="2880"/>
            </w:tblGrid>
        """)
        result = parse_table_grid(elem)
        assert result is not None
        assert result.grid_col[0].w == 1440
        assert result.grid_col[1].w == 4320
        assert result.grid_col[2].w == 2880


# =============================================================================
# Table Cell Margins Parser Tests (<w:tcMar>, <w:tblCellMar>)
# =============================================================================


class TestTableCellMarginsParser:
    """Tests for parse_table_cell_margins function.

    XML Element: <w:tcMar>, <w:tblCellMar>
    Children: top, left, bottom, right
    """

    def test_parse_cell_margins_none(self):
        """None input returns None."""
        result = parse_table_cell_margins(None)
        assert result is None

    def test_parse_cell_margins_empty(self):
        """Parse empty cell margins."""
        elem = make_element("<w:tcMar/>")
        result = parse_table_cell_margins(elem)
        assert result is not None
        assert result.top is None
        assert result.left is None

    def test_parse_cell_margins_all_sides(self):
        """Parse cell margins with all sides."""
        elem = make_element("""
            <w:tcMar>
                <w:top w:w="72" w:type="dxa"/>
                <w:left w:w="115" w:type="dxa"/>
                <w:bottom w:w="72" w:type="dxa"/>
                <w:right w:w="115" w:type="dxa"/>
            </w:tcMar>
        """)
        result = parse_table_cell_margins(elem)
        assert result is not None
        assert result.top is not None
        assert result.top.w == 72
        assert result.left is not None
        assert result.left.w == 115
        assert result.bottom is not None
        assert result.bottom.w == 72
        assert result.right is not None
        assert result.right.w == 115


# =============================================================================
# Table Cell Properties Parser Tests (<w:tcPr>)
# =============================================================================


class TestTableCellPropertiesParser:
    """Tests for parse_table_cell_properties function.

    XML Element: <w:tcPr>
    Children: tcW, tcBorders, shd, tcMar, textDirection, vAlign,
              gridSpan, vMerge, hMerge, noWrap, tcFitText, hideMark
    """

    def test_parse_cell_properties_none(self):
        """None input returns None."""
        result = parse_table_cell_properties(None)
        assert result is None

    def test_parse_cell_properties_empty(self):
        """Parse empty cell properties."""
        elem = make_element("<w:tcPr/>")
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_w is None
        assert result.v_align is None

    def test_parse_cell_properties_width(self):
        """Parse cell width."""
        elem = make_element("""
            <w:tcPr>
                <w:tcW w:w="2880" w:type="dxa"/>
            </w:tcPr>
        """)
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_w is not None
        assert result.tc_w.w == 2880
        assert result.tc_w.type == "dxa"

    def test_parse_cell_properties_shading(self):
        """Parse cell shading."""
        elem = make_element("""
            <w:tcPr>
                <w:shd w:val="clear" w:fill="FFFF00"/>
            </w:tcPr>
        """)
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.shd is not None
        assert result.shd.fill == "FFFF00"

    def test_parse_cell_properties_vertical_align(self):
        """Parse vertical alignment."""
        elem = make_element('<w:tcPr><w:vAlign w:val="center"/></w:tcPr>')
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.v_align == "center"

    def test_parse_cell_properties_valign_values(self):
        """Test all vertical alignment values."""
        alignments = ["top", "center", "bottom"]
        for align in alignments:
            elem = make_element(f'<w:tcPr><w:vAlign w:val="{align}"/></w:tcPr>')
            result = parse_table_cell_properties(elem)
            assert result is not None
            assert result.v_align == align

    def test_parse_cell_properties_text_direction(self):
        """Parse text direction."""
        elem = make_element('<w:tcPr><w:textDirection w:val="tbRl"/></w:tcPr>')
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.text_direction == "tbRl"

    def test_parse_cell_properties_grid_span(self):
        """Parse horizontal merge (grid span)."""
        elem = make_element('<w:tcPr><w:gridSpan w:val="3"/></w:tcPr>')
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.grid_span == 3

    def test_parse_cell_properties_vmerge_restart(self):
        """Parse vertical merge start."""
        elem = make_element('<w:tcPr><w:vMerge w:val="restart"/></w:tcPr>')
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.v_merge == "restart"

    def test_parse_cell_properties_vmerge_continue(self):
        """Parse vertical merge continue (no val attribute)."""
        elem = make_element("<w:tcPr><w:vMerge/></w:tcPr>")
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.v_merge == "continue"

    def test_parse_cell_properties_no_wrap(self):
        """Parse no wrap."""
        elem = make_element("<w:tcPr><w:noWrap/></w:tcPr>")
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.no_wrap is True

    def test_parse_cell_properties_fit_text(self):
        """Parse fit text."""
        elem = make_element("<w:tcPr><w:tcFitText/></w:tcPr>")
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_fit_text is True

    def test_parse_cell_properties_hide_mark(self):
        """Parse hide mark (for merged cells)."""
        elem = make_element("<w:tcPr><w:hideMark/></w:tcPr>")
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.hide_mark is True

    def test_parse_cell_properties_borders(self):
        """Parse cell borders."""
        elem = make_element("""
            <w:tcPr>
                <w:tcBorders>
                    <w:top w:val="single" w:sz="4" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:color="000000"/>
                </w:tcBorders>
            </w:tcPr>
        """)
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_borders is not None
        assert result.tc_borders.top is not None

    def test_parse_cell_properties_margins(self):
        """Parse cell margins."""
        elem = make_element("""
            <w:tcPr>
                <w:tcMar>
                    <w:top w:w="72" w:type="dxa"/>
                    <w:left w:w="115" w:type="dxa"/>
                </w:tcMar>
            </w:tcPr>
        """)
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_mar is not None
        assert result.tc_mar.top is not None
        assert result.tc_mar.top.w == 72

    def test_parse_cell_properties_comprehensive(self):
        """Parse comprehensive cell properties."""
        elem = make_element("""
            <w:tcPr>
                <w:tcW w:w="2880" w:type="dxa"/>
                <w:gridSpan w:val="2"/>
                <w:vMerge w:val="restart"/>
                <w:shd w:val="clear" w:fill="E0E0E0"/>
                <w:vAlign w:val="center"/>
                <w:noWrap/>
            </w:tcPr>
        """)
        result = parse_table_cell_properties(elem)
        assert result is not None
        assert result.tc_w is not None
        assert result.tc_w.w == 2880
        assert result.grid_span == 2
        assert result.v_merge == "restart"
        assert result.shd is not None
        assert result.shd.fill == "E0E0E0"
        assert result.v_align == "center"
        assert result.no_wrap is True


# =============================================================================
# Table Cell Parser Tests (<w:tc>)
# =============================================================================


class TestTableCellParser:
    """Tests for parse_table_cell function.

    XML Element: <w:tc>
    Children: tcPr, p, tbl (nested)
    """

    def test_parse_table_cell_none(self):
        """None input returns None."""
        result = parse_table_cell(None)
        assert result is None

    def test_parse_table_cell_empty(self):
        """Parse empty table cell."""
        elem = make_element("<w:tc/>")
        result = parse_table_cell(elem)
        assert result is not None
        assert result.tc_pr is None
        assert len(result.content) == 0

    def test_parse_table_cell_simple(self):
        """Parse simple table cell with text."""
        elem = make_element("""
            <w:tc>
                <w:p>
                    <w:r>
                        <w:t>Cell content</w:t>
                    </w:r>
                </w:p>
            </w:tc>
        """)
        result = parse_table_cell(elem)
        assert result is not None
        assert len(result.content) == 1

    def test_parse_table_cell_with_properties(self):
        """Parse table cell with properties."""
        elem = make_element("""
            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="2880" w:type="dxa"/>
                    <w:shd w:val="clear" w:fill="FFFF00"/>
                </w:tcPr>
                <w:p>
                    <w:r><w:t>Highlighted cell</w:t></w:r>
                </w:p>
            </w:tc>
        """)
        result = parse_table_cell(elem)
        assert result is not None
        assert result.tc_pr is not None
        assert result.tc_pr.tc_w is not None
        assert result.tc_pr.tc_w.w == 2880
        assert result.tc_pr.shd is not None
        assert result.tc_pr.shd.fill == "FFFF00"

    def test_parse_table_cell_multiple_paragraphs(self):
        """Parse table cell with multiple paragraphs."""
        elem = make_element("""
            <w:tc>
                <w:p><w:r><w:t>First paragraph</w:t></w:r></w:p>
                <w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>
            </w:tc>
        """)
        result = parse_table_cell(elem)
        assert result is not None
        assert len(result.content) == 2


# =============================================================================
# Table Row Height Parser Tests (<w:trHeight>)
# =============================================================================


class TestTableRowHeightParser:
    """Tests for parse_table_row_height function.

    XML Element: <w:trHeight>
    Attributes: val, hRule
    """

    def test_parse_row_height_none(self):
        """None input returns None."""
        result = parse_table_row_height(None)
        assert result is None

    def test_parse_row_height_auto(self):
        """Parse auto row height."""
        elem = make_element('<w:trHeight w:val="720" w:hRule="auto"/>')
        result = parse_table_row_height(elem)
        assert result is not None
        assert result.val == 720
        assert result.h_rule == "auto"

    def test_parse_row_height_exact(self):
        """Parse exact row height."""
        elem = make_element('<w:trHeight w:val="720" w:hRule="exact"/>')
        result = parse_table_row_height(elem)
        assert result is not None
        assert result.h_rule == "exact"

    def test_parse_row_height_at_least(self):
        """Parse atLeast row height."""
        elem = make_element('<w:trHeight w:val="360" w:hRule="atLeast"/>')
        result = parse_table_row_height(elem)
        assert result is not None
        assert result.h_rule == "atLeast"

    def test_parse_row_height_no_rule(self):
        """Parse row height without rule."""
        elem = make_element('<w:trHeight w:val="720"/>')
        result = parse_table_row_height(elem)
        assert result is not None
        assert result.val == 720
        assert result.h_rule is None


# =============================================================================
# Table Row Properties Parser Tests (<w:trPr>)
# =============================================================================


class TestTableRowPropertiesParser:
    """Tests for parse_table_row_properties function.

    XML Element: <w:trPr>
    Children: trHeight, tblHeader, jc, cantSplit, tblCellSpacing
    """

    def test_parse_row_properties_none(self):
        """None input returns None."""
        result = parse_table_row_properties(None)
        assert result is None

    def test_parse_row_properties_empty(self):
        """Parse empty row properties."""
        elem = make_element("<w:trPr/>")
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.tr_height is None
        assert result.tbl_header is None

    def test_parse_row_properties_height(self):
        """Parse row with height."""
        elem = make_element("""
            <w:trPr>
                <w:trHeight w:val="720" w:hRule="exact"/>
            </w:trPr>
        """)
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.tr_height is not None
        assert result.tr_height.val == 720
        assert result.tr_height.h_rule == "exact"

    def test_parse_row_properties_header(self):
        """Parse header row."""
        elem = make_element("<w:trPr><w:tblHeader/></w:trPr>")
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.tbl_header is True

    def test_parse_row_properties_cant_split(self):
        """Parse can't split row."""
        elem = make_element("<w:trPr><w:cantSplit/></w:trPr>")
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.cant_split is True

    def test_parse_row_properties_justification(self):
        """Parse row justification."""
        elem = make_element('<w:trPr><w:jc w:val="center"/></w:trPr>')
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.jc == "center"

    def test_parse_row_properties_cell_spacing(self):
        """Parse row cell spacing."""
        elem = make_element("""
            <w:trPr>
                <w:tblCellSpacing w:w="72" w:type="dxa"/>
            </w:trPr>
        """)
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.tbl_cell_spacing is not None
        assert result.tbl_cell_spacing.w == 72

    def test_parse_row_properties_comprehensive(self):
        """Parse comprehensive row properties."""
        elem = make_element("""
            <w:trPr>
                <w:trHeight w:val="720" w:hRule="exact"/>
                <w:tblHeader/>
                <w:cantSplit/>
                <w:jc w:val="center"/>
            </w:trPr>
        """)
        result = parse_table_row_properties(elem)
        assert result is not None
        assert result.tr_height is not None
        assert result.tr_height.val == 720
        assert result.tbl_header is True
        assert result.cant_split is True
        assert result.jc == "center"


# =============================================================================
# Table Row Parser Tests (<w:tr>)
# =============================================================================


class TestTableRowParser:
    """Tests for parse_table_row function.

    XML Element: <w:tr>
    Children: trPr, tc
    """

    def test_parse_table_row_none(self):
        """None input returns None."""
        result = parse_table_row(None)
        assert result is None

    def test_parse_table_row_empty(self):
        """Parse empty table row."""
        elem = make_element("<w:tr/>")
        result = parse_table_row(elem)
        assert result is not None
        assert result.tr_pr is None
        assert len(result.tc) == 0

    def test_parse_table_row_single_cell(self):
        """Parse row with single cell."""
        elem = make_element("""
            <w:tr>
                <w:tc>
                    <w:p><w:r><w:t>Cell</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
        """)
        result = parse_table_row(elem)
        assert result is not None
        assert len(result.tc) == 1

    def test_parse_table_row_multiple_cells(self):
        """Parse row with multiple cells."""
        elem = make_element("""
            <w:tr>
                <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Cell 3</w:t></w:r></w:p></w:tc>
            </w:tr>
        """)
        result = parse_table_row(elem)
        assert result is not None
        assert len(result.tc) == 3

    def test_parse_table_row_with_properties(self):
        """Parse row with properties."""
        elem = make_element("""
            <w:tr>
                <w:trPr>
                    <w:tblHeader/>
                </w:trPr>
                <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
            </w:tr>
        """)
        result = parse_table_row(elem)
        assert result is not None
        assert result.tr_pr is not None
        assert result.tr_pr.tbl_header is True


# =============================================================================
# Table Look Parser Tests (<w:tblLook>)
# =============================================================================


class TestTableLookParser:
    """Tests for parse_table_look function.

    XML Element: <w:tblLook>
    Attributes: firstRow, lastRow, firstColumn, lastColumn, noHBand, noVBand
    """

    def test_parse_table_look_none(self):
        """None input returns None."""
        result = parse_table_look(None)
        assert result is None

    def test_parse_table_look_all_on(self):
        """Parse table look with all features on."""
        elem = make_element(
            '<w:tblLook w:firstRow="1" w:lastRow="1" w:firstColumn="1" '
            'w:lastColumn="1" w:noHBand="0" w:noVBand="0"/>'
        )
        result = parse_table_look(elem)
        assert result is not None
        assert result.first_row is True
        assert result.last_row is True
        assert result.first_column is True
        assert result.last_column is True
        assert result.no_h_band is False
        assert result.no_v_band is False

    def test_parse_table_look_typical(self):
        """Parse typical table look (first row, no banding)."""
        elem = make_element(
            '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="1" '
            'w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
        )
        result = parse_table_look(elem)
        assert result is not None
        assert result.first_row is True
        assert result.last_row is False
        assert result.first_column is True
        assert result.no_v_band is True


# =============================================================================
# Table Properties Parser Tests (<w:tblPr>)
# =============================================================================


class TestTablePropertiesParser:
    """Tests for parse_table_properties function.

    XML Element: <w:tblPr>
    Children: tblStyle, tblW, jc, tblInd, tblBorders, shd,
              tblLayout, tblCellMar, tblLook, tblCaption, tblDescription
    """

    def test_parse_table_properties_none(self):
        """None input returns None."""
        result = parse_table_properties(None)
        assert result is None

    def test_parse_table_properties_empty(self):
        """Parse empty table properties."""
        elem = make_element("<w:tblPr/>")
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_style is None

    def test_parse_table_properties_style(self):
        """Parse table with style."""
        elem = make_element('<w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr>')
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_style == "TableGrid"

    def test_parse_table_properties_width(self):
        """Parse table width."""
        elem = make_element("""
            <w:tblPr>
                <w:tblW w:w="5000" w:type="pct"/>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_w is not None
        assert result.tbl_w.w == 5000
        assert result.tbl_w.type == "pct"

    def test_parse_table_properties_justification(self):
        """Parse table justification."""
        elem = make_element('<w:tblPr><w:jc w:val="center"/></w:tblPr>')
        result = parse_table_properties(elem)
        assert result is not None
        assert result.jc == "center"

    def test_parse_table_properties_indentation(self):
        """Parse table indentation."""
        elem = make_element("""
            <w:tblPr>
                <w:tblInd w:w="720" w:type="dxa"/>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_ind is not None
        assert result.tbl_ind.w == 720

    def test_parse_table_properties_borders(self):
        """Parse table borders."""
        elem = make_element("""
            <w:tblPr>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="000000"/>
                    <w:left w:val="single" w:sz="4" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:color="000000"/>
                    <w:right w:val="single" w:sz="4" w:color="000000"/>
                    <w:insideH w:val="single" w:sz="4" w:color="000000"/>
                    <w:insideV w:val="single" w:sz="4" w:color="000000"/>
                </w:tblBorders>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_borders is not None
        assert result.tbl_borders.top is not None
        assert result.tbl_borders.inside_h is not None

    def test_parse_table_properties_layout(self):
        """Parse table layout."""
        elem = make_element('<w:tblPr><w:tblLayout w:type="fixed"/></w:tblPr>')
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_layout == "fixed"

    def test_parse_table_properties_layout_values(self):
        """Test table layout values."""
        layouts = ["fixed", "autofit"]
        for layout in layouts:
            elem = make_element(f'<w:tblPr><w:tblLayout w:type="{layout}"/></w:tblPr>')
            result = parse_table_properties(elem)
            assert result is not None
            assert result.tbl_layout == layout

    def test_parse_table_properties_cell_margins(self):
        """Parse default cell margins."""
        elem = make_element("""
            <w:tblPr>
                <w:tblCellMar>
                    <w:top w:w="72" w:type="dxa"/>
                    <w:left w:w="115" w:type="dxa"/>
                    <w:bottom w:w="72" w:type="dxa"/>
                    <w:right w:w="115" w:type="dxa"/>
                </w:tblCellMar>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_cell_mar is not None
        assert result.tbl_cell_mar.top is not None
        assert result.tbl_cell_mar.top.w == 72

    def test_parse_table_properties_caption(self):
        """Parse table caption."""
        elem = make_element('<w:tblPr><w:tblCaption w:val="Sales Data"/></w:tblPr>')
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_caption == "Sales Data"

    def test_parse_table_properties_description(self):
        """Parse table description."""
        elem = make_element(
            '<w:tblPr><w:tblDescription w:val="Quarterly sales figures"/></w:tblPr>'
        )
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_description == "Quarterly sales figures"

    def test_parse_table_properties_look(self):
        """Parse table look."""
        elem = make_element("""
            <w:tblPr>
                <w:tblLook w:firstRow="1" w:firstColumn="1" w:noVBand="1"/>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_look is not None
        assert result.tbl_look.first_row is True

    def test_parse_table_properties_comprehensive(self):
        """Parse comprehensive table properties."""
        elem = make_element("""
            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="5000" w:type="pct"/>
                <w:jc w:val="center"/>
                <w:tblLayout w:type="fixed"/>
                <w:tblLook w:firstRow="1" w:noVBand="1"/>
            </w:tblPr>
        """)
        result = parse_table_properties(elem)
        assert result is not None
        assert result.tbl_style == "TableGrid"
        assert result.tbl_w is not None
        assert result.tbl_w.type == "pct"
        assert result.jc == "center"
        assert result.tbl_layout == "fixed"
        assert result.tbl_look is not None
        assert result.tbl_look.first_row is True


# =============================================================================
# Table Parser Tests (<w:tbl>)
# =============================================================================


class TestTableParser:
    """Tests for parse_table function.

    XML Element: <w:tbl>
    Children: tblPr, tblGrid, tr
    """

    def test_parse_table_none(self):
        """None input returns None."""
        result = parse_table(None)
        assert result is None

    def test_parse_table_empty(self):
        """Parse empty table."""
        elem = make_element("<w:tbl/>")
        result = parse_table(elem)
        assert result is not None
        assert result.tbl_pr is None
        assert result.tbl_grid is None
        assert len(result.tr) == 0

    def test_parse_table_simple(self):
        """Parse simple 2x2 table."""
        elem = make_element("""
            <w:tbl>
                <w:tblPr>
                    <w:tblStyle w:val="TableGrid"/>
                </w:tblPr>
                <w:tblGrid>
                    <w:gridCol w:w="2880"/>
                    <w:gridCol w:w="2880"/>
                </w:tblGrid>
                <w:tr>
                    <w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc>
                </w:tr>
                <w:tr>
                    <w:tc><w:p><w:r><w:t>A2</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>B2</w:t></w:r></w:p></w:tc>
                </w:tr>
            </w:tbl>
        """)
        result = parse_table(elem)
        assert result is not None
        assert result.tbl_pr is not None
        assert result.tbl_pr.tbl_style == "TableGrid"
        assert result.tbl_grid is not None
        assert len(result.tbl_grid.grid_col) == 2
        assert len(result.tr) == 2
        assert len(result.tr[0].tc) == 2

    def test_parse_table_with_header(self):
        """Parse table with header row."""
        elem = make_element("""
            <w:tbl>
                <w:tblPr>
                    <w:tblLook w:firstRow="1"/>
                </w:tblPr>
                <w:tblGrid>
                    <w:gridCol w:w="2880"/>
                </w:tblGrid>
                <w:tr>
                    <w:trPr><w:tblHeader/></w:trPr>
                    <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
                </w:tr>
                <w:tr>
                    <w:tc><w:p><w:r><w:t>Data</w:t></w:r></w:p></w:tc>
                </w:tr>
            </w:tbl>
        """)
        result = parse_table(elem)
        assert result is not None
        assert result.tbl_pr is not None
        assert result.tbl_pr.tbl_look is not None
        assert result.tbl_pr.tbl_look.first_row is True
        assert result.tr[0].tr_pr is not None
        assert result.tr[0].tr_pr.tbl_header is True

    def test_parse_table_merged_cells(self):
        """Parse table with merged cells."""
        elem = make_element("""
            <w:tbl>
                <w:tblGrid>
                    <w:gridCol w:w="2880"/>
                    <w:gridCol w:w="2880"/>
                </w:tblGrid>
                <w:tr>
                    <w:tc>
                        <w:tcPr><w:gridSpan w:val="2"/></w:tcPr>
                        <w:p><w:r><w:t>Merged</w:t></w:r></w:p>
                    </w:tc>
                </w:tr>
            </w:tbl>
        """)
        result = parse_table(elem)
        assert result is not None
        assert result.tr[0].tc[0].tc_pr is not None
        assert result.tr[0].tc[0].tc_pr.grid_span == 2
