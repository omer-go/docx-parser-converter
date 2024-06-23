# table_cell_parser.py

from lxml import etree
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parsers.models.table_models import TableCell
from docx_parsers.document_parser import DocumentParser  # Assuming DocumentParser has parse_paragraph method
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
        document_parser = DocumentParser()
        properties_element = extract_element(cell_element, ".//w:tcPr")
        properties = TableCellPropertiesParser.parse(properties_element)
        paragraphs = [document_parser.parse_paragraph(p) for p in cell_element.findall(".//w:p", namespaces=NAMESPACE)]
        return TableCell(properties=properties, paragraphs=paragraphs)
