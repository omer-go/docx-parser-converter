from pydantic import BaseModel
from typing import List, Optional

class SpacingProperties(BaseModel):
    """
    Represents the spacing properties for a paragraph.

    Attributes:
        before_pt (Optional[float]): The space before the paragraph in points.
        after_pt (Optional[float]): The space after the paragraph in points.
        line_pt (Optional[float]): The line spacing in points.

    Example:
        The following is an example of spacing properties in a paragraph properties element:

        .. code-block:: xml

            <w:spacing w:before="240" w:after="240" w:line="360"/>
    """
    before_pt: Optional[float] = None
    after_pt: Optional[float] = None
    line_pt: Optional[float] = None

class IndentationProperties(BaseModel):
    """
    Represents the indentation properties for a paragraph.

    Attributes:
        left_pt (Optional[float]): The left indentation in points.
        right_pt (Optional[float]): The right indentation in points.
        firstline_pt (Optional[float]): The first line indentation in points.

    Example:
        The following is an example of indentation properties in a paragraph properties element:

        .. code-block:: xml

            <w:ind w:left="720" w:right="720" w:firstLine="720"/>
    """
    left_pt: Optional[float] = None
    right_pt: Optional[float] = None
    firstline_pt: Optional[float] = None

class FontProperties(BaseModel):
    """
    Represents the font properties for text.

    Attributes:
        ascii (Optional[str]): The ASCII font.
        hAnsi (Optional[str]): The high ANSI font.
        eastAsia (Optional[str]): The East Asian font.
        cs (Optional[str]): The complex script font.

    Example:
        The following is an example of font properties in a run properties element:

        .. code-block:: xml

            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="SimSun" w:cs="Arial"/>
    """
    ascii: Optional[str] = None
    hAnsi: Optional[str] = None
    eastAsia: Optional[str] = None
    cs: Optional[str] = None

class LanguageProperties(BaseModel):
    """
    Represents the language properties for text.

    Attributes:
        val (Optional[str]): The language value.
        eastAsia (Optional[str]): The East Asian language.
        bidi (Optional[str]): The bidirectional language.

    Example:
        The following is an example of language properties in a run properties element:

        .. code-block:: xml

            <w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/>
    """
    val: Optional[str] = None
    eastAsia: Optional[str] = None
    bidi: Optional[str] = None

class TabStop(BaseModel):
    """
    Represents a tab stop within a paragraph.

    Attributes:
        val (str): The type of tab stop.
        pos (float): The position of the tab stop in points.

    Example:
        The following is an example of a tab stop in a tabs element:

        .. code-block:: xml

            <w:tab w:val="left" w:pos="720"/>
    """
    val: str
    pos: float

class ParagraphStyleProperties(BaseModel):
    """
    Represents the style properties for a paragraph.

    Attributes:
        style_id (Optional[str]): The style ID of the paragraph.
        spacing (Optional[SpacingProperties]): The spacing properties.
        indent (Optional[IndentationProperties]): The indentation properties.
        outline_level (Optional[int]): The outline level.
        widow_control (Optional[bool]): The widow control setting.
        suppress_auto_hyphens (Optional[bool]): The suppress auto hyphens setting.
        bidi (Optional[bool]): The bidirectional setting.
        justification (Optional[str]): The justification setting.
        keep_next (Optional[bool]): The keep next setting.
        suppress_line_numbers (Optional[bool]): The suppress line numbers setting.
        tabs (Optional[List[TabStop]]): The list of tab stops.

    Example:
        The following is an example of paragraph style properties in a style element:

        .. code-block:: xml

            <w:pPr>
                <w:spacing w:before="240" w:after="240" w:line="360"/>
                <w:ind w:left="720" w:right="720" w:firstLine="720"/>
                <w:jc w:val="both"/>
                <w:tabs>
                    <w:tab w:val="left" w:pos="720"/>
                </w:tabs>
            </w:pPr>
    """
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
    """
    Represents the style properties for a text run.

    Attributes:
        font (Optional[FontProperties]): The font properties.
        size_pt (Optional[float]): The font size in points.
        color (Optional[str]): The font color.
        bold (Optional[bool]): The bold setting.
        italic (Optional[bool]): The italic setting.
        underline (Optional[str]): The underline setting.
        strikethrough (Optional[bool]): The strikethrough setting.
        hidden (Optional[bool]): The hidden setting.
        lang (Optional[LanguageProperties]): The language properties.
        highlight (Optional[str]): The highlight color.
        shading (Optional[str]): The shading color.
        text_position_pt (Optional[float]): The text position in points.
        kerning (Optional[int]): The kerning value.
        character_spacing_pt (Optional[float]): The character spacing in points.
        emboss (Optional[bool]): The emboss setting.
        outline (Optional[bool]): The outline setting.
        shadow (Optional[bool]): The shadow setting.
        all_caps (Optional[bool]): The all caps setting.
        small_caps (Optional[bool]): The small caps setting.

    Example:
        The following is an example of run style properties in a style element:

        .. code-block:: xml

            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:sz w:val="24"/>
                <w:color w:val="FF0000"/>
                <w:b/>
                <w:i/>
                <w:u w:val="single"/>
                <w:strike/>
                <w:highlight w:val="yellow"/>
                <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:rPr>
    """
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
    """
    Represents a style definition in the document.

    Attributes:
        style_id (str): The ID of the style.
        name (str): The name of the style.
        based_on (Optional[str]): The style this style is based on.
        paragraph_properties (Optional[ParagraphStyleProperties]): The paragraph style properties.
        run_properties (Optional[RunStyleProperties]): The run style properties.

    Example:
        The following is an example of a style definition in a styles.xml file:

        .. code-block:: xml

            <w:style w:styleId="Heading1" w:type="paragraph">
                <w:name w:val="heading 1"/>
                <w:basedOn w:val="Normal"/>
                <w:pPr>
                    <w:spacing w:before="240" w:after="240" w:line="360"/>
                    <w:ind w:left="720" w:right="720" w:firstLine="720"/>
                    <w:jc w:val="both"/>
                </w:pPr>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:sz w:val="24"/>
                    <w:color w:val="FF0000"/>
                    <w:b/>
                    <w:i/>
                    <w:u w:val="single"/>
                    <w:strike/>
                    <w:highlight w:val="yellow"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                </w:rPr>
            </w:style>
    """
    style_id: str
    name: str
    based_on: Optional[str] = None
    paragraph_properties: Optional[ParagraphStyleProperties] = None
    run_properties: Optional[RunStyleProperties] = None

class StyleDefaults(BaseModel):
    """
    Represents the default styles for various elements in the document.

    Attributes:
        paragraph (Optional[str]): The default paragraph style.
        character (Optional[str]): The default character style.
        numbering (Optional[str]): The default numbering style.
        table (Optional[str]): The default table style.

    Example:
        The following is an example of style defaults in a styles.xml file:

        .. code-block:: xml

            <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
                <w:name w:val="Default Paragraph Font"/>
                <w:uiPriority w:val="1"/>
                <w:semiHidden/>
                <w:unhideWhenUsed/>
            </w:style>
    """
    paragraph: Optional[str] = None
    character: Optional[str] = None
    numbering: Optional[str] = None
    table: Optional[str] = None

class StylesSchema(BaseModel):
    """
    Represents the overall styles schema for the document.

    Attributes:
        styles (List[Style]): The list of styles in the document.
        style_type_defaults (StyleDefaults): The default styles for different elements.
        doc_defaults_rpr (Optional[RunStyleProperties]): The default run properties.
        doc_defaults_ppr (Optional[ParagraphStyleProperties]): The default paragraph properties.

    Example:
        The following is an example of a styles schema structure:

        .. code-block:: xml

            <w:styles>
                <w:style w:styleId="Heading1" w:type="paragraph">
                    <w:name w:val="heading 1"/>
                    <w:basedOn w:val="Normal"/>
                    <w:pPr>
                        <w:spacing w:before="240" w:after="240" w:line="360"/>
                        <w:ind w:left="720" w:right="720" w:firstLine="720"/>
                        <w:jc w:val="both"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:sz w:val="24"/>
                        <w:color w:val="FF0000"/>
                        <w:b/>
                        <w:i/>
                        <w:u w:val="single"/>
                        <w:strike/>
                        <w:highlight w:val="yellow"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
                    </w:rPr>
                </w:style>
                <w:docDefaults>
                    <w:rPrDefault>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:sz w:val="22"/>
                        </w:rPr>
                    </w:rPrDefault>
                    <w:pPrDefault>
                        <w:pPr>
                            <w:spacing w:before="120" w:after="120"/>
                        </w:pPr>
                    </w:pPrDefault>
                </w:docDefaults>
            </w:styles>
    """
    styles: List[Style]
    style_type_defaults: StyleDefaults
    doc_defaults_rpr: Optional[RunStyleProperties] = None
    doc_defaults_ppr: Optional[ParagraphStyleProperties] = None
