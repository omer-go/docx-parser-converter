# numbering_parser.py

from pydantic import BaseModel
from typing import List, Optional
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_twips_to_points
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.styles_models import FontProperties, IndentationProperties
import json

class NumberingLevel(BaseModel):
    numId: int
    ilvl: int
    start: int
    numFmt: str
    lvlText: str
    lvlJc: str
    counter: int = None
    indent: Optional[IndentationProperties] = None
    tab_pt: Optional[float] = None
    fonts: Optional[FontProperties] = None

class NumberingInstance(BaseModel):
    numId: int
    levels: List[NumberingLevel]

class NumberingSchema(BaseModel):
    instances: List[NumberingInstance]

class NumberingParser:
    def __init__(self, docx_file: bytes):
        self.root = extract_xml_root_from_docx(docx_file, 'numbering.xml')
        self.numbering_schema = self.parse()

    def parse(self) -> NumberingSchema:
        instances = []
        
        for num in self.root.findall(".//w:num", namespaces=NAMESPACE):
            numId = int(extract_attribute(num, 'numId'))
            abstractNumId = int(extract_attribute(extract_element(num, ".//w:abstractNumId"), 'val'))
            levels = []

            abstractNum = extract_element(self.root, f".//w:abstractNum[@w:abstractNumId='{abstractNumId}']")
            for lvl in abstractNum.findall(".//w:lvl", namespaces=NAMESPACE):
                ilvl = int(extract_attribute(lvl, 'ilvl'))
                start = int(extract_attribute(extract_element(lvl, ".//w:start"), 'val'))
                numFmt = extract_attribute(extract_element(lvl, ".//w:numFmt"), 'val')
                lvlText = extract_attribute(extract_element(lvl, ".//w:lvlText"), 'val')
                lvlJc = extract_attribute(extract_element(lvl, ".//w:lvlJc"), 'val')
                
                pPr = extract_element(lvl, ".//w:pPr")
                indent_properties = IndentationProperties()
                tab_pt = None

                if pPr is not None:
                    indent_element = extract_element(pPr, "w:ind")
                    if indent_element is not None:
                        indent_properties.left_pt = convert_twips_to_points(int(extract_attribute(indent_element, 'left') or extract_attribute(indent_element, 'start') or 0))
                        indent_properties.right_pt = convert_twips_to_points(int(extract_attribute(indent_element, 'right') or extract_attribute(indent_element, 'end') or 0))
                        indent_properties.hanging_pt = convert_twips_to_points(int(extract_attribute(indent_element, 'hanging') or 0))
                        indent_properties.firstline_pt = convert_twips_to_points(int(extract_attribute(indent_element, 'firstLine') or 0))
                    
                    tab_element = extract_element(pPr, ".//w:tab")
                    if tab_element is not None:
                        tab_val = extract_attribute(tab_element, 'pos')
                        if tab_val.isdigit():
                            tab_pt = convert_twips_to_points(int(tab_val))
                
                # Extract font properties
                fonts = None
                rPr = extract_element(lvl, ".//w:rPr")
                if rPr is not None:
                    rFonts = extract_element(rPr, "w:rFonts")
                    if rFonts is not None:
                        fonts = FontProperties(
                            ascii=extract_attribute(rFonts, 'ascii'),
                            hAnsi=extract_attribute(rFonts, 'hAnsi'),
                            eastAsia=extract_attribute(rFonts, 'eastAsia'),
                            cs=extract_attribute(rFonts, 'cs')
                        )

                level = NumberingLevel(
                    numId=numId, ilvl=ilvl, start=start, numFmt=numFmt, lvlText=lvlText, lvlJc=lvlJc,
                    indent=indent_properties, tab_pt=tab_pt, fonts=fonts
                )
                levels.append(level)
            
            instance = NumberingInstance(numId=numId, levels=levels)
            instances.append(instance)
        
        return NumberingSchema(instances=instances)

    def get_numbering_schema(self) -> NumberingSchema:
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
