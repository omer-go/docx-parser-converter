from pydantic import BaseModel
from typing import List, Optional, Union
from xml.etree.ElementTree import Element
from docx_parsers.styles_parser import StylesParser, ParagraphStyleProperties, RunStyleProperties, TabStop
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, convert_twips_to_points
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE, NAMESPACE_URI
import json

class Numbering(BaseModel):
    ilvl: int
    numId: int

class TextContent(BaseModel):
    text: str

class TabContent(BaseModel):
    type: str = "tab"

class RunContent(BaseModel):
    run: Union[TextContent, TabContent]

class Run(BaseModel):
    contents: List[RunContent]
    properties: Optional[RunStyleProperties]

class Paragraph(BaseModel):
    properties: ParagraphStyleProperties
    runs: List[Run]
    numbering: Optional[Numbering] = None

class Margins(BaseModel):
    top_pt: float
    right_pt: float
    bottom_pt: float
    left_pt: float
    header_pt: Optional[float] = None
    footer_pt: Optional[float] = None
    gutter_pt: Optional[float] = None

class DocumentSchema(BaseModel):
    paragraphs: List[Paragraph]
    margins: Optional[Margins]

class DocumentParser:
    def __init__(self, docx_file: Optional[bytes] = None):
        if docx_file:
            self.root = extract_xml_root_from_docx(docx_file, 'document.xml')
            self.styles_parser = StylesParser()
            self.document_schema = self.parse()
        else:
            self.root = None
            self.styles_parser = StylesParser()
            self.document_schema = None

    def parse(self) -> DocumentSchema:
        margins = self.extract_margins()
        paragraphs = self.extract_paragraphs()
        return DocumentSchema(paragraphs=paragraphs, margins=margins)

    def extract_margins(self) -> Optional[Margins]:
        sectPr = extract_element(self.root, ".//w:sectPr")
        return self.parse_margins(sectPr) if sectPr is not None else None

    def extract_paragraphs(self) -> List[Paragraph]:
        paragraphs = []
        for p in self.root.findall(".//w:p", namespaces=NAMESPACE):
            paragraphs.append(self.parse_paragraph(p))
        return paragraphs

    def parse_paragraph(self, p: Element) -> Paragraph:
        pPr = extract_element(p, ".//w:pPr")
        p_properties = self.extract_paragraph_properties(pPr)
        numbering = self.extract_numbering(pPr)
        runs = self.extract_runs(p)
        return Paragraph(properties=p_properties, runs=runs, numbering=numbering)

    def extract_paragraph_properties(self, pPr: Optional[Element]) -> ParagraphStyleProperties:
        properties = ParagraphStyleProperties()
        if pPr:
            properties = self.styles_parser.extract_paragraph_properties(pPr)
            style_id = self.extract_style_id(pPr)
            if style_id is not None:
                properties.style_id = style_id
            tabs = self.extract_tabs(pPr)
            if tabs is not None:
                properties.tabs = tabs
        return properties

    def extract_numbering(self, pPr: Optional[Element]) -> Optional[Numbering]:
        numPr = extract_element(pPr, ".//w:numPr")
        return self.parse_numbering(numPr) if numPr is not None else None

    def extract_style_id(self, pPr: Optional[Element]) -> Optional[str]:
        pStyle = extract_element(pPr, ".//w:pStyle")
        return extract_attribute(pStyle, 'val') if pStyle else None

    def extract_tabs(self, pPr: Optional[Element]) -> Optional[List[TabStop]]:
        tabs_elem = extract_element(pPr, ".//w:tabs")
        return self.parse_tabs(tabs_elem) if tabs_elem else None

    def extract_runs(self, p: Element) -> List[Run]:
        runs = []
        for r in p.findall(".//w:r", namespaces=NAMESPACE):
            runs.append(self.parse_run(r))
        return runs

    def parse_run(self, r: Element) -> Run:
        rPr = extract_element(r, ".//w:rPr")
        run_properties = self.styles_parser.extract_run_properties(rPr) if rPr else RunStyleProperties()
        contents = self.extract_run_contents(r)
        return Run(contents=contents, properties=run_properties)

    def extract_run_contents(self, r: Element) -> List[RunContent]:
        contents = []
        for elem in r:
            if elem.tag == f"{{{NAMESPACE_URI}}}tab":
                contents.append(RunContent(run=TabContent()))
            elif elem.tag == f"{{{NAMESPACE_URI}}}t":
                contents.append(RunContent(run=TextContent(text=elem.text)))
        return contents

    def parse_numbering(self, numPr: Element) -> Numbering:
        ilvl_elem = extract_element(numPr, ".//w:ilvl")
        numId_elem = extract_element(numPr, ".//w:numId")
        ilvl = int(extract_attribute(ilvl_elem, 'val')) if ilvl_elem is not None else 0
        numId = int(extract_attribute(numId_elem, 'val')) if numId_elem is not None else 0
        return Numbering(ilvl=ilvl, numId=numId)

    def parse_margins(self, sectPr: Optional[Element]) -> Margins:
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

    def parse_tabs(self, tabs_elem: Element) -> List[TabStop]:
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

    def get_document_schema(self) -> DocumentSchema:
        return self.document_schema


if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"

    docx_file = read_binary_from_file_path(docx_path)
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()

    # Convert the document schema to a dictionary excluding null properties
    filtered_schema_dict = document_schema.model_dump(exclude_none=True)

    # Output or further process the filtered schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))