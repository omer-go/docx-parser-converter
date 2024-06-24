# styles_parser.py

from pydantic import BaseModel
from typing import List, Optional, Tuple
import xml.etree.ElementTree as ET
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_half_points_to_points, convert_twips_to_points
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE, NAMESPACE_URI
import json

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
    style_id: Optional[str] = None
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
            style_id = extract_attribute(style, 'styleId') or 'Unknown StyleId'
            name_element = extract_element(style, ".//w:name")
            name = extract_attribute(name_element, 'val') if name_element is not None else 'Unknown Name'
            
            based_on_element = extract_element(style, ".//w:basedOn")
            based_on = extract_attribute(based_on_element, 'val') if based_on_element is not None else None
            
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
            if extract_attribute(style, 'default') == "1":
                style_type = extract_attribute(style, 'type')
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
        rPr_default = extract_element(root, ".//w:rPrDefault//w:rPr")
        return self.extract_run_properties(rPr_default) if rPr_default is not None else RunStyleProperties()

    def extract_default_ppr(self, root) -> ParagraphStyleProperties:
        pPr_default = extract_element(root, ".//w:pPrDefault//w:pPr")
        return self.extract_paragraph_properties(pPr_default) if pPr_default is not None else ParagraphStyleProperties()

    def extract_style_properties(self, style_element) -> Tuple[ParagraphStyleProperties, RunStyleProperties]:
        paragraph_properties = self.extract_paragraph_properties(extract_element(style_element, ".//w:pPr"))
        run_properties = self.extract_run_properties(extract_element(style_element, ".//w:rPr"))
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
            spacing_element = extract_element(pPr_element, "w:spacing")
            if spacing_element is not None:
                spacing_properties = SpacingProperties()
                before = extract_attribute(spacing_element, 'before')
                after = extract_attribute(spacing_element, 'after')
                line = extract_attribute(spacing_element, 'line')
                if before:
                    spacing_properties.before_pt = convert_twips_to_points(int(before))
                if after:
                    spacing_properties.after_pt = convert_twips_to_points(int(after))
                if line:
                    spacing_properties.line_pt = convert_twips_to_points(int(line))
                properties.spacing = spacing_properties

            # Extract indentation
            indent_element = extract_element(pPr_element, "w:ind")
            if indent_element is not None:
                indent_properties = IndentationProperties()
                left = extract_attribute(indent_element, 'left') or extract_attribute(indent_element, 'start')
                right = extract_attribute(indent_element, 'right') or extract_attribute(indent_element, 'end')
                hanging = extract_attribute(indent_element, 'hanging')
                firstLine = extract_attribute(indent_element, 'firstLine')
                if left:
                    indent_properties.left_pt = convert_twips_to_points(int(left))
                if right:
                    indent_properties.right_pt = convert_twips_to_points(int(right))
                if hanging:
                    indent_properties.hanging_pt = convert_twips_to_points(int(hanging))
                if firstLine:
                    indent_properties.firstline_pt = convert_twips_to_points(int(firstLine))
                properties.indent = indent_properties

            # Extract outline level
            outline_lvl_element = extract_element(pPr_element, "w:outlineLvl")
            if outline_lvl_element is not None:
                outline_level = extract_attribute(outline_lvl_element, 'val')
                if outline_level is not None:
                    properties.outline_level = int(outline_level)
            
            # Extract widow control
            widow_control_element = extract_element(pPr_element, "w:widowControl")
            if widow_control_element is not None:
                properties.widow_control = True
            
            # Extract suppress auto hyphens
            suppress_auto_hyphens_element = extract_element(pPr_element, "w:suppressAutoHyphens")
            if suppress_auto_hyphens_element is not None:
                properties.suppress_auto_hyphens = True
            
            # Extract bidi
            bidi_element = extract_element(pPr_element, "w:bidi")
            if bidi_element is not None:
                properties.bidi = True
            
            # Extract justification
            justification_element = extract_element(pPr_element, "w:jc")
            if justification_element is not None:
                properties.justification = extract_attribute(justification_element, 'val')
            
            # Extract keep next
            keep_next_element = extract_element(pPr_element, "w:keepNext")
            if keep_next_element is not None:
                properties.keep_next = True
            
            # Extract suppress line numbers
            suppress_line_numbers_element = extract_element(pPr_element, "w:suppressLineNumbers")
            if suppress_line_numbers_element is not None:
                properties.suppress_line_numbers = True

        return properties

    def extract_run_properties(self, rPr_element: ET.Element) -> RunStyleProperties:
        properties = RunStyleProperties()

        if rPr_element is not None:
            # Extract fonts
            font_element = extract_element(rPr_element, "w:rFonts")
            if font_element is not None:
                font_properties = FontProperties()
                font_properties.ascii = extract_attribute(font_element, 'ascii')
                font_properties.hAnsi = extract_attribute(font_element, 'hAnsi')
                font_properties.eastAsia = extract_attribute(font_element, 'eastAsia')
                font_properties.cs = extract_attribute(font_element, 'cs')
                properties.font = font_properties

            # Extract font size
            size_element = extract_element(rPr_element, "w:sz")
            if size_element is not None:
                size = extract_attribute(size_element, 'val')
                if size:
                    properties.size_pt = convert_half_points_to_points(int(size))

            # Extract font color
            color_element = extract_element(rPr_element, "w:color")
            if color_element is not None:
                properties.color = extract_attribute(color_element, 'val')

            # Extract bold and italic
            bold_element = extract_element(rPr_element, "w:b")
            if bold_element is not None:
                properties.bold = True

            italic_element = extract_element(rPr_element, "w:i")
            if italic_element is not None:
                properties.italic = True

            # Extract underline
            underline_element = extract_element(rPr_element, "w:u")
            if underline_element is not None:
                properties.underline = extract_attribute(underline_element, 'val')

            # Extract strikethrough
            strikethrough_element = extract_element(rPr_element, "w:strike")
            if strikethrough_element is not None:
                properties.strikethrough = True

            # Extract hidden text
            hidden_element = extract_element(rPr_element, "w:vanish")
            if hidden_element is not None:
                properties.hidden = True

            # Extract language settings
            lang_element = extract_element(rPr_element, "w:lang")
            if lang_element is not None:
                lang_properties = LanguageProperties()
                lang_properties.val = extract_attribute(lang_element, 'val')
                lang_properties.eastAsia = extract_attribute(lang_element, 'eastAsia')
                lang_properties.bidi = extract_attribute(lang_element, 'bidi')
                properties.lang = lang_properties

            # Extract highlight
            highlight_element = extract_element(rPr_element, "w:highlight")
            if highlight_element is not None:
                properties.highlight = extract_attribute(highlight_element, 'val')

            # Extract shading
            shading_element = extract_element(rPr_element, "w:shd")
            if shading_element is not None:
                properties.shading = extract_attribute(shading_element, 'val')

            # Extract text position
            text_position_element = extract_element(rPr_element, "w:position")
            if text_position_element is not None:
                text_position = extract_attribute(text_position_element, 'val')
                if text_position:
                    properties.text_position_pt = convert_half_points_to_points(int(text_position))

            # Extract kerning
            kerning_element = extract_element(rPr_element, "w:kern")
            if kerning_element is not None:
                kerning = extract_attribute(kerning_element, 'val')
                if kerning:
                    properties.kerning = int(kerning)

            # Extract character spacing
            character_spacing_element = extract_element(rPr_element, "w:spacing")
            if character_spacing_element is not None:
                character_spacing = extract_attribute(character_spacing_element, 'val')
                if character_spacing:
                    properties.character_spacing_pt = convert_half_points_to_points(int(character_spacing))

            # Extract emboss
            emboss_element = extract_element(rPr_element, "w:emboss")
            if emboss_element is not None:
                properties.emboss = True

            # Extract outline
            outline_element = extract_element(rPr_element, "w:outline")
            if outline_element is not None:
                properties.outline = True

            # Extract shadow
            shadow_element = extract_element(rPr_element, "w:shadow")
            if shadow_element is not None:
                properties.shadow = True

            # Extract all caps
            all_caps_element = extract_element(rPr_element, "w:caps")
            if all_caps_element is not None:
                properties.all_caps = True

            # Extract small caps
            small_caps_element = extract_element(rPr_element, "w:smallCaps")
            if small_caps_element is not None:
                properties.small_caps = True

        return properties

    def get_styles_schema(self) -> StylesSchema:
        return self.styles_schema


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/new_docx.docx"

    docx_file = read_binary_from_file_path(docx_path)
    styles_parser = StylesParser(docx_file)

    # Convert the document schema to a dictionary excluding null properties
    filtered_schema_dict = styles_parser.styles_schema.model_dump(exclude_none=True)

    # Output or further process the filtered schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))
