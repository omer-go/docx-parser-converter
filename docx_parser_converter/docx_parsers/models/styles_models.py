from pydantic import BaseModel, Field
from typing import List, Optional

class SpacingProperties(BaseModel):
    """
    Represents the spacing properties for a paragraph.

    Example:
        The following is an example of spacing properties in a paragraph properties element:

        .. code-block:: xml

            <w:spacing w:before="240" w:after="240" w:line="360"/>
    """
    before_pt: Optional[float] = Field(None, description="The space before the paragraph in points.")
    after_pt: Optional[float] = Field(None, description="The space after the paragraph in points.")
    line_pt: Optional[float] = Field(None, description="The line spacing in points.")

class IndentationProperties(BaseModel):
    """
    Represents the indentation properties for a paragraph.

    Example:
        The following is an example of indentation properties in a paragraph properties element:

        .. code-block:: xml

            <w:ind w:left="720" w:right="720" w:firstLine="720"/>
    """
    left_pt: Optional[float] = Field(None, description="The left indentation in points.")
    right_pt: Optional[float] = Field(None, description="The right indentation in points.")
    firstline_pt: Optional[float] = Field(None, description="The first line indentation in points.")

class FontProperties(BaseModel):
    """
    Represents the font properties for text.

    Example:
        The following is an example of font properties in a run properties element:

        .. code-block:: xml

            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
    """
    ascii: Optional[str] = Field(None, description="The ASCII font.")
    hAnsi: Optional[str] = Field(None, description="The high ANSI font.")
    eastAsia: Optional[str] = Field(None, description="The East Asian font.")
    cs: Optional[str] = Field(None, description="The complex script font.")

class LanguageProperties(BaseModel):
    """
    Represents the language properties for text.

    Example:
        The following is an example of language properties in a run properties element:

        .. code-block:: xml

            <w:lang w:val="en-US"/>
    """
    val: Optional[str] = Field(None, description="The language value.")
    eastAsia: Optional[str] = Field(None, description="The East Asian language.")
    bidi: Optional[str] = Field(None, description="The bidirectional language.")

class TabStop(BaseModel):
    """
    Represents a tab stop within a paragraph.

    Example:
        The following is an example of a tab stop in a tabs element:

        .. code-block:: xml

            <w:tab w:val="left" w:pos="720"/>
    """
    val: str = Field(..., description="The type of tab stop.")
    pos: float = Field(..., description="The position of the tab stop in points.")

class ParagraphStyleProperties(BaseModel):
    """
    Represents the style properties for a paragraph.

    Example:
        The following is an example of paragraph style properties in a style element:

        .. code-block:: xml

            <w:pPr>
                <w:spacing w:before="240" w:after="240" w:line="360"/>
                <w:ind w:left="720" w:right="720" w:firstLine="720"/>
                ...
            </w:pPr>
    """
    style_id: Optional[str] = Field(None, description="The style ID of the paragraph.")
    spacing: Optional[SpacingProperties] = Field(None, description="The spacing properties.")
    indent: Optional[IndentationProperties] = Field(None, description="The indentation properties.")
    outline_level: Optional[int] = Field(None, description="The outline level.")
    widow_control: Optional[bool] = Field(None, description="The widow control setting.")
    suppress_auto_hyphens: Optional[bool] = Field(None, description="The suppress auto hyphens setting.")
    bidi: Optional[bool] = Field(None, description="The bidirectional setting.")
    justification: Optional[str] = Field(None, description="The justification setting.")
    keep_next: Optional[bool] = Field(None, description="The keep next setting.")
    suppress_line_numbers: Optional[bool] = Field(None, description="The suppress line numbers setting.")
    tabs: Optional[List[TabStop]] = Field(None, description="The list of tab stops.")

class RunStyleProperties(BaseModel):
    """
    Represents the style properties for a text run.

    Example:
        The following is an example of run style properties in a style element:

        .. code-block:: xml

            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:sz w:val="24"/>
                <w:color w:val="FF0000"/>
                ...
            </w:rPr>
    """
    font: Optional[FontProperties] = Field(None, description="The font properties.")
    size_pt: Optional[float] = Field(None, description="The font size in points.")
    color: Optional[str] = Field(None, description="The font color.")
    bold: Optional[bool] = Field(None, description="The bold setting.")
    italic: Optional[bool] = Field(None, description="The italic setting.")
    underline: Optional[str] = Field(None, description="The underline setting.")
    strikethrough: Optional[bool] = Field(None, description="The strikethrough setting.")
    hidden: Optional[bool] = Field(None, description="The hidden setting.")
    lang: Optional[LanguageProperties] = Field(None, description="The language properties.")
    highlight: Optional[str] = Field(None, description="The highlight color.")
    shading: Optional[str] = Field(None, description="The shading color.")
    text_position_pt: Optional[float] = Field(None, description="The text position in points.")
    kerning: Optional[int] = Field(None, description="The kerning value.")
    character_spacing_pt: Optional[float] = Field(None, description="The character spacing in points.")
    emboss: Optional[bool] = Field(None, description="The emboss setting.")
    outline: Optional[bool] = Field(None, description="The outline setting.")
    shadow: Optional[bool] = Field(None, description="The shadow setting.")
    all_caps: Optional[bool] = Field(None, description="The all caps setting.")
    small_caps: Optional[bool] = Field(None, description="The small caps setting.")

class Style(BaseModel):
    """
    Represents a style definition in the document.

    Example:
        The following is an example of a style definition in a styles.xml file:

        .. code-block:: xml

            <w:style w:styleId="Heading1" w:type="paragraph">
                ...
            </w:style>
    """
    style_id: str = Field(..., description="The ID of the style.")
    name: str = Field(..., description="The name of the style.")
    based_on: Optional[str] = Field(None, description="The style this style is based on.")
    paragraph_properties: Optional[ParagraphStyleProperties] = Field(None, description="The paragraph style properties.")
    run_properties: Optional[RunStyleProperties] = Field(None, description="The run style properties.")

class StyleDefaults(BaseModel):
    """
    Represents the default styles for various elements in the document.

    Example:
        The following is an example of style defaults in a styles.xml file:

        .. code-block:: xml

            <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
                ...
            </w:style>
    """
    paragraph: Optional[str] = Field(None, description="The default paragraph style.")
    character: Optional[str] = Field(None, description="The default character style.")
    numbering: Optional[str] = Field(None, description="The default numbering style.")
    table: Optional[str] = Field(None, description="The default table style.")

class StylesSchema(BaseModel):
    """
    Represents the overall styles schema for the document.

    Example:
        The following is an example of a styles schema structure:

        .. code-block:: xml

            <w:styles>
                <w:style w:styleId="Heading1" w:type="paragraph">
                    ...
                </w:style>
                <w:docDefaults>
                    <w:rPrDefault>
                        ...
                    </w:rPrDefault>
                    <w:pPrDefault>
                        ...
                    </w:pPrDefault>
                </w:docDefaults>
            </w:styles>
    """
    styles: List[Style] = Field(..., description="The list of styles in the document.")
    style_type_defaults: StyleDefaults = Field(..., description="The default styles for different elements.")
    doc_defaults_rpr: Optional[RunStyleProperties] = Field(None, description="The default run properties.")
    doc_defaults_ppr: Optional[ParagraphStyleProperties] = Field(None, description="The default paragraph properties.")
