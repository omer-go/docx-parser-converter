# table_row_properties_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, safe_int
from docx_parsers.models.table_models import TableRowProperties
from docx_parsers.tables.table_properties_parser import TablePropertiesParser
from docx_parsers.utils import convert_twips_to_points

class TableRowPropertiesParser:
    @staticmethod
    def parse(trPr_element: Optional[etree.Element]) -> TableRowProperties:
        """
        Parses table row properties from the given XML element.

        Args:
            trPr_element (Optional[etree.Element]): The row properties XML element.

        Returns:
            TableRowProperties: The parsed table row properties.
        """
        return TableRowProperties(
            trHeight=TableRowPropertiesParser.extract_row_height(trPr_element),
            trHeight_hRule=TableRowPropertiesParser.extract_row_height_h_rule(trPr_element),
            tblHeader=TableRowPropertiesParser.extract_table_header(trPr_element),
            justification=TableRowPropertiesParser.extract_justification(trPr_element),
            tblBorders=TablePropertiesParser.extract_table_cell_borders(extract_element(trPr_element, ".//w:tblBorders")),
            shd=TablePropertiesParser.extract_shading(extract_element(trPr_element, ".//w:shd"))
        )

    @staticmethod
    def extract_row_height(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts row height from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The row height in points as a string, or None if not found.
        """
        height_element = extract_element(element, ".//w:trHeight")
        if height_element is not None:
            height_value = safe_int(extract_attribute(height_element, 'val'))
            return str(convert_twips_to_points(height_value)) if height_value is not None else None
        return None

    @staticmethod
    def extract_row_height_h_rule(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts row height rule from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The row height rule, or None if not found.
        """
        height_element = extract_element(element, ".//w:trHeight")
        if height_element is not None:
            return extract_attribute(height_element, 'hRule')
        return None

    @staticmethod
    def extract_table_header(element: Optional[etree.Element]) -> Optional[bool]:
        """
        Extracts table header from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[bool]: True if the table header is found, otherwise None.
        """
        header_element = extract_element(element, ".//w:tblHeader")
        return header_element is not None

    @staticmethod
    def extract_justification(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts justification from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The justification, or None if not found.
        """
        jc_element = extract_element(element, ".//w:jc")
        return extract_attribute(jc_element, 'val')
