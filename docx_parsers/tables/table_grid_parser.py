# table_grid_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_attribute, NAMESPACE
from docx_parsers.models.table_models import TableGrid
from docx_parsers.utils import convert_twips_to_points

class TableGridParser:
    @staticmethod
    def parse(table_element: etree.Element) -> Optional[TableGrid]:
        """
        Parses the table grid from the given XML element.

        Args:
            table_element (etree.Element): The table XML element.

        Returns:
            Optional[TableGrid]: The parsed table grid, or None if not found.
        """
        grid_elements = table_element.findall(".//w:gridCol", namespaces=NAMESPACE)
        if grid_elements:
            columns = [convert_twips_to_points(int(extract_attribute(col, 'w'))) for col in grid_elements]
            return TableGrid(columns=columns)
        return None
