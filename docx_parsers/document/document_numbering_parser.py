# numbering_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute
from docx_parsers.models.document_models import Numbering

class DocumentNumberingParser:
    @staticmethod
    def parse(pPr: Optional[etree.Element]) -> Optional[Numbering]:
        """
        Parses numbering from the given paragraph properties XML element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties XML element.

        Returns:
            Optional[Numbering]: The parsed numbering, or None if not found.
        """
        numPr = extract_element(pPr, ".//w:numPr")
        if numPr is None:
            return None
        ilvl_elem = extract_element(numPr, ".//w:ilvl")
        numId_elem = extract_element(numPr, ".//w:numId")
        ilvl = int(extract_attribute(ilvl_elem, 'val')) if ilvl_elem is not None else 0
        numId = int(extract_attribute(numId_elem, 'val')) if numId_elem is not None else 0
        return Numbering(ilvl=ilvl, numId=numId)
