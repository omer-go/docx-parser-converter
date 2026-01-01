"""Table to HTML converter.

Converts Table elements to HTML table structure with appropriate styling.
"""

from html import escape
from typing import TYPE_CHECKING

from converters.html.css_generator import (
    CSSGenerator,
    border_to_css,
    shading_to_css,
    table_cell_properties_to_css,
    twips_to_pt,
    width_to_css,
)
from converters.html.paragraph_to_html import paragraph_to_html
from models.document.paragraph import Paragraph
from models.document.table import Table, TableProperties
from models.document.table_cell import TableCell
from models.document.table_row import TableRow, TableRowProperties

if TYPE_CHECKING:
    from converters.common.style_resolver import StyleResolver

# =============================================================================
# Table Properties to CSS
# =============================================================================


def table_properties_to_css(tbl_pr: TableProperties | None) -> dict[str, str]:
    """Convert TableProperties to CSS properties.

    Args:
        tbl_pr: Table properties

    Returns:
        Dictionary of CSS property names to values
    """
    result: dict[str, str] = {}

    if tbl_pr is None:
        return result

    # Table width
    if tbl_pr.tbl_w:
        width = width_to_css(tbl_pr.tbl_w)
        if width:
            result["width"] = width

    # Table alignment (justification)
    if tbl_pr.jc:
        if tbl_pr.jc == "center":
            result["margin-left"] = "auto"
            result["margin-right"] = "auto"
        elif tbl_pr.jc == "right":
            result["margin-left"] = "auto"
            result["margin-right"] = "0"

    # Table indentation
    if tbl_pr.tbl_ind:
        indent = width_to_css(tbl_pr.tbl_ind)
        if indent:
            result["margin-left"] = indent

    # Table layout
    if tbl_pr.tbl_layout:
        if tbl_pr.tbl_layout == "fixed":
            result["table-layout"] = "fixed"
        else:
            result["table-layout"] = "auto"

    # Table shading
    if tbl_pr.shd:
        shd_css = shading_to_css(tbl_pr.shd)
        if shd_css:
            result["background-color"] = shd_css

    # Border collapse (always use for DOCX tables)
    result["border-collapse"] = "collapse"

    return result


def table_borders_to_css(tbl_pr: TableProperties | None) -> dict[str, str]:
    """Convert table borders to CSS.

    Args:
        tbl_pr: Table properties

    Returns:
        Dictionary of CSS border properties
    """
    result: dict[str, str] = {}

    if tbl_pr is None or tbl_pr.tbl_borders is None:
        return result

    borders = tbl_pr.tbl_borders

    if borders.top:
        top_css = border_to_css(borders.top)
        if top_css:
            result["border-top"] = top_css

    if borders.bottom:
        bottom_css = border_to_css(borders.bottom)
        if bottom_css:
            result["border-bottom"] = bottom_css

    if borders.left:
        left_css = border_to_css(borders.left)
        if left_css:
            result["border-left"] = left_css

    if borders.right:
        right_css = border_to_css(borders.right)
        if right_css:
            result["border-right"] = right_css

    return result


# =============================================================================
# Row Properties to CSS
# =============================================================================


def row_properties_to_css(tr_pr: TableRowProperties | None) -> dict[str, str]:
    """Convert TableRowProperties to CSS properties.

    Args:
        tr_pr: Row properties

    Returns:
        Dictionary of CSS property names to values
    """
    result: dict[str, str] = {}

    if tr_pr is None:
        return result

    # Row height
    if tr_pr.tr_height:
        height = twips_to_pt(tr_pr.tr_height.val)
        if height is not None:
            if tr_pr.tr_height.h_rule == "exact":
                result["height"] = f"{height}pt"
            else:
                result["min-height"] = f"{height}pt"

    # Row can't split
    if tr_pr.cant_split:
        result["break-inside"] = "avoid"

    return result


# =============================================================================
# Cell Rowspan Calculation
# =============================================================================


def calculate_rowspans(table: Table) -> dict[tuple[int, int], int]:
    """Calculate rowspan values for cells with vMerge.

    Args:
        table: Table model

    Returns:
        Dictionary mapping (row_index, cell_index) to rowspan value
    """
    rowspans: dict[tuple[int, int], int] = {}

    if not table.tr:
        return rowspans

    # Track which cells are "restart" points for vertical merges
    # and count how many rows they span
    num_rows = len(table.tr)

    for row_idx, row in enumerate(table.tr):
        for cell_idx, cell in enumerate(row.tc):
            if cell.tc_pr and cell.tc_pr.v_merge == "restart":
                # Count how many rows this merge spans
                span = 1
                for next_row_idx in range(row_idx + 1, num_rows):
                    next_row = table.tr[next_row_idx]
                    if cell_idx < len(next_row.tc):
                        next_cell = next_row.tc[cell_idx]
                        if next_cell.tc_pr and next_cell.tc_pr.v_merge == "continue":
                            span += 1
                        else:
                            break
                    else:
                        break
                if span > 1:
                    rowspans[(row_idx, cell_idx)] = span

    return rowspans


def is_merged_cell(cell: TableCell) -> bool:
    """Check if a cell is a continuation of a vertical merge.

    Args:
        cell: Table cell

    Returns:
        True if this cell continues a vertical merge
    """
    return cell.tc_pr is not None and cell.tc_pr.v_merge == "continue"


# =============================================================================
# Cell Content Conversion
# =============================================================================


def cell_content_to_html(
    content: list,
    *,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert cell content to HTML.

    Args:
        content: List of paragraphs/tables
        relationships: Relationship map for hyperlinks
        use_semantic_tags: Use semantic tags
        css_generator: CSS generator
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML content
    """
    result = []

    for item in content:
        if isinstance(item, Paragraph):
            html = paragraph_to_html(
                item,
                relationships=relationships,
                use_semantic_tags=use_semantic_tags,
                css_generator=css_generator,
                style_resolver=style_resolver,
            )
            result.append(html)
        elif isinstance(item, Table):
            # Nested table
            html = table_to_html(
                item,
                relationships=relationships,
                use_semantic_tags=use_semantic_tags,
                css_generator=css_generator,
                style_resolver=style_resolver,
            )
            result.append(html)

    return "".join(result)


# =============================================================================
# Table Cell Conversion
# =============================================================================


def cell_to_html(
    cell: TableCell,
    *,
    is_header: bool = False,
    colspan: int | None = None,
    rowspan: int | None = None,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert TableCell to HTML td or th element.

    Args:
        cell: Table cell model
        is_header: Whether this is a header cell
        colspan: Colspan value (from gridSpan)
        rowspan: Rowspan value (from vMerge)
        relationships: Relationship map
        use_semantic_tags: Use semantic tags
        css_generator: CSS generator
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML td or th element
    """
    gen = css_generator or CSSGenerator()

    # Determine tag
    tag = "th" if is_header else "td"

    # Build attributes
    attrs: list[str] = []

    # Colspan
    if colspan and colspan > 1:
        attrs.append(f'colspan="{colspan}"')

    # Rowspan
    if rowspan and rowspan > 1:
        attrs.append(f'rowspan="{rowspan}"')

    # Scope for headers
    if is_header:
        attrs.append('scope="col"')

    # CSS from cell properties
    css_props = table_cell_properties_to_css(cell.tc_pr)

    # Generate style attribute
    style = gen.generate_inline_style(css_props)
    if style:
        attrs.append(f'style="{style}"')

    # Build opening tag
    attr_str = f" {' '.join(attrs)}" if attrs else ""

    # Convert content
    content_html = cell_content_to_html(
        cell.content,
        relationships=relationships,
        use_semantic_tags=use_semantic_tags,
        css_generator=gen,
        style_resolver=style_resolver,
    )

    # If cell is empty, add non-breaking space for proper rendering
    if not content_html.strip():
        content_html = "&nbsp;"

    return f"<{tag}{attr_str}>{content_html}</{tag}>"


# =============================================================================
# Table Row Conversion
# =============================================================================


def row_to_html(
    row: TableRow,
    row_idx: int,
    *,
    is_header_row: bool = False,
    rowspans: dict[tuple[int, int], int] | None = None,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert TableRow to HTML tr element.

    Args:
        row: Table row model
        row_idx: Row index in table
        is_header_row: Whether this is a header row
        rowspans: Pre-calculated rowspan values
        relationships: Relationship map
        use_semantic_tags: Use semantic tags
        css_generator: CSS generator
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML tr element
    """
    gen = css_generator or CSSGenerator()
    rowspans = rowspans or {}

    # CSS from row properties
    css_props = row_properties_to_css(row.tr_pr)
    style = gen.generate_inline_style(css_props)

    # Build row tag
    attrs: list[str] = []
    if style:
        attrs.append(f'style="{style}"')
    attr_str = f" {' '.join(attrs)}" if attrs else ""

    # Convert cells
    cells_html = []
    for cell_idx, cell in enumerate(row.tc):
        # Skip cells that continue a vertical merge
        if is_merged_cell(cell):
            continue

        # Get colspan from gridSpan
        colspan = cell.tc_pr.grid_span if cell.tc_pr else None

        # Get rowspan from pre-calculated values
        rowspan = rowspans.get((row_idx, cell_idx))

        cell_html = cell_to_html(
            cell,
            is_header=is_header_row,
            colspan=colspan,
            rowspan=rowspan,
            relationships=relationships,
            use_semantic_tags=use_semantic_tags,
            css_generator=gen,
            style_resolver=style_resolver,
        )
        cells_html.append(cell_html)

    return f"<tr{attr_str}>{''.join(cells_html)}</tr>"


# =============================================================================
# Table Conversion
# =============================================================================


def table_to_html(
    table: Table | None,
    *,
    relationships: dict[str, str] | None = None,
    use_semantic_tags: bool = True,
    css_generator: CSSGenerator | None = None,
    style_resolver: "StyleResolver | None" = None,
) -> str:
    """Convert Table element to HTML.

    Args:
        table: Table model instance
        relationships: Relationship map for hyperlinks
        use_semantic_tags: Use semantic tags
        css_generator: CSS generator instance
        style_resolver: Style resolver for style inheritance

    Returns:
        HTML table element
    """
    if table is None:
        return ""

    if not table.tr:
        return "<table></table>"

    gen = css_generator or CSSGenerator()

    # Calculate rowspans for vMerge
    rowspans = calculate_rowspans(table)

    # CSS from table properties
    css_props = table_properties_to_css(table.tbl_pr)
    border_props = table_borders_to_css(table.tbl_pr)
    css_props.update(border_props)

    style = gen.generate_inline_style(css_props)

    # Build table tag
    attrs: list[str] = []
    if style:
        attrs.append(f'style="{style}"')

    # Caption
    if table.tbl_pr and table.tbl_pr.tbl_caption:
        attrs.append(f'aria-label="{escape(table.tbl_pr.tbl_caption)}"')

    attr_str = f" {' '.join(attrs)}" if attrs else ""

    # Build colgroup if grid columns defined
    colgroup_html = ""
    if table.tbl_grid and table.tbl_grid.grid_col:
        cols = []
        for col in table.tbl_grid.grid_col:
            if col.w:
                width = twips_to_pt(col.w)
                if width:
                    cols.append(f'<col style="width: {width}pt">')
                else:
                    cols.append("<col>")
            else:
                cols.append("<col>")
        colgroup_html = f"<colgroup>{''.join(cols)}</colgroup>"

    # Build caption element
    caption_html = ""
    if table.tbl_pr and table.tbl_pr.tbl_caption:
        caption_html = f"<caption>{escape(table.tbl_pr.tbl_caption)}</caption>"

    # Separate header and body rows
    header_rows = []
    body_rows = []

    for row_idx, row in enumerate(table.tr):
        is_header = row.tr_pr and row.tr_pr.tbl_header
        row_html = row_to_html(
            row,
            row_idx,
            is_header_row=bool(is_header),
            rowspans=rowspans,
            relationships=relationships,
            use_semantic_tags=use_semantic_tags,
            css_generator=gen,
            style_resolver=style_resolver,
        )
        if is_header:
            header_rows.append(row_html)
        else:
            body_rows.append(row_html)

    # Build thead and tbody
    thead_html = ""
    if header_rows:
        thead_html = f"<thead>{''.join(header_rows)}</thead>"

    tbody_html = f"<tbody>{''.join(body_rows)}</tbody>" if body_rows else ""

    # If no separation, just use rows directly
    if not header_rows and body_rows:
        return f"<table{attr_str}>{colgroup_html}{caption_html}{''.join(body_rows)}</table>"

    return f"<table{attr_str}>{colgroup_html}{caption_html}{thead_html}{tbody_html}</table>"


# =============================================================================
# Table to HTML Converter Class
# =============================================================================


class TableToHTMLConverter:
    """Converter for Table elements to HTML."""

    def __init__(
        self,
        *,
        use_semantic_tags: bool = True,
        use_classes: bool = False,
        use_inline_styles: bool = True,
        css_generator: CSSGenerator | None = None,
    ) -> None:
        """Initialize table converter.

        Args:
            use_semantic_tags: Use semantic tags
            use_classes: Use CSS classes instead of inline styles
            use_inline_styles: Use inline styles
            css_generator: CSS generator instance
        """
        self.use_semantic_tags = use_semantic_tags
        self.use_classes = use_classes
        self.use_inline_styles = use_inline_styles
        self.css_generator = css_generator or CSSGenerator()
        self.relationships: dict[str, str] = {}

    def set_relationships(self, relationships: dict[str, str]) -> None:
        """Set the relationship map for hyperlinks.

        Args:
            relationships: Dict mapping r:id to URL
        """
        self.relationships = relationships

    def convert(self, table: Table | None) -> str:
        """Convert Table to HTML.

        Args:
            table: Table model instance

        Returns:
            HTML representation
        """
        return table_to_html(
            table,
            relationships=self.relationships,
            use_semantic_tags=self.use_semantic_tags,
            css_generator=self.css_generator,
        )

    def convert_row(
        self,
        row: TableRow,
        row_idx: int = 0,
        *,
        is_header_row: bool = False,
    ) -> str:
        """Convert table row to HTML.

        Args:
            row: Table row
            row_idx: Row index
            is_header_row: Whether this is a header row

        Returns:
            HTML tr element
        """
        return row_to_html(
            row,
            row_idx,
            is_header_row=is_header_row,
            relationships=self.relationships,
            use_semantic_tags=self.use_semantic_tags,
            css_generator=self.css_generator,
        )

    def convert_cell(
        self,
        cell: TableCell,
        *,
        is_header: bool = False,
    ) -> str:
        """Convert table cell to HTML.

        Args:
            cell: Table cell
            is_header: Whether this is a header cell

        Returns:
            HTML td or th element
        """
        return cell_to_html(
            cell,
            is_header=is_header,
            relationships=self.relationships,
            use_semantic_tags=self.use_semantic_tags,
            css_generator=self.css_generator,
        )
