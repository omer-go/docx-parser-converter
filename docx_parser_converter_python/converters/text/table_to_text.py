"""Table to text converter.

Converts Table elements to plain text in various modes (ASCII, tabs, plain).
"""

from typing import Literal

from converters.text.paragraph_to_text import paragraph_to_text
from models.document.paragraph import Paragraph
from models.document.table import Table
from models.document.table_cell import TableCell
from models.document.table_row import TableRow

# =============================================================================
# Type Definitions
# =============================================================================


TableMode = Literal["ascii", "tabs", "plain", "auto"]


# =============================================================================
# Cell Content Extraction
# =============================================================================


def cell_to_text(cell: TableCell | None) -> str:
    """Extract text content from a table cell.

    Args:
        cell: TableCell element or None

    Returns:
        Text content of the cell
    """
    if cell is None:
        return ""

    parts = []
    for content in cell.content:
        if isinstance(content, Paragraph):
            text = paragraph_to_text(content)
            if text:
                parts.append(text)

    return "\n".join(parts)


def row_to_text(row: TableRow | None, separator: str = "\t") -> str:
    """Extract text content from a table row.

    Args:
        row: TableRow element or None
        separator: Cell separator string

    Returns:
        Text content of the row
    """
    if row is None:
        return ""

    cells = []
    for cell in row.tc:
        text = cell_to_text(cell)
        cells.append(text)

    return separator.join(cells)


# =============================================================================
# Border Detection
# =============================================================================


def has_visible_borders(table: Table) -> bool:
    """Check if table has visible borders.

    Args:
        table: Table element

    Returns:
        True if table has visible borders
    """
    if not table.tbl_pr or not table.tbl_pr.tbl_borders:
        return False

    borders = table.tbl_pr.tbl_borders

    # Check all border types
    for border in [
        borders.top,
        borders.bottom,
        borders.left,
        borders.right,
        borders.inside_h,
        borders.inside_v,
    ]:
        if border and border.val and border.val not in ("none", "nil"):
            return True

    return False


# =============================================================================
# ASCII Box Mode
# =============================================================================


def table_to_ascii(table: Table) -> str:
    """Convert table to ASCII box format.

    Args:
        table: Table element

    Returns:
        ASCII box representation
    """
    if not table.tr:
        return ""

    # Extract all cell contents and calculate column widths
    rows_data: list[list[str]] = []
    max_cols = 0

    for row in table.tr:
        cells = []
        for cell in row.tc:
            text = cell_to_text(cell)
            # Replace newlines in cell with space for single-line cells
            text = text.replace("\n", " ")
            cells.append(text)
        rows_data.append(cells)
        max_cols = max(max_cols, len(cells))

    if not rows_data:
        return ""

    # Pad rows to have same number of columns
    for row in rows_data:
        while len(row) < max_cols:
            row.append("")

    # Calculate column widths
    col_widths = []
    for col_idx in range(max_cols):
        max_width = 1  # Minimum width
        for row in rows_data:
            if col_idx < len(row):
                max_width = max(max_width, len(row[col_idx]))
        col_widths.append(max_width)

    # Build ASCII table
    lines = []

    # Top border
    top_border = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    lines.append(top_border)

    # Data rows
    for row_idx, row in enumerate(rows_data):
        # Row content
        cells = []
        for col_idx, cell in enumerate(row):
            width = col_widths[col_idx]
            cells.append(f" {cell.ljust(width)} ")
        lines.append("|" + "|".join(cells) + "|")

        # Row separator (between rows)
        if row_idx < len(rows_data) - 1:
            separator = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
            lines.append(separator)

    # Bottom border
    bottom_border = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    lines.append(bottom_border)

    return "\n".join(lines)


# =============================================================================
# Tab-Separated Mode
# =============================================================================


def table_to_tabs(table: Table) -> str:
    """Convert table to tab-separated format.

    Args:
        table: Table element

    Returns:
        Tab-separated representation
    """
    if not table.tr:
        return ""

    lines = []
    for row in table.tr:
        line = row_to_text(row, separator="\t")
        lines.append(line)

    return "\n".join(lines)


# =============================================================================
# Plain Text Mode
# =============================================================================


def table_to_plain(table: Table) -> str:
    """Convert table to plain text format.

    Args:
        table: Table element

    Returns:
        Plain text representation
    """
    if not table.tr:
        return ""

    lines = []
    for row in table.tr:
        line = row_to_text(row, separator="  ")
        lines.append(line)

    return "\n".join(lines)


# =============================================================================
# Main Entry Point
# =============================================================================


def table_to_text(
    table: Table | None,
    mode: TableMode = "auto",
) -> str:
    """Convert a Table to text.

    Args:
        table: Table element or None
        mode: Table rendering mode (ascii, tabs, plain, auto)

    Returns:
        Text representation of the table
    """
    if table is None:
        return ""

    if not table.tr:
        return ""

    # Determine actual mode for auto
    actual_mode = mode
    if mode == "auto":
        actual_mode = "ascii" if has_visible_borders(table) else "tabs"

    # Convert based on mode
    if actual_mode == "ascii":
        return table_to_ascii(table)
    elif actual_mode == "tabs":
        return table_to_tabs(table)
    else:  # plain
        return table_to_plain(table)


# =============================================================================
# Table to Text Converter Class
# =============================================================================


class TableToTextConverter:
    """Converter for Table elements to plain text."""

    mode: TableMode

    def __init__(
        self,
        *,
        mode: TableMode = "auto",
    ) -> None:
        """Initialize table converter.

        Args:
            mode: Table rendering mode (ascii, tabs, plain, auto)
        """
        self.mode = mode

    def convert(self, table: Table | None) -> str:
        """Convert a Table to text.

        Args:
            table: Table element or None

        Returns:
            Text representation
        """
        return table_to_text(table, mode=self.mode)
