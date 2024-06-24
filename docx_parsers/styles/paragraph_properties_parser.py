# paragraph_properties_parser.py

import xml.etree.ElementTree as ET
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute
from docx_parsers.utils import convert_twips_to_points
from docx_parsers.models.styles_models import ParagraphStyleProperties, SpacingProperties, IndentationProperties

class ParagraphPropertiesParser:
    """
    A parser for extracting paragraph properties from an XML element.
    """

    def parse(self, pPr_element: ET.Element) -> ParagraphStyleProperties:
        """
        Parses paragraph properties from the given XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            ParagraphStyleProperties: The parsed paragraph style properties.
        """
        properties = ParagraphStyleProperties()
        
        if pPr_element is not None:
            properties.spacing = self.extract_spacing(pPr_element)
            properties.indent = self.extract_indentation(pPr_element)
            properties.outline_level = self.extract_outline_level(pPr_element)
            properties.widow_control = self.extract_widow_control(pPr_element)
            properties.suppress_auto_hyphens = self.extract_suppress_auto_hyphens(pPr_element)
            properties.bidi = self.extract_bidi(pPr_element)
            properties.justification = self.extract_justification(pPr_element)
            properties.keep_next = self.extract_keep_next(pPr_element)
            properties.suppress_line_numbers = self.extract_suppress_line_numbers(pPr_element)

        return properties

    def extract_spacing(self, pPr_element: ET.Element) -> Optional[SpacingProperties]:
        """
        Extracts spacing properties from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[SpacingProperties]: The extracted spacing properties or None.
        """
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
            return spacing_properties
        return None

    def extract_indentation(self, pPr_element: ET.Element) -> Optional[IndentationProperties]:
        """
        Extracts indentation properties from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[IndentationProperties]: The extracted indentation properties or None.
        """
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
            return indent_properties
        return None

    def extract_outline_level(self, pPr_element: ET.Element) -> Optional[int]:
        """
        Extracts the outline level from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[int]: The extracted outline level or None.
        """
        outline_lvl_element = extract_element(pPr_element, "w:outlineLvl")
        if outline_lvl_element is not None:
            outline_level = extract_attribute(outline_lvl_element, 'val')
            if outline_level is not None:
                return int(outline_level)
        return None

    def extract_widow_control(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the widow control property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[bool]: The extracted widow control property or None.
        """
        widow_control_element = extract_element(pPr_element, "w:widowControl")
        if widow_control_element is not None:
            return True
        return None

    def extract_suppress_auto_hyphens(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the suppress auto hyphens property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[bool]: The extracted suppress auto hyphens property or None.
        """
        suppress_auto_hyphens_element = extract_element(pPr_element, "w:suppressAutoHyphens")
        if suppress_auto_hyphens_element is not None:
            return True
        return None

    def extract_bidi(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the bidi property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[bool]: The extracted bidi property or None.
        """
        bidi_element = extract_element(pPr_element, "w:bidi")
        if bidi_element is not None:
            return True
        return None

    def extract_justification(self, pPr_element: ET.Element) -> Optional[str]:
        """
        Extracts the justification property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[str]: The extracted justification property or None.
        """
        justification_element = extract_element(pPr_element, "w:jc")
        if justification_element is not None:
            return extract_attribute(justification_element, 'val')
        return None

    def extract_keep_next(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the keep next property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[bool]: The extracted keep next property or None.
        """
        keep_next_element = extract_element(pPr_element, "w:keepNext")
        if keep_next_element is not None:
            return True
        return None

    def extract_suppress_line_numbers(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the suppress line numbers property from the paragraph properties XML element.

        Args:
            pPr_element (ET.Element): The paragraph properties XML element.

        Returns:
            Optional[bool]: The extracted suppress line numbers property or None.
        """
        suppress_line_numbers_element = extract_element(pPr_element, "w:suppressLineNumbers")
        if suppress_line_numbers_element is not None:
            return True
        return None
