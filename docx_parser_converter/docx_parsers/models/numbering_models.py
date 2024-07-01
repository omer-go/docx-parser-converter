from pydantic import BaseModel, Field
from typing import List, Optional
from docx_parser_converter.docx_parsers.models.styles_models import FontProperties, IndentationProperties

class NumberingLevel(BaseModel):
    """
    Represents a specific level in a numbering scheme.

    Example:
        The following is an example of a numbering level element in a numbering.xml file:

        .. code-block:: xml

            <w:lvl w:ilvl="0">
                <w:start w:val="1"/>
                <w:numFmt w:val="decimal"/>
                <w:lvlText w:val="%1."/>
                <w:lvlJc w:val="left"/>
                <w:pPr>
                    <w:ind w:left="720" w:hanging="360"/>
                </w:pPr>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                </w:rPr>
            </w:lvl>
    """
    numId: int = Field(..., description="The ID of the numbering definition.")
    ilvl: int = Field(..., description="The indent level of the numbering.")
    start: int = Field(..., description="The start value for the numbering level.")
    numFmt: str = Field(..., description="The format of the numbering (e.g., decimal, bullet).")
    lvlText: str = Field(..., description="The text to be displayed for the level.")
    lvlJc: str = Field(..., description="The justification of the level text.")
    counter: Optional[int] = Field(None, description="A counter for the level.")
    indent: Optional[IndentationProperties] = Field(None, description="The indentation properties for the level.")
    tab_pt: Optional[float] = Field(None, description="The tab position in points.")
    fonts: Optional[FontProperties] = Field(None, description="The font properties for the level.")

class NumberingInstance(BaseModel):
    """
    Represents an instance of a numbering definition.

    Example:
        The following is an example of a numbering instance element in a numbering.xml file:

        .. code-block:: xml

            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
                <w:lvlOverride w:ilvl="0">
                    <w:startOverride w:val="1"/>
                </w:lvlOverride>
            </w:num>
    """
    numId: int = Field(..., description="The ID of the numbering definition.")
    levels: List[NumberingLevel] = Field(..., description="The list of levels in the numbering definition.")

class NumberingSchema(BaseModel):
    """
    Represents the overall numbering schema for the document.

    Example:
        The following is an example of a numbering schema structure:

        .. code-block:: xml

            <w:numbering>
                <w:abstractNum w:abstractNumId="0">
                    <w:lvl w:ilvl="0">
                        <w:start w:val="1"/>
                        <w:numFmt w:val="decimal"/>
                        <w:lvlText w:val="%1."/>
                        <w:lvlJc w:val="left"/>
                        <w:pPr>
                            <w:ind w:left="720" w:hanging="360"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        </w:rPr>
                    </w:lvl>
                </w:abstractNum>
                <w:num w:numId="1">
                    <w:abstractNumId w:val="0"/>
                </w:num>
            </w:numbering>
    """
    instances: List[NumberingInstance] = Field(..., description="The list of numbering instances in the document.")
