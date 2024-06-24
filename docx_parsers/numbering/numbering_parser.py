# numbering_parser.py

from typing import List, Optional
from lxml import etree
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_twips_to_points
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.numbering_models import NumberingLevel, NumberingInstance, NumberingSchema
from docx_parsers.models.styles_models import FontProperties, IndentationProperties
import json

class NumberingParser:
    def __init__(self, docx_file: bytes):
        self.root = extract_xml_root_from_docx(docx_file, 'numbering.xml')
        self.numbering_schema = self.parse()

    def parse(self) -> NumberingSchema:
        """
        Parses the numbering.xml and returns the numbering schema.

        Returns:
            NumberingSchema: The parsed numbering schema.
        """
        instances = []
        for num in self.root.findall(".//w:num", namespaces=NAMESPACE):
            numId = int(extract_attribute(num, 'numId'))
            abstractNumId = int(extract_attribute(extract_element(num, ".//w:abstractNumId"), 'val'))
            levels = self.extract_levels(abstractNumId)
            instance = NumberingInstance(numId=numId, levels=levels)
            instances.append(instance)
        return NumberingSchema(instances=instances)

    def extract_levels(self, abstractNumId: int) -> List[NumberingLevel]:
        """
        Extracts the numbering levels for a given abstractNumId.

        Args:
            abstractNumId (int): The abstract numbering ID.

        Returns:
            List[NumberingLevel]: The list of numbering levels.
        """
        levels = []
        abstractNum = extract_element(self.root, f".//w:abstractNum[@w:abstractNumId='{abstractNumId}']")
        for lvl in abstractNum.findall(".//w:lvl", namespaces=NAMESPACE):
            level = self.extract_level(abstractNumId, lvl)
            levels.append(level)
        return levels

    def extract_level(self, numId: int, lvl: etree.Element) -> NumberingLevel:
        """
        Extracts a single numbering level from the XML element.

        Args:
            numId (int): The numbering ID.
            lvl (etree.Element): The level XML element.

        Returns:
            NumberingLevel: The extracted numbering level.
        """
        ilvl = int(extract_attribute(lvl, 'ilvl'))
        start = int(extract_attribute(extract_element(lvl, ".//w:start"), 'val'))
        numFmt = extract_attribute(extract_element(lvl, ".//w:numFmt"), 'val')
        lvlText = extract_attribute(extract_element(lvl, ".//w:lvlText"), 'val')
        lvlJc = extract_attribute(extract_element(lvl, ".//w:lvlJc"), 'val')
        
        indent_properties = self.extract_indentation(lvl)
        tab_pt = self.extract_tab(lvl)
        fonts = self.extract_fonts(lvl)

        return NumberingLevel(
            numId=numId, ilvl=ilvl, start=start, numFmt=numFmt, lvlText=lvlText, lvlJc=lvlJc,
            indent=indent_properties, tab_pt=tab_pt, fonts=fonts
        )

    def extract_indentation(self, lvl: etree.Element) -> Optional[IndentationProperties]:
        """
        Extracts the indentation properties from the level XML element.

        Args:
            lvl (etree.Element): The level XML element.

        Returns:
            Optional[IndentationProperties]: The extracted indentation properties or None.
        """
        pPr = extract_element(lvl, ".//w:pPr")
        if pPr is not None:
            indent_element = extract_element(pPr, "w:ind")
            if indent_element is not None:
                return IndentationProperties(
                    left_pt=self.convert_to_points(indent_element, ['left', 'start']),
                    right_pt=self.convert_to_points(indent_element, ['right', 'end']),
                    hanging_pt=self.convert_to_points(indent_element, ['hanging']),
                    firstline_pt=self.convert_to_points(indent_element, ['firstLine'])
                )
        return None

    def convert_to_points(self, element: etree.Element, attrs: List[str]) -> Optional[float]:
        """
        Converts attribute values to points.

        Args:
            element (etree.Element): The XML element.
            attrs (List[str]): The list of attributes to check.

        Returns:
            Optional[float]: The converted value in points or None.
        """
        for attr in attrs:
            value = extract_attribute(element, attr)
            if value:
                return convert_twips_to_points(int(value))
        return None

    def extract_tab(self, lvl: etree.Element) -> Optional[float]:
        """
        Extracts the tab stop position from the level XML element.

        Args:
            lvl (etree.Element): The level XML element.

        Returns:
            Optional[float]: The tab stop position in points or None.
        """
        pPr = extract_element(lvl, ".//w:pPr")
        if pPr is not None:
            tab_element = extract_element(pPr, ".//w:tab")
            if tab_element is not None:
                tab_val = extract_attribute(tab_element, 'pos')
                if tab_val and tab_val.isdigit():
                    return convert_twips_to_points(int(tab_val))
        return None

    def extract_fonts(self, lvl: etree.Element) -> Optional[FontProperties]:
        """
        Extracts the font properties from the level XML element.

        Args:
            lvl (etree.Element): The level XML element.

        Returns:
            Optional[FontProperties]: The extracted font properties or None.
        """
        rPr = extract_element(lvl, ".//w:rPr")
        if rPr is not None:
            rFonts = extract_element(rPr, "w:rFonts")
            if rFonts is not None:
                return FontProperties(
                    ascii=extract_attribute(rFonts, 'ascii'),
                    hAnsi=extract_attribute(rFonts, 'hAnsi'),
                    eastAsia=extract_attribute(rFonts, 'eastAsia'),
                    cs=extract_attribute(rFonts, 'cs')
                )
        return None

    def get_numbering_schema(self) -> NumberingSchema:
        """
        Returns the parsed numbering schema.

        Returns:
            NumberingSchema: The parsed numbering schema.
        """
        return self.numbering_schema

if __name__ == "__main__":

    docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"

    docx_file = read_binary_from_file_path(docx_path)

    numbering_parser = NumberingParser(docx_file)
    # numbering_scheme = numbering_parser.get_numbering_schema()

    filtered_schema_dict = numbering_parser.numbering_schema.model_dump(exclude_none=True)
    # Output or further process the numbering_scheme as needed
    print(json.dumps(filtered_schema_dict, indent=2))
