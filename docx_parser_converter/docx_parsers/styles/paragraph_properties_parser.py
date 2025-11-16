import xml.etree.ElementTree as ET
from typing import Optional, List
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, extract_attribute, extract_boolean_attribute
from docx_parser_converter.docx_parsers.utils import convert_twips_to_points
from docx_parser_converter.docx_parsers.models.styles_models import ParagraphStyleProperties, SpacingProperties, IndentationProperties

class ParagraphPropertiesParser:
    """
    Parses the paragraph properties from a DOCX paragraph properties element.

    This class extracts and parses various properties related to paragraph formatting, 
    converting them into structured Pydantic models for further processing or conversion 
    to other formats.
    """

    def parse(self, pPr_element: ET.Element) -> ParagraphStyleProperties:
        """
        Parses the given paragraph properties element into a ParagraphStyleProperties object.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            ParagraphStyleProperties: The parsed paragraph style properties.

        Example:
            The following is an example of a paragraph properties element:

            .. code-block:: xml

                <w:pPr>
                    <w:spacing w:before="240" w:after="240" w:line="360"/>
                    <w:ind w:left="720" w:right="720" w:firstLine="720"/>
                    <w:jc w:val="both"/>
                    <w:outlineLvl w:val="1"/>
                    <w:widowControl/>
                    <w:suppressAutoHyphens/>
                    <w:bidi/>
                    <w:keepNext/>
                    <w:suppressLineNumbers/>
                </w:pPr>
        """
        properties = ParagraphStyleProperties.model_validate({})
        
        if pPr_element is not None:
            properties.spacing = self.extract_spacing(pPr_element)
            properties.indent = self.extract_indentation(pPr_element)
            properties.outline_level = self.extract_outline_level(pPr_element)
            properties.widow_control = self.extract_widow_control(pPr_element)
            properties.suppress_auto_hyphens = self.extract_suppress_auto_hyphens(pPr_element)
            properties.bidi = self.extract_bidi(pPr_element)
            properties.justification = self.extract_justification(pPr_element)
            properties.highlight = self.extract_highlight(pPr_element)
            properties.keep_next = self.extract_keep_next(pPr_element)
            properties.suppress_line_numbers = self.extract_suppress_line_numbers(pPr_element)

        return properties

    def extract_spacing(self, pPr_element: ET.Element) -> Optional[SpacingProperties]:
        """
        Extracts spacing properties from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[SpacingProperties]: The extracted spacing properties.

        Example:
            The following is an example of spacing properties in a paragraph properties element:

            .. code-block:: xml

                <w:spacing w:before="240" w:after="240" w:line="360"/>
        """
        spacing_element = extract_element(pPr_element, "w:spacing")
        if spacing_element is not None:
            spacing_properties = SpacingProperties.model_validate({})
            before = extract_attribute(spacing_element, 'before')
            after = extract_attribute(spacing_element, 'after')
            line = extract_attribute(spacing_element, 'line')
            if before is not None:
                spacing_properties.before_pt = convert_twips_to_points(int(before))
            if after is not None:
                spacing_properties.after_pt = convert_twips_to_points(int(after))
            if line is not None:
                spacing_properties.line_pt = convert_twips_to_points(int(line))
            return spacing_properties
        return None

    def extract_indentation(self, pPr_element: ET.Element) -> Optional[IndentationProperties]:
        """
        Extracts indentation properties from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[IndentationProperties]: The extracted indentation properties.

        Example:
            The following is an example of indentation properties in a paragraph properties element:

            .. code-block:: xml

                <w:ind w:left="720" w:right="720" w:firstLine="720"/>
        """
        indent_element = extract_element(pPr_element, "w:ind")
        if indent_element is not None:
            left_pt = self.convert_to_points(indent_element, ['left', 'start'])
            right_pt = self.convert_to_points(indent_element, ['right', 'end'])
            hanging_pt = self.convert_to_points(indent_element, ['hanging'])
            firstline_pt = self.convert_to_points(indent_element, ['firstLine'])

            # Handling hanging and firstLine properties
            if hanging_pt is not None:
                firstline_pt = -hanging_pt

            return IndentationProperties(
                left_pt=left_pt,
                right_pt=right_pt,
                firstline_pt=firstline_pt
            )
        return None

    def convert_to_points(self, element: ET.Element, attrs: List[str]) -> Optional[float]:
        """
        Converts the given attribute values to points.

        Args:
            element (ET.Element): The XML element containing the attributes.
            attrs (List[str]): The list of attribute names to convert.

        Returns:
            Optional[float]: The converted value in points, or None if not found.

        Example:
            The following is an example of converting attributes to points:

            .. code-block:: python

                left_pt = self.convert_to_points(indent_element, ['left', 'start'])
        """
        for attr in attrs:
            value = extract_attribute(element, attr)
            if value is not None:
                return convert_twips_to_points(int(value))
        return None

    def extract_outline_level(self, pPr_element: ET.Element) -> Optional[int]:
        """
        Extracts the outline level from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[int]: The extracted outline level.

        Example:
            The following is an example of an outline level in a paragraph properties element:

            .. code-block:: xml

                <w:outlineLvl w:val="1"/>
        """
        outline_lvl_element = extract_element(pPr_element, "w:outlineLvl")
        if outline_lvl_element is not None:
            outline_level = extract_attribute(outline_lvl_element, 'val')
            if outline_level is not None:
                return int(outline_level)
        return None

    def extract_widow_control(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the widow control setting from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[bool]: The widow control setting.

        Example:
            The following is an example of a widow control setting in a paragraph properties element:

            .. code-block:: xml

                <w:widowControl/>
        """
        widow_control_element = extract_element(pPr_element, "w:widowControl")
        return extract_boolean_attribute(widow_control_element)

    def extract_suppress_auto_hyphens(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the suppress auto hyphens setting from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[bool]: The suppress auto hyphens setting.

        Example:
            The following is an example of a suppress auto hyphens setting in a paragraph properties element:

            .. code-block:: xml

                <w:suppressAutoHyphens/>
        """
        suppress_auto_hyphens_element = extract_element(pPr_element, "w:suppressAutoHyphens")
        return extract_boolean_attribute(suppress_auto_hyphens_element)

    def extract_bidi(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the bidirectional setting from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[bool]: The bidirectional setting.

        Example:
            The following is an example of a bidirectional setting in a paragraph properties element:

            .. code-block:: xml

                <w:bidi/>
        """
        bidi_element = extract_element(pPr_element, "w:bidi")
        return extract_boolean_attribute(bidi_element)

    def extract_justification(self, pPr_element: ET.Element) -> Optional[str]:
        """
        Extracts the justification value from the given element.

        Args:
            pPr_element (ET.Element): The element containing the justification.

        Returns:
            Optional[str]: The raw DOCX justification value (e.g., 'left', 'start', 'both') or None.

        Example:
            The following is an example of a justification setting in a paragraph properties element:

            .. code-block:: xml

                <w:jc w:val="both"/>
        """
        justification_element = extract_element(pPr_element, "w:jc")
        if justification_element is not None:
            return extract_attribute(justification_element, 'val')
        return None

    def extract_keep_next(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the keep next setting from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[bool]: The keep next setting.

        Example:
            The following is an example of a keep next setting in a paragraph properties element:

            .. code-block:: xml

                <w:keepNext/>
        """
        keep_next_element = extract_element(pPr_element, "w:keepNext")
        return extract_boolean_attribute(keep_next_element)

    def extract_suppress_line_numbers(self, pPr_element: ET.Element) -> Optional[bool]:
        """
        Extracts the suppress line numbers setting from the given paragraph properties element.

        Args:
            pPr_element (ET.Element): The paragraph properties element.

        Returns:
            Optional[bool]: The suppress line numbers setting.

        Example:
            The following is an example of a suppress line numbers setting in a paragraph properties element:

            .. code-block:: xml

                <w:suppressLineNumbers/>
        """
        suppress_line_numbers_element = extract_element(pPr_element, "w:suppressLineNumbers")
        return extract_boolean_attribute(suppress_line_numbers_element)

    def extract_highlight(self, pPr_element: ET.Element) -> Optional[str]:
        """
        Extracts paragraph highlight/shading color from the properties element.

        Prefers an explicit <w:highlight w:val="..."> if present, otherwise falls back
        to the fill color defined on <w:shd>.
        """
        highlight_element = extract_element(pPr_element, "w:highlight")
        if highlight_element is not None:
            highlight = extract_attribute(highlight_element, "val")
            if highlight:
                return highlight

        shading_element = extract_element(pPr_element, "w:shd")
        if shading_element is not None:
            fill = extract_attribute(shading_element, "fill")
            if fill and fill.lower() != "auto":
                return fill
            color = extract_attribute(shading_element, "color")
            if color and color.lower() != "auto":
                return color

        return None
