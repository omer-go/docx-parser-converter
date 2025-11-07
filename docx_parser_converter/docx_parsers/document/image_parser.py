"""
Image Parser Module

This module handles all aspects of image parsing from DOCX files, including:
- Extracting image metadata from w:drawing elements
- Resolving relationship IDs to image files
- Loading image binary data
- Processing images in document structures

All image-related parsing logic is centralized in this module.
"""

from lxml import etree
from typing import Optional, Dict
from docx_parser_converter.docx_parsers.helpers.common_helpers import (
    NAMESPACE_URI_DRAWINGML,
    NAMESPACE_URI_DRAWINGML_WP,
    NAMESPACE_URI_RELATIONSHIPS,
    NAMESPACE
)
from docx_parser_converter.docx_parsers.models.paragraph_models import ImageContent, Paragraph
from docx_parser_converter.docx_parsers.models.document_models import DocumentSchema
from docx_parser_converter.docx_parsers.models.table_models import Table
from docx_parser_converter.docx_parsers.utils import (
    extract_relationships_from_docx,
    extract_image_from_docx,
    encode_image_to_base64,
    get_image_mime_type
)


class ImageParser:
    """
    A parser for extracting and processing images from DOCX documents.
    
    This class centralizes all image-related parsing functionality, including:
    - Parsing w:drawing elements from XML
    - Extracting image metadata (dimensions, alt text, title)
    - Resolving relationship IDs to actual image files
    - Loading and encoding image binary data
    """
    
    def __init__(self, docx_file: Optional[bytes] = None):
        """
        Initializes the ImageParser.
        
        Args:
            docx_file (Optional[bytes]): The binary content of the DOCX file.
                                        If provided, relationships will be extracted.
        """
        self.docx_file = docx_file
        self.relationships = {}
        
        if docx_file:
            self.relationships = extract_relationships_from_docx(docx_file)
    
    def extract_image_from_drawing(self, drawing: etree.Element) -> Optional[ImageContent]:
        """
        Extracts image information from a drawing element.

        Args:
            drawing (etree.Element): The drawing XML element.

        Returns:
            Optional[ImageContent]: The extracted image content, or None if parsing fails.

        Example:
            The following is an example of a drawing element in a document.xml file:

            .. code-block:: xml

                <w:drawing>
                    <wp:inline>
                        <wp:extent cx="914400" cy="914400"/>
                        <wp:docPr id="1" name="Picture 1" descr="Alt text"/>
                        <a:graphic>
                            <a:graphicData>
                                <pic:pic>
                                    <pic:blipFill>
                                        <a:blip r:embed="rId4"/>
                                    </pic:blipFill>
                                </pic:pic>
                            </a:graphicData>
                        </a:graphic>
                    </wp:inline>
                </w:drawing>
        """
        # Try to find inline or anchor drawing
        inline = drawing.find(f".//{{{NAMESPACE_URI_DRAWINGML_WP}}}inline", namespaces=NAMESPACE)
        anchor = drawing.find(f".//{{{NAMESPACE_URI_DRAWINGML_WP}}}anchor", namespaces=NAMESPACE)
        
        drawing_elem = inline if inline is not None else anchor
        if drawing_elem is None:
            return None
        
        # Extract dimensions from wp:extent
        extent = drawing_elem.find(f".//{{{NAMESPACE_URI_DRAWINGML_WP}}}extent", namespaces=NAMESPACE)
        width_emu = None
        height_emu = None
        if extent is not None:
            cx = extent.get('cx')
            cy = extent.get('cy')
            if cx:
                try:
                    width_emu = int(cx)
                except (ValueError, TypeError):
                    width_emu = None
            if cy:
                try:
                    height_emu = int(cy)
                except (ValueError, TypeError):
                    height_emu = None
        
        # Extract alt text and title from wp:docPr
        alt_text = None
        title = None
        docPr = drawing_elem.find(f".//{{{NAMESPACE_URI_DRAWINGML_WP}}}docPr", namespaces=NAMESPACE)
        if docPr is not None:
            alt_text = docPr.get('descr')
            title = docPr.get('name')
        
        # Extract relationship ID from a:blip
        blip = drawing_elem.find(f".//{{{NAMESPACE_URI_DRAWINGML}}}blip", namespaces=NAMESPACE)
        if blip is None:
            return None
        
        rId = blip.get(f"{{{NAMESPACE_URI_RELATIONSHIPS}}}embed")
        if not rId:
            return None
        
        return ImageContent(
            rId=rId,
            width_emu=width_emu,
            height_emu=height_emu,
            alt_text=alt_text,
            title=title
        )
    
    def process_images_in_document(self, document_schema: DocumentSchema) -> None:
        """
        Processes images in the document by extracting their binary data and encoding as base64.
        
        Args:
            document_schema (DocumentSchema): The document schema to process.
        
        This method iterates through all paragraphs and their runs to find ImageContent,
        then extracts the actual image data from the DOCX file and encodes it as base64.
        """
        if not self.docx_file:
            return
        
        for element in document_schema.elements:
            if isinstance(element, Paragraph):
                self._process_paragraph_images(element)
            elif isinstance(element, Table):
                # Process images in table cells
                for row in element.rows:
                    for cell in row.cells:
                        for paragraph in cell.paragraphs:
                            self._process_paragraph_images(paragraph)
    
    def _process_paragraph_images(self, paragraph: Paragraph) -> None:
        """
        Processes images in a single paragraph.
        
        Args:
            paragraph (Paragraph): The paragraph to process.
        """
        for run in paragraph.runs:
            for content in run.contents:
                if isinstance(content.run, ImageContent):
                    self._load_image_data(content.run)
    
    def _load_image_data(self, image_content: ImageContent) -> None:
        """
        Loads the binary image data and encodes it as base64.
        
        Args:
            image_content (ImageContent): The image content to load data for.
        """
        # Get the image path from the relationship
        image_path = self.relationships.get(image_content.rId)
        if not image_path:
            return
        
        # Extract the image binary data
        image_data = extract_image_from_docx(self.docx_file, image_path)
        if not image_data:
            return
        
        # Encode as base64
        mime_type = get_image_mime_type(image_path)
        image_content.image_data = encode_image_to_base64(image_data, mime_type)
