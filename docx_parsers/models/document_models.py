# document_models.py

from pydantic import BaseModel
from typing import List, Optional, Union
from docx_parsers.models.styles_models import ParagraphStyleProperties, RunStyleProperties
from docx_parsers.models.table_models import Table

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

class DocMargins(BaseModel):
    top_pt: Optional[float] = None
    right_pt: Optional[float] = None
    bottom_pt: Optional[float] = None
    left_pt: Optional[float] = None
    header_pt: Optional[float] = None
    footer_pt: Optional[float] = None
    gutter_pt: Optional[float] = None

class DocumentSchema(BaseModel):
    elements: List[Union[Paragraph, Table]]
    doc_margins: Optional[DocMargins]
