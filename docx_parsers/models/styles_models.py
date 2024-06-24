# models/styles_models.py

from pydantic import BaseModel
from typing import List, Optional

class SpacingProperties(BaseModel):
    before_pt: Optional[float] = None
    after_pt: Optional[float] = None
    line_pt: Optional[float] = None

class IndentationProperties(BaseModel):
    left_pt: Optional[float] = None
    right_pt: Optional[float] = None
    firstline_pt: Optional[float] = None
    hanging_pt: Optional[float] = None

class FontProperties(BaseModel):
    ascii: Optional[str] = None
    hAnsi: Optional[str] = None
    eastAsia: Optional[str] = None
    cs: Optional[str] = None

class LanguageProperties(BaseModel):
    val: Optional[str] = None
    eastAsia: Optional[str] = None
    bidi: Optional[str] = None

class TabStop(BaseModel):
    val: str
    pos: float

class ParagraphStyleProperties(BaseModel):
    style_id: Optional[str] = None
    spacing: Optional[SpacingProperties] = None
    indent: Optional[IndentationProperties] = None
    outline_level: Optional[int] = None
    widow_control: Optional[bool] = None
    suppress_auto_hyphens: Optional[bool] = None
    bidi: Optional[bool] = None
    justification: Optional[str] = None
    keep_next: Optional[bool] = None
    suppress_line_numbers: Optional[bool] = None
    tabs: Optional[List[TabStop]] = None

class RunStyleProperties(BaseModel):
    font: Optional[FontProperties] = None
    size_pt: Optional[float] = None
    color: Optional[str] = None
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    underline: Optional[str] = None
    strikethrough: Optional[bool] = None
    hidden: Optional[bool] = None
    lang: Optional[LanguageProperties] = None
    highlight: Optional[str] = None
    shading: Optional[str] = None
    text_position_pt: Optional[float] = None
    kerning: Optional[int] = None
    character_spacing_pt: Optional[float] = None
    emboss: Optional[bool] = None
    outline: Optional[bool] = None
    shadow: Optional[bool] = None
    all_caps: Optional[bool] = None
    small_caps: Optional[bool] = None

class Style(BaseModel):
    style_id: str
    name: str
    based_on: Optional[str] = None
    paragraph_properties: Optional[ParagraphStyleProperties] = None
    run_properties: Optional[RunStyleProperties] = None

class StyleDefaults(BaseModel):
    paragraph: Optional[str] = None
    character: Optional[str] = None
    numbering: Optional[str] = None
    table: Optional[str] = None

class StylesSchema(BaseModel):
    styles: List[Style]
    style_type_defaults: StyleDefaults
    doc_defaults_rpr: Optional[RunStyleProperties] = None
    doc_defaults_ppr: Optional[ParagraphStyleProperties] = None
