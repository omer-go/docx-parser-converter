# numbering_models.py

from pydantic import BaseModel
from typing import List, Optional
from docx_parsers.models.styles_models import FontProperties, IndentationProperties

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
