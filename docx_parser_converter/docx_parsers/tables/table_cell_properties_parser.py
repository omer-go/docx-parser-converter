from lxml import etree
from typing import Optional
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, extract_attribute, safe_int
from docx_parser_converter.docx_parsers.models.table_models import TableCellProperties, TableWidth
from docx_parser_converter.docx_parsers.tables.table_properties_parser import TablePropertiesParser
from docx_parser_converter.docx_parsers.utils import convert_twips_to_points, convert_half_points_to_points

class TableCellPropertiesParser:
    """
    A parser for extracting table cell properties from an XML element.
    """

    @staticmethod
    def parse(tcPr_element: Optional[etree.Element]) -> TableCellProperties:
        """
        Parses table cell properties from the given XML element.

        Args:
            tcPr_element (Optional[etree.Element]): The cell properties XML element.

        Returns:
            TableCellProperties: The parsed table cell properties.

        Example:
            The following is an example of table cell properties in a table cell element:

            .. code-block:: xml

                <w:tcPr>
                    <w:tcW w:w="5000" w:type="dxa"/>
                    <w:tcBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tcBorders>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    <w:tcMar>
                        <w:top w:w="100" w:type="dxa"/>
                        <w:left w:w="100" w:type="dxa"/>
                        <w:bottom w:w="100" w:type="dxa"/>
                        <w:right w:w="100" w:type="dxa"/>
                    </w:tcMar>
                    <w:textDirection w:val="btLr"/>
                    <w:vAlign w:val="center"/>
                    <w:gridSpan w:val="2"/>
                </w:tcPr>
        """
        return TableCellProperties(
            tcW=TableCellPropertiesParser.extract_table_cell_width(tcPr_element),
            tcBorders=TablePropertiesParser.extract_table_cell_borders(extract_element(tcPr_element, ".//w:tcBorders")),
            shd=TablePropertiesParser.extract_shading(extract_element(tcPr_element, ".//w:shd")),
            tcMar=TableCellPropertiesParser.extract_table_cell_margins(tcPr_element),
            textDirection=TableCellPropertiesParser.extract_text_direction(tcPr_element),
            vAlign=TableCellPropertiesParser.extract_vertical_alignment(tcPr_element),
            hideMark=TableCellPropertiesParser.extract_hide_mark(tcPr_element),
            cellMerge=TableCellPropertiesParser.extract_cell_merge(tcPr_element),
            gridSpan=TableCellPropertiesParser.extract_grid_span(tcPr_element)
        )

    @staticmethod
    def extract_table_cell_width(element: Optional[etree.Element]) -> Optional[TableWidth]:
        """
        Extracts table cell width from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[TableWidth]: The table cell width, or None if not found.

        Example:
            The following is an example of a table cell width element:

            .. code-block:: xml

                <w:tcW w:w="5000" w:type="dxa"/>
        """
        width_element = extract_element(element, ".//w:tcW")
        if width_element is not None:
            width_value = safe_int(extract_attribute(width_element, 'w'))
            return TableWidth(
                type=extract_attribute(width_element, 'type'),
                width=convert_twips_to_points(width_value) if width_value is not None else None
            )
        return None

    @staticmethod
    def extract_text_direction(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts text direction from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The text direction, or None if not found.

        Example:
            The following is an example of a text direction element:

            .. code-block:: xml

                <w:textDirection w:val="btLr"/>
        """
        direction_element = extract_element(element, ".//w:textDirection")
        return extract_attribute(direction_element, 'val')

    @staticmethod
    def extract_vertical_alignment(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts vertical alignment from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The vertical alignment, or None if not found.

        Example:
            The following is an example of a vertical alignment element:

            .. code-block:: xml

                <w:vAlign w:val="center"/>
        """
        alignment_element = extract_element(element, ".//w:vAlign")
        return extract_attribute(alignment_element, 'val')

    @staticmethod
    def extract_hide_mark(element: Optional[etree.Element]) -> Optional[bool]:
        """
        Extracts hide mark from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[bool]: True if the hide mark is found, otherwise None.

        Example:
            The following is an example of a hide mark element:

            .. code-block:: xml

                <w:hideMark/>
        """
        hide_mark_element = extract_element(element, ".//w:hideMark")
        return hide_mark_element is not None

    @staticmethod
    def extract_cell_merge(element: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts cell merge from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[str]: The cell merge value, or None if not found.

        Example:
            The following is an example of a cell merge element:

            .. code-block:: xml

                <w:cellMerge w:val="restart"/>
        """
        merge_element = extract_element(element, ".//w:cellMerge")
        return extract_attribute(merge_element, 'val')

    @staticmethod
    def extract_grid_span(element: Optional[etree.Element]) -> Optional[int]:
        """
        Extracts grid span from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[int]: The grid span value, or None if not found.

        Example:
            The following is an example of a grid span element:

            .. code-block:: xml

                <w:gridSpan w:val="2"/>
        """
        grid_span_element = extract_element(element, ".//w:gridSpan")
        return safe_int(extract_attribute(grid_span_element, 'val'))

    @staticmethod
    def extract_table_cell_margins(element: Optional[etree.Element]) -> Optional[dict]:
        """
        Extracts table cell margins from the given XML element.

        Args:
            element (Optional[etree.Element]): The XML element.

        Returns:
            Optional[dict]: The table cell margins, or None if not found.

        Example:
            The following is an example of table cell margins:

            .. code-block:: xml

                <w:tcMar>
                    <w:top w:w="100" w:type="dxa"/>
                    <w:left w:w="100" w:type="dxa"/>
                    <w:bottom w:w="100" w:type="dxa"/>
                    <w:right w:w="100" w:type="dxa"/>
                </w:tcMar>
        """
        margins_element = extract_element(element, ".//w:tcMar")
        if margins_element is not None:
            margins = {}
            for attr in ['top', 'left', 'bottom', 'right']:
                margin_element = extract_element(margins_element, f".//w:{attr}")
                if margin_element is not None:
                    margin_value = safe_int(extract_attribute(margin_element, 'w'))
                    if margin_value is not None:
                        margins[attr] = convert_twips_to_points(margin_value)
            return margins
        return None
