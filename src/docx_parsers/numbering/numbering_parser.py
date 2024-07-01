from typing import List, Optional
from lxml import etree
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_twips_to_points
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.numbering_models import NumberingLevel, NumberingInstance, NumberingSchema
from docx_parsers.models.styles_models import FontProperties, IndentationProperties
from docx_parsers.styles.paragraph_properties_parser import ParagraphPropertiesParser
import json

class NumberingParser:
    """
    Parses the numbering definitions from a DOCX file.

    This class extracts and parses the numbering definitions found in the 
    numbering.xml file of a DOCX document, converting them into structured 
    Pydantic models for further processing or conversion to other formats.
    """

    def __init__(self, docx_file: bytes):
        """
        Initializes the NumberingParser with the given DOCX file.

        Args:
            docx_file (bytes): The binary content of the DOCX file.
        """
        self.root = extract_xml_root_from_docx(docx_file, 'numbering.xml')
        self.numbering_schema = self.parse()

    def parse(self) -> NumberingSchema:
        """
        Parses the numbering XML into a NumberingSchema.

        Returns:
            NumberingSchema: The parsed numbering schema.

        Example:
            The following is an example of a numbering definition in a numbering.xml file:

            .. code-block:: xml

                <w:numbering>
                    <w:num w:numId="1">
                        <w:abstractNumId w:val="0"/>
                    </w:num>
                    <w:abstractNum w:abstractNumId="0">
                        <w:lvl w:ilvl="0">
                            <w:start w:val="1"/>
                            <w:numFmt w:val="decimal"/>
                            <w:lvlText w:val="%1."/>
                            <w:lvlJc w:val="left"/>
                        </w:lvl>
                    </w:abstractNum>
                </w:numbering>
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
        Extracts the levels for a given abstract numbering ID.

        Args:
            abstractNumId (int): The abstract numbering ID.

        Returns:
            List[NumberingLevel]: The list of extracted numbering levels.
        """
        levels = []
        abstractNum = extract_element(self.root, f".//w:abstractNum[@w:abstractNumId='{abstractNumId}']")
        for lvl in abstractNum.findall(".//w:lvl", namespaces=NAMESPACE):
            level = self.extract_level(abstractNumId, lvl)
            levels.append(level)
        return levels

    def extract_level(self, numId: int, lvl: etree.Element) -> NumberingLevel:
        """
        Extracts a single numbering level.

        Args:
            numId (int): The numbering ID.
            lvl (etree.Element): The XML element representing the numbering level.

        Returns:
            NumberingLevel: The extracted numbering level.

        Example:
            The following is an example of a numbering level in a numbering.xml file:

            .. code-block:: xml

                <w:lvl w:ilvl="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1."/>
                    <w:lvlJc w:val="left"/>
                </w:lvl>
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
        Extracts indentation properties from a numbering level.

        Args:
            lvl (etree.Element): The XML element representing the numbering level.

        Returns:
            Optional[IndentationProperties]: The extracted indentation properties.

        Example:
            The following is an example of paragraph properties with indentation in a numbering level:

            .. code-block:: xml

                <w:pPr>
                    <w:ind w:left="720" w:hanging="360"/>
                </w:pPr>
        """
        pPr = extract_element(lvl, ".//w:pPr")
        if pPr is not None:
            return ParagraphPropertiesParser().extract_indentation(pPr)

    def extract_tab(self, lvl: etree.Element) -> Optional[float]:
        """
        Extracts tab stop properties from a numbering level.

        Args:
            lvl (etree.Element): The XML element representing the numbering level.

        Returns:
            Optional[float]: The tab stop position in points.

        Example:
            The following is an example of paragraph properties with a tab stop in a numbering level:

            .. code-block:: xml

                <w:pPr>
                    <w:tabs>
                        <w:tab w:val="left" w:pos="720"/>
                    </w:tabs>
                </w:pPr>
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
        Extracts font properties from a numbering level.

        Args:
            lvl (etree.Element): The XML element representing the numbering level.

        Returns:
            Optional[FontProperties]: The extracted font properties.

        Example:
            The following is an example of run properties with font settings in a numbering level:

            .. code-block:: xml

                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                </w:rPr>
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
        Gets the parsed numbering schema.

        Returns:
            NumberingSchema: The parsed numbering schema.
        """
        return self.numbering_schema

if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    docx_file = read_binary_from_file_path(docx_path)

    numbering_parser = NumberingParser(docx_file)
    filtered_schema_dict = numbering_parser.numbering_schema.model_dump(exclude_none=True)
    print(json.dumps(filtered_schema_dict, indent=2))
