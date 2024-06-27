from pydantic import BaseModel
from typing import List, Optional, Union
from docx_parsers.models.styles_models import ParagraphStyleProperties, RunStyleProperties
from docx_parsers.models.table_models import Table

class Numbering(BaseModel):
    """
    Represents the numbering properties of a paragraph.

    Attributes:
        ilvl (int): The indent level of the numbering.
        numId (int): The ID of the numbering definition.

    Example:
        The following is an example of a numbering element in a paragraph properties element:

        .. code-block:: xml

            <w:numPr>
                <w:ilvl w:val="0"/>
                <w:numId w:val="1"/>
            </w:numPr>
    """
    ilvl: int
    numId: int

class TextContent(BaseModel):
    """
    Represents text content in a run.

    Attributes:
        text (str): The text content.

    Example:
        The following is an example of a text element in a run:

        .. code-block:: xml

            <w:r>
                <w:t>Example text</w:t>
            </w:r>
    """
    text: str

class TabContent(BaseModel):
    """
    Represents a tab character in a run.

    Attributes:
        type (str): The type of content, default is "tab".

    Example:
        The following is an example of a tab element in a run:

        .. code-block:: xml

            <w:r>
                <w:tab/>
            </w:r>
    """
    type: str = "tab"

class RunContent(BaseModel):
    """
    Represents the content of a run, which can be either text or a tab.

    Attributes:
        run (Union[TextContent, TabContent]): The content of the run.

    Example:
        The following is an example of run contents in a run element:

        .. code-block:: xml

            <w:r>
                <w:t>Example text</w:t>
                <w:tab/>
            </w:r>
    """
    run: Union[TextContent, TabContent]

class Run(BaseModel):
    """
    Represents a run within a paragraph, containing text and formatting properties.

    Attributes:
        contents (List[RunContent]): The list of run contents (text or tabs).
        properties (Optional[RunStyleProperties]): The style properties of the run.

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
    contents: List[RunContent]
    properties: Optional[RunStyleProperties]

class Paragraph(BaseModel):
    """
    Represents a paragraph in the document, containing text runs and optional numbering.

    Attributes:
        properties (ParagraphStyleProperties): The style properties of the paragraph.
        runs (List[Run]): The list of text runs within the paragraph.
        numbering (Optional[Numbering]): The numbering properties, if the paragraph is part of a list.

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
    properties: ParagraphStyleProperties
    runs: List[Run]
    numbering: Optional[Numbering] = None

class DocMargins(BaseModel):
    """
    Represents the margins of a document section.

    Attributes:
        top_pt (Optional[float]): The top margin in points.
        right_pt (Optional[float]): The right margin in points.
        bottom_pt (Optional[float]): The bottom margin in points.
        left_pt (Optional[float]): The left margin in points.
        header_pt (Optional[float]): The header margin in points.
        footer_pt (Optional[float]): The footer margin in points.
        gutter_pt (Optional[float]): The gutter margin in points.

    Example:
        The following is an example of a section properties element with margins:

        .. code-block:: xml

            <w:sectPr>
                <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" 
                         w:header="720" w:footer="720" w:gutter="0"/>
            </w:sectPr>
    """
    top_pt: Optional[float] = None
    right_pt: Optional[float] = None
    bottom_pt: Optional[float] = None
    left_pt: Optional[float] = None
    header_pt: Optional[float] = None
    footer_pt: Optional[float] = None
    gutter_pt: Optional[float] = None

class DocumentSchema(BaseModel):
    """
    Represents the overall structure of a document, including paragraphs and tables.

    Attributes:
        elements (List[Union[Paragraph, Table]]): The list of document elements (paragraphs and tables).
        doc_margins (Optional[DocMargins]): The margins of the document.

    Example:
        The following is an example of a document schema structure:

        .. code-block:: xml

            <w:document>
                <w:body>
                    <w:p>
                        <w:pPr>
                            <w:pStyle w:val="Heading1"/>
                        </w:pPr>
                        <w:r>
                            <w:t>Example text</w:t>
                        </w:r>
                    </w:p>
                    <w:tbl>
                        <!-- Table elements here -->
                    </w:tbl>
                    <w:sectPr>
                        <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" 
                                 w:header="720" w:footer="720" w:gutter="0"/>
                    </w:sectPr>
                </w:body>
            </w:document>
    """
    elements: List[Union[Paragraph, Table]]
    doc_margins: Optional[DocMargins]
