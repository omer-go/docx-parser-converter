from lxml import etree
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parser_converter.docx_parsers.models.table_models import TableRow
from docx_parser_converter.docx_parsers.tables.table_row_properties_parser import TableRowPropertiesParser
from docx_parser_converter.docx_parsers.tables.table_cell_parser import TableCellParser

class TableRowParser:
    """
    A parser for extracting table rows from an XML element.
    """

    @staticmethod
    def parse(row_element: etree.Element) -> TableRow:
        """
        Parses a table row from the given XML element.

        Args:
            row_element (etree.Element): The row XML element.

        Returns:
            TableRow: The parsed table row.

        Example:
            The following is an example of a table row element in a document.xml file:

            .. code-block:: xml

                <w:tr>
                    <w:trPr>
                        <w:trHeight w:val="300"/>
                        <w:tblHeader/>
                    </w:trPr>
                    <w:tc>
                        <w:tcPr>
                            <w:tcW w:w="5000" w:type="dxa"/>
                        </w:tcPr>
                        <w:p>
                            <!-- Paragraph content here -->
                        </w:p>
                    </w:tc>
                    <w:tc>
                        <w:tcPr>
                            <w:tcW w:w="5000" w:type="dxa"/>
                        </w:tcPr>
                        <w:p>
                            <!-- Paragraph content here -->
                        </w:p>
                    </w:tc>
                </w:tr>
        """
        properties_element = extract_element(row_element, ".//w:trPr")
        properties = TableRowPropertiesParser.parse(properties_element)
        cells = [TableCellParser.parse(cell) for cell in row_element.findall(".//w:tc", namespaces=NAMESPACE)]
        return TableRow(properties=properties, cells=cells)
