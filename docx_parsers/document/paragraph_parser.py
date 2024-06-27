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
        """
        Parses a paragraph element from the DOCX document.

        Args:
            p (etree.Element): The paragraph element to parse.

        Returns:
            Paragraph: The parsed paragraph object.

        Example:
            The following is an example of a paragraph element in a document.xml file:

            .. code-block:: xml

                <w:p>
                    <w:pPr>
                        <w:pStyle w:val="Heading1"/>
                        <w:numPr>
                            <w:ilvl w:val="0"/>
                            <w:numId w:val="1"/>
                        </w:numPr>
                    </w:pPr>
                    <w:r>
                        <w:t>Example text</w:t>
                    </w:r>
                </w:p>
        """
        pPr = extract_element(p, ".//w:pPr")
        p_properties = self.extract_paragraph_properties(pPr)
        numbering = DocumentNumberingParser().parse(pPr)
        runs = self.extract_runs(p)
        return Paragraph(properties=p_properties, runs=runs, numbering=numbering)

    def extract_paragraph_properties(self, pPr: Optional[etree.Element]) -> ParagraphStyleProperties:
        """
        Extracts the paragraph properties from the given paragraph properties element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties element.

        Returns:
            ParagraphStyleProperties: The extracted paragraph style properties.
        """
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
        """
        Extracts the style ID from the paragraph properties element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties element.

        Returns:
            Optional[str]: The style ID, or None if not found.

        Example:
            The following is an example of a paragraph style element in a document.xml file:

            .. code-block:: xml

                <w:pStyle w:val="Heading1"/>
        """
        pStyle = extract_element(pPr, ".//w:pStyle")
        if pStyle is not None:
            style_id = extract_attribute(pStyle, 'val')
            if style_id is not None:
                return style_id
        return None

    def extract_tabs(self, pPr: Optional[etree.Element]) -> Optional[List[TabStop]]:
        """
        Extracts the tab stops from the paragraph properties element.

        Args:
            pPr (Optional[etree.Element]): The paragraph properties element.

        Returns:
            Optional[List[TabStop]]: The list of tab stops, or None if not found.

        Example:
            The following is an example of a tabs element in a document.xml file:

            .. code-block:: xml

                <w:tabs>
                    <w:tab w:val="left" w:pos="720"/>
                </w:tabs>
        """
        tabs_elem = extract_element(pPr, ".//w:tabs")
        if tabs_elem is not None:
            return self.parse_tabs(tabs_elem)
        return None

    def extract_runs(self, p: etree.Element) -> List[Run]:
        """
        Extracts the run elements from the paragraph element.

        Args:
            p (etree.Element): The paragraph element.

        Returns:
            List[Run]: The list of extracted runs.

        Example:
            The following is an example of run elements in a paragraph element in a document.xml file:

            .. code-block:: xml

                <w:r>
                    <w:t>Example text</w:t>
                </w:r>
        """
        runs = []
        run_parser = RunParser()
        for r in p.findall(".//w:r", namespaces=NAMESPACE):
            runs.append(run_parser.parse(r))
        return runs

    def parse_tabs(self, tabs_elem: etree.Element) -> List[TabStop]:
        """
        Parses the tab stops from the tabs element.

        Args:
            tabs_elem (etree.Element): The tabs element.

        Returns:
            List[TabStop]: The list of parsed tab stops.
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
