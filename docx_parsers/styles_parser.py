from pydantic import BaseModel
from typing import List, Optional, Tuple
import xml.etree.ElementTree as ET
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_half_points_to_points, convert_twips_to_points
import json

# Namespace URI
NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# Constants for Namespace and References
NAMESPACE = {'w': NAMESPACE_URI}

# Style-related attributes
W_STYLE_ID = f"{{{NAMESPACE_URI}}}styleId"
W_VAL = f"{{{NAMESPACE_URI}}}val"

# Font-related attributes
W_FONT_ASCII = f"{{{NAMESPACE_URI}}}ascii"
W_FONT_HANSI = f"{{{NAMESPACE_URI}}}hAnsi"
W_FONT_EASTASIA = f"{{{NAMESPACE_URI}}}eastAsia"
W_FONT_CS = f"{{{NAMESPACE_URI}}}cs"
W_BIDI = f"{{{NAMESPACE_URI}}}bidi"

# Paragraph-related attributes
W_SPACING_BEFORE = f"{{{NAMESPACE_URI}}}before"
W_SPACING_AFTER = f"{{{NAMESPACE_URI}}}after"
W_INDENT_LEFT = f"{{{NAMESPACE_URI}}}left"
W_INDENT_START = f"{{{NAMESPACE_URI}}}start"
W_INDENT_RIGHT = f"{{{NAMESPACE_URI}}}right"
W_INDENT_END = f"{{{NAMESPACE_URI}}}end"
W_INDENT_FIRSTLINE = f"{{{NAMESPACE_URI}}}firstLine"
W_INDENT_HANGING = f"{{{NAMESPACE_URI}}}hanging"
W_LINE_SPACING = f"{{{NAMESPACE_URI}}}line"


# Pydantic models for paragraph and run properties
class SpacingProperties(BaseModel):
    before_pt: Optional[float] = None
    after_pt: Optional[float] = None
    line_pt: Optional[float] = None

class IndentationProperties(BaseModel):
    left_pt: Optional[float] = None
    right_pt: Optional[float] = None
    firstline_pt: Optional[float] = None
    hanging_pt: Optional[float] = None

class FontProperties(BaseModel):
    ascii: Optional[str] = None
    hAnsi: Optional[str] = None
    eastAsia: Optional[str] = None
    cs: Optional[str] = None

class LanguageProperties(BaseModel):
    val: Optional[str] = None
    eastAsia: Optional[str] = None
    bidi: Optional[str] = None

class TabStop(BaseModel):
    val: str
    pos: float

class ParagraphStyleProperties(BaseModel):
    style_id: str = None
    spacing: Optional[SpacingProperties] = None
    indent: Optional[IndentationProperties] = None
    outline_level: Optional[int] = None
    widow_control: Optional[bool] = None
    suppress_auto_hyphens: Optional[bool] = None
    bidi: Optional[bool] = None
    justification: Optional[str] = None
    keep_next: Optional[bool] = None
    suppress_line_numbers: Optional[bool] = None
    tabs: Optional[List[TabStop]] = None

class RunStyleProperties(BaseModel):
    font: Optional[FontProperties] = None
    size_pt: Optional[float] = None
    color: Optional[str] = None
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    underline: Optional[str] = None
    strikethrough: Optional[bool] = None
    hidden: Optional[bool] = None
    lang: Optional[LanguageProperties] = None
    highlight: Optional[str] = None
    shading: Optional[str] = None
    text_position_pt: Optional[float] = None
    kerning: Optional[int] = None
    character_spacing_pt: Optional[float] = None
    emboss: Optional[bool] = None
    outline: Optional[bool] = None
    shadow: Optional[bool] = None
    all_caps: Optional[bool] = None
    small_caps: Optional[bool] = None

class Style(BaseModel):
    style_id: str
    name: str
    based_on: Optional[str] = None
    paragraph_properties: Optional[ParagraphStyleProperties] = None
    run_properties: Optional[RunStyleProperties] = None

class StyleDefaults(BaseModel):
    paragraph: Optional[str] = None
    character: Optional[str] = None
    numbering: Optional[str] = None
    table: Optional[str] = None

class StylesSchema(BaseModel):
    styles: List[Style]
    defaults: StyleDefaults
    default_rpr: Optional[RunStyleProperties] = None
    default_ppr: Optional[ParagraphStyleProperties] = None

class StylesParser:
    def __init__(self, docx_file: Optional[bytes] = None):
        if docx_file:
            self.root = extract_xml_root_from_docx(docx_file, 'styles.xml')
            self.styles_schema = self.parse()
        else:
            self.root = None
            self.styles_schema = None

    def parse(self) -> StylesSchema:
        styles = []

        default_rpr = self.extract_default_rpr(self.root)
        default_ppr = self.extract_default_ppr(self.root)
        
        defaults = StyleDefaults()

        for style in self.root.findall(".//w:style", namespaces=NAMESPACE):
            style_id = style.get(W_STYLE_ID, 'Unknown StyleId')
            name_element = style.find(".//w:name", namespaces=NAMESPACE)
            name = name_element.get(W_VAL) if name_element is not None else 'Unknown Name'
            
            based_on_element = style.find(".//w:basedOn", namespaces=NAMESPACE)
            based_on = based_on_element.get(W_VAL) if based_on_element is not None else None
            
            paragraph_properties, run_properties = self.extract_style_properties(style)
            
            style_obj = Style(
                style_id=style_id,
                name=name,
                based_on=based_on,
                paragraph_properties=paragraph_properties,
                run_properties=run_properties
            )
            styles.append(style_obj)

            # Check if this style is a default style
            if style.get(f"{{{NAMESPACE_URI}}}default") == "1":
                style_type = style.get(f"{{{NAMESPACE_URI}}}type")
                if style_type == "paragraph":
                    defaults.paragraph = style_id
                elif style_type == "character":
                    defaults.character = style_id
                elif style_type == "numbering":
                    defaults.numbering = style_id
                elif style_type == "table":
                    defaults.table = style_id

        styles_schema = StylesSchema(
            styles=styles,
            defaults=defaults,
            default_rpr=default_rpr,
            default_ppr=default_ppr
        )
        self.resolve_based_on_styles(styles_schema)
        return styles_schema

    def extract_default_rpr(self, root) -> RunStyleProperties:
        rPr_default = root.find(".//w:rPrDefault//w:rPr", namespaces=NAMESPACE)
        return self.extract_run_properties(rPr_default) if rPr_default is not None else RunStyleProperties()

    def extract_default_ppr(self, root) -> ParagraphStyleProperties:
        pPr_default = root.find(".//w:pPrDefault//w:pPr", namespaces=NAMESPACE)
        return self.extract_paragraph_properties(pPr_default) if pPr_default is not None else ParagraphStyleProperties()

    def extract_style_properties(self, style_element) -> Tuple[ParagraphStyleProperties, RunStyleProperties]:
        paragraph_properties = self.extract_paragraph_properties(style_element.find(".//w:pPr", namespaces=NAMESPACE))
        run_properties = self.extract_run_properties(style_element.find(".//w:rPr", namespaces=NAMESPACE))
        return paragraph_properties, run_properties

    def resolve_based_on_styles(self, styles_schema: StylesSchema) -> None:
        styles_dict = {style.style_id: style for style in styles_schema.styles}

        def merge_properties(base_props, derived_props):
            if not base_props:
                return derived_props
            if not derived_props:
                return base_props
            base_dict = base_props.dict(exclude_unset=True)
            derived_dict = derived_props.dict(exclude_unset=True)
            merged_dict = {**base_dict, **derived_dict}
            return type(base_props)(**merged_dict)

        def resolve_style(style):
            if style.based_on:
                base_style = styles_dict.get(style.based_on)
                if base_style:
                    resolve_style(base_style)
                    style.paragraph_properties = merge_properties(base_style.paragraph_properties, style.paragraph_properties)
                    style.run_properties = merge_properties(base_style.run_properties, style.run_properties)

        # Defaults will be applied later during the styles merger - delete after this works
        # def apply_defaults(style):
        #     style.paragraph_properties = merge_properties(styles_schema.default_ppr, style.paragraph_properties)
        #     style.run_properties = merge_properties(styles_schema.default_rpr, style.run_properties)

        for style in styles_schema.styles:
            resolve_style(style)
            # apply_defaults(style)
    
    def extract_paragraph_properties(self, pPr_element: ET.Element) -> ParagraphStyleProperties:
        properties = ParagraphStyleProperties()
        
        if pPr_element is not None:
            # Extract spacing
            spacing_element = pPr_element.find("w:spacing", namespaces=NAMESPACE)
            if spacing_element is not None:
                spacing_properties = SpacingProperties()
                if W_SPACING_BEFORE in spacing_element.attrib:
                    spacing_properties.before_pt = convert_twips_to_points(int(spacing_element.get(W_SPACING_BEFORE)))
                if W_SPACING_AFTER in spacing_element.attrib:
                    spacing_properties.after_pt = convert_twips_to_points(int(spacing_element.get(W_SPACING_AFTER)))
                if W_LINE_SPACING in spacing_element.attrib:
                    spacing_properties.line_pt = convert_twips_to_points(int(spacing_element.get(W_LINE_SPACING)))
                properties.spacing = spacing_properties

            # Extract indentation
            indent_element = pPr_element.find("w:ind", namespaces=NAMESPACE)
            if indent_element is not None:
                indent_properties = IndentationProperties()
                if W_INDENT_LEFT in indent_element.attrib:
                    indent_properties.left_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_LEFT)))
                elif W_INDENT_START in indent_element.attrib:
                    indent_properties.left_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_START)))
                if W_INDENT_RIGHT in indent_element.attrib:
                    indent_properties.right_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_RIGHT)))
                elif W_INDENT_END in indent_element.attrib:
                    indent_properties.right_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_END)))
                if W_INDENT_HANGING in indent_element.attrib:
                    indent_properties.hanging_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_HANGING)))
                if W_INDENT_FIRSTLINE in indent_element.attrib:
                    indent_properties.firstline_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_FIRSTLINE)))
                properties.indent = indent_properties

            # Extract outline level
            outline_lvl_element = pPr_element.find("w:outlineLvl", namespaces=NAMESPACE)
            if outline_lvl_element is not None and W_VAL in outline_lvl_element.attrib:
                properties.outline_level = int(outline_lvl_element.get(W_VAL))
            
            # Extract widow control
            widow_control_element = pPr_element.find("w:widowControl", namespaces=NAMESPACE)
            if widow_control_element is not None and W_VAL in widow_control_element.attrib:
                properties.widow_control = widow_control_element.get(W_VAL) == "true"
            
            # Extract suppress auto hyphens
            suppress_auto_hyphens_element = pPr_element.find("w:suppressAutoHyphens", namespaces=NAMESPACE)
            if suppress_auto_hyphens_element is not None and W_VAL in suppress_auto_hyphens_element.attrib:
                properties.suppress_auto_hyphens = suppress_auto_hyphens_element.get(W_VAL) == "true"
            
            # Extract bidi
            bidi_element = pPr_element.find("w:bidi", namespaces=NAMESPACE)
            if bidi_element is not None and W_VAL in bidi_element.attrib:
                properties.bidi = bidi_element.get(W_VAL) == "true"
            
            # Extract justification
            justification_element = pPr_element.find("w:jc", namespaces=NAMESPACE)
            if justification_element is not None and W_VAL in justification_element.attrib:
                properties.justification = justification_element.get(W_VAL)
            
            # Extract keep next
            keep_next_element = pPr_element.find("w:keepNext", namespaces=NAMESPACE)
            if keep_next_element is not None:
                properties.keep_next = True
            
            # Extract suppress line numbers
            suppress_line_numbers_element = pPr_element.find("w:suppressLineNumbers", namespaces=NAMESPACE)
            if suppress_line_numbers_element is not None:
                properties.suppress_line_numbers = True

        return properties

    def extract_run_properties(self, rPr_element: ET.Element) -> RunStyleProperties:
        properties = RunStyleProperties()

        if rPr_element is not None:
            # Extract fonts
            font_element = rPr_element.find("w:rFonts", namespaces=NAMESPACE)
            if font_element is not None:
                font_properties = FontProperties()
                font_properties.ascii = font_element.get(W_FONT_ASCII)
                font_properties.hAnsi = font_element.get(W_FONT_HANSI)
                font_properties.eastAsia = font_element.get(W_FONT_EASTASIA)
                font_properties.cs = font_element.get(W_FONT_CS)
                properties.font = font_properties

            # Extract font size
            size_element = rPr_element.find("w:sz", namespaces=NAMESPACE)
            if size_element is not None and W_VAL in size_element.attrib:
                properties.size_pt = convert_half_points_to_points(int(size_element.get(W_VAL)))

            # Extract font color
            color_element = rPr_element.find("w:color", namespaces=NAMESPACE)
            if color_element is not None and W_VAL in color_element.attrib:
                properties.color = color_element.get(W_VAL)

            # Extract bold and italic
            bold_element = rPr_element.find("w:b", namespaces=NAMESPACE)
            if bold_element is not None:
                properties.bold = bold_element.get(W_VAL, "true") == "true"

            italic_element = rPr_element.find("w:i", namespaces=NAMESPACE)
            if italic_element is not None:
                properties.italic = italic_element.get(W_VAL, "true") == "true"

            # Extract underline
            underline_element = rPr_element.find("w:u", namespaces=NAMESPACE)
            if underline_element is not None and W_VAL in underline_element.attrib:
                properties.underline = underline_element.get(W_VAL)

            # Extract strikethrough
            strikethrough_element = rPr_element.find("w:strike", namespaces=NAMESPACE)
            if strikethrough_element is not None:
                properties.strikethrough = strikethrough_element.get(W_VAL, "true") == "true"

            # Extract hidden text
            hidden_element = rPr_element.find("w:vanish", namespaces=NAMESPACE)
            if hidden_element is not None:
                properties.hidden = hidden_element.get(W_VAL, "true") == "true"

            # Extract language settings
            lang_element = rPr_element.find("w:lang", namespaces=NAMESPACE)
            if lang_element is not None:
                lang_properties = LanguageProperties()
                lang_properties.val = lang_element.get(W_VAL)
                lang_properties.eastAsia = lang_element.get(W_FONT_EASTASIA)
                lang_properties.bidi = lang_element.get(W_BIDI)
                properties.lang = lang_properties

            # Extract highlight
            highlight_element = rPr_element.find("w:highlight", namespaces=NAMESPACE)
            if highlight_element is not None and W_VAL in highlight_element.attrib:
                properties.highlight = highlight_element.get(W_VAL)

            # Extract shading
            shading_element = rPr_element.find("w:shd", namespaces=NAMESPACE)
            if shading_element is not None and W_VAL in shading_element.attrib:
                properties.shading = shading_element.get(W_VAL)

            # Extract text position
            text_position_element = rPr_element.find("w:position", namespaces=NAMESPACE)
            if text_position_element is not None and W_VAL in text_position_element.attrib:
                properties.text_position_pt = convert_half_points_to_points(int(text_position_element.get(W_VAL)))

            # Extract kerning
            kerning_element = rPr_element.find("w:kern", namespaces=NAMESPACE)
            if kerning_element is not None and W_VAL in kerning_element.attrib:
                properties.kerning = int(kerning_element.get(W_VAL))

            # Extract character spacing
            character_spacing_element = rPr_element.find("w:spacing", namespaces=NAMESPACE)
            if character_spacing_element is not None and W_VAL in character_spacing_element.attrib:
                properties.character_spacing_pt = convert_half_points_to_points(int(character_spacing_element.get(W_VAL)))

            # Extract emboss
            emboss_element = rPr_element.find("w:emboss", namespaces=NAMESPACE)
            if emboss_element is not None:
                properties.emboss = emboss_element.get(W_VAL, "true") == "true"

            # Extract outline
            outline_element = rPr_element.find("w:outline", namespaces=NAMESPACE)
            if outline_element is not None:
                properties.outline = outline_element.get(W_VAL, "true") == "true"

            # Extract shadow
            shadow_element = rPr_element.find("w:shadow", namespaces=NAMESPACE)
            if shadow_element is not None:
                properties.shadow = shadow_element.get(W_VAL, "true") == "true"

            # Extract all caps
            all_caps_element = rPr_element.find("w:caps", namespaces=NAMESPACE)
            if all_caps_element is not None:
                properties.all_caps = all_caps_element.get(W_VAL, "true") == "true"

            # Extract small caps
            small_caps_element = rPr_element.find("w:smallCaps", namespaces=NAMESPACE)
            if small_caps_element is not None:
                properties.small_caps = small_caps_element.get(W_VAL, "true") == "true"

        return properties

    def get_styles_schema(self) -> StylesSchema:
        return self.styles_schema


if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"

    docx_file = read_binary_from_file_path(docx_path)
    styles_parser = StylesParser(docx_file)

    # Convert the document schema to a dictionary excluding null properties
    filtered_schema_dict = styles_parser.styles_schema.model_dump(exclude_none=True)

    # Output or further process the filtered schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))
