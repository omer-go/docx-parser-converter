from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, safe_int
from docx_parsers.models.table_models import TableRowProperties
from docx_parsers.tables.table_properties_parser import TablePropertiesParser
from docx_parsers.utils import convert_twips_to_points

class TableRowPropertiesParser:
    """
    A parser for extracting table row properties from an XML element.
    """

    @staticmethod
    def parse(trPr_element: Optional[etree.Element]) -> TableRowProperties:
        """
        Parses table row properties from the given XML element.

        Args:
            trPr_element (Optional[etree.Element]): The row properties XML element.

        Returns:
            TableRowProperties: The parsed table row properties.

        Example:
            The following is an example of table row properties in a table row element:

            .. code-block:: xml

                <w:trPr>
                    <w:trHeight w:val="300"/>
                    <w:tblHeader/>
                    <w:jc w:val="center"/>
                    <w:tblBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tblBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                </w:trPr>
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

        Example:
            The following is an example of a row height element:

            .. code-block:: xml

                <w:trHeight w:val="300"/>
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

        Example:
            The following is an example of a row height rule element:

            .. code-block:: xml

                <w:trHeight w:val="300" w:hRule="exact"/>
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

        Example:
            The following is an example of a table header element:

            .. code-block:: xml

                <w:tblHeader/>
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

        Example:
            The following is an example of a justification element:

            .. code-block:: xml

                <w:jc w:val="center"/>
        """
        jc_element = extract_element(element, ".//w:jc")
        return extract_attribute(jc_element, 'val')
