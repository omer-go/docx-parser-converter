# run_properties_parser.py

import xml.etree.ElementTree as ET
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, extract_boolean_attribute
from docx_parsers.utils import convert_half_points_to_points
from docx_parsers.models.styles_models import RunStyleProperties, FontProperties, LanguageProperties

class RunPropertiesParser:
    """
    A parser for extracting run properties from an XML element.
    """

    def parse(self, rPr_element: ET.Element) -> RunStyleProperties:
        """
        Parses run properties from the given XML element.

        Args:
            rPr_element (ET.Element): The run properties XML element.

        Returns:
            RunStyleProperties: The parsed run style properties.
        """
        properties = RunStyleProperties()

        if rPr_element is not None:
            properties.font = self.extract_fonts(rPr_element)
            properties.size_pt = self.extract_font_size(rPr_element)
            properties.color = self.extract_font_color(rPr_element)
            properties.bold = self.extract_bold(rPr_element)
            properties.italic = self.extract_italic(rPr_element)
            properties.underline = self.extract_underline(rPr_element)
            properties.strikethrough = self.extract_strikethrough(rPr_element)
            properties.hidden = self.extract_hidden(rPr_element)
            properties.lang = self.extract_language_settings(rPr_element)
            properties.highlight = self.extract_highlight(rPr_element)
            properties.shading = self.extract_shading(rPr_element)
            properties.text_position_pt = self.extract_text_position(rPr_element)
            properties.kerning = self.extract_kerning(rPr_element)
            properties.character_spacing_pt = self.extract_character_spacing(rPr_element)
            properties.emboss = self.extract_emboss(rPr_element)
            properties.outline = self.extract_outline(rPr_element)
            properties.shadow = self.extract_shadow(rPr_element)
            properties.all_caps = self.extract_all_caps(rPr_element)
            properties.small_caps = self.extract_small_caps(rPr_element)

        return properties

    def extract_fonts(self, rPr_element: ET.Element) -> Optional[FontProperties]:
        font_element = extract_element(rPr_element, "w:rFonts")
        if font_element is not None:
            font_properties = FontProperties()
            font_properties.ascii = extract_attribute(font_element, 'ascii')
            font_properties.hAnsi = extract_attribute(font_element, 'hAnsi')
            font_properties.eastAsia = extract_attribute(font_element, 'eastAsia')
            font_properties.cs = extract_attribute(font_element, 'cs')
            return font_properties
        return None

    def extract_font_size(self, rPr_element: ET.Element) -> Optional[float]:
        size_element = extract_element(rPr_element, "w:sz")
        if size_element is not None:
            size = extract_attribute(size_element, 'val')
            if size:
                return convert_half_points_to_points(int(size))
        return None

    def extract_font_color(self, rPr_element: ET.Element) -> Optional[str]:
        color_element = extract_element(rPr_element, "w:color")
        if color_element is not None:
            return extract_attribute(color_element, 'val')
        return None

    def extract_bold(self, rPr_element: ET.Element) -> Optional[bool]:
        bold_element = extract_element(rPr_element, "w:b")
        return extract_boolean_attribute(bold_element)

    def extract_italic(self, rPr_element: ET.Element) -> Optional[bool]:
        italic_element = extract_element(rPr_element, "w:i")
        return extract_boolean_attribute(italic_element)

    def extract_underline(self, rPr_element: ET.Element) -> Optional[str]:
        underline_element = extract_element(rPr_element, "w:u")
        if underline_element is not None:
            return extract_attribute(underline_element, 'val')
        return None

    def extract_strikethrough(self, rPr_element: ET.Element) -> Optional[bool]:
        strikethrough_element = extract_element(rPr_element, "w:strike")
        return extract_boolean_attribute(strikethrough_element)

    def extract_hidden(self, rPr_element: ET.Element) -> Optional[bool]:
        hidden_element = extract_element(rPr_element, "w:vanish")
        return extract_boolean_attribute(hidden_element)

    def extract_language_settings(self, rPr_element: ET.Element) -> Optional[LanguageProperties]:
        lang_element = extract_element(rPr_element, "w:lang")
        if lang_element is not None:
            lang_properties = LanguageProperties()
            lang_properties.val = extract_attribute(lang_element, 'val')
            lang_properties.eastAsia = extract_attribute(lang_element, 'eastAsia')
            lang_properties.bidi = extract_attribute(lang_element, 'bidi')
            return lang_properties
        return None

    def extract_highlight(self, rPr_element: ET.Element) -> Optional[str]:
        highlight_element = extract_element(rPr_element, "w:highlight")
        if highlight_element is not None:
            return extract_attribute(highlight_element, 'val')
        return None

    def extract_shading(self, rPr_element: ET.Element) -> Optional[str]:
        shading_element = extract_element(rPr_element, "w:shd")
        if shading_element is not None:
            return extract_attribute(shading_element, 'val')
        return None

    def extract_text_position(self, rPr_element: ET.Element) -> Optional[float]:
        text_position_element = extract_element(rPr_element, "w:position")
        if text_position_element is not None:
            text_position = extract_attribute(text_position_element, 'val')
            if text_position:
                return convert_half_points_to_points(int(text_position))
        return None

    def extract_kerning(self, rPr_element: ET.Element) -> Optional[int]:
        kerning_element = extract_element(rPr_element, "w:kern")
        if kerning_element is not None:
            kerning = extract_attribute(kerning_element, 'val')
            if kerning:
                return int(kerning)
        return None

    def extract_character_spacing(self, rPr_element: ET.Element) -> Optional[float]:
        character_spacing_element = extract_element(rPr_element, "w:spacing")
        if character_spacing_element is not None:
            character_spacing = extract_attribute(character_spacing_element, 'val')
            if character_spacing:
                return convert_half_points_to_points(int(character_spacing))
        return None

    def extract_emboss(self, rPr_element: ET.Element) -> Optional[bool]:
        emboss_element = extract_element(rPr_element, "w:emboss")
        return extract_boolean_attribute(emboss_element)

    def extract_outline(self, rPr_element: ET.Element) -> Optional[bool]:
        outline_element = extract_element(rPr_element, "w:outline")
        return extract_boolean_attribute(outline_element)

    def extract_shadow(self, rPr_element: ET.Element) -> Optional[bool]:
        shadow_element = extract_element(rPr_element, "w:shadow")
        return extract_boolean_attribute(shadow_element)

    def extract_all_caps(self, rPr_element: ET.Element) -> Optional[bool]:
        all_caps_element = extract_element(rPr_element, "w:caps")
        return extract_boolean_attribute(all_caps_element)

    def extract_small_caps(self, rPr_element: ET.Element) -> Optional[bool]:
        small_caps_element = extract_element(rPr_element, "w:smallCaps")
        return extract_boolean_attribute(small_caps_element)
