from pydantic import BaseModel
from typing import List, Optional
from docx_parsers.models.styles_models import FontProperties, IndentationProperties

class NumberingLevel(BaseModel):
    """
    Represents a specific level in a numbering scheme.

    Attributes:
        numId (int): The ID of the numbering definition.
        ilvl (int): The indent level of the numbering.
        start (int): The start value for the numbering level.
        numFmt (str): The format of the numbering (e.g., decimal, bullet).
        lvlText (str): The text to be displayed for the level.
        lvlJc (str): The justification of the level text.
        counter (Optional[int]): A counter for the level.
        indent (Optional[IndentationProperties]): The indentation properties for the level.
        tab_pt (Optional[float]): The tab position in points.
        fonts (Optional[FontProperties]): The font properties for the level.

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
    numId: int
    ilvl: int
    start: int
    numFmt: str
    lvlText: str
    lvlJc: str
    counter: Optional[int] = None
    indent: Optional[IndentationProperties] = None
    tab_pt: Optional[float] = None
    fonts: Optional[FontProperties] = None

class NumberingInstance(BaseModel):
    """
    Represents an instance of a numbering definition.

    Attributes:
        numId (int): The ID of the numbering definition.
        levels (List[NumberingLevel]): The list of levels in the numbering definition.

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
    numId: int
    levels: List[NumberingLevel]

class NumberingSchema(BaseModel):
    """
    Represents the overall numbering schema for the document.

    Attributes:
        instances (List[NumberingInstance]): The list of numbering instances in the document.

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
    instances: List[NumberingInstance]
