from lxml import etree
from typing import List, Optional
from docx_parser_converter.docx_parsers.helpers.common_helpers import (
    extract_element, 
    NAMESPACE_URI, 
    NAMESPACE_URI_DRAWINGML, 
    NAMESPACE_URI_DRAWINGML_WP,
    NAMESPACE_URI_PICTURE,
    NAMESPACE_URI_RELATIONSHIPS,
    NAMESPACE
)
from docx_parser_converter.docx_parsers.models.paragraph_models import Run, RunContent, TextContent, TabContent, ImageContent
from docx_parser_converter.docx_parsers.models.styles_models import RunStyleProperties
from docx_parser_converter.docx_parsers.styles.run_properties_parser import RunPropertiesParser

class RunParser:
    """
    A parser for extracting run elements from the DOCX document structure.

    This class handles the extraction of run properties and contents within a 
    run element, converting them into a structured Run object for further 
    processing or conversion to other formats like HTML.
    """

    def parse(self, r: etree.Element) -> Run:
        """
        Parses a run from the given XML element.

        Args:
            r (etree.Element): The run XML element.

        Returns:
            Run: The parsed run.

        Example:
            The following is an example of a run element in a document.xml file:

            .. code-block:: xml

                <w:r>
                    <w:rPr>
                        <w:b/>
                        <w:color w:val="FF0000"/>
                    </w:rPr>
                    <w:t>Example text</w:t>
                </w:r>
        """
        rPr = extract_element(r, ".//w:rPr")
        run_properties = RunPropertiesParser().parse(rPr) if rPr else RunStyleProperties()
        contents = self.extract_run_contents(r)
        return Run(contents=contents, properties=run_properties)

    def extract_run_contents(self, r: etree.Element) -> List[RunContent]:
        """
        Extracts run contents from the given run XML element.

        Args:
            r (etree.Element): The run XML element.

        Returns:
            List[RunContent]: The list of extracted run contents.

        Example:
            The following is an example of run contents in a document.xml file:

            .. code-block:: xml

                <w:r>
                    <w:tab/>
                    <w:t>Example text</w:t>
                    <w:drawing>
                        <!-- Image content -->
                    </w:drawing>
                </w:r>
        """
        contents = []
        for elem in r:
            if elem.tag == f"{{{NAMESPACE_URI}}}tab":
                contents.append(RunContent(run=TabContent()))
            elif elem.tag == f"{{{NAMESPACE_URI}}}t":
                contents.append(RunContent(run=TextContent(text=elem.text)))
            elif elem.tag == f"{{{NAMESPACE_URI}}}drawing":
                image_content = self.extract_image_from_drawing(elem)
                if image_content:
                    contents.append(RunContent(run=image_content))
        return contents

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
                width_emu = int(cx)
            if cy:
                height_emu = int(cy)
        
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
