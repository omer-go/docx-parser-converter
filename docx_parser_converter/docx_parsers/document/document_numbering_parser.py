from lxml import etree
from typing import Optional
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, extract_attribute
from docx_parser_converter.docx_parsers.models.paragraph_models import Numbering

class DocumentNumberingParser:
    """
    Parses the numbering properties of a paragraph in a docx document.

    This class contains methods to parse the numbering properties from the
    paragraph properties (pPr) element of a docx document. The numbering 
    properties are essential for understanding the ordered or unordered 
    list formatting in the document.
    """

    @staticmethod
    def parse(pPr: Optional[etree.Element]) -> Optional[Numbering]:
        """
        Parses numbering from the given paragraph properties XML element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties XML element.
                This element can contain numbering properties which define the
                list level and list ID for the paragraph.

        Returns:
            Optional[Numbering]: The parsed numbering, or None if not found.

        Example:
            The following is an example of the numbering properties in a 
            paragraph properties (pPr) element:

            .. code-block:: xml

                <w:pPr>
                    <w:numPr>
                        <w:ilvl w:val="1"/>
                        <w:numId w:val="2"/>
                    </w:numPr>
                </w:pPr>
        """
        numPr = extract_element(pPr, ".//w:numPr")
        if numPr is None:
            return None

        ilvl_elem = extract_element(numPr, ".//w:ilvl")
        numId_elem = extract_element(numPr, ".//w:numId")

        # Extract the level of the numbering (ilvl)
        ilvl = int(extract_attribute(ilvl_elem, 'val')) if ilvl_elem is not None else 0

        # Extract the ID of the numbering (numId)
        numId = int(extract_attribute(numId_elem, 'val')) if numId_elem is not None else 0

        return Numbering(ilvl=ilvl, numId=numId)
