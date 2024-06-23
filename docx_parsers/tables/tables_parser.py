# tables_parser.py

from lxml import etree
import json
from docx_parsers.utils import read_binary_from_file_path, extract_xml_root_from_docx
from docx_parsers.helpers.common_helpers import NAMESPACE
from docx_parsers.models.table_models import Table
from docx_parsers.tables.table_properties_parser import TablePropertiesParser
from docx_parsers.tables.table_grid_parser import TableGridParser
from docx_parsers.tables.table_row_parser import TableRowParser

class TablesParser:
    def __init__(self, table_element: etree._Element):
        """
        Initializes the TablesParser with the given table XML element.

        Args:
            table_element (etree._Element): The root XML element of the table.
        """
        self.root = table_element

    def parse(self) -> Table:
        """
        Parses the table XML element into a Table object.

        Returns:
            Table: The parsed Table object.
        """
        properties_element = self.root.find(".//w:tblPr", namespaces=NAMESPACE)
        properties = TablePropertiesParser.parse(properties_element)
        grid = TableGridParser.parse(self.root)
        rows = [TableRowParser.parse(row) for row in self.root.findall(".//w:tr", namespaces=NAMESPACE)]
        return Table(properties=properties, grid=grid, rows=rows)

if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"

    # Read the binary content of the DOCX file
    docx_file = read_binary_from_file_path(docx_path)
    # Extract the XML root from the DOCX file for 'document.xml'
    root = extract_xml_root_from_docx(docx_file, 'document.xml')

    # Iterate over each table element found in the document
    for tbl in root.findall(".//w:tbl", namespaces=NAMESPACE):
        # Initialize the TablesParser with the table element
        tables_parser = TablesParser(tbl)
        # Parse the table element into a Table object
        table = tables_parser.parse()
        # Convert the Table object to a dictionary, excluding None values
        filtered_schema_dict = table.model_dump(exclude_none=True)
        # Print the resulting dictionary as a formatted JSON string
        print(json.dumps(filtered_schema_dict, indent=2))