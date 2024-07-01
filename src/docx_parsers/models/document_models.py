from pydantic import BaseModel, Field
from typing import List, Optional, Union
from docx_parsers.models.paragraph_models import Paragraph
from docx_parsers.models.table_models import Table

class DocMargins(BaseModel):
    """
    Represents the margins of a document section.

    Example:
        The following is an example of a section properties element with margins:

        .. code-block:: xml

            <w:sectPr>
                <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" 
                         w:header="720" w:footer="720" w:gutter="0"/>
            </w:sectPr>
    """
    top_pt: Optional[float] = Field(None, description="The top margin in points.")
    right_pt: Optional[float] = Field(None, description="The right margin in points.")
    bottom_pt: Optional[float] = Field(None, description="The bottom margin in points.")
    left_pt: Optional[float] = Field(None, description="The left margin in points.")
    header_pt: Optional[float] = Field(None, description="The header margin in points.")
    footer_pt: Optional[float] = Field(None, description="The footer margin in points.")
    gutter_pt: Optional[float] = Field(None, description="The gutter margin in points.")

class DocumentSchema(BaseModel):
    """
    Represents the overall structure of a document, including paragraphs and tables.

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
    elements: List[Union[Paragraph, Table]] = Field(..., description="The list of document elements (paragraphs and tables).")
    doc_margins: Optional[DocMargins] = Field(None, description="The margins of the document.")