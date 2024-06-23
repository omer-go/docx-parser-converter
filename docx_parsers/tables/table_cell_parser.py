# table_cell_parser.py

from lxml import etree
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parsers.models.table_models import TableCell
from docx_parsers.document.paragraph_parser import ParagraphParser
from docx_parsers.tables.table_cell_properties_parser import TableCellPropertiesParser

class TableCellParser:
    @staticmethod
    def parse(cell_element: etree.Element) -> TableCell:
        """
        Parses a table cell from the given XML element.

        Args:
            cell_element (etree.Element): The cell XML element.

        Returns:
            TableCell: The parsed table cell.
        """
        properties_element = extract_element(cell_element, ".//w:tcPr")
        properties = TableCellPropertiesParser.parse(properties_element)
        paragraph_parser = ParagraphParser()
        paragraphs = [paragraph_parser.parse(p) for p in cell_element.findall(".//w:p", namespaces=NAMESPACE)]
        return TableCell(properties=properties, paragraphs=paragraphs)
