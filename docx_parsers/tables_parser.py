from lxml import etree
from pydantic import BaseModel
from typing import List, Optional, Union
from xml.etree.ElementTree import Element
from docx_parsers.styles_parser import StylesParser, ParagraphStyleProperties, RunStyleProperties
from docx_parsers.utils import convert_twips_to_points, extract_xml_root_from_docx, read_binary_from_file_path
from docx_parsers.document_parser import DocumentParser, Paragraph
import json

NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NAMESPACE = {'w': NAMESPACE_URI}

class BorderProperties(BaseModel):
    color: Optional[str]
    size: Optional[int]
    space: Optional[int]
    val: Optional[str]

class ShadingProperties(BaseModel):
    fill: Optional[str]
    val: Optional[str]
    color: Optional[str]

class MarginProperties(BaseModel):
    top: Optional[int]
    left: Optional[int]
    bottom: Optional[int]
    right: Optional[int]

class TableWidth(BaseModel):
    type: Optional[str]
    width: Optional[int]

class TableIndent(BaseModel):
    type: Optional[str]
    width: Optional[int]

class TableLook(BaseModel):
    firstRow: Optional[bool]
    lastRow: Optional[bool]
    firstColumn: Optional[bool]
    lastColumn: Optional[bool]
    noHBand: Optional[bool]
    noVBand: Optional[bool]

class TableCellBorders(BaseModel):
    top: Optional[BorderProperties]
    left: Optional[BorderProperties]
    bottom: Optional[BorderProperties]
    right: Optional[BorderProperties]
    insideH: Optional[BorderProperties]
    insideV: Optional[BorderProperties]

class TableCellProperties(BaseModel):
    tcW: Optional[TableWidth]
    tcBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]
    tcMar: Optional[MarginProperties]
    textDirection: Optional[str]
    vAlign: Optional[str]
    hideMark: Optional[bool]
    cellMerge: Optional[str]
    gridSpan: Optional[int]

class TableCell(BaseModel):
    properties: Optional[TableCellProperties]
    paragraphs: List[Paragraph]

class TableRowProperties(BaseModel):
    trHeight: Optional[str]
    trHeight_hRule: Optional[str]
    tblHeader: Optional[bool]
    justification: Optional[str]
    tblBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]

class TableRow(BaseModel):
    properties: Optional[TableRowProperties]
    cells: List[TableCell]

class TableProperties(BaseModel):
    tblStyle: Optional[str]
    tblW: Optional[TableWidth]
    justification: Optional[str]
    tblInd: Optional[TableIndent]
    tblCellMar: Optional[MarginProperties]
    tblBorders: Optional[TableCellBorders]
    shd: Optional[ShadingProperties]
    tblLayout: Optional[str]
    tblLook: Optional[TableLook]

class TableGrid(BaseModel):
    columns: List[int]

class Table(BaseModel):
    properties: Optional[TableProperties]
    grid: Optional[TableGrid]
    rows: List[TableRow]

class TablesParser:
    def __init__(self, table_element: etree._Element):
        self.root = table_element
        self.styles_parser = StylesParser()
        self.document_parser = DocumentParser(docx_file=None)

    def parse(self) -> Table:
        properties_element = self.extract_element(self.root, ".//w:tblPr")
        properties = self.extract_table_properties(properties_element)

        grid = self.extract_table_grid(self.root)
        
        rows = [self.extract_table_row(row) for row in self.root.findall(".//w:tr", namespaces=NAMESPACE)]
        return Table(properties=properties, grid=grid, rows=rows)

    def extract_element(self, parent: Element, path: str) -> Optional[Element]:
        element = parent.find(path, namespaces=NAMESPACE)
        return element

    def extract_attribute(self, element: Optional[Element], attr: str) -> Optional[str]:
        if element is not None:
            return element.get(f'{{{NAMESPACE_URI}}}{attr}')
        return None

    def safe_int(self, value: Optional[str]) -> Optional[int]:
        return int(value) if value is not None else None

    def extract_table_properties(self, tblPr_element: Element) -> TableProperties:
        tblStyle = self.extract_table_style(tblPr_element)
        tblW = self.extract_table_width(tblPr_element)
        justification = self.extract_justification(tblPr_element)
        tblInd = self.extract_table_indent(tblPr_element)
        tblCellMar = self.extract_table_cell_margins(tblPr_element)
        tblBorders = self.extract_table_cell_borders(self.extract_element(tblPr_element, ".//w:tblBorders"))
        shd = self.extract_shading(self.extract_element(tblPr_element, ".//w:shd"))
        tblLayout = self.extract_table_layout(tblPr_element)
        tblLook = self.extract_table_look(tblPr_element)

        return TableProperties(
            tblStyle=tblStyle,
            tblW=tblW,
            justification=justification,
            tblInd=tblInd,
            tblCellMar=tblCellMar,
            tblBorders=tblBorders,
            shd=shd,
            tblLayout=tblLayout,
            tblLook=tblLook
        )

    def extract_table_indent(self, element: Element) -> Optional[TableIndent]:
        indent_element = self.extract_element(element, ".//w:tblInd")
        if indent_element is not None:
            return TableIndent(
                type=self.extract_attribute(indent_element, 'type'),
                width=self.safe_int(self.extract_attribute(indent_element, 'w'))
            )
        return None

    def extract_table_grid(self, table_element: Element) -> Optional[TableGrid]:
        grid_elements = table_element.findall(".//w:gridCol", namespaces=NAMESPACE)
        if grid_elements:
            columns = [int(self.extract_attribute(col, 'w')) for col in grid_elements]
            return TableGrid(columns=columns)
        return None

    def extract_table_row(self, row_element: Element) -> TableRow:
        properties_element = self.extract_element(row_element, ".//w:trPr")
        properties = self.extract_table_row_properties(properties_element)

        cells = [self.extract_table_cell(cell) for cell in row_element.findall(".//w:tc", namespaces=NAMESPACE)]
        return TableRow(properties=properties, cells=cells)

    def extract_table_row_properties(self, trPr_element: Element) -> TableRowProperties:
        return TableRowProperties(
            trHeight=self.extract_row_height(trPr_element),
            trHeight_hRule=self.extract_row_height_h_rule(trPr_element),
            tblHeader=self.extract_table_header(trPr_element),
            justification=self.extract_justification(trPr_element),
            tblBorders=self.extract_table_cell_borders(self.extract_element(trPr_element, ".//w:tblBorders")),
            shd=self.extract_shading(self.extract_element(trPr_element, ".//w:shd"))
        )

    def extract_row_height(self, element: Element) -> Optional[str]:
        height_element = self.extract_element(element, ".//w:trHeight")
        if height_element is not None:
            return self.extract_attribute(height_element, 'val')
        return None

    def extract_row_height_h_rule(self, element: Element) -> Optional[str]:
        height_element = self.extract_element(element, ".//w:trHeight")
        if height_element is not None:
            return self.extract_attribute(height_element, 'hRule')
        return None

    def extract_table_cell(self, cell_element: Element) -> TableCell:
        properties_element = self.extract_element(cell_element, ".//w:tcPr")
        properties = self.extract_table_cell_properties(properties_element)

        paragraphs = [self.document_parser.parse_paragraph(p) for p in cell_element.findall(".//w:p", namespaces=NAMESPACE)]
        return TableCell(properties=properties, paragraphs=paragraphs)

    def extract_table_cell_properties(self, tcPr_element: Element) -> TableCellProperties:
        return TableCellProperties(
            tcW=self.extract_table_cell_width(tcPr_element),
            tcBorders=self.extract_table_cell_borders(self.extract_element(tcPr_element, ".//w:tcBorders")),
            shd=self.extract_shading(self.extract_element(tcPr_element, ".//w:shd")),
            tcMar=self.extract_table_cell_margins(tcPr_element),
            textDirection=self.extract_text_direction(tcPr_element),
            vAlign=self.extract_vertical_alignment(tcPr_element),
            hideMark=self.extract_hide_mark(tcPr_element),
            cellMerge=self.extract_cell_merge(tcPr_element),
            gridSpan=self.extract_grid_span(tcPr_element)
        )

    def extract_table_cell_width(self, element: Element) -> Optional[TableWidth]:
        width_element = self.extract_element(element, ".//w:tcW")
        if width_element is not None:
            return TableWidth(
                type=self.extract_attribute(width_element, 'type'),
                width=self.safe_int(self.extract_attribute(width_element, 'w'))
            )
        return None

    def extract_text_direction(self, element: Element) -> Optional[str]:
        direction_element = self.extract_element(element, ".//w:textDirection")
        return self.extract_attribute(direction_element, 'val')

    def extract_vertical_alignment(self, element: Element) -> Optional[str]:
        alignment_element = self.extract_element(element, ".//w:vAlign")
        return self.extract_attribute(alignment_element, 'val')

    def extract_hide_mark(self, element: Element) -> bool:
        hide_mark_element = self.extract_element(element, ".//w:hideMark")
        return hide_mark_element is not None

    def extract_cell_merge(self, element: Element) -> Optional[str]:
        merge_element = self.extract_element(element, ".//w:cellMerge")
        return self.extract_attribute(merge_element, 'val')

    def extract_grid_span(self, element: Element) -> Optional[int]:
        grid_span_element = self.extract_element(element, ".//w:gridSpan")
        return self.safe_int(self.extract_attribute(grid_span_element, 'val'))

    def extract_table_cell_borders(self, borders_element: Optional[Element]) -> Optional[TableCellBorders]:
        if borders_element is not None:
            return TableCellBorders(
                top=self.extract_border(self.extract_element(borders_element, ".//w:top")),
                left=self.extract_border(self.extract_element(borders_element, ".//w:left")),
                bottom=self.extract_border(self.extract_element(borders_element, ".//w:bottom")),
                right=self.extract_border(self.extract_element(borders_element, ".//w:right")),
                insideH=self.extract_border(self.extract_element(borders_element, ".//w:insideH")),
                insideV=self.extract_border(self.extract_element(borders_element, ".//w:insideV"))
            )
        return None

    def extract_border(self, border_element: Optional[Element]) -> Optional[BorderProperties]:
        if border_element is not None:
            return BorderProperties(
                color=self.extract_attribute(border_element, 'color'),
                size=self.safe_int(self.extract_attribute(border_element, 'sz')),
                space=self.safe_int(self.extract_attribute(border_element, 'space')),
                val=self.extract_attribute(border_element, 'val')
            )
        return None

    def extract_shading(self, shd_element: Optional[Element]) -> Optional[ShadingProperties]:
        if shd_element is not None:
            return ShadingProperties(
                fill=self.extract_attribute(shd_element, 'fill'),
                val=self.extract_attribute(shd_element, 'val'),
                color=self.extract_attribute(shd_element, 'color')
            )
        return None

    def extract_table_style(self, element: Element) -> Optional[str]:
        style_element = self.extract_element(element, ".//w:tblStyle")
        return self.extract_attribute(style_element, 'val')

    def extract_table_width(self, element: Element) -> Optional[TableWidth]:
        width_element = self.extract_element(element, ".//w:tblW")
        if width_element is not None:
            return TableWidth(
                type=self.extract_attribute(width_element, 'type'),
                width=self.safe_int(self.extract_attribute(width_element, 'w'))
            )
        return None

    def extract_justification(self, element: Element) -> Optional[str]:
        jc_element = self.extract_element(element, ".//w:jc")
        return self.extract_attribute(jc_element, 'val')

    def extract_table_cell_margins(self, element: Element) -> Optional[MarginProperties]:
        margin_element = self.extract_element(element, ".//w:tblCellMar")
        if margin_element is not None:
            return MarginProperties(
                top=self.extract_margin_value(margin_element, "top"),
                left=self.extract_margin_value(margin_element, "left"),
                bottom=self.extract_margin_value(margin_element, "bottom"),
                right=self.extract_margin_value(margin_element, "right")
            )
        return None

    def extract_margin_value(self, margin_element: Element, side: str) -> Optional[int]:
        side_element = self.extract_element(margin_element, f".//w:{side}")
        return self.safe_int(self.extract_attribute(side_element, 'w'))

    def extract_table_layout(self, element: Element) -> Optional[str]:
        layout_element = self.extract_element(element, ".//w:tblLayout")
        return self.extract_attribute(layout_element, 'type')

    def extract_table_look(self, element: Element) -> Optional[TableLook]:
        look_element = self.extract_element(element, ".//w:tblLook")
        if look_element is not None:
            return TableLook(
                firstRow=self.extract_attribute(look_element, 'firstRow') == "1",
                lastRow=self.extract_attribute(look_element, 'lastRow') == "1",
                firstColumn=self.extract_attribute(look_element, 'firstColumn') == "1",
                lastColumn=self.extract_attribute(look_element, 'lastColumn') == "1",
                noHBand=self.extract_attribute(look_element, 'noHBand') == "1",
                noVBand=self.extract_attribute(look_element, 'noVBand') == "1"
            )
        return None

    def extract_table_header(self, element: Element) -> bool:
        header_element = self.extract_element(element, ".//w:tblHeader")
        return header_element is not None

if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"

    docx_file = read_binary_from_file_path(docx_path)
    root = extract_xml_root_from_docx(docx_file, 'document.xml')

    for tbl in root.findall(".//w:tbl", namespaces=NAMESPACE):
        tables_parser = TablesParser(tbl)
        table = tables_parser.parse()
        filtered_schema_dict = table.model_dump(exclude_none=True)
        print(json.dumps(filtered_schema_dict, indent=2))
