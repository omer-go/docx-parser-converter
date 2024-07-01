from lxml import etree
from typing import Optional
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, extract_attribute
from docx_parser_converter.docx_parsers.utils import convert_twips_to_points
from docx_parser_converter.docx_parsers.models.document_models import DocMargins

class MarginsParser:
    """
    Parses the margin properties of a section in a docx document.

    This class contains methods to parse the margin properties from the
    section properties (sectPr) element of a docx document. The margin 
    properties are essential for understanding the layout of the document.
    """

    @staticmethod
    def parse(sectPr: Optional[etree.Element]) -> Optional[DocMargins]:
        """
        Parses margins from the given section properties XML element.

        Args:
            sectPr (Optional[etree.Element]): The section properties XML element.
                This element can contain margin properties which define the 
                top, right, bottom, left, header, footer, and gutter margins
                of the section.

        Returns:
            Optional[DocMargins]: The parsed margins, or None if not found.

        Example:
            The following is an example of the section properties with margins 
            in a document.xml file:

            .. code-block:: xml

                <w:sectPr>
                    <w:pgMar w:left="1134" w:right="1134" w:gutter="0" w:header="0" 
                             w:top="1134" w:footer="0" w:bottom="1134"/>
                </w:sectPr>
        """
        pgMar = extract_element(sectPr, ".//w:pgMar")
        if pgMar is not None:
            top = extract_attribute(pgMar, 'top')
            right = extract_attribute(pgMar, 'right') or extract_attribute(pgMar, 'end')
            bottom = extract_attribute(pgMar, 'bottom')
            left = extract_attribute(pgMar, 'left') or extract_attribute(pgMar, 'start')
            header = extract_attribute(pgMar, 'header')
            footer = extract_attribute(pgMar, 'footer')
            gutter = extract_attribute(pgMar, 'gutter')

            return DocMargins(
                top_pt=convert_twips_to_points(int(top)) if top is not None else None,
                right_pt=convert_twips_to_points(int(right)) if right is not None else None,
                bottom_pt=convert_twips_to_points(int(bottom)) if bottom is not None else None,
                left_pt=convert_twips_to_points(int(left)) if left is not None else None,
                header_pt=convert_twips_to_points(int(header)) if header is not None else None,
                footer_pt=convert_twips_to_points(int(footer)) if footer is not None else None,
                gutter_pt=convert_twips_to_points(int(gutter)) if gutter is not None else None
            )
        return None
