from docx_parsers.models.styles_models import FontProperties, SpacingProperties, IndentationProperties


class StyleConverter:
    @staticmethod
    def convert_bold(bold: bool) -> str:
        return "font-weight:bold;" if bold else ""

    @staticmethod
    def convert_italic(italic: bool) -> str:
        return "font-style:italic;" if italic else ""

    @staticmethod
    def convert_underline(underline: str) -> str:
        return "text-decoration:underline;" if underline else ""

    @staticmethod
    def convert_color(color: str) -> str:
        return f"color:{color};" if color else ""

    @staticmethod
    def convert_font(font: FontProperties) -> str:
        style = ""
        if font.ascii:
            style += f"font-family:{font.ascii};"
        return style

    @staticmethod
    def convert_size(size_pt: float) -> str:
        return f"font-size:{size_pt}pt;" if size_pt else ""

    @staticmethod
    def convert_spacing(spacing: SpacingProperties) -> str:
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
        style = ""
        if indent.left_pt is not None:
            style += f"margin-left:{indent.left_pt}pt;"
        if indent.right_pt is not None:
            style += f"margin-right:{indent.right_pt}pt;"
        if indent.firstline_pt:
            style += f"text-indent:{indent.firstline_pt}pt;"
        # if indent.hanging_pt is not None: # Merged with firsline_pt property
        #     style += f"text-indent:-{indent.hanging_pt}pt;"
        return style

    @staticmethod
    def convert_justification(justification: str) -> str:
        justification_map = {
            "left": "left",
            "center": "center",
            "right": "right",
            "both": "justify",
            "distribute": "justify"
        }
        return f"text-align:{justification_map.get(justification, 'left')};" if justification else ""

    @staticmethod
    def convert_doc_margins(margins) -> str:
        style = f"padding-top:{margins.top_pt}pt; padding-right:{margins.right_pt}pt; padding-bottom:{margins.bottom_pt}pt; padding-left:{margins.left_pt}pt;"
        if margins.header_pt:
            style += f" padding-top:{margins.header_pt}pt;"
        if margins.footer_pt:
            style += f" padding-bottom:{margins.footer_pt}pt;"
        if margins.gutter_pt:
            style += f" margin-left:{margins.gutter_pt}pt;"
        return style
