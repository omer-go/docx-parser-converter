# table_row_parser.py

from lxml import etree
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parsers.models.table_models import TableRow
from docx_parsers.tables.table_row_properties_parser import TableRowPropertiesParser
from docx_parsers.tables.table_cell_parser import TableCellParser

class TableRowParser:
    @staticmethod
    def parse(row_element: etree.Element) -> TableRow:
        """
        Parses a table row from the given XML element.

        Args:
            row_element (etree.Element): The row XML element.

        Returns:
            TableRow: The parsed table row.
        """
        properties_element = extract_element(row_element, ".//w:trPr")
        properties = TableRowPropertiesParser.parse(properties_element)
        cells = [TableCellParser.parse(cell) for cell in row_element.findall(".//w:tc", namespaces=NAMESPACE)]
        return TableRow(properties=properties, cells=cells)
