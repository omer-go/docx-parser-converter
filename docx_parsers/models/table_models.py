# table_models.py

from pydantic import BaseModel
from typing import Optional, List
from docx_parsers.models.document_models import Paragraph

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
    paragraphs: List['Paragraph']  # 'Paragraph' needs to be defined in document_models

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

class TableSchema(BaseModel):
    properties: Optional[TableProperties]
    grid: Optional[TableGrid]
    rows: List[TableRow]
