from docx_parser_converter.docx_parsers.models.styles_models import FontProperties, SpacingProperties, IndentationProperties
from docx_parser_converter.docx_parsers.models.document_models import DocMargins

HEAVY_UNDERLINE_THICKNESS = "0.15em"

UNDERLINE_CSS_MAP = {
    "single": {"line": "underline", "style": "solid"},
    "words": {"line": "underline", "style": "solid"},
    "double": {"line": "underline", "style": "double"},
    "thick": {"line": "underline", "style": "solid", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "dotted": {"line": "underline", "style": "dotted"},
    "dottedheavy": {"line": "underline", "style": "dotted", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "dash": {"line": "underline", "style": "dashed"},
    "dashedheavy": {"line": "underline", "style": "dashed", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "dashlong": {"line": "underline", "style": "dashed"},
    "dashlongheavy": {"line": "underline", "style": "dashed", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "dotdash": {"line": "underline", "style": "dashed"},
    "dashdotheavy": {"line": "underline", "style": "dashed", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "dashdotdotheavy": {"line": "underline", "style": "dashed", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "wave": {"line": "underline", "style": "wavy"},
    # "wavy": {"line": "underline", "style": "wavy"},
    "wavyheavy": {"line": "underline", "style": "wavy", "thickness": HEAVY_UNDERLINE_THICKNESS},
    "none": {"line": "none"},
}

# Aliases & fallbacks specified by the ST_Underline mapping rules
for alias, target in {
    "dotdotdash": "dotdash",
    "dashdot": "dotdash",
    "dashdotdot": "dotdotdash",
    "dotdashheavy": "dashdotheavy",
    "dashheavy": "dashedheavy",
    "thickdash": "dashedheavy",
    "wavy": "wave",
    "wavydouble": "wave",
}.items():
    UNDERLINE_CSS_MAP[alias] = UNDERLINE_CSS_MAP[target]

class StyleConverter:
    """
    A converter class for converting DOCX style properties to CSS style attributes.
    """

    @staticmethod
    def convert_bold(bold: bool) -> str:
        """
        Converts bold property to CSS style.

        Args:
            bold (bool): The bold property.

        Returns:
            str: The CSS style string for bold.

        Example:
            The output style might look like:

            .. code-block:: css

                font-weight:bold;
        """
        return "font-weight:bold;" if bold else ""

    @staticmethod
    def convert_italic(italic: bool) -> str:
        """
        Converts italic property to CSS style.

        Args:
            italic (bool): The italic property.

        Returns:
            str: The CSS style string for italic.

        Example:
            The output style might look like:

            .. code-block:: css

                font-style:italic;
        """
        return "font-style:italic;" if italic else ""

    @staticmethod
    def convert_underline(underline: str) -> str:
        """
        Converts underline property to CSS style, mapping ST_Underline values to CSS equivalents.

        Args:
            underline (str): The underline property.

        Returns:
            str: The CSS style string for underline.
        """
        normalized = StyleConverter._normalize_underline_value(underline)
        if not normalized:
            return ""
        mapping = UNDERLINE_CSS_MAP.get(normalized)
        if not mapping:
            return ""

        if mapping.get("line") == "none":
            return "text-decoration-line:none;"

        styles = [f"text-decoration-line:{mapping.get('line', 'underline')};"]

        decoration_style = mapping.get("style")
        if decoration_style:
            styles.append(f"text-decoration-style:{decoration_style};")

        thickness = mapping.get("thickness")
        if thickness:
            styles.append(f"text-decoration-thickness:{thickness};")

        return "".join(styles)

    @staticmethod
    def _normalize_underline_value(value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            return ""
        return "".join(ch for ch in cleaned.lower() if ch.isalpha())

    @staticmethod
    def convert_color(color: str) -> str:
        """
        Converts color property to CSS style, ensuring hex codes include a '#' and mirroring underline color.

        Args:
            color (str): The color property.

        Returns:
            str: The CSS style string for color.

        Example:
            The output style might look like:

            .. code-block:: css

                color:#FF0000;
        """
        formatted_color = StyleConverter._format_css_color(color)
        if not formatted_color:
            return ""
        return (
            f"color:{formatted_color};"
            f"text-decoration-color:{formatted_color};"
        )

    @staticmethod
    def convert_underline_color(color: str) -> str:
        """Converts an explicit underline color to CSS style."""
        formatted_color = StyleConverter._format_css_color(color)
        if not formatted_color:
            return ""
        return f"text-decoration-color:{formatted_color};"

    @staticmethod
    def _format_css_color(color: str) -> str:
        """Normalizes DOCX color values to valid CSS color tokens."""
        if not color:
            return ""

        color = color.strip()
        if not color:
            return ""

        lowered = color.lower()
        if lowered == "auto":
            return ""

        if color.startswith("#") or lowered.startswith("rgb"):
            return color

        hex_lengths = {3, 4, 6, 8}
        hex_digits = set("0123456789abcdefABCDEF")
        if len(color) in hex_lengths and all(ch in hex_digits for ch in color):
            return f"#{color}"

        return color

    @staticmethod
    def convert_font(font: FontProperties) -> str:
        """
        Converts font properties to CSS style.

        Args:
            font (FontProperties): The font properties.

        Returns:
            str: The CSS style string for font.

        Example:
            The output style might look like:

            .. code-block:: css

                font-family:Arial;
        """
        style = ""
        if font.ascii:
            style += f"font-family:{font.ascii};"
        return style

    @staticmethod
    def convert_size(size_pt: float) -> str:
        """
        Converts font size property to CSS style.

        Args:
            size_pt (float): The font size in points.

        Returns:
            str: The CSS style string for font size.

        Example:
            The output style might look like:

            .. code-block:: css

                font-size:12pt;
        """
        return f"font-size:{size_pt}pt;" if size_pt else ""

    @staticmethod
    def convert_spacing(spacing: SpacingProperties) -> str:
        """
        Converts spacing properties to CSS style.

        Args:
            spacing (SpacingProperties): The spacing properties.

        Returns:
            str: The CSS style string for spacing.

        Example:
            The output style might look like:

            .. code-block:: css

                margin-top:12pt;margin-bottom:12pt;line-height:18pt;
        """
        style = ""
        if spacing.before_pt:
            style += f"margin-top:{spacing.before_pt}pt;"
        if spacing.after_pt:
            style += f"margin-bottom:{spacing.after_pt}pt;"
        if spacing.line_pt:
            style += f"line-height:{spacing.line_pt}pt;"
        return style

    @staticmethod
    def convert_indent(indent: IndentationProperties) -> str:
        """
        Converts indentation properties to CSS style.

        Args:
            indent (IndentationProperties): The indentation properties.

        Returns:
            str: The CSS style string for indentation.

        Example:
            The output style might look like:

            .. code-block:: css

                margin-left:36pt;margin-right:36pt;text-indent:36pt;
        """
        style = ""
        if indent.left_pt is not None:
            style += f"margin-left:{indent.left_pt}pt;"
        if indent.right_pt is not None:
            style += f"margin-right:{indent.right_pt}pt;"
        if indent.firstline_pt:
            style += f"text-indent:{indent.firstline_pt}pt;"
        return style

    @staticmethod
    def convert_justification(justification: str) -> str:
        """
        Converts justification property to CSS style.

        Args:
            justification (str): The justification property.

        Returns:
            str: The CSS style string for justification.

        Example:
            The output style might look like:

            .. code-block:: css

                text-align:left;
        """
        justification_map = {
            "left": "left",
            "center": "center",
            "right": "right",
            "both": "justify",
            "distribute": "justify"
        }
        return f"text-align:{justification_map.get(justification, 'left')};" if justification else ""

    @staticmethod
    def convert_doc_margins(margins: DocMargins) -> str:
        """
        Converts document margins to CSS style.

        Args:
            margins: The document margins.

        Returns:
            str: The CSS style string for document margins.

        Example:
            The output style might look like:

            .. code-block:: css

                padding-top:36pt;padding-right:36pt;padding-bottom:36pt;padding-left:36pt;padding-top:18pt;padding-bottom:18pt;margin-left:18pt;
        """
        style = f"padding-top:{margins.top_pt}pt; padding-right:{margins.right_pt}pt; padding-bottom:{margins.bottom_pt}pt; padding-left:{margins.left_pt}pt;"
        if margins.header_pt:
            style += f" padding-top:{margins.header_pt}pt;"
        if margins.footer_pt:
            style += f" padding-bottom:{margins.footer_pt}pt;"
        if margins.gutter_pt:
            style += f" margin-left:{margins.gutter_pt}pt;"
        return style
