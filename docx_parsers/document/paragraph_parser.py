# paragraph_parser.py

from lxml import etree
from typing import Optional, List
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.document_models import Paragraph, Run
from docx_parsers.document.numbering_parser import NumberingParser
from docx_parsers.document.run_parser import RunParser
from docx_parsers.styles_parser import StylesParser, ParagraphStyleProperties, TabStop
from docx_parsers.utils import convert_twips_to_points

class ParagraphParser:
    def parse(self, p: etree.Element) -> Paragraph:
        """
        Parses a paragraph from the given XML element.

        Args:
            p (etree.Element): The paragraph XML element.

        Returns:
            Paragraph: The parsed paragraph.
        """
        pPr = extract_element(p, ".//w:pPr")
        p_properties = self.extract_paragraph_properties(pPr)
        numbering = NumberingParser().parse(pPr)
        runs = self.extract_runs(p)
        return Paragraph(properties=p_properties, runs=runs, numbering=numbering)

    def extract_paragraph_properties(self, pPr: Optional[etree.Element]) -> ParagraphStyleProperties:
        """
        Extracts paragraph properties from the given XML element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties XML element.

        Returns:
            ParagraphStyleProperties: The extracted paragraph properties.
        """
        properties = ParagraphStyleProperties()
        if pPr:
            styles_parser = StylesParser()
            properties = styles_parser.extract_paragraph_properties(pPr)
            style_id = self.extract_style_id(pPr)
            if style_id is not None:
                properties.style_id = style_id
            tabs = self.extract_tabs(pPr)
            if tabs is not None:
                properties.tabs = tabs
        return properties

    def extract_style_id(self, pPr: Optional[etree.Element]) -> Optional[str]:
        """
        Extracts style ID from the given paragraph properties XML element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties XML element.

        Returns:
            Optional[str]: The style ID, or None if not found.
        """
        pStyle = extract_element(pPr, ".//w:pStyle")
        return extract_attribute(pStyle, 'val') if pStyle else None

    def extract_tabs(self, pPr: Optional[etree.Element]) -> Optional[List[TabStop]]:
        """
        Extracts tabs from the given paragraph properties XML element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties XML element.

        Returns:
            Optional[List[TabStop]]: The extracted tabs, or None if not found.
        """
        tabs_elem = extract_element(pPr, ".//w:tabs")
        return self.parse_tabs(tabs_elem) if tabs_elem else None

    def extract_runs(self, p: etree.Element) -> List[Run]:
        """
        Extracts runs from the given paragraph XML element.

        Args:
            p (etree.Element): The paragraph XML element.

        Returns:
            List[Run]: The list of parsed runs.
        """
        runs = []
        run_parser = RunParser()
        for r in p.findall(".//w:r", namespaces=NAMESPACE):
            runs.append(run_parser.parse(r))
        return runs

    def parse_tabs(self, tabs_elem: etree.Element) -> List[TabStop]:
        """
        Parses tabs from the given tabs XML element.

        Args:
            tabs_elem (etree.Element): The tabs XML element.

        Returns:
            List[TabStop]: The parsed tabs.
        """
        tabs = []
        for tab in tabs_elem.findall(".//w:tab", namespaces=NAMESPACE):
            val = extract_attribute(tab, 'val')
            pos = extract_attribute(tab, 'pos')
            if pos is not None:
                pos = convert_twips_to_points(int(pos))
                tabs.append(TabStop(val=val, pos=pos))
            else:
                print(f"Warning: <w:tab> element missing 'w:pos' attribute.")
        return tabs
