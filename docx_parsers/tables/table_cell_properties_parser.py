# table_cell_properties_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, safe_int
from docx_parsers.models.table_models import TableCellProperties, TableWidth
from docx_parsers.tables.table_properties_parser import TablePropertiesParser

class TableCellPropertiesParser:
    @staticmethod
    def parse(tcPr_element: Optional[etree.Element]) -> TableCellProperties:
        """
        Parses table cell properties from the given XML element.

        Args:
            tcPr_element (Optional[etree.Element]): The cell properties XML element.

        Returns:
            TableCellProperties: The parsed table cell properties.
        """
        return TableCellProperties(
            tcW=TableCellPropertiesParser.extract_table_cell_width(tcPr_element),
            tcBorders=TablePropertiesParser.extract_table_cell_borders(extract_element(tcPr_element, ".//w:tcBorders")),
            shd=TablePropertiesParser.extract_shading(extract_element(tcPr_element, ".//w:shd")),
            tcMar=TablePropertiesParser.extract_table_cell_margins(tcPr_element),
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
        """
        width_element = extract_element(element, ".//w:tcW")
        if width_element is not None:
            return TableWidth(
                type=extract_attribute(width_element, 'type'),
                width=safe_int(extract_attribute(width_element, 'w'))
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
        """
        grid_span_element = extract_element(element, ".//w:gridSpan")
        return safe_int(extract_attribute(grid_span_element, 'val'))
