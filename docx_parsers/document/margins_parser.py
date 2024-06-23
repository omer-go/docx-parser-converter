# margins_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute
from docx_parsers.utils import convert_twips_to_points
from docx_parsers.models.document_models import Margins

class MarginsParser:
    @staticmethod
    def parse(sectPr: Optional[etree.Element]) -> Margins:
        """
        Parses margins from the given section properties XML element.

        Args:
            sectPr (Optional[etree.Element]): The section properties XML element.

        Returns:
            Margins: The parsed margins.
        """
        pgMar = extract_element(sectPr, ".//w:pgMar")
        if pgMar is not None:
            return Margins(
                top_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'top'))),
                right_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'right'))),
                bottom_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'bottom'))),
                left_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'left'))),
                header_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'header'))) if extract_attribute(pgMar, 'header') else None,
                footer_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'footer'))) if extract_attribute(pgMar, 'footer') else None,
                gutter_pt=convert_twips_to_points(int(extract_attribute(pgMar, 'gutter'))) if extract_attribute(pgMar, 'gutter') else None
            )
        return Margins(top_pt=0, right_pt=0, bottom_pt=0, left_pt=0)
