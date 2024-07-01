from lxml import etree
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parsers.models.table_models import TableCell
from docx_parsers.document.paragraph_parser import ParagraphParser
from docx_parsers.tables.table_cell_properties_parser import TableCellPropertiesParser

class TableCellParser:
    """
    A parser for extracting table cells from an XML element.
    """

    @staticmethod
    def parse(cell_element: etree.Element) -> TableCell:
        """
        Parses a table cell from the given XML element.

        Args:
            cell_element (etree.Element): The cell XML element.

        Returns:
            TableCell: The parsed table cell.

        Example:
            The following is an example of a table cell element in a document.xml file:

            .. code-block:: xml

                <w:tc>
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
                    <w:p>
                        <!-- Paragraph content here -->
                    </w:p>
                </w:tc>
        """
        properties_element = extract_element(cell_element, ".//w:tcPr")
        properties = TableCellPropertiesParser.parse(properties_element)
        paragraph_parser = ParagraphParser()
        paragraphs = [paragraph_parser.parse(p) for p in cell_element.findall(".//w:p", namespaces=NAMESPACE)]
        return TableCell(properties=properties, paragraphs=paragraphs)
