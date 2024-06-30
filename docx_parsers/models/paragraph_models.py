from pydantic import BaseModel, Field
from typing import List, Optional, Union
from docx_parsers.models.styles_models import ParagraphStyleProperties, RunStyleProperties

class Numbering(BaseModel):
    """
    Represents the numbering properties of a paragraph.

    Example:
        The following is an example of a numbering element in a paragraph properties element:

        .. code-block:: xml

            <w:numPr>
                <w:ilvl w:val="0"/>
                <w:numId w:val="1"/>
            </w:numPr>
    """
    ilvl: int = Field(..., description="The indent level of the numbering.")
    numId: int = Field(..., description="The ID of the numbering definition.")

class TextContent(BaseModel):
    """
    Represents text content in a run.

    Example:
        The following is an example of a text element in a run:

        .. code-block:: xml

            <w:r>
                <w:t>Example text</w:t>
            </w:r>
    """
    text: str = Field(..., description="The text content.")

class TabContent(BaseModel):
    """
    Represents a tab character in a run.

    Example:
        The following is an example of a tab element in a run:

        .. code-block:: xml

            <w:r>
                <w:tab/>
            </w:r>
    """
    type: str = Field("tab", description="The type of content, default is 'tab'.")

class RunContent(BaseModel):
    """
    Represents the content of a run, which can be either text or a tab.

    Example:
        The following is an example of run contents in a run element:

        .. code-block:: xml

            <w:r>
                <w:t>Example text</w:t>
                <w:tab/>
            </w:r>
    """
    run: Union[TextContent, TabContent] = Field(..., description="The content of the run.")

class Run(BaseModel):
    """
    Represents a run within a paragraph, containing text and formatting properties.

    Example:
        The following is an example of a run element in a paragraph:

        .. code-block:: xml

            <w:r>
                <w:rPr>
                    <w:b/>
                    <w:color w:val="FF0000"/>
                </w:rPr>
                <w:t>Example text</w:t>
            </w:r>
    """
    contents: List[RunContent] = Field(..., description="The list of run contents (text or tabs).")
    properties: Optional[RunStyleProperties] = Field(None, description="The style properties of the run.")

class Paragraph(BaseModel):
    """
    Represents a paragraph in the document, containing text runs and optional numbering.

    Example:
        The following is an example of a paragraph element in a document:

        .. code-block:: xml

            <w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading1"/>
                    <w:numPr>
                        <w:ilvl w:val="0"/>
                        <w:numId w:val="1"/>
                    </w:numPr>
                </w:pPr>
                <w:r>
                    <w:t>Example text</w:t>
                </w:r>
            </w:p>
    """
    properties: ParagraphStyleProperties = Field(..., description="The style properties of the paragraph.")
    runs: List[Run] = Field(..., description="The list of text runs within the paragraph.")
    numbering: Optional[Numbering] = Field(None, description="The numbering properties, if the paragraph is part of a list.")