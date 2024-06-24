# paragraph_parser.py

from lxml import etree
from typing import Optional, List
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.document_models import Paragraph, Run
from docx_parsers.models.styles_models import TabStop, ParagraphStyleProperties
from docx_parsers.document.document_numbering_parser import DocumentNumberingParser
from docx_parsers.document.run_parser import RunParser
from docx_parsers.styles.paragraph_properties_parser import ParagraphPropertiesParser
from docx_parsers.utils import convert_twips_to_points

class ParagraphParser:
    """
    A parser for extracting paragraph elements from the DOCX document structure.
    
    This class handles the extraction of paragraph properties, runs, 
    styles, numbering, and tabs within a paragraph element, converting them 
    into a structured Paragraph object for further processing or conversion 
    to other formats like HTML.
    """

    def parse(self, p: etree.Element) -> Paragraph:
        pPr = extract_element(p, ".//w:pPr")
        p_properties = self.extract_paragraph_properties(pPr)
        numbering = DocumentNumberingParser().parse(pPr)
        runs = self.extract_runs(p)
        return Paragraph(properties=p_properties, runs=runs, numbering=numbering)

    def extract_paragraph_properties(self, pPr: Optional[etree.Element]) -> ParagraphStyleProperties:
        properties = ParagraphPropertiesParser().parse(pPr) if pPr else ParagraphStyleProperties()
        
        if pPr:
            style_id = self.extract_style_id(pPr)
            if style_id is not None:
                properties.style_id = style_id

            tabs = self.extract_tabs(pPr)
            if tabs:
                properties.tabs = tabs

        return properties

    def extract_style_id(self, pPr: Optional[etree.Element]) -> Optional[str]:
        pStyle = extract_element(pPr, ".//w:pStyle")
        if pStyle is not None:
            style_id = extract_attribute(pStyle, 'val')
            if style_id is not None:
                return style_id
        return None

    def extract_tabs(self, pPr: Optional[etree.Element]) -> Optional[List[TabStop]]:
        tabs_elem = extract_element(pPr, ".//w:tabs")
        if tabs_elem is not None:
            return self.parse_tabs(tabs_elem)
        return None

    def extract_runs(self, p: etree.Element) -> List[Run]:
        runs = []
        run_parser = RunParser()
        for r in p.findall(".//w:r", namespaces=NAMESPACE):
            runs.append(run_parser.parse(r))
        return runs

    def parse_tabs(self, tabs_elem: etree.Element) -> List[TabStop]:
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
