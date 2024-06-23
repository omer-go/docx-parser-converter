from pydantic import BaseModel
from typing import List, Optional
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_twips_to_points
from docx_parsers.styles_parser import FontProperties, IndentationProperties
import json

# Namespace URI
NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# Constants for Namespace and References
NAMESPACE = {'w': NAMESPACE_URI}
W_VAL = f"{{{NAMESPACE_URI}}}val"
W_ILVL = f"{{{NAMESPACE_URI}}}ilvl"
W_POS = f"{{{NAMESPACE_URI}}}pos"
W_NUMID = f"{{{NAMESPACE_URI}}}numId"
W_ABSTRACTNUMID = f"{{{NAMESPACE_URI}}}abstractNumId"
W_INDENT_LEFT = f"{{{NAMESPACE_URI}}}left"
W_INDENT_START = f"{{{NAMESPACE_URI}}}start"
W_INDENT_RIGHT = f"{{{NAMESPACE_URI}}}right"
W_INDENT_END = f"{{{NAMESPACE_URI}}}end"
W_INDENT_FIRSTLINE = f"{{{NAMESPACE_URI}}}firstLine"
W_INDENT_HANGING = f"{{{NAMESPACE_URI}}}hanging"
W_RPR = f"{{{NAMESPACE_URI}}}rPr"
W_RFONTS = f"{{{NAMESPACE_URI}}}rFonts"

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
            numId = int(num.get(W_NUMID))
            abstractNumId = int(num.find(".//w:abstractNumId", namespaces=NAMESPACE).get(W_VAL))
            levels = []

            abstractNum = self.root.find(f".//w:abstractNum[@{W_ABSTRACTNUMID}='{abstractNumId}']", namespaces=NAMESPACE)
            for lvl in abstractNum.findall(".//w:lvl", namespaces=NAMESPACE):
                ilvl = int(lvl.get(W_ILVL))
                start = int(lvl.find(".//w:start", namespaces=NAMESPACE).get(W_VAL))
                numFmt = lvl.find(".//w:numFmt", namespaces=NAMESPACE).get(W_VAL)
                lvlText = lvl.find(".//w:lvlText", namespaces=NAMESPACE).get(W_VAL)
                lvlJc = lvl.find(".//w:lvlJc", namespaces=NAMESPACE).get(W_VAL)
                
                pPr = lvl.find(".//w:pPr", namespaces=NAMESPACE)
                indent_properties = IndentationProperties()
                tab_pt = None

                if pPr is not None:
                    indent_element = pPr.find("w:ind", namespaces=NAMESPACE)
                    if indent_element is not None:
                        if W_INDENT_LEFT in indent_element.attrib:
                            indent_properties.left_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_LEFT)))
                        elif W_INDENT_START in indent_element.attrib:
                            indent_properties.left_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_START)))
                        if W_INDENT_RIGHT in indent_element.attrib:
                            indent_properties.right_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_RIGHT)))
                        elif W_INDENT_END in indent_element.attrib:
                            indent_properties.right_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_END)))
                        if W_INDENT_HANGING in indent_element.attrib:
                            indent_properties.hanging_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_HANGING)))
                        if W_INDENT_FIRSTLINE in indent_element.attrib:
                            indent_properties.firstline_pt = convert_twips_to_points(int(indent_element.get(W_INDENT_FIRSTLINE)))
                    
                    tab_element = pPr.find(".//w:tab", namespaces=NAMESPACE)
                    if tab_element is not None:
                        tab_val = tab_element.get(W_POS)
                        if tab_val.isdigit():
                            tab_pt = convert_twips_to_points(int(tab_val))
                
                # Extract font properties
                fonts = None
                rPr = lvl.find(".//w:rPr", namespaces=NAMESPACE)
                if rPr is not None:
                    rFonts = rPr.find(".//w:rFonts", namespaces=NAMESPACE)
                    if rFonts is not None:
                        fonts = FontProperties(
                            ascii=rFonts.get(f"{{{NAMESPACE_URI}}}ascii"),
                            hAnsi=rFonts.get(f"{{{NAMESPACE_URI}}}hAnsi"),
                            eastAsia=rFonts.get(f"{{{NAMESPACE_URI}}}eastAsia"),
                            cs=rFonts.get(f"{{{NAMESPACE_URI}}}cs")
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
