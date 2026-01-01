"""CSS generator for converting DOCX properties to CSS.

Provides functions for converting DOCX formatting properties to CSS styles.
"""

from models.common.border import Border, ParagraphBorders, TableBorders
from models.common.color import Color
from models.common.shading import Shading
from models.common.width import Width
from models.document.paragraph import ParagraphProperties
from models.document.run import RunFonts, RunProperties
from models.document.table_cell import TableCellMargins, TableCellProperties

# =============================================================================
# Unit Conversion Constants
# =============================================================================

# 1 inch = 72 points = 1440 twips
TWIPS_PER_POINT = 20
TWIPS_PER_INCH = 1440

# Half-points (used for font size)
HALF_POINTS_PER_POINT = 2

# Eighths of a point (used for border width)
EIGHTHS_PER_POINT = 8

# EMUs (English Metric Units) - used for images
EMUS_PER_INCH = 914400
EMUS_PER_POINT = 12700
EMUS_PER_PIXEL = 9525  # Approximate at 96 DPI


# =============================================================================
# Highlight Color Mapping
# =============================================================================

HIGHLIGHT_COLORS: dict[str, str] = {
    "yellow": "#FFFF00",
    "green": "#00FF00",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
    "blue": "#0000FF",
    "red": "#FF0000",
    "darkBlue": "#00008B",
    "darkCyan": "#008B8B",
    "darkGreen": "#006400",
    "darkMagenta": "#8B008B",
    "darkRed": "#8B0000",
    "darkYellow": "#808000",
    "darkGray": "#A9A9A9",
    "lightGray": "#D3D3D3",
    "black": "#000000",
    "white": "#FFFFFF",
}


# =============================================================================
# Border Style Mapping
# =============================================================================

BORDER_STYLES: dict[str, str] = {
    "single": "solid",
    "double": "double",
    "dashed": "dashed",
    "dotted": "dotted",
    "dashDotStroked": "dashed",
    "dashSmallGap": "dashed",
    "dotDash": "dashed",
    "dotDotDash": "dotted",
    "triple": "double",
    "thick": "solid",
    "thickThinSmallGap": "double",
    "thinThickSmallGap": "double",
    "thickThinMediumGap": "double",
    "thinThickMediumGap": "double",
    "thickThinLargeGap": "double",
    "thinThickLargeGap": "double",
    "wave": "solid",
    "doubleWave": "double",
    "inset": "inset",
    "outset": "outset",
    "nil": "none",
    "none": "none",
}


# =============================================================================
# Underline Style Mapping
# =============================================================================

# Maps DOCX underline styles to CSS text-decoration-style values
UNDERLINE_STYLES: dict[str, str] = {
    "single": "solid",
    "words": "solid",  # Underline only words (closest approximation)
    "double": "double",
    "thick": "solid",  # No CSS equivalent for thick, use solid
    "dotted": "dotted",
    "dottedHeavy": "dotted",
    "dash": "dashed",
    "dashedHeavy": "dashed",
    "dashLong": "dashed",
    "dashLongHeavy": "dashed",
    "dotDash": "dashed",
    "dashDotHeavy": "dashed",
    "dotDotDash": "dashed",
    "dashDotDotHeavy": "dashed",
    "wave": "wavy",
    "wavyHeavy": "wavy",
    "wavyDouble": "wavy",  # No double-wavy in CSS
}


# =============================================================================
# Unit Conversion Functions
# =============================================================================


def twips_to_pt(twips: int | None) -> float | None:
    """Convert twips to points.

    Args:
        twips: Value in twips (1/20 of a point)

    Returns:
        Value in points, or None if input is None
    """
    if twips is None:
        return None
    return twips / TWIPS_PER_POINT


def twips_to_px(twips: int | None, dpi: int = 96) -> float | None:
    """Convert twips to pixels.

    Args:
        twips: Value in twips
        dpi: Dots per inch (default 96)

    Returns:
        Value in pixels, or None if input is None
    """
    if twips is None:
        return None
    inches = twips / TWIPS_PER_INCH
    return inches * dpi


def half_points_to_pt(half_points: int | None) -> float | None:
    """Convert half-points to points.

    Args:
        half_points: Value in half-points (used for font size)

    Returns:
        Value in points, or None if input is None
    """
    if half_points is None:
        return None
    return half_points / HALF_POINTS_PER_POINT


def eighths_to_pt(eighths: int | None) -> float | None:
    """Convert eighths of a point to points.

    Args:
        eighths: Value in eighths of a point (used for border width)

    Returns:
        Value in points, or None if input is None
    """
    if eighths is None:
        return None
    return eighths / EIGHTHS_PER_POINT


def emu_to_px(emu: int | None, dpi: int = 96) -> float | None:
    """Convert EMUs to pixels.

    Args:
        emu: Value in English Metric Units
        dpi: Dots per inch (default 96)

    Returns:
        Value in pixels, or None if input is None
    """
    if emu is None:
        return None
    return emu / EMUS_PER_PIXEL


# =============================================================================
# Color Conversion Functions
# =============================================================================


def color_to_css(color: Color | None) -> str | None:
    """Convert Color model to CSS color value.

    Args:
        color: Color model instance

    Returns:
        CSS color string (e.g., "#FF0000") or None
    """
    if color is None:
        return None

    # Check for "auto" color (system default)
    if color.val and color.val.lower() == "auto":
        return None  # Let browser use default

    # Direct hex color value
    if color.val:
        hex_val = color.val.upper()
        # Ensure it's a valid 6-character hex
        if len(hex_val) == 6 and all(c in "0123456789ABCDEF" for c in hex_val):
            return f"#{hex_val}"
        return f"#{hex_val}"

    # Theme color (would need theme resolution - return None for now)
    if color.theme_color:
        # Theme colors need to be resolved from theme part
        # For now, return a placeholder or None
        return None

    return None


def highlight_to_css(highlight: str | None) -> str | None:
    """Convert highlight color name to CSS color.

    Args:
        highlight: Highlight color name (e.g., "yellow", "green")

    Returns:
        CSS color string or None
    """
    if highlight is None:
        return None

    # Handle "none" explicitly
    if highlight.lower() == "none":
        return None

    return HIGHLIGHT_COLORS.get(highlight)


# =============================================================================
# Font Conversion Functions
# =============================================================================


def font_family_to_css(fonts: RunFonts | None) -> str | None:
    """Convert RunFonts to CSS font-family.

    Args:
        fonts: RunFonts model instance

    Returns:
        CSS font-family value or None
    """
    if fonts is None:
        return None

    # Priority: ascii, hAnsi, cs, eastAsia
    font_name = fonts.ascii or fonts.h_ansi or fonts.cs or fonts.east_asia

    if font_name is None:
        return None

    # Quote font names with spaces (use single quotes for HTML attribute compatibility)
    if " " in font_name:
        return f"'{font_name}'"

    return font_name


def font_size_to_css(sz: int | None) -> str | None:
    """Convert font size (half-points) to CSS.

    Args:
        sz: Font size in half-points

    Returns:
        CSS font-size value (e.g., "12pt") or None
    """
    if sz is None:
        return None

    points = half_points_to_pt(sz)
    if points is None:
        return None

    # Format nicely - use integer if whole number
    if points == int(points):
        return f"{int(points)}pt"
    return f"{points}pt"


# =============================================================================
# Border Conversion Functions
# =============================================================================


def border_to_css(border: Border | None) -> str | None:
    """Convert Border model to CSS border value.

    Args:
        border: Border model instance

    Returns:
        CSS border value (e.g., "1pt solid #000000") or None
    """
    if border is None:
        return None

    # Check for nil/none border
    if border.val and border.val.lower() in ("nil", "none"):
        return "none"

    # Get border style
    style = BORDER_STYLES.get(border.val or "single", "solid")

    # Get border width (sz is in eighths of a point)
    width_pt = eighths_to_pt(border.sz) if border.sz else 1
    if width_pt is None:
        width_pt = 1

    # Get border color
    if border.color and border.color.lower() != "auto":
        color = f"#{border.color.upper()}"
    else:
        color = "#000000"  # Default to black

    return f"{width_pt}pt {style} {color}"


def paragraph_borders_to_css(borders: ParagraphBorders | None) -> dict[str, str]:
    """Convert ParagraphBorders to CSS properties.

    Args:
        borders: ParagraphBorders model instance

    Returns:
        Dictionary of CSS property-value pairs
    """
    result: dict[str, str] = {}

    if borders is None:
        return result

    if borders.top:
        css = border_to_css(borders.top)
        if css:
            result["border-top"] = css

    if borders.bottom:
        css = border_to_css(borders.bottom)
        if css:
            result["border-bottom"] = css

    if borders.left:
        css = border_to_css(borders.left)
        if css:
            result["border-left"] = css

    if borders.right:
        css = border_to_css(borders.right)
        if css:
            result["border-right"] = css

    return result


def table_borders_to_css(borders: TableBorders | None) -> dict[str, str]:
    """Convert TableBorders to CSS properties.

    Args:
        borders: TableBorders model instance

    Returns:
        Dictionary of CSS property-value pairs
    """
    result: dict[str, str] = {}

    if borders is None:
        return result

    if borders.top:
        css = border_to_css(borders.top)
        if css:
            result["border-top"] = css

    if borders.bottom:
        css = border_to_css(borders.bottom)
        if css:
            result["border-bottom"] = css

    if borders.left:
        css = border_to_css(borders.left)
        if css:
            result["border-left"] = css

    if borders.right:
        css = border_to_css(borders.right)
        if css:
            result["border-right"] = css

    return result


# =============================================================================
# Shading Conversion Functions
# =============================================================================


def shading_to_css(shading: Shading | None) -> str | None:
    """Convert Shading model to CSS background-color.

    Args:
        shading: Shading model instance

    Returns:
        CSS background-color value or None
    """
    if shading is None:
        return None

    # Check for clear/nil shading
    if shading.val and shading.val.lower() in ("clear", "nil"):
        # For clear, use the fill color if present
        if shading.fill and shading.fill.lower() not in ("auto", ""):
            return f"#{shading.fill.upper()}"
        return None

    # Use fill color if present
    if shading.fill and shading.fill.lower() not in ("auto", ""):
        return f"#{shading.fill.upper()}"

    return None


# =============================================================================
# Width Conversion Functions
# =============================================================================


def width_to_css(width: Width | None) -> str | None:
    """Convert Width model to CSS width value.

    Args:
        width: Width model instance

    Returns:
        CSS width value or None
    """
    if width is None:
        return None

    width_type = width.type or "dxa"

    if width_type == "auto":
        return "auto"

    if width_type == "pct":
        # Percentage is in fiftieths of a percent
        if width.w is not None:
            pct = width.w / 50
            return f"{pct}%"
        return None

    if width_type == "dxa":
        # DXA is twips
        if width.w is not None:
            pt = twips_to_pt(width.w)
            if pt is not None:
                if pt == int(pt):
                    return f"{int(pt)}pt"
                return f"{pt:.2f}pt"
        return None

    if width_type == "nil":
        return "0"

    return None


# =============================================================================
# Run Properties Conversion
# =============================================================================


def run_properties_to_css(r_pr: RunProperties | None) -> dict[str, str]:
    """Convert RunProperties to CSS properties.

    Args:
        r_pr: RunProperties model instance

    Returns:
        Dictionary of CSS property-value pairs
    """
    result: dict[str, str] = {}

    if r_pr is None:
        return result

    # Font family
    if r_pr.r_fonts:
        font = font_family_to_css(r_pr.r_fonts)
        if font:
            result["font-family"] = font

    # Font size
    if r_pr.sz is not None:
        size = font_size_to_css(r_pr.sz)
        if size:
            result["font-size"] = size

    # Bold
    if r_pr.b is True:
        result["font-weight"] = "bold"
    elif r_pr.b is False:
        result["font-weight"] = "normal"

    # Italic
    if r_pr.i is True:
        result["font-style"] = "italic"
    elif r_pr.i is False:
        result["font-style"] = "normal"

    # Text decorations (underline, strikethrough)
    decorations: list[str] = []
    decoration_style: str | None = None

    if r_pr.u and r_pr.u.val and r_pr.u.val.lower() not in ("none", ""):
        decorations.append("underline")
        # Get the underline style (solid, double, dotted, dashed, wavy)
        css_style = UNDERLINE_STYLES.get(r_pr.u.val)
        if css_style and css_style != "solid":
            decoration_style = css_style

    if r_pr.strike is True:
        decorations.append("line-through")

    if r_pr.dstrike is True:
        decorations.append("line-through")

    if decorations:
        # Build text-decoration value with style if not solid
        if decoration_style:
            result["text-decoration"] = f"{' '.join(decorations)} {decoration_style}"
        else:
            result["text-decoration"] = " ".join(decorations)

    # Text transform (caps)
    if r_pr.caps is True:
        result["text-transform"] = "uppercase"

    if r_pr.small_caps is True:
        result["font-variant"] = "small-caps"

    # Vertical alignment (superscript/subscript)
    if r_pr.vert_align:
        if r_pr.vert_align == "superscript":
            result["vertical-align"] = "super"
            result["font-size"] = "smaller"
        elif r_pr.vert_align == "subscript":
            result["vertical-align"] = "sub"
            result["font-size"] = "smaller"

    # Text color
    if r_pr.color:
        color = color_to_css(r_pr.color)
        if color:
            result["color"] = color

    # Highlight (background)
    if r_pr.highlight:
        bg = highlight_to_css(r_pr.highlight)
        if bg:
            result["background-color"] = bg

    # Character spacing
    if r_pr.spacing is not None:
        # Spacing is in twips
        pt = twips_to_pt(r_pr.spacing)
        if pt is not None:
            result["letter-spacing"] = f"{pt}pt"

    # Hidden text
    if r_pr.vanish is True:
        result["display"] = "none"

    return result


# =============================================================================
# Paragraph Properties Conversion
# =============================================================================


def paragraph_properties_to_css(p_pr: ParagraphProperties | None) -> dict[str, str]:
    """Convert ParagraphProperties to CSS properties.

    Args:
        p_pr: ParagraphProperties model instance

    Returns:
        Dictionary of CSS property-value pairs
    """
    result: dict[str, str] = {}

    if p_pr is None:
        return result

    # Text alignment
    if p_pr.jc:
        jc = p_pr.jc.lower()
        if jc == "left":
            result["text-align"] = "left"
        elif jc == "center":
            result["text-align"] = "center"
        elif jc == "right":
            result["text-align"] = "right"
        elif jc in ("both", "distribute"):
            result["text-align"] = "justify"

    # Spacing
    if p_pr.spacing:
        spacing = p_pr.spacing

        # Space before (margin-top)
        if spacing.before is not None:
            pt = twips_to_pt(spacing.before)
            if pt is not None:
                if pt == int(pt):
                    result["margin-top"] = f"{int(pt)}pt"
                else:
                    result["margin-top"] = f"{pt:.2f}pt"

        # Space after (margin-bottom)
        if spacing.after is not None:
            pt = twips_to_pt(spacing.after)
            if pt is not None:
                if pt == int(pt):
                    result["margin-bottom"] = f"{int(pt)}pt"
                else:
                    result["margin-bottom"] = f"{pt:.2f}pt"

        # Line spacing
        if spacing.line is not None and spacing.line_rule:
            rule = spacing.line_rule.lower()
            if rule == "auto":
                # Auto means line value is in 240ths of a line
                line_height = spacing.line / 240
                result["line-height"] = f"{line_height:.2f}"
            elif rule == "exact":
                pt = twips_to_pt(spacing.line)
                if pt is not None:
                    result["line-height"] = f"{pt}pt"
            elif rule == "atleast":
                pt = twips_to_pt(spacing.line)
                if pt is not None:
                    result["min-height"] = f"{pt}pt"

    # Indentation
    if p_pr.ind:
        ind = p_pr.ind

        if ind.left is not None:
            pt = twips_to_pt(ind.left)
            if pt is not None:
                if pt == int(pt):
                    result["margin-left"] = f"{int(pt)}pt"
                else:
                    result["margin-left"] = f"{pt:.2f}pt"

        if ind.right is not None:
            pt = twips_to_pt(ind.right)
            if pt is not None:
                if pt == int(pt):
                    result["margin-right"] = f"{int(pt)}pt"
                else:
                    result["margin-right"] = f"{pt:.2f}pt"

        if ind.first_line is not None:
            pt = twips_to_pt(ind.first_line)
            if pt is not None:
                if pt == int(pt):
                    result["text-indent"] = f"{int(pt)}pt"
                else:
                    result["text-indent"] = f"{pt:.2f}pt"

        if ind.hanging is not None:
            pt = twips_to_pt(ind.hanging)
            if pt is not None:
                # Hanging indent is negative text-indent
                if pt == int(pt):
                    result["text-indent"] = f"-{int(pt)}pt"
                else:
                    result["text-indent"] = f"-{pt:.2f}pt"

    # Borders
    if p_pr.p_bdr:
        border_css = paragraph_borders_to_css(p_pr.p_bdr)
        result.update(border_css)

    # Shading/background
    if p_pr.shd:
        bg = shading_to_css(p_pr.shd)
        if bg:
            result["background-color"] = bg

    # Page break control
    if p_pr.page_break_before is True:
        result["page-break-before"] = "always"

    if p_pr.keep_next is True:
        result["page-break-after"] = "avoid"

    if p_pr.keep_lines is True:
        result["page-break-inside"] = "avoid"

    # RTL direction
    if p_pr.bidi is True:
        result["direction"] = "rtl"

    return result


# =============================================================================
# Table Cell Properties Conversion
# =============================================================================


def cell_vertical_align_to_css(v_align: str | None) -> str | None:
    """Convert cell vertical alignment to CSS.

    Args:
        v_align: Vertical alignment value (top, center, bottom)

    Returns:
        CSS vertical-align value or None
    """
    if v_align is None:
        return None

    v_align = v_align.lower()
    if v_align == "top":
        return "top"
    elif v_align == "center":
        return "middle"
    elif v_align == "bottom":
        return "bottom"

    return None


def cell_margins_to_css(margins: TableCellMargins | None) -> dict[str, str]:
    """Convert TableCellMargins to CSS padding.

    Args:
        margins: TableCellMargins model instance

    Returns:
        Dictionary of CSS padding properties
    """
    result: dict[str, str] = {}

    if margins is None:
        return result

    if margins.top:
        css = width_to_css(margins.top)
        if css:
            result["padding-top"] = css

    if margins.bottom:
        css = width_to_css(margins.bottom)
        if css:
            result["padding-bottom"] = css

    if margins.left:
        css = width_to_css(margins.left)
        if css:
            result["padding-left"] = css

    if margins.right:
        css = width_to_css(margins.right)
        if css:
            result["padding-right"] = css

    return result


def table_cell_properties_to_css(tc_pr: TableCellProperties | None) -> dict[str, str]:
    """Convert TableCellProperties to CSS properties.

    Args:
        tc_pr: TableCellProperties model instance

    Returns:
        Dictionary of CSS property-value pairs
    """
    result: dict[str, str] = {}

    if tc_pr is None:
        return result

    # Cell width
    if tc_pr.tc_w:
        width = width_to_css(tc_pr.tc_w)
        if width:
            result["width"] = width

    # Vertical alignment
    if tc_pr.v_align:
        valign = cell_vertical_align_to_css(tc_pr.v_align)
        if valign:
            result["vertical-align"] = valign

    # Borders
    if tc_pr.tc_borders:
        border_css = table_borders_to_css(tc_pr.tc_borders)
        result.update(border_css)

    # Shading/background
    if tc_pr.shd:
        bg = shading_to_css(tc_pr.shd)
        if bg:
            result["background-color"] = bg

    # Cell margins (padding)
    if tc_pr.tc_mar:
        margin_css = cell_margins_to_css(tc_pr.tc_mar)
        result.update(margin_css)

    # No wrap
    if tc_pr.no_wrap is True:
        result["white-space"] = "nowrap"

    # Text direction
    if tc_pr.text_direction:
        td = tc_pr.text_direction.lower()
        if td in ("tbrl", "tbrlv"):
            result["writing-mode"] = "vertical-rl"
        elif td in ("btlr",):
            result["writing-mode"] = "vertical-lr"

    return result


# =============================================================================
# CSS Generator Class
# =============================================================================


class CSSGenerator:
    """CSS generator for converting DOCX properties to CSS."""

    def __init__(
        self,
        *,
        use_pt: bool = True,
        use_px: bool = False,
        dpi: int = 96,
    ) -> None:
        """Initialize CSS generator.

        Args:
            use_pt: Use points for sizes (default True)
            use_px: Use pixels instead of points
            dpi: DPI for pixel conversion
        """
        self.use_pt = use_pt
        self.use_px = use_px
        self.dpi = dpi

    def run_to_css(self, r_pr: RunProperties | None) -> dict[str, str]:
        """Convert run properties to CSS."""
        return run_properties_to_css(r_pr)

    def paragraph_to_css(self, p_pr: ParagraphProperties | None) -> dict[str, str]:
        """Convert paragraph properties to CSS."""
        return paragraph_properties_to_css(p_pr)

    def cell_to_css(self, tc_pr: TableCellProperties | None) -> dict[str, str]:
        """Convert table cell properties to CSS."""
        return table_cell_properties_to_css(tc_pr)

    def generate_inline_style(self, props: dict[str, str]) -> str:
        """Generate inline style string from CSS properties.

        Args:
            props: Dictionary of CSS property-value pairs

        Returns:
            CSS inline style string (e.g., "color: red; font-weight: bold")
        """
        if not props:
            return ""

        return "; ".join(f"{k}: {v}" for k, v in props.items())

    def generate_style_attribute(self, props: dict[str, str]) -> str:
        """Generate style attribute for HTML element.

        Args:
            props: Dictionary of CSS property-value pairs

        Returns:
            HTML style attribute (e.g., 'style="color: red"') or empty string
        """
        if not props:
            return ""

        style = self.generate_inline_style(props)
        return f'style="{style}"'

    @staticmethod
    def merge_css(base: dict[str, str], override: dict[str, str]) -> dict[str, str]:
        """Merge two CSS property dictionaries.

        Args:
            base: Base CSS properties
            override: Override CSS properties

        Returns:
            Merged CSS properties (override takes precedence)
        """
        result = base.copy()
        result.update(override)
        return result


# Module-level instance for convenience
css_generator = CSSGenerator()
